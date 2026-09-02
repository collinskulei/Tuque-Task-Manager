"use client";

import { useState } from "react";
import { createRule, deleteRule, toggleRule } from "@/app/dashboard/actions";
import { TASK_STATUSES, type Profile, type Rule, type RuleActionType, type RuleTriggerType, type Tag } from "@/lib/types";
import { useServerAction } from "@/lib/use-server-action";
import { Button } from "@/components/ui/button";

const TRIGGERS: { value: RuleTriggerType; label: string }[] = [
  { value: "task_created", label: "A task is created" },
  { value: "status_changed", label: "Status changes to..." },
  { value: "assignee_changed", label: "Assignee changes to..." },
];

const ACTIONS: { value: RuleActionType; label: string }[] = [
  { value: "set_status", label: "Set status to..." },
  { value: "set_assignee", label: "Assign to..." },
  { value: "add_tag", label: "Add tag..." },
  { value: "notify_assignee", label: "Notify the assignee" },
];

function describeRule(rule: Rule): string {
  const trigger = TRIGGERS.find((t) => t.value === rule.trigger_type)?.label ?? rule.trigger_type;
  const action = ACTIONS.find((a) => a.value === rule.action_type)?.label ?? rule.action_type;
  return `When ${trigger.replace("...", "")} → ${action.replace("...", "")}`;
}

export function RulesManager({
  projectId,
  rules,
  profiles,
  tags,
}: {
  projectId: string;
  rules: Rule[];
  profiles: Profile[];
  tags: Tag[];
}) {
  const { run } = useServerAction();
  const [open, setOpen] = useState(false);
  const [triggerType, setTriggerType] = useState<RuleTriggerType>("status_changed");
  const [triggerValue, setTriggerValue] = useState("done");
  const [actionType, setActionType] = useState<RuleActionType>("notify_assignee");
  const [actionValue, setActionValue] = useState("");

  function handleCreate() {
    const triggerKey = triggerType === "status_changed" ? "status" : "assignee_id";
    const actionKey =
      actionType === "set_status" ? "status" : actionType === "set_assignee" ? "assignee_id" : "tag_id";

    const trigger_value = triggerType === "task_created" ? {} : { [triggerKey]: triggerValue };
    const action_value = actionType === "notify_assignee" ? {} : { [actionKey]: actionValue };

    run(() =>
      createRule({
        projectId,
        name: `${triggerType}->${actionType}`,
        triggerType,
        triggerValue: trigger_value,
        actionType,
        actionValue: action_value,
      })
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-foreground-subtle hover:text-foreground"
      >
        Rules
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-80 rounded-md border border-border bg-surface p-3 shadow-sm">
          <div className="flex flex-col gap-2">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between gap-2 text-sm">
                <span className={rule.enabled ? "" : "text-foreground-subtle line-through"}>
                  {describeRule(rule)}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => run(() => toggleRule(rule.id, !rule.enabled, projectId))}
                    className="text-xs text-foreground-subtle hover:text-foreground"
                  >
                    {rule.enabled ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => run(() => deleteRule(rule.id, projectId))}
                    className="text-xs text-foreground-subtle hover:text-danger"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {rules.length === 0 && (
              <p className="text-xs text-foreground-subtle">No rules yet.</p>
            )}
          </div>

          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-xs text-foreground-subtle">When</span>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value as RuleTriggerType)}
                className="flex-1 rounded-md border border-border bg-surface px-1.5 py-1 text-xs outline-none"
              >
                {TRIGGERS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {triggerType === "status_changed" && (
              <select
                value={triggerValue}
                onChange={(e) => setTriggerValue(e.target.value)}
                className="rounded-md border border-border bg-surface px-1.5 py-1 text-xs outline-none"
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            )}
            {triggerType === "assignee_changed" && (
              <select
                value={triggerValue}
                onChange={(e) => setTriggerValue(e.target.value)}
                className="rounded-md border border-border bg-surface px-1.5 py-1 text-xs outline-none"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name || p.email}
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-1">
              <span className="text-xs text-foreground-subtle">Then</span>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as RuleActionType)}
                className="flex-1 rounded-md border border-border bg-surface px-1.5 py-1 text-xs outline-none"
              >
                {ACTIONS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>

            {actionType === "set_status" && (
              <select
                value={actionValue}
                onChange={(e) => setActionValue(e.target.value)}
                className="rounded-md border border-border bg-surface px-1.5 py-1 text-xs outline-none"
              >
                <option value="">Select status...</option>
                {TASK_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            )}
            {actionType === "set_assignee" && (
              <select
                value={actionValue}
                onChange={(e) => setActionValue(e.target.value)}
                className="rounded-md border border-border bg-surface px-1.5 py-1 text-xs outline-none"
              >
                <option value="">Select person...</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name || p.email}
                  </option>
                ))}
              </select>
            )}
            {actionType === "add_tag" && (
              <select
                value={actionValue}
                onChange={(e) => setActionValue(e.target.value)}
                className="rounded-md border border-border bg-surface px-1.5 py-1 text-xs outline-none"
              >
                <option value="">Select tag...</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}

            <Button size="sm" variant="secondary" onClick={handleCreate}>
              Add rule
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
