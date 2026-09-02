"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Refreshes the current route whenever another session changes data for this
// project, so two people looking at the same board see updates without a
// manual reload.
export function RealtimeProjectSync({ projectId }: { projectId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    // RLS on `tasks`/`comments` is scoped `to authenticated`. Realtime evaluates
    // that using the client's synced auth token, not just the anon apikey — if we
    // subscribe before the session is loaded, events get silently filtered out.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session) supabase.realtime.setAuth(session.access_token);

      channel = supabase
        .channel(`project-${projectId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "tasks", filter: `project_id=eq.${projectId}` },
          () => router.refresh()
        )
        .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, () =>
          router.refresh()
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [projectId, router]);

  return null;
}
