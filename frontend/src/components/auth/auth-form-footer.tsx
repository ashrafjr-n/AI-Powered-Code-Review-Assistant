import Link from "next/link";

interface AuthFormFooterProps {
  text: string;
  link: { label: string; href: string };
}

export function AuthFormFooter({ text, link }: AuthFormFooterProps) {
  return (
    <p className="text-sm text-silver-500">
      {text}{" "}
      <Link
        href={link.href}
        className="text-paper underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-paper"
      >
        {link.label}
      </Link>
    </p>
  );
}
