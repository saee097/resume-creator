import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      <div className="mt-6">{children}</div>
      {footer ? <div className="mt-6 border-t border-slate-100 pt-4 text-sm text-slate-600">{footer}</div> : null}
    </div>
  );
}

export function OAuthButtons() {
  const providers = [
    { name: "Google", href: "/api/auth/oauth/google" },
    { name: "GitHub", href: "/api/auth/oauth/github" },
  ];
  return (
    <div className="space-y-2">
      {providers.map((p) => (
        <a key={p.name} href={p.href} className="btn-secondary w-full">
          Continue with {p.name}
        </a>
      ))}
    </div>
  );
}

export function AuthError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </div>
  );
}
