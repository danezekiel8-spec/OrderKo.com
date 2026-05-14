-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN "isKioskEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Restaurant" ADD COLUMN "superAdminNotes" TEXT;
