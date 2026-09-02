import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Counts {
  todo: number;
  in_progress: number;
  done: number;
  total: number;
}

const ROWS: { key: keyof Omit<Counts, "total">; label: string; barClass: string }[] = [
  { key: "todo", label: "To do", barClass: "bg-foreground-subtle" },
  { key: "in_progress", label: "In progress", barClass: "bg-accent" },
  { key: "done", label: "Done", barClass: "bg-success" },
];

export function ReportsView({ counts }: { counts: Counts }) {
  const pctDone = counts.total === 0 ? 0 : Math.round((counts.done / counts.total) * 100);
  const max = Math.max(1, counts.todo, counts.in_progress, counts.done);

  return (
    <div>
      <div className="mb-6 grid grid-cols-4 gap-3">
        <StatTile label="Total tasks" value={counts.total} />
        <StatTile label="To do" value={counts.todo} />
        <StatTile label="In progress" value={counts.in_progress} />
        <StatTile label="% complete" value={`${pctDone}%`} />
      </div>

      <Card>
        <h3 className="mb-4 text-xs font-medium uppercase tracking-wide text-foreground-subtle">
          Status distribution
        </h3>
        <div className="flex flex-col gap-3">
          {ROWS.map((row) => {
            const value = counts[row.key];
            const widthPct = (value / max) * 100;
            return (
              <div key={row.key} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm text-foreground-muted">{row.label}</span>
                <div className="h-4 flex-1 overflow-hidden rounded bg-surface-muted">
                  <div
                    className={cn("h-full rounded", row.barClass)}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-sm text-foreground-muted">
                  {value}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-foreground-subtle">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </Card>
  );
}
