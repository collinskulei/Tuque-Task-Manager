"use client";

import { useMemo, useState } from "react";
import {
  addProjectMember,
  removeProjectMember,
  updateUserRole,
} from "@/app/dashboard/actions";
import type { AuditLogEntry, Profile, Project, ProjectMember, UserRole } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useServerAction } from "@/lib/use-server-action";

const ROLES: UserRole[] = ["admin", "member", "guest"];

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
  projects,
  auditLog,
  projectMembers,
  currentUserId,
}: {
  profiles: Profile[];
  projects: Project[];
  auditLog: AuditLogEntry[];
  projectMembers: ProjectMember[];
  currentUserId: string;
}) {
  const { run } = useServerAction();
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? "");
  const [memberPick, setMemberPick] = useState("");
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  const currentMembers = useMemo(
    () => projectMembers.filter((pm) => pm.project_id === selectedProjectId),
    [projectMembers, selectedProjectId]
  );
  const memberOptions = profiles.filter(
    (p) => !currentMembers.some((m) => m.user_id === p.id)
  );

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
          Project membership (for guests)
        </h2>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="mb-3 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-accent"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <div className="flex flex-col gap-1">
          {currentMembers.map((member) => {
            const profile = profileById.get(member.user_id);
            return (
              <div key={member.user_id} className="flex items-center justify-between text-sm">
                <span>{profile?.full_name || profile?.email || member.user_id}</span>
                <button
                  onClick={() =>
                    run(() => removeProjectMember(selectedProjectId, member.user_id))
                  }
                  className="text-xs text-foreground-subtle hover:text-danger"
                >
                  Remove
                </button>
              </div>
            );
          })}
          {currentMembers.length === 0 && (
            <p className="text-xs text-foreground-subtle">No members added.</p>
          )}
        </div>

        {memberOptions.length > 0 && (
          <div className="mt-3 flex gap-2 border-t border-border pt-3">
            <select
              value={memberPick}
              onChange={(e) => setMemberPick(e.target.value)}
              className="h-8 flex-1 rounded-md border border-border bg-surface px-2 text-sm outline-none focus:border-accent"
            >
              <option value="">Add a person...</option>
              {memberOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name || p.email}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                if (!memberPick) return;
                run(() => addProjectMember(selectedProjectId, memberPick));
                setMemberPick("");
              }}
            >
              Add
            </Button>
          </div>
        )}
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
