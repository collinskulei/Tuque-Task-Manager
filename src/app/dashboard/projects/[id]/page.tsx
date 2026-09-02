import { notFound } from "next/navigation";
import { getProject, getProjectTasks, getProfiles, getTags, getProjectCustomFields } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { ProjectView } from "@/components/tasks/project-view";
import { DeleteProjectButton } from "@/components/tasks/delete-project-button";
import { CustomFieldsManager } from "@/components/tasks/custom-fields-manager";
import { RealtimeProjectSync } from "@/components/tasks/realtime-project-sync";

export default async function ProjectPage(props: PageProps<"/dashboard/projects/[id]">) {
  const { id } = await props.params;

  const project = await getProject(id);
  if (!project) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [tasks, profiles, tags, customFields] = await Promise.all([
    getProjectTasks(id),
    getProfiles(),
    getTags(),
    getProjectCustomFields(id),
  ]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">{project.name}</h1>
        <div className="flex items-center gap-3">
          <CustomFieldsManager projectId={id} fields={customFields} />
          {project.created_by === user!.id && <DeleteProjectButton projectId={id} />}
        </div>
      </div>
      <ProjectView
        projectId={id}
        tasks={tasks}
        profiles={profiles}
        tags={tags}
        customFields={customFields}
        currentUserId={user!.id}
      />
      <RealtimeProjectSync projectId={id} />
    </div>
  );
}
