import type { Metadata } from "next";
import { AuthFormFooter } from "@/components/auth/auth-form-footer";
import { RegisterForm } from "@/components/auth/register-form";
import { registerCopy } from "@/content/auth";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-display text-paper">
          {registerCopy.title}
        </h1>
        <p className="text-silver-400">{registerCopy.subtitle}</p>
      </header>
      <RegisterForm
        submitLabel={registerCopy.submit}
        pendingLabel={registerCopy.pending}
        passwordHint={registerCopy.passwordHint}
      />
      <AuthFormFooter
        text={registerCopy.switchText}
        link={registerCopy.switchLink}
      />
    </div>
  );
}
