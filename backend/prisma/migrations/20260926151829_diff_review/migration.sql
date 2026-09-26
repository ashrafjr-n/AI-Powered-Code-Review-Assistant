-- AlterEnum
ALTER TYPE "ReviewScope" ADD VALUE 'DIFF';

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "diff" TEXT;
