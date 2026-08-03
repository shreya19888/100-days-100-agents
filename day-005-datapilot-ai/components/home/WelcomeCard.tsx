import { ArrowRight, Sparkles } from "lucide-react";

export default function WelcomeCard() {
  return (
    <div className="mb-8 overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-8 shadow-2xl">

      <div className="flex items-start justify-between">

        <div className="max-w-2xl">

          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur">

            <Sparkles size={16} />

            AI Mentor

          </div>

          <h2 className="text-5xl font-bold leading-tight">
            Welcome back,
            <br />
            Shreya 👋
          </h2>

          <p className="mt-5 text-lg text-blue-100 leading-8">
            Today I'll help you become productive with your company's
            data platform. Let's explore the datasets you'll actually use.
          </p>

          <button className="mt-8 flex items-center gap-3 rounded-2xl bg-white px-6 py-4 font-semibold text-black transition hover:scale-105">

            Continue Learning

            <ArrowRight size={18} />

          </button>

        </div>

        <div className="hidden lg:block">

          <div className="rounded-3xl bg-white/10 p-6 backdrop-blur">

            <p className="text-sm text-blue-100">
              Today's Goal
            </p>

            <h3 className="mt-2 text-2xl font-bold">
              Employee Attrition
            </h3>

            <div className="mt-6 h-3 w-56 rounded-full bg-white/20">

              <div className="h-3 w-1/3 rounded-full bg-white" />

            </div>

            <p className="mt-3 text-sm text-blue-100">

              32% Complete

            </p>

          </div>

        </div>

      </div>

    </div>
  );
}