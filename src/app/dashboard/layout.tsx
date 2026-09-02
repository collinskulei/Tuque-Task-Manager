import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProjects } from "@/lib/data";
import { Avatar } from "@/components/ui/avatar";
import { signOut } from "@/app/login/actions";
import { NewProjectForm } from "@/components/tasks/new-project-form";

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
  const projects = await getProjects();

  return (
    <div className="flex flex-1">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border px-3 py-4">
        <div className="px-2 pb-6 text-sm font-semibold tracking-tight">
          Tuque
        </div>

        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto">
          <Link
            href="/dashboard"
            className="rounded-md px-2 py-1.5 text-sm text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            My Tasks
          </Link>

          <div>
            <div className="flex items-center justify-between px-2 pb-1">
              <span className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">
                Projects
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  className="truncate rounded-md px-2 py-1.5 text-sm text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
                >
                  {project.name}
                </Link>
              ))}
            </div>
            <NewProjectForm />
          </div>
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

      <main className="flex-1 overflow-y-auto px-8 py-6">{children}</main>
    </div>
  );
}
