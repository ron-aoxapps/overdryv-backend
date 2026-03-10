-- AlterTable: allow NULL on Vehicle.make, Vehicle.model, Vehicle.mileage
ALTER TABLE "Vehicle" ALTER COLUMN "make" DROP NOT NULL;
ALTER TABLE "Vehicle" ALTER COLUMN "model" DROP NOT NULL;
ALTER TABLE "Vehicle" ALTER COLUMN "mileage" DROP NOT NULL;
ALTER TABLE "Vehicle" ALTER COLUMN "mileage" DROP DEFAULT;
