"use client";

import { useEffect, useRef } from "react";
import Form from "next/form";
import { Search } from "lucide-react";
import { inputClass } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/cn";
import { MODE_LABEL } from "@/lib/labels";
import { SEVERITY_LABEL, SEVERITY_ORDER } from "@/lib/severity";
import type { ReviewMode } from "@/lib/types";

interface ReviewFiltersProps {
  q?: string;
  mode?: string;
  severity?: string;
  project?: string;
  projects: { id: string; name: string }[];
}

const selectClass =
  "h-10 rounded-sm border border-line-strong bg-ink-800 px-3 text-sm text-paper hover:border-silver-500";

// A GET form: filters become URL params (?q=…&mode=…), so results can be shared and
// back/forward works. next/form navigates on the client without a full reload.
export function ReviewFilters({
  q,
  mode,
  severity,
  project,
  projects,
}: ReviewFiltersProps) {
  const searchRef = useRef<HTMLInputElement>(null);

  // "/" focuses the search box, like many developer tools.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (event.key !== "/" || target.closest("input, textarea, select"))
        return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <Form action="/reviews" className="flex flex-wrap gap-2" role="search">
      <div className="relative min-w-60 flex-1">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-silver-500"
          strokeWidth={1.5}
        />
        <label htmlFor="review-search" className="sr-only">
          Search reviews
        </label>
        <input
          ref={searchRef}
          id="review-search"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search summaries, issues, files…"
          className={cn(inputClass, "pr-10 pl-9")}
        />
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
          <Kbd>/</Kbd>
        </span>
      </div>
      <label className="sr-only" htmlFor="filter-mode">
        Lens
      </label>
      <select
        id="filter-mode"
        name="mode"
        defaultValue={mode ?? ""}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className={selectClass}
      >
        <option value="">All lenses</option>
        {(Object.keys(MODE_LABEL) as ReviewMode[]).map((value) => (
          <option key={value} value={value}>
            {MODE_LABEL[value]}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="filter-severity">
        Worst severity
      </label>
      <select
        id="filter-severity"
        name="severity"
        defaultValue={severity ?? ""}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className={selectClass}
      >
        <option value="">Any severity</option>
        {/* Filters by the review's worst issue, the same severity its badge shows. */}
        {SEVERITY_ORDER.map((value) => (
          <option key={value} value={value}>
            Worst: {SEVERITY_LABEL[value]}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="filter-project">
        Project
      </label>
      <select
        id="filter-project"
        name="project"
        defaultValue={project ?? ""}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className={selectClass}
      >
        <option value="">All projects</option>
        {projects.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </Form>
  );
}
