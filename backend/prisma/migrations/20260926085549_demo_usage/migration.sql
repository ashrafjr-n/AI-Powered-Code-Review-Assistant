-- CreateTable
CREATE TABLE "DemoUsage" (
    "userId" UUID NOT NULL,
    "day" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DemoUsage_pkey" PRIMARY KEY ("userId","day")
);

-- CreateIndex
CREATE INDEX "DemoUsage_day_idx" ON "DemoUsage"("day");

-- AddForeignKey
ALTER TABLE "DemoUsage" ADD CONSTRAINT "DemoUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
