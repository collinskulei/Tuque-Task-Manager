import { notFound } from "next/navigation";
import Link from "next/link";
import { getProject, getProjectForm, getProjectCustomFields, getProfiles } from "@/lib/data";
import { submitForm } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function IntakePage(props: PageProps<"/dashboard/projects/[id]/intake">) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const submitted = searchParams.submitted === "1";

  const project = await getProject(id);
  if (!project) notFound();

  const [form, customFields, profiles] = await Promise.all([
    getProjectForm(id),
    getProjectCustomFields(id),
    getProfiles(),
  ]);

  const includedFields = customFields.filter((f) => form?.custom_field_ids.includes(f.id));

  return (
    <div className="mx-auto max-w-md">
      <Link href={`/dashboard/projects/${id}`} className="text-xs text-foreground-subtle hover:text-foreground">
        ← Back to {project.name}
      </Link>

      <h1 className="mb-1 mt-3 text-lg font-semibold tracking-tight">Request: {project.name}</h1>
      {form?.description && (
        <p className="mb-4 text-sm text-foreground-muted">{form.description}</p>
      )}

      {submitted && (
        <p className="mb-4 rounded-md bg-accent-muted px-3 py-2 text-sm text-accent">
          Submitted — your task was added to the project.
        </p>
      )}

      <form action={submitForm} className="flex flex-col gap-3">
        <input type="hidden" name="projectId" value={id} />

        <div>
          <label className="mb-1 block text-xs text-foreground-subtle">Title</label>
          <Input name="title" required autoFocus />
        </div>

        {(form?.include_description ?? true) && (
          <div>
            <label className="mb-1 block text-xs text-foreground-subtle">Description</label>
            <textarea
              name="description"
              rows={3}
              className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
        )}

        {(form?.include_due_date ?? true) && (
          <div>
            <label className="mb-1 block text-xs text-foreground-subtle">Due date</label>
            <Input type="date" name="dueDate" />
          </div>
        )}

        {form?.include_assignee && (
          <div>
            <label className="mb-1 block text-xs text-foreground-subtle">Assignee</label>
            <select
              name="assigneeId"
              className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-accent"
            >
              <option value="">Unassigned</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name || p.email}
                </option>
              ))}
            </select>
          </div>
        )}

        {includedFields.map((field) => (
          <div key={field.id}>
            <label className="mb-1 block text-xs text-foreground-subtle">{field.name}</label>
            {field.field_type === "dropdown" ? (
              <select
                name={`field_${field.id}`}
                className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-accent"
              >
                <option value="">—</option>
                {(field.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                name={`field_${field.id}`}
                type={field.field_type === "number" ? "number" : field.field_type === "date" ? "date" : "text"}
              />
            )}
          </div>
        ))}

        <Button type="submit" className="mt-1">
          Submit
        </Button>
      </form>
    </div>
  );
}
