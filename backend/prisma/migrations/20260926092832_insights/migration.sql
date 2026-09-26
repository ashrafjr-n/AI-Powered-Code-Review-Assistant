-- CreateEnum
CREATE TYPE "InsightKind" AS ENUM ('ARCHITECTURE', 'README', 'SETUP', 'API_DOCS');

-- CreateTable
CREATE TABLE "Insight" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "kind" "InsightKind" NOT NULL,
    "content" TEXT NOT NULL,
    "filePaths" TEXT[],
    "providerName" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Insight_projectId_kind_key" ON "Insight"("projectId", "kind");

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
