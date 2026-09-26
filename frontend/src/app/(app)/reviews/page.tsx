import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Reviews" };

// Shell only (F3). The page content is built in its own phase.
export default function ReviewsPage() {
  return (
    <PageHeader
      title="Reviews"
      description="Every review you ran, in one place."
    />
  );
}
