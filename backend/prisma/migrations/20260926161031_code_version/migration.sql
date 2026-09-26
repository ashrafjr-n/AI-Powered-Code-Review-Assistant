-- AlterTable
ALTER TABLE "Insight" ADD COLUMN     "codeVersion" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "codeVersion" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "codeVersion" INTEGER NOT NULL DEFAULT 0;
