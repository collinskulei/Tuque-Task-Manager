export default function DashboardPage() {
  return (
    <div className="flex h-full flex-col">
      <h1 className="text-lg font-semibold tracking-tight">My Tasks</h1>

      <div className="mt-16 flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-sm text-foreground-muted">
          No tasks yet. Task creation ships in the next milestone.
        </p>
      </div>
    </div>
  );
}
