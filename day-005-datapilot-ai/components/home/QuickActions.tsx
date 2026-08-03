import {
  Database,
  GitBranch,
  Sparkles,
  Search,
  FileCode,
  ShieldCheck,
} from "lucide-react";

const actions = [
  {
    title: "Explain Dataset",
    icon: Database,
  },
  {
    title: "Generate SQL",
    icon: FileCode,
  },
  {
    title: "Trace Lineage",
    icon: GitBranch,
  },
  {
    title: "Find Owner",
    icon: Search,
  },
  {
    title: "Impact Analysis",
    icon: ShieldCheck,
  },
  {
    title: "Ask AI",
    icon: Sparkles,
  },
];

export default function QuickActions() {
  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold">
        Quick Actions
      </h2>

      <div className="grid gap-4 md:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.title}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-left transition hover:border-blue-500 hover:bg-zinc-800"
            >
              <Icon className="mb-4 text-blue-400" />

              <p className="font-semibold">
                {action.title}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}