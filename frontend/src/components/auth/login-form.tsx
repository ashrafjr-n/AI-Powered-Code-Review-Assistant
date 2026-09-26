"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "./password-input";

interface LoginFormProps {
  submitLabel: string;
  pendingLabel: string;
  /** Where to go after signing in (checked on the server). */
  next?: string;
}

export function LoginForm({ submitLabel, pendingLabel, next }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(loginAction, {
    email: "",
  });

  return (
    <form action={formAction} className="space-y-5">
      <FormError message={state.error} />
      {next && <input type="hidden" name="next" value={next} />}
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
