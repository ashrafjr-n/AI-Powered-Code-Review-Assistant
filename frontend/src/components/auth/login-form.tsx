"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { mockSignIn } from "@/mocks/auth";
import { PasswordInput } from "./password-input";

interface LoginFormProps {
  submitLabel: string;
  pendingLabel: string;
}

interface LoginState {
  email: string;
  error?: string;
}

export function LoginForm({ submitLabel, pendingLabel }: LoginFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_previous: LoginState, formData: FormData): Promise<LoginState> => {
      const email = String(formData.get("email") ?? "");
      const result = await mockSignIn();
      if (!result.ok) {
        // Keep the email, never send the password back into the form.
        return { email, error: result.error };
      }
      router.push("/projects");
      return { email };
    },
    { email: "" },
  );

  return (
    <form action={formAction} className="space-y-5">
      <FormError message={state.error} />
      <Field id="email" label="Email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          defaultValue={state.email}
        />
      </Field>
      <Field id="password" label="Password">
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
        />
      </Field>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
