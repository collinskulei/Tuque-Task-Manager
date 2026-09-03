import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile, getProfiles, getAuditLog } from "@/lib/data";
import { AdminView } from "@/components/tasks/admin-view";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const me = await getMyProfile(user!.id);
  if (me?.role !== "admin") redirect("/dashboard");

  const [profiles, auditLog] = await Promise.all([getProfiles(), getAuditLog()]);

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold tracking-tight">Admin</h1>
      <AdminView profiles={profiles} auditLog={auditLog} currentUserId={user!.id} />
    </div>
  );
}
