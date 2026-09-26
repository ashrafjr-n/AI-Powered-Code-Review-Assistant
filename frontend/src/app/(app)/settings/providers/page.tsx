import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Model providers" };

// Shell only (F3). The page content is built in its own phase.
export default function ProvidersPage() {
  return (
    <PageHeader
      title="Model providers"
      description="Choose which model reviews your code."
    />
  );
}
