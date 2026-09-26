import type { ReviewMode, ReviewScope } from "./types";

export const MODE_LABEL: Record<ReviewMode, string> = {
  SECURITY: "Security",
  PERFORMANCE: "Performance",
  QUALITY: "Quality",
};

export const SCOPE_LABEL: Record<ReviewScope, string> = {
  FILE: "Single file",
  FILES: "Selected files",
  PROJECT: "Whole project",
  DIFF: "Two-file diff",
};
