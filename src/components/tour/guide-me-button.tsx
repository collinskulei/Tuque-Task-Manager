"use client";

import { useTour } from "./tour-context";

export function GuideMeButton() {
  const { start } = useTour();

  return (
    <button
      onClick={start}
      className="flex items-center gap-2 rounded-md border border-accent-muted bg-accent-muted px-2 py-1.5 text-sm font-medium text-accent transition-colors hover:opacity-90"
    >
      <span aria-hidden="true">✨</span>
      Guide me
    </button>
  );
}
