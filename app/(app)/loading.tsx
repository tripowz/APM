export default function AppLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="surface-panel animate-pulse p-6">
        <div className="h-4 w-28 rounded-full bg-surface-muted" />
        <div className="mt-4 h-8 w-72 rounded-full bg-surface-muted" />
        <div className="mt-3 h-4 w-full max-w-2xl rounded-full bg-surface-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="surface-panel animate-pulse p-5">
            <div className="h-4 w-24 rounded-full bg-surface-muted" />
            <div className="mt-4 h-8 w-20 rounded-full bg-surface-muted" />
            <div className="mt-6 h-4 w-full rounded-full bg-surface-muted" />
          </div>
        ))}
      </div>
      <div className="surface-panel animate-pulse p-6">
        <div className="h-5 w-40 rounded-full bg-surface-muted" />
        <div className="mt-4 h-[320px] rounded-2xl bg-surface-muted" />
      </div>
    </div>
  );
}
