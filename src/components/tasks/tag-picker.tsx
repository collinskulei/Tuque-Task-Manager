"use client";

import { useState } from "react";
import { addTagToTask, createTagAndApply, removeTagFromTask } from "@/app/dashboard/actions";
import type { Tag } from "@/lib/types";
import { useServerAction } from "@/lib/use-server-action";
import { cn } from "@/lib/utils";

const PALETTE = ["#3462ff", "#d64545", "#1a9e6b", "#c07a1e", "#8347d6"];

export function TagChip({ tag }: { tag: Tag }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs"
      style={{ backgroundColor: tag.color + "20", color: tag.color }}
    >
      {tag.name}
    </span>
  );
}

export function TagPicker({
  allTags,
  selectedTagIds,
  taskId,
  projectId,
}: {
  allTags: Tag[];
  selectedTagIds: string[];
  taskId: string;
  projectId: string;
}) {
  const { run } = useServerAction();
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const selected = allTags.filter((t) => selectedTagIds.includes(t.id));
  const available = allTags.filter((t) => !selectedTagIds.includes(t.id));

  function handleCreateTag() {
    if (!newTagName.trim()) return;
    const color = PALETTE[allTags.length % PALETTE.length];
    run(() => createTagAndApply(newTagName, color, taskId, projectId));
    setNewTagName("");
    setOpen(false);
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-1">
        {selected.map((tag) => (
          <button
            key={tag.id}
            onClick={() => run(() => removeTagFromTask(taskId, tag.id, projectId))}
            title="Remove tag"
          >
            <TagChip tag={tag} />
          </button>
        ))}
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-foreground-subtle hover:text-foreground"
        >
          + Tag
        </button>
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-48 rounded-md border border-border bg-surface p-2 shadow-sm">
          <div className="flex flex-col gap-1">
            {available.map((tag) => (
              <button
                key={tag.id}
                onClick={() => {
                  run(() => addTagToTask(taskId, tag.id, projectId));
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center rounded-md px-2 py-1 text-left hover:bg-surface-muted"
                )}
              >
                <TagChip tag={tag} />
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-1 border-t border-border pt-2">
            <input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
              placeholder="New tag"
              className="h-7 w-full rounded-md border border-border bg-surface px-2 text-xs outline-none focus:border-accent"
            />
          </div>
        </div>
      )}
    </div>
  );
}
