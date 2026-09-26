import type { InsightKind } from "@/lib/types";

// The four documents the Insights tab can generate, in the order the panel lists them.
export const insightDocs: {
  kind: InsightKind;
  title: string;
  description: string;
}[] = [
  {
    kind: "ARCHITECTURE",
    title: "Architecture overview",
    description:
      "A map of the layers, entry points and how the parts talk to each other.",
  },
  {
    kind: "README",
    title: "README",
    description: "What the project does and how to use it.",
  },
  {
    kind: "SETUP",
    title: "Setup guide",
    description: "Install, configure and run it locally.",
  },
  {
    kind: "API_DOCS",
    title: "API documentation",
    description: "Every endpoint the code defines, with inputs and outputs.",
  },
];

export const insightTitle = Object.fromEntries(
  insightDocs.map((doc) => [doc.kind, doc.title]),
) as Record<InsightKind, string>;
