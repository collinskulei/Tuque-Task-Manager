import type { WorkloadRow } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const OVERLOADED_THRESHOLD = 8;

export function WorkloadView({ rows }: { rows: WorkloadRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.openTaskCount));

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">
          Open tasks per person
        </h3>
        <span className="text-xs text-foreground-subtle">
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-danger" />
          {OVERLOADED_THRESHOLD}+ open tasks
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-foreground-muted">No assigned tasks yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => {
            const overloaded = row.openTaskCount >= OVERLOADED_THRESHOLD;
            const widthPct = (row.openTaskCount / max) * 100;
            return (
              <div key={row.profile.id} className="flex items-center gap-3">
                <Avatar name={row.profile.full_name || row.profile.email} />
                <span className="w-36 shrink-0 truncate text-sm text-foreground-muted">
                  {row.profile.full_name || row.profile.email}
                </span>
                <div className="h-4 flex-1 overflow-hidden rounded bg-surface-muted">
                  <div
                    className={cn("h-full rounded", overloaded ? "bg-danger" : "bg-accent")}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "w-6 shrink-0 text-right text-sm",
                    overloaded ? "font-semibold text-danger" : "text-foreground-muted"
                  )}
                >
                  {row.openTaskCount}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
