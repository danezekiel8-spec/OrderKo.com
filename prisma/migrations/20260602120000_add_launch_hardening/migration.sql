ALTER TABLE "Restaurant" ADD COLUMN "subscriptionStatus" TEXT NOT NULL DEFAULT 'TRIAL';
ALTER TABLE "Restaurant" ADD COLUMN "subscriptionNotes" TEXT;
ALTER TABLE "Restaurant" ADD COLUMN "pausedReason" TEXT;
ALTER TABLE "Restaurant" ADD COLUMN "pausedAt" DATETIME;

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "restaurantId" TEXT,
    "actorType" TEXT NOT NULL,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "entityLabel" TEXT,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "AuditLog_restaurantId_createdAt_idx" ON "AuditLog"("restaurantId", "createdAt");
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
