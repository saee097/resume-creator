import { getCurrentUser } from "@/lib/session";
import * as repo from "@/lib/repo";
import PortfolioEditor from "@/components/PortfolioEditor";

export default function PortfolioPage() {
  const user = getCurrentUser();
  let portfolio = repo.getPortfolio(user.id);
  if (!portfolio) portfolio = repo.createPortfolio(user.id);

  const publicUrl = `/portfolio/${portfolio.slug}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Portfolio Builder</h1>
        <p className="text-sm text-slate-500">
          Showcase your work with a shareable page.
        </p>
      </div>
      <PortfolioEditor portfolio={portfolio} publicUrl={publicUrl} />
    </div>
  );
}
