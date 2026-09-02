"use client";

import { useState } from "react";
import Link from "next/link";
import { addProjectToPortfolio, removeProjectFromPortfolio } from "@/app/dashboard/actions";
import type { PortfolioProjectRollup, Project } from "@/lib/types";
import { useServerAction } from "@/lib/use-server-action";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PortfolioView({
  portfolioId,
  rollups,
  allProjects,
}: {
  portfolioId: string;
  rollups: PortfolioProjectRollup[];
  allProjects: Project[];
}) {
  const { run } = useServerAction();
  const [picking, setPicking] = useState("");
  const includedIds = new Set(rollups.map((r) => r.project.id));
  const available = allProjects.filter((p) => !includedIds.has(p.id));

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <select
          value={picking}
          onChange={(e) => setPicking(e.target.value)}
          className="h-9 flex-1 rounded-md border border-border bg-surface px-2 text-sm outline-none focus:border-accent"
        >
          <option value="">Add a project...</option>
          {available.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            if (!picking) return;
            run(() => addProjectToPortfolio(portfolioId, picking));
            setPicking("");
          }}
        >
          Add
        </Button>
      </div>

      {rollups.length === 0 ? (
        <p className="mt-10 text-center text-sm text-foreground-muted">
          No projects in this portfolio yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {rollups.map(({ project, totalTasks, doneTasks }) => {
            const pct = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);
            return (
              <Card key={project.id}>
                <div className="mb-2 flex items-center justify-between">
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="text-sm font-medium hover:text-accent"
                  >
                    {project.name}
                  </Link>
                  <button
                    onClick={() => run(() => removeProjectFromPortfolio(portfolioId, project.id))}
                    className="text-xs text-foreground-subtle hover:text-danger"
                  >
                    Remove
                  </button>
                </div>
                <div className="mb-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-foreground-subtle">
                  {doneTasks} / {totalTasks} tasks done ({pct}%)
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
