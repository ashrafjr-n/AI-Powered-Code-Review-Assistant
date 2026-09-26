-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "sources" TEXT[] DEFAULT ARRAY[]::TEXT[];
