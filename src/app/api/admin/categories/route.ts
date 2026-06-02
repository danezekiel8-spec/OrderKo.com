import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { recordAuditLog } from "@/lib/audit-log";
import { requireRequestRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categoryMutationSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = requireRequestRole(request, ["admin"]);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = categoryMutationSchema.parse(await request.json());
    const category = await prisma.$transaction(async (tx) => {
      const created = await tx.category.create({
        data: {
          restaurantId: session.restaurantId,
          name: body.name,
          sortOrder: body.sortOrder,
        },
      });
      await recordAuditLog(tx, {
        restaurantId: session.restaurantId,
        actorType: "staff",
        actorRole: session.role,
        action: "category.created",
        entityType: "category",
        entityId: created.id,
        entityLabel: created.name,
        request,
      });
      return created;
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid category.", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create category." },
      { status: 400 },
    );
  }
}
