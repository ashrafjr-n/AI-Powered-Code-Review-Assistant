"use client";

import { useActionState } from "react";
import { registerAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "./password-input";

interface RegisterFormProps {
  submitLabel: string;
  pendingLabel: string;
  passwordHint: string;
}

// Limits match the backend schema (backend/src/auth/auth.schemas.ts).
const PASSWORD_MIN = 8;

export function RegisterForm({
  submitLabel,
  pendingLabel,
  passwordHint,
}: RegisterFormProps) {
  const [state, formAction, pending] = useActionState(registerAction, {
    name: "",
    email: "",
  });

  return (
    <form action={formAction} className="space-y-5">
      <FormError message={state.error} />
      <Field id="name" label="Name">
        <Input
          id="name"
          name="name"
          autoComplete="name"
          required
          maxLength={100}
          defaultValue={state.name}
        />
      </Field>
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
      <Field id="password" label="Password" hint={passwordHint}>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN}
          describedBy="password-hint"
        />
      </Field>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
