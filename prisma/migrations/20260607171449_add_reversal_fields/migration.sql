-- AlterTable
ALTER TABLE "Transfer" ADD COLUMN     "reversalReference" TEXT,
ADD COLUMN     "reversed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reversedAt" TIMESTAMP(3);
