import { notFound } from "next/navigation";
import { getPortfolio, getPortfolioRollups, getProjects } from "@/lib/data";
import { PortfolioView } from "@/components/tasks/portfolio-view";
import { DeletePortfolioButton } from "@/components/tasks/delete-portfolio-button";

export default async function PortfolioPage(props: PageProps<"/dashboard/portfolios/[id]">) {
  const { id } = await props.params;

  const portfolio = await getPortfolio(id);
  if (!portfolio) notFound();

  const [rollups, allProjects] = await Promise.all([getPortfolioRollups(id), getProjects()]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">{portfolio.name}</h1>
        <DeletePortfolioButton portfolioId={id} />
      </div>
      <PortfolioView portfolioId={id} rollups={rollups} allProjects={allProjects} />
    </div>
  );
}
