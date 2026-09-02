"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

// Server Actions called directly from an event handler (not a <form action>)
// mark the Router Cache stale but don't refresh the mounted page on their own —
// router.refresh() is what actually pulls the updated server-rendered data in.
export function useServerAction() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<unknown>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  return { run, isPending };
}
