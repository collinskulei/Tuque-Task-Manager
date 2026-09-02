"use client";

import { deletePortfolio } from "@/app/dashboard/actions";

export function DeletePortfolioButton({ portfolioId }: { portfolioId: string }) {
  return (
    <button
      onClick={() => {
        if (confirm("Delete this portfolio? Projects inside it are not deleted.")) {
          deletePortfolio(portfolioId);
        }
      }}
      className="text-xs text-foreground-subtle hover:text-danger"
    >
      Delete portfolio
    </button>
  );
}
