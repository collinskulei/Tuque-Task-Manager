import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/avatar";
import { signOut } from "@/app/login/actions";

const NAV_ITEMS = [{ label: "My Tasks", href: "/dashboard" }];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? "";

  return (
    <div className="flex flex-1">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border px-3 py-4">
        <div className="px-2 pb-6 text-sm font-semibold tracking-tight">
          Tuque
        </div>

        <nav className="flex flex-1 flex-col gap-0.5">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-md px-2 py-1.5 text-sm text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 border-t border-border pt-3">
          <Avatar name={email} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-foreground-muted">{email}</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="text-xs text-foreground-subtle hover:text-foreground"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 px-8 py-6">{children}</main>
    </div>
  );
}
