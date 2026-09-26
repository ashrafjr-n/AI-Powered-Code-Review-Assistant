import Link from "next/link";
import { AuthAside } from "@/components/auth/auth-aside";
import { Logo } from "@/components/brand/logo";
import { authAside } from "@/content/auth";
import { sampleReview } from "@/content/sample-review";

// Shared by /login and /register: form on the left, a piece of a real report on the right.
const asideIssues = sampleReview.issues.slice(0, 3);

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 sm:px-8">
        <Link href="/" aria-label="Redline home" className="self-start">
          <Logo className="h-6 w-auto" />
        </Link>
        <main className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm">{children}</div>
        </main>
      </div>
      <AuthAside {...authAside} issues={asideIssues} />
    </div>
  );
}
