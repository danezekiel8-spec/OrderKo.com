-- Add optional restaurant branding assets.
ALTER TABLE "Restaurant" ADD COLUMN "logoUrl" TEXT;
ALTER TABLE "Restaurant" ADD COLUMN "bannerImageUrl" TEXT;
