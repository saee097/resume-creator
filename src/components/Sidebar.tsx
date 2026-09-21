"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/profile", label: "Profile", icon: "◉" },
  { href: "/resumes", label: "Resumes", icon: "📄" },
  { href: "/jobs", label: "Job Match", icon: "◎" },
  { href: "/cover-letters", label: "Cover Letters", icon: "✉" },
  { href: "/interview", label: "Interview Prep", icon: "?" },
  { href: "/portfolio", label: "Portfolio", icon: "★" },
  { href: "/coaching", label: "Career Coaching", icon: "⤴" },
  { href: "/applications", label: "Applications", icon: "🗂" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white md:block">
      <div className="flex items-center gap-2 px-5 py-4 font-bold text-brand-700">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
          R
        </span>
        ResumeForge
      </div>
      <nav className="space-y-1 px-3 py-2">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
