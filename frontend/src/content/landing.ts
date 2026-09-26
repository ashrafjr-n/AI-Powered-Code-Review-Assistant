// All landing page text lives here. Components only render what they receive.

export const REPO_URL =
  "https://github.com/ashrafjr-n/AI-Powered-Code-Review-Assistant";

export interface NavLink {
  label: string;
  href: string;
}

/** Header button: goes to the app (proxy.ts sends signed-out visitors to /login first). */
export const headerCta: NavLink = { label: "Dashboard", href: "/projects" };

export const navLinks: NavLink[] = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Lenses", href: "#lenses" },
  { label: "Models", href: "#models" },
  { label: "Sample report", href: "#sample-report" },
];

export const hero = {
  eyebrow: "AI code review · local or cloud",
  title: "Code review, on your terms.",
  subtitle:
    "Upload a project, choose a Security, Performance or Quality lens, and get a structured report. Start with the free built-in model, then connect your own: OpenAI, Gemini, or a model on your own computer.",
  primaryCta: { label: "Start reviewing", href: "/register" },
  secondaryCta: { label: "See a sample report", href: "#sample-report" },
};

// The code in the hero editor. Tone maps to a silver shade; one line gets the red pen.
export type CodeTone = "plain" | "keyword" | "string" | "muted";

export interface CodeLine {
  tokens: { text: string; tone: CodeTone }[];
  flagged?: boolean;
}

export const heroEditor = {
  fileName: "src/config/payments.ts",
  lines: [
    {
      tokens: [
        { text: "import", tone: "keyword" },
        { text: " Stripe ", tone: "plain" },
        { text: "from", tone: "keyword" },
        { text: ' "stripe"', tone: "string" },
        { text: ";", tone: "muted" },
      ],
    },
    { tokens: [] },
    {
      tokens: [
        { text: "export const", tone: "keyword" },
        { text: " stripe = ", tone: "plain" },
        { text: "new", tone: "keyword" },
        { text: " Stripe(", tone: "plain" },
      ],
    },
    {
      tokens: [{ text: '  "sk_live_51Hx9…q8Zt"', tone: "string" }],
      flagged: true,
    },
    {
      tokens: [
        { text: "  { apiVersion: ", tone: "plain" },
        { text: '"2025-01-27"', tone: "string" },
        { text: " },", tone: "plain" },
      ],
    },
    { tokens: [{ text: ");", tone: "muted" }] },
  ] satisfies CodeLine[],
  note: {
    title: "Hardcoded secret",
    body: "A live payment key is committed to the repository. Move it to an environment variable and rotate it.",
  },
};

export interface Step {
  number: string;
  title: string;
  body: string;
}

export const steps: Step[] = [
  {
    number: "01",
    title: "Upload your code",
    body: "Drop a project folder or a ZIP. Dependencies, build output and binaries are skipped, and secret files like .env never leave your browser, so only real source code is stored.",
  },
  {
    number: "02",
    title: "Pick a lens",
    body: "Review one file, a few files or the whole project, through a Security, Performance or Quality lens.",
  },
  {
    number: "03",
    title: "Read the report",
    body: "A summary, issues ranked by severity with the exact file and line, and clear next steps. Every report is saved and searchable.",
  },
];

export interface Lens {
  name: string;
  tagline: string;
  checks: string[];
}

export const lenses: Lens[] = [
  {
    name: "Security",
    tagline: "What could an attacker use?",
    checks: [
      "Hardcoded credentials and keys",
      "Authentication and session flaws",
      "Missing input validation",
      "SQL, command and template injection",
    ],
  },
  {
    name: "Performance",
    tagline: "What slows it down?",
    checks: [
      "Slow loops and heavy operations",
      "Unnecessary re-renders",
      "N+1 and repeated database queries",
      "Work that could be cached or batched",
    ],
  },
  {
    name: "Quality",
    tagline: "What will hurt next month?",
    checks: [
      "Unclear naming",
      "Tangled structure and large files",
      "Hard-to-read logic",
      "Code that is costly to maintain",
    ],
  },
];

export interface Provider {
  name: string;
  baseUrl: string;
  location: "Local" | "Cloud";
}

export const providers: Provider[] = [
  { name: "OpenAI", baseUrl: "https://api.openai.com/v1", location: "Cloud" },
  {
    name: "Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    location: "Cloud",
  },
  {
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    location: "Cloud",
  },
  {
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    location: "Cloud",
  },
  { name: "LM Studio", baseUrl: "http://localhost:1234/v1", location: "Local" },
  { name: "Ollama", baseUrl: "http://localhost:11434/v1", location: "Local" },
  { name: "Any compatible API", baseUrl: "https://…/v1", location: "Cloud" },
];

export const models = {
  title: "Bring your own model.",
  body: "Redline speaks the OpenAI-compatible API, so any provider works. You set the base URL, the key and the model. Nothing is hardcoded. New accounts can start right away with a free built-in model and a daily limit.",
  localNote:
    "Local models (LM Studio, Ollama) run on your own computer. Connect one through a secure tunnel, or run Redline yourself: then your code never leaves your machine.",
};

export const finalCta = {
  title: "Your code deserves a second read.",
  body: "Create a workspace, upload a project and get your first report in a few minutes.",
  primaryCta: { label: "Start reviewing", href: "/register" },
  secondaryCta: { label: "Sign in", href: "/login" },
};

export const footer = {
  tagline: "Code review for people who ship.",
};
