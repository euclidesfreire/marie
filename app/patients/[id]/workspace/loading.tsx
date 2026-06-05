export default function WorkspaceLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 border-b border-border bg-white" />
      <div className="grid h-[calc(100vh-64px)] grid-cols-1 lg:grid-cols-[300px_1fr_560px] xl:grid-cols-[300px_1fr_620px]">
        <div className="hidden bg-senac-blue-dark lg:block" />
        <main className="min-w-0 space-y-4 p-5 lg:p-8">
          <div className="h-8 w-56 animate-pulse rounded-xl bg-blue-100" />
          <div className="h-12 animate-pulse rounded-2xl bg-blue-50" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-[14px] border border-border bg-white shadow-soft" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-[14px] border border-border bg-white shadow-soft" />
        </main>
        <aside className="hidden border-l border-border bg-white p-5 lg:block">
          <div className="h-28 animate-pulse rounded-[14px] border border-border bg-[#F8FAFD]" />
          <div className="mt-4 h-12 animate-pulse rounded-xl bg-blue-50" />
          <div className="mt-4 h-96 animate-pulse rounded-[14px] border border-border bg-[#F8FAFD]" />
        </aside>
      </div>
    </div>
  );
}

