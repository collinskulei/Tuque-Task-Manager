import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile, getProfiles, getProjects, getAuditLog, getAllProjectMembers } from "@/lib/data";
import { AdminView } from "@/components/tasks/admin-view";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const me = await getMyProfile(user!.id);
  if (me?.role !== "admin") redirect("/dashboard");

  const [profiles, projects, auditLog, projectMembers] = await Promise.all([
    getProfiles(),
    getProjects(),
    getAuditLog(),
    getAllProjectMembers(),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold tracking-tight">Admin</h1>
      <AdminView
        profiles={profiles}
        projects={projects}
        auditLog={auditLog}
        projectMembers={projectMembers}
        currentUserId={user!.id}
      />
    </div>
  );
}
