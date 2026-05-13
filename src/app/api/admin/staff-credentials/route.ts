import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { hashStaffPin, requireRequestRole, type StaffRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { staffCredentialsMutationSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const pinFields: { field: "cashierPin" | "kitchenPin" | "adminPin"; role: StaffRole; label: string }[] = [
  { field: "cashierPin", role: "cashier", label: "Cashier" },
  { field: "kitchenPin", role: "kitchen", label: "Kitchen" },
  { field: "adminPin", role: "admin", label: "Admin" },
];

export async function PATCH(request: NextRequest) {
  const session = requireRequestRole(request, ["admin"]);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = staffCredentialsMutationSchema.parse(await request.json());
    const updates = pinFields.filter(({ field }) => body[field]?.trim());
    if (!updates.length) {
      return NextResponse.json({ error: "Enter at least one PIN to update." }, { status: 400 });
    }

    await prisma.$transaction(
      updates.map(({ field, role, label }) =>
        prisma.staffCredential.upsert({
          where: { restaurantId_role: { restaurantId: session.restaurantId, role } },
          update: {
            pinHash: hashStaffPin(session.restaurantId, role, body[field] ?? ""),
            isActive: true,
          },
          create: {
            restaurantId: session.restaurantId,
            role,
            label,
            pinHash: hashStaffPin(session.restaurantId, role, body[field] ?? ""),
          },
        }),
      ),
    );

    return NextResponse.json({ ok: true, updatedRoles: updates.map((update) => update.role) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid staff PIN settings.", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update staff PINs." },
      { status: 400 },
    );
  }
}
