"use client";

import {
  Home,
  GraduationCap,
  BrainCircuit,
  GitBranch,
  Zap,
  Star,
  Settings,
  Database,
} from "lucide-react";

const navigation = [
  {
    name: "Home",
    icon: Home,
    active: true,
  },
  {
    name: "Learning",
    icon: GraduationCap,
  },
  {
    name: "AI Copilot",
    icon: BrainCircuit,
  },
  {
    name: "Data Map",
    icon: GitBranch,
  },
  {
    name: "Quick Actions",
    icon: Zap,
  },
  {
    name: "Favorites",
    icon: Star,
  },
];

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-72 flex-col border-r border-zinc-800 bg-[#09090B]">
      {/* Logo */}
      <div className="border-b border-zinc-800 px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-600 p-3">
            <Database className="h-6 w-6 text-white" />
          </div>

          <div>
            <h1 className="text-2xl font-bold">DataPilot</h1>

            <p className="text-sm text-zinc-500">
              AI Data Engineering Copilot
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              className={`mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200 ${
                item.active
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />

              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Card */}
      <div className="m-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="text-sm text-zinc-400">Current Role</p>

        <h3 className="mt-2 text-lg font-semibold">
          Data Engineer
        </h3>

        <div className="mt-4">
          <div className="mb-2 flex justify-between text-sm">
            <span>Onboarding</span>
            <span>32%</span>
          </div>

          <div className="h-2 rounded-full bg-zinc-800">
            <div className="h-2 w-1/3 rounded-full bg-blue-500" />
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="border-t border-zinc-800 p-4">
        <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-zinc-400 transition hover:bg-zinc-900 hover:text-white">
          <Settings className="h-5 w-5" />
          Settings
        </button>
      </div>
    </aside>
  );
}