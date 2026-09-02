import { notFound } from "next/navigation";
import { getProject, getProjectTasks, getProfiles } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { ProjectView } from "@/components/tasks/project-view";
import { DeleteProjectButton } from "@/components/tasks/delete-project-button";

export default async function ProjectPage(props: PageProps<"/dashboard/projects/[id]">) {
  const { id } = await props.params;

  const project = await getProject(id);
  if (!project) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [tasks, profiles] = await Promise.all([getProjectTasks(id), getProfiles()]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">{project.name}</h1>
        {project.created_by === user!.id && (
          <DeleteProjectButton projectId={id} />
        )}
      </div>
      <ProjectView
        projectId={id}
        tasks={tasks}
        profiles={profiles}
        currentUserId={user!.id}
      />
    </div>
  );
}
