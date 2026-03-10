-- AlterTable: change phone from Decimal to Text on Profile
ALTER TABLE "Profile" ALTER COLUMN "phone" TYPE TEXT USING "phone"::TEXT;
