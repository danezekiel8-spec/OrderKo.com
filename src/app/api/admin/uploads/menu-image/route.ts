import { createHash } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { requireRequestRole } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxFileSize = 5 * 1024 * 1024;

function cloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

function signUpload(params: Record<string, string>, apiSecret: string) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

export async function POST(request: NextRequest) {
  const role = requireRequestRole(request, ["admin"]);
  if (!role) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const config = cloudinaryConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET." },
      { status: 500 },
    );
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image file to upload." }, { status: 400 });
  }
  if (!allowedTypes.has(file.type)) {
    return NextResponse.json({ error: "Use a JPG, PNG, or WebP image." }, { status: 400 });
  }
  if (file.size > maxFileSize) {
    return NextResponse.json({ error: "Image must be 5 MB or smaller." }, { status: 400 });
  }

  const timestamp = Math.round(Date.now() / 1000).toString();
  const uploadParams = {
    folder: "orderko/menu",
    timestamp,
  };
  const signature = signUpload(uploadParams, config.apiSecret);
  const cloudinaryData = new FormData();
  cloudinaryData.append("file", file);
  cloudinaryData.append("api_key", config.apiKey);
  cloudinaryData.append("folder", uploadParams.folder);
  cloudinaryData.append("timestamp", timestamp);
  cloudinaryData.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
    method: "POST",
    body: cloudinaryData,
  });
  const result = (await response.json().catch(() => null)) as {
    secure_url?: string;
    public_id?: string;
    error?: { message?: string };
  } | null;

  if (!response.ok || !result?.secure_url) {
    return NextResponse.json(
      { error: result?.error?.message ?? "Image upload failed. Please try again." },
      { status: response.ok ? 502 : response.status },
    );
  }

  return NextResponse.json({
    url: result.secure_url,
    publicId: result.public_id,
  });
}
