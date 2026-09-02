"use client";

import Link from "next/link";
import { markAllNotificationsRead, markNotificationRead } from "@/app/dashboard/actions";
import type { Notification } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useServerAction } from "@/lib/use-server-action";
import { cn } from "@/lib/utils";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function InboxView({ notifications }: { notifications: Notification[] }) {
  const { run } = useServerAction();
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Inbox</h1>
        {hasUnread && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => run(() => markAllNotificationsRead())}
          >
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="mt-16 text-center text-sm text-foreground-muted">
          You&apos;re all caught up.
        </p>
      ) : (
        <div className="flex flex-col">
          {notifications.map((n) => {
            const content = (
              <div
                className={cn(
                  "flex items-start justify-between gap-3 border-b border-border py-3",
                  !n.read && "bg-accent-muted/40"
                )}
              >
                <div>
                  <p className="text-sm">{n.message}</p>
                  <p className="mt-0.5 text-xs text-foreground-subtle">{timeAgo(n.created_at)}</p>
                </div>
              </div>
            );

            if (!n.project_id) {
              return <div key={n.id}>{content}</div>;
            }

            return (
              <Link
                key={n.id}
                href={`/dashboard/projects/${n.project_id}`}
                onClick={() => !n.read && run(() => markNotificationRead(n.id))}
              >
                {content}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
