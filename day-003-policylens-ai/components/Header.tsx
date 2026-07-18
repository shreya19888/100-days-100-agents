export default function Header() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-6">

        <div>
          <h1 className="text-3xl font-bold text-white">
            PolicyLens AI
          </h1>

          <p className="mt-2 text-zinc-400">
            Multilingual Agentic RAG Platform for Global HR Policies
          </p>
        </div>

        <span className="rounded-full border border-emerald-700 bg-emerald-900/40 px-4 py-2 text-sm text-emerald-400">
          Day 003
        </span>

      </div>
    </header>
  );
}