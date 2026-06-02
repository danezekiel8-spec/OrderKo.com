import "server-only";

import type { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

type AuditActorType = "customer" | "staff" | "super_admin" | "system";

type AuditClient = {
  auditLog: {
    create(args: Prisma.AuditLogCreateArgs): Promise<unknown>;
  };
};

export type AuditLogInput = {
  restaurantId?: string | null;
  actorType: AuditActorType;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  metadata?: Record<string, unknown>;
  request?: NextRequest;
};

function requestMeta(request?: NextRequest) {
  if (!request) return {};
  return {
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    userAgent: request.headers.get("user-agent") || null,
  };
}

function metadataJson(metadata?: Record<string, unknown>) {
  try {
    return JSON.stringify(metadata ?? {});
  } catch {
    return "{}";
  }
}

export async function recordAuditLog(client: AuditClient, input: AuditLogInput) {
  const meta = requestMeta(input.request);
  await client.auditLog.create({
    data: {
      restaurantId: input.restaurantId ?? null,
      actorType: input.actorType,
      actorRole: input.actorRole ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      entityLabel: input.entityLabel ?? null,
      metadataJson: metadataJson(input.metadata),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    },
  });
}

export async function safeAuditLog(input: AuditLogInput) {
  try {
    await recordAuditLog(prisma, input);
  } catch (error) {
    console.warn("Audit log write failed", error);
  }
}
