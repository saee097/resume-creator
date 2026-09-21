"use client";

import { useEffect } from "react";

/**
 * Renders a small, screen-only toolbar over a print-optimized page. Clicking
 * "Download PDF" opens the browser print dialog where the user can save as PDF
 * (no external PDF dependency required). Optionally auto-opens on mount.
 */
export default function PrintTrigger({
  auto = false,
  backHref,
}: {
  auto?: boolean;
  backHref?: string;
}) {
  useEffect(() => {
    if (!auto) return;
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, [auto]);

  return (
    <div className="no-print sticky top-0 z-10 mb-4 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
      <span className="text-sm text-slate-500">
        Tip: choose <span className="font-medium">“Save as PDF”</span> in the
        print dialog.
      </span>
      <div className="flex items-center gap-2">
        {backHref && (
          <a href={backHref} className="btn-secondary">
            ← Back
          </a>
        )}
        <button className="btn-primary" onClick={() => window.print()}>
          Download PDF
        </button>
      </div>
    </div>
  );
}
