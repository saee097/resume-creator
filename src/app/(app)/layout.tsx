import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { getCurrentUser } from "@/lib/session";
import { USER_TYPES, type UserType } from "@/lib/types";

const LABELS: Record<UserType, string> = {
  student: "Student",
  graduate: "Fresh Graduate",
  professional: "Professional",
  freelancer: "Freelancer",
  executive: "Executive",
  recruiter: "Recruiter",
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = getCurrentUser();
  void USER_TYPES;
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <Link href="/" className="text-sm text-slate-400 md:hidden">
            ← Home
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <span className="badge bg-slate-100 text-slate-600">
              {LABELS[user.userType]}
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
