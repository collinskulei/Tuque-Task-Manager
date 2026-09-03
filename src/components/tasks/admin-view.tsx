"use client";

import { updateUserRole } from "@/app/dashboard/actions";
import type { AuditLogEntry, Profile, UserRole } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { useServerAction } from "@/lib/use-server-action";

const ROLES: UserRole[] = ["admin", "member"];

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function AdminView({
  profiles,
  auditLog,
  currentUserId,
}: {
  profiles: Profile[];
  auditLog: AuditLogEntry[];
  currentUserId: string;
}) {
  const { run } = useServerAction();
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-foreground-subtle">
          Users & roles
        </h2>
        <div className="flex flex-col gap-2">
          {profiles.map((profile) => (
            <div key={profile.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate">{profile.full_name || profile.email}</span>
              <select
                value={profile.role}
                disabled={profile.id === currentUserId}
                onChange={(e) =>
                  run(() => updateUserRole(profile.id, e.target.value as UserRole))
                }
                className="rounded-md border border-border bg-surface px-2 py-1 text-xs outline-none focus:border-accent disabled:opacity-60"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-foreground-subtle">
          Audit log
        </h2>
        <div className="flex flex-col gap-2">
          {auditLog.map((entry) => {
            const actor = profileById.get(entry.actor_id ?? "");
            return (
              <div key={entry.id} className="flex items-center justify-between text-sm">
                <span className="truncate text-foreground-muted">
                  <span className="text-foreground">{actor?.full_name || actor?.email || "System"}</span>{" "}
                  {entry.action.replace(/_/g, " ")} {entry.target_type}
                </span>
                <span className="shrink-0 text-xs text-foreground-subtle">
                  {timeAgo(entry.created_at)}
                </span>
              </div>
            );
          })}
          {auditLog.length === 0 && (
            <p className="text-xs text-foreground-subtle">No activity yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
