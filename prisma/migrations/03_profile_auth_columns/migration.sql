-- Add auth columns to Profile table (all nullable — no existing data is affected)
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "password" TEXT;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "access_token" TEXT;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "refresh_token" TEXT;
