import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile, getWorkload } from "@/lib/data";
import { WorkloadView } from "@/components/tasks/workload-view";

export default async function WorkloadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const me = await getMyProfile(user!.id);
  if (me?.role === "guest") redirect("/dashboard");

  const rows = await getWorkload();

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold tracking-tight">Workload</h1>
      <WorkloadView rows={rows} />
    </div>
  );
}
