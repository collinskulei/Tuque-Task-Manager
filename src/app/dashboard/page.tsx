import { createClient } from "@/lib/supabase/server";
import { getMyTasks, getProfiles, getTags, getMyProfile } from "@/lib/data";
import { MyTasksView } from "@/components/tasks/my-tasks-view";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [tasks, profiles, tags, me] = await Promise.all([
    getMyTasks(user!.id),
    getProfiles(),
    getTags(),
    getMyProfile(user!.id),
  ]);

  return (
    <div className="flex h-full flex-col">
      <h1 className="mb-4 text-lg font-semibold tracking-tight">My Tasks</h1>
      <MyTasksView
        tasks={tasks}
        profiles={profiles}
        tags={tags}
        currentUserId={user!.id}
        isGuest={me?.role === "guest"}
      />
    </div>
  );
}
