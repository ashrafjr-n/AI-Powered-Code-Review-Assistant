import "server-only";
import { codeToHtml, type ThemeRegistration } from "shiki";
import type { LineMarker } from "./issue-markers";

// Redline's own monochrome theme: silver shades only, no rainbow syntax colors.
const redlineTheme: ThemeRegistration = {
  name: "redline",
  type: "dark",
  colors: {
    "editor.background": "#0c0d10",
    "editor.foreground": "#b4b8bf",
  },
  tokenColors: [
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: "#6e737d", fontStyle: "italic" },
    },
    {
      scope: ["keyword", "storage", "storage.type", "keyword.control"],
      settings: { foreground: "#f4f5f6" },
    },
    {
      scope: ["string", "string.quoted", "string.template"],
      settings: { foreground: "#8d929b" },
    },
    {
      scope: ["entity.name.function", "support.function", "meta.function-call"],
      settings: { foreground: "#d5d8dc" },
    },
    {
      scope: [
        "constant.numeric",
        "constant.language",
        "support.type",
        "entity.name.type",
      ],
      settings: { foreground: "#d5d8dc" },
    },
    {
      scope: ["punctuation", "meta.brace"],
      settings: { foreground: "#6e737d" },
    },
  ],
};

const MAX_HIGHLIGHT_BYTES = 200_000;

/**
 * Server-side highlighting. Each line gets id="L<n>" (so #L27 links scroll there),
 * the target line gets the "highlighted" class, and lines with review issues get
 * data-severity (a dot in the gutter) + the issue titles as hover text.
 */
export async function highlightCode(
  code: string,
  lang: string,
  highlightLine?: number,
  markers: Map<number, LineMarker> = new Map(),
): Promise<string> {
  // Very large files are shown as plain text: highlighting them is slow and rarely useful.
  const safeLang = code.length > MAX_HIGHLIGHT_BYTES ? "text" : lang;
  return codeToHtml(code, {
    lang: safeLang,
    theme: redlineTheme,
    transformers: [
      {
        line(node, line) {
          node.properties.id = `L${line}`;
          node.properties["data-line"] = line;
          if (line === highlightLine) this.addClassToHast(node, "highlighted");
          const marker = markers.get(line);
          if (marker) {
            node.properties["data-severity"] = marker.severity.toLowerCase();
            node.properties.title = marker.titles.join("\n");
          }
        },
      },
    ],
  });
}
