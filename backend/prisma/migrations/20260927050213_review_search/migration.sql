-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "searchText" TEXT NOT NULL DEFAULT '';

-- Fill it for reviews saved before this column existed (same text the service writes).
UPDATE "Review" SET "searchText" = lower(
  "summary" || ' ' || array_to_string("filePaths", ' ') || ' ' ||
  coalesce((SELECT string_agg(issue->>'title', ' ') FROM jsonb_array_elements("issues") AS issue), '')
);
