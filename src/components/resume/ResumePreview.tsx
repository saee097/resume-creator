import type { Resume } from "@/lib/types";

function fmtDate(value?: string): string {
  if (!value) return "";
  const [y, m] = value.split("-");
  const months = [
    "",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  if (m && months[Number(m)]) return `${months[Number(m)]} ${y}`;
  return value;
}

export default function ResumePreview({
  resume,
}: {
  resume: Resume;
}) {
  const c = resume.contact;
  return (
    <div
      className={`mx-auto max-w-[640px] bg-white p-8 text-slate-800 shadow-sm ${
        resume.template === "compact" ? "text-[13px] leading-snug" : "text-sm"
      }`}
    >
      <header className="border-b border-slate-200 pb-3">
        <h1 className="text-2xl font-bold text-slate-900">
          {c.fullName || "Your Name"}
        </h1>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
          {c.email && <span>{c.email}</span>}
          {c.phone && <span>{c.phone}</span>}
          {c.location && <span>{c.location}</span>}
          {c.linkedin && <span>{c.linkedin}</span>}
          {c.github && <span>{c.github}</span>}
          {c.website && <span>{c.website}</span>}
        </div>
      </header>

      {resume.summary && (
        <section className="mt-4">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-700">
            Summary
          </h2>
          <p className="text-slate-700">{resume.summary}</p>
        </section>
      )}

      {resume.experience.length > 0 && (
        <section className="mt-4">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-700">
            Experience
          </h2>
          {resume.experience.map((e) => (
            <div key={e.id} className="mb-3">
              <div className="flex items-baseline justify-between">
                <span className="font-semibold text-slate-900">{e.role}</span>
                <span className="text-xs text-slate-500">
                  {fmtDate(e.startDate)} – {e.current ? "Present" : fmtDate(e.endDate)}
                </span>
              </div>
              <div className="text-xs text-slate-600">
                {e.company}
                {e.location ? ` · ${e.location}` : ""}
              </div>
              <ul className="mt-1 list-disc pl-5 text-slate-700">
                {e.bullets.filter(Boolean).map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {resume.education.length > 0 && (
        <section className="mt-4">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-700">
            Education
          </h2>
          {resume.education.map((ed) => (
            <div key={ed.id} className="mb-2">
              <div className="font-semibold text-slate-900">
                {ed.school}
                {ed.field ? ` — ${ed.degree}, ${ed.field}` : ` — ${ed.degree}`}
              </div>
              <div className="text-xs text-slate-500">
                {ed.startDate} – {ed.endDate || "Present"}
              </div>
            </div>
          ))}
        </section>
      )}

      {resume.skills.length > 0 && (
        <section className="mt-4">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-700">
            Skills
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {resume.skills.map((s) => (
              <span key={s} className="badge bg-slate-100 text-slate-700">
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      {resume.projects.length > 0 && (
        <section className="mt-4">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-700">
            Projects
          </h2>
          {resume.projects.map((p) => (
            <div key={p.id} className="mb-2">
              <span className="font-semibold text-slate-900">{p.name}</span>
              {p.description && (
                <p className="text-slate-700">{p.description}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {resume.languages && resume.languages.length > 0 && (
        <section className="mt-4">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-700">
            Languages
          </h2>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-slate-700">
            {resume.languages
              .filter((l) => l.language)
              .map((l, i) => (
                <span key={i}>
                  {l.language}
                  <span className="text-slate-500"> ({l.level})</span>
                </span>
              ))}
          </div>
        </section>
      )}

      {resume.awards && resume.awards.length > 0 && (
        <section className="mt-4">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-700">
            Awards
          </h2>
          {resume.awards.map((a) => (
            <div key={a.id} className="mb-2">
              <div className="flex items-baseline justify-between">
                <span className="font-semibold text-slate-900">
                  {a.title}
                  {a.issuer ? ` · ${a.issuer}` : ""}
                </span>
                {a.date && (
                  <span className="text-xs text-slate-500">{fmtDate(a.date)}</span>
                )}
              </div>
              {a.description && <p className="text-slate-700">{a.description}</p>}
            </div>
          ))}
        </section>
      )}

      {resume.publications && resume.publications.length > 0 && (
        <section className="mt-4">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-700">
            Publications
          </h2>
          {resume.publications.map((p) => (
            <div key={p.id} className="mb-2">
              <div className="flex items-baseline justify-between">
                <span className="font-semibold text-slate-900">
                  {p.title}
                  {p.publisher ? ` · ${p.publisher}` : ""}
                </span>
                {p.date && (
                  <span className="text-xs text-slate-500">{fmtDate(p.date)}</span>
                )}
              </div>
              {p.description && <p className="text-slate-700">{p.description}</p>}
              {p.url && <div className="text-xs text-slate-500">{p.url}</div>}
            </div>
          ))}
        </section>
      )}

      {resume.courses && resume.courses.length > 0 && (
        <section className="mt-4">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-700">
            Courses
          </h2>
          {resume.courses.map((c) => (
            <div key={c.id} className="mb-1 flex items-baseline justify-between">
              <span className="text-slate-800">
                <span className="font-semibold text-slate-900">{c.name}</span>
                {c.institution ? ` · ${c.institution}` : ""}
              </span>
              {c.date && (
                <span className="text-xs text-slate-500">{fmtDate(c.date)}</span>
              )}
            </div>
          ))}
        </section>
      )}

      {resume.volunteer && resume.volunteer.length > 0 && (
        <section className="mt-4">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-700">
            Volunteer
          </h2>
          {resume.volunteer.map((v) => (
            <div key={v.id} className="mb-3">
              <div className="flex items-baseline justify-between">
                <span className="font-semibold text-slate-900">
                  {v.role || v.organization}
                </span>
                <span className="text-xs text-slate-500">
                  {fmtDate(v.startDate)}
                  {v.current
                    ? " – Present"
                    : v.endDate
                      ? ` – ${fmtDate(v.endDate)}`
                      : ""}
                </span>
              </div>
              {v.role && (
                <div className="text-xs text-slate-600">{v.organization}</div>
              )}
              {v.description && <p className="text-slate-700">{v.description}</p>}
            </div>
          ))}
        </section>
      )}

      {resume.references && resume.references.length > 0 && (
        <section className="mt-4">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-700">
            References
          </h2>
          {resume.references.map((ref) => (
            <div key={ref.id} className="mb-2">
              <span className="font-semibold text-slate-900">{ref.name}</span>
              {(ref.title || ref.company) && (
                <div className="text-xs text-slate-600">
                  {[ref.title, ref.company].filter(Boolean).join(" · ")}
                </div>
              )}
              {(ref.email || ref.phone) && (
                <div className="text-xs text-slate-500">
                  {[ref.email, ref.phone].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {resume.customSections
        ?.filter((cs) => cs.title || cs.items.some((i) => i.title || i.description))
        .map((cs) => (
          <section key={cs.id} className="mt-4">
            <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-700">
              {cs.title || "Section"}
            </h2>
            {cs.items.map((it) => (
              <div key={it.id} className="mb-2">
                {(it.title || it.date) && (
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold text-slate-900">
                      {it.title}
                      {it.subtitle ? ` · ${it.subtitle}` : ""}
                    </span>
                    {it.date && (
                      <span className="text-xs text-slate-500">{it.date}</span>
                    )}
                  </div>
                )}
                {it.description && (
                  <p className="text-slate-700">{it.description}</p>
                )}
              </div>
            ))}
          </section>
        ))}
    </div>
  );
}
