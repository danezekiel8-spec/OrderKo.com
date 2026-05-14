import { NextResponse, type NextRequest } from "next/server";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminRequest } from "@/lib/super-admin-auth";

export const dynamic = "force-dynamic";

const leadPatchSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "CLOSED"]),
});

function serializeLead<T extends { createdAt: Date; updatedAt: Date }>(lead: T) {
  return {
    ...lead,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!requireSuperAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = leadPatchSchema.parse(await request.json());
    const lead = await prisma.lead.update({
      where: { id },
      data: { status: body.status },
      select: {
        id: true,
        name: true,
        email: true,
        restaurantName: true,
        phone: true,
        message: true,
        status: true,
        source: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ lead: serializeLead(lead) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Choose a valid lead status.", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update lead." },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!requireSuperAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ ok: true, deletedId: id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete demo request." },
      { status: 400 },
    );
  }
}
