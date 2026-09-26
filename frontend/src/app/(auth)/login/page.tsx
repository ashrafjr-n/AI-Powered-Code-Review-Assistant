import type { Metadata } from "next";
import { AuthFormFooter } from "@/components/auth/auth-form-footer";
import { LoginForm } from "@/components/auth/login-form";
import { loginCopy } from "@/content/auth";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-display text-paper">
          {loginCopy.title}
        </h1>
        <p className="text-silver-400">{loginCopy.subtitle}</p>
      </header>
      <LoginForm
        submitLabel={loginCopy.submit}
        pendingLabel={loginCopy.pending}
      />
      <AuthFormFooter text={loginCopy.switchText} link={loginCopy.switchLink} />
    </div>
  );
}
