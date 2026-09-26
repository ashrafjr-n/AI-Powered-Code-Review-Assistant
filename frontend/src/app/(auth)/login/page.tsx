import type { Metadata } from "next";
import { AuthFormFooter } from "@/components/auth/auth-form-footer";
import { LoginForm } from "@/components/auth/login-form";
import { loginCopy } from "@/content/auth";
import { safeNextPath } from "@/lib/safe-redirect";
import { firstParam } from "@/lib/workspace-url";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const query = await searchParams;
  const next = firstParam(query.next);
  const expired = firstParam(query.expired) === "1";

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-display text-paper">
          {loginCopy.title}
        </h1>
        <p className="text-silver-400">
          {expired ? loginCopy.expired : loginCopy.subtitle}
        </p>
      </header>
      <LoginForm
        submitLabel={loginCopy.submit}
        pendingLabel={loginCopy.pending}
        next={next ? safeNextPath(next) : undefined}
      />
      <AuthFormFooter text={loginCopy.switchText} link={loginCopy.switchLink} />
    </div>
  );
}
