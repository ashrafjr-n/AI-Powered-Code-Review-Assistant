"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { inputClass } from "@/components/ui/input";
import { cn } from "@/lib/cn";

interface PasswordInputProps {
  id: string;
  name: string;
  autoComplete: "current-password" | "new-password";
  minLength?: number;
  describedBy?: string;
}

export function PasswordInput({
  id,
  name,
  autoComplete,
  minLength,
  describedBy,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        required
        minLength={minLength}
        maxLength={128}
        aria-describedby={describedBy}
        className={cn(inputClass, "pr-10")}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-sm text-silver-500 transition-colors hover:text-paper"
      >
        {visible ? (
          <EyeOff aria-hidden className="size-4" strokeWidth={1.5} />
        ) : (
          <Eye aria-hidden className="size-4" strokeWidth={1.5} />
        )}
      </button>
    </div>
  );
}
