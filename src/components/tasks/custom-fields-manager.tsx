"use client";

import { useState } from "react";
import { createCustomField, deleteCustomField } from "@/app/dashboard/actions";
import type { CustomField, CustomFieldType } from "@/lib/types";
import { useServerAction } from "@/lib/use-server-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FIELD_TYPES: { value: CustomFieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "dropdown", label: "Dropdown" },
  { value: "date", label: "Date" },
];

export function CustomFieldsManager({
  projectId,
  fields,
}: {
  projectId: string;
  fields: CustomField[];
}) {
  const { run } = useServerAction();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [fieldType, setFieldType] = useState<CustomFieldType>("text");
  const [options, setOptions] = useState("");

  function handleAdd() {
    if (!name.trim()) return;
    run(() =>
      createCustomField({
        projectId,
        name,
        fieldType,
        options: options
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean),
      })
    );
    setName("");
    setOptions("");
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-foreground-subtle hover:text-foreground"
      >
        Fields
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-64 rounded-md border border-border bg-surface p-3 shadow-sm">
          <div className="flex flex-col gap-1">
            {fields.map((field) => (
              <div key={field.id} className="flex items-center justify-between text-sm">
                <span>
                  {field.name}{" "}
                  <span className="text-xs text-foreground-subtle">({field.field_type})</span>
                </span>
                <button
                  onClick={() => run(() => deleteCustomField(field.id, projectId))}
                  className="text-xs text-foreground-subtle hover:text-danger"
                >
                  Remove
                </button>
              </div>
            ))}
            {fields.length === 0 && (
              <p className="text-xs text-foreground-subtle">No custom fields yet.</p>
            )}
          </div>

          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Field name"
              className="h-8 text-sm"
            />
            <select
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value as CustomFieldType)}
              className="h-8 rounded-md border border-border bg-surface px-2 text-sm outline-none"
            >
              {FIELD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {fieldType === "dropdown" && (
              <Input
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                placeholder="Options, comma separated"
                className="h-8 text-sm"
              />
            )}
            <Button size="sm" variant="secondary" onClick={handleAdd}>
              Add field
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
