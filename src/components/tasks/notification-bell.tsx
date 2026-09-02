import Link from "next/link";

export function NotificationBell({ unreadCount }: { unreadCount: number }) {
  return (
    <Link
      href="/dashboard/inbox"
      className="relative flex items-center rounded-md px-2 py-1.5 text-sm text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
    >
      Inbox
      {unreadCount > 0 && (
        <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-accent-foreground">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
