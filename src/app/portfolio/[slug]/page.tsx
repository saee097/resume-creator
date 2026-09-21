import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import type { Portfolio } from "@/lib/types";

function getBySlug(slug: string): Portfolio | undefined {
  const db = getDb() as unknown as { portfolios?: Portfolio[] };
  return (db.portfolios ?? []).find((p) => p.slug === slug);
}

export default function PublicPortfolioPage({
  params,
}: {
  params: { slug: string };
}) {
  const portfolio = getBySlug(params.slug);
  if (!portfolio) notFound();

  const themeBg =
    portfolio.theme === "dark"
      ? "bg-slate-900 text-white"
      : portfolio.theme === "accent"
        ? "bg-brand-700 text-white"
        : "bg-slate-50 text-slate-900";

  return (
    <main className={`min-h-screen ${themeBg}`}>
      <div className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="text-3xl font-bold">{portfolio.headline}</h1>
        {portfolio.about && (
          <p className="mt-3 max-w-2xl opacity-80">{portfolio.about}</p>
        )}
        <div className="mt-10 space-y-5">
          {portfolio.projects.map((proj) => (
            <div key={proj.id} className="rounded-xl bg-black/5 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{proj.title}</h2>
                <div className="flex gap-3 text-sm">
                  {proj.liveUrl && (
                    <a href={proj.liveUrl} className="underline">
                      Live
                    </a>
                  )}
                  {proj.repoUrl && (
                    <a href={proj.repoUrl} className="underline">
                      Code
                    </a>
                  )}
                </div>
              </div>
              {proj.summary && <p className="mt-2 opacity-80">{proj.summary}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {proj.tags.map((t) => (
                  <span key={t} className="badge bg-black/10 text-current">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {portfolio.projects.length === 0 && (
            <p className="opacity-60">No projects published yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
