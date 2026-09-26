import type { Metadata } from "next";
import { JetBrains_Mono, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";

const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Redline — AI code review on your terms",
    template: "%s · Redline",
  },
  description:
    "Upload a project, pick a Security, Performance or Quality lens, and get a structured review from a free built-in model, your own API key, or a model on your own computer.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${schibsted.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        {/* First Tab stop: lets keyboard users jump past the navigation. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-sm focus:bg-paper focus:px-3 focus:py-2 focus:text-sm focus:text-ink-950"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
