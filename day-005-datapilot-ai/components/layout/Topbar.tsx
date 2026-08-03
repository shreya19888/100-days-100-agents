import { Sparkles } from "lucide-react";

export default function Topbar() {
  return (
    <div className="mb-10 flex items-center justify-between">
      <div>
        <p className="text-sm text-zinc-500">
          Monday • August 3
        </p>

        <h1 className="mt-2 text-5xl font-bold tracking-tight">
          Good afternoon, Shreya 👋
        </h1>

        <p className="mt-3 max-w-2xl text-lg text-zinc-400">
          Become productive with your organization's data ecosystem using AI.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-4">
        <div className="flex items-center gap-3">
          <Sparkles className="text-blue-400" />

          <div>
            <p className="text-sm text-zinc-500">
              AI Mentor
            </p>

            <p className="font-semibold">
              Ready to help
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}