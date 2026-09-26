-- AlterTable
ALTER TABLE "File" ADD COLUMN     "sensitive" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "uploadStats" JSONB;
