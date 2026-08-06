import { datasets } from "@/lib/datasets";
import Link from "next/link";
const missions = [
  {
    title: "HR Data Engineer",
    progress: 82,
    color: "bg-blue-600",
    tasks: [
      "Explore Employee Master",
      "Understand Lineage",
      "Run SQL Query",
      "Complete AI Learning",
      "Take Quiz",
    ],
  },
  {
    title: "Finance Analytics",
    progress: 61,
    color: "bg-green-600",
    tasks: ["Payroll", "Expense Reports", "Budget", "Build Dashboard", "Validate Metrics"],
  },
  {
    title: "Marketing Analytics",
    progress: 35,
    color: "bg-purple-600",
    tasks: [
      "Campaign Performance",
      "Customer Segments",
      "Email Analytics",
      "Create Report",
      "Present Insights",
    ],
  },
];

export default function MissionsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-900 text-white">
        <div className="mx-auto max-w-7xl px-10 py-16">
          <h1 className="text-5xl font-black">🎯 Learning Missions</h1>

          <p className="mt-4 text-xl text-blue-100">
            Become productive faster through guided enterprise onboarding.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl p-10">
        <div className="grid gap-6 md:grid-cols-4 mb-10">
          <Stat title="Datasets" value={Object.keys(datasets).length.toString()} />

          <Stat title="Missions" value={missions.length.toString()} />

          <Stat
            title="Completion"
            value={`${Math.round(missions.reduce((a, b) => a + b.progress, 0) / missions.length)}%`}
          />

          <Stat title="Badges" value="7" />
        </div>

        <div className="space-y-8">
          {missions.map((mission) => (
            <div key={mission.title} className="rounded-3xl border bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold">{mission.title}</h2>

                  <p className="text-gray-500 mt-2">Complete all tasks to unlock your badge.</p>
                </div>

                <div className="text-right">
                  <p className="text-4xl font-black">{mission.progress}%</p>

                  <p className="text-gray-500">Completed</p>
                </div>
              </div>

              <div className="mt-6 h-4 rounded-full bg-slate-200">
                <div
                  className={`${mission.color} h-4 rounded-full`}
                  style={{
                    width: `${mission.progress}%`,
                  }}
                />
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {mission.tasks.map((task, index) => {
                  let href = "/";

                  switch (task) {
                    case "Explore Employee Master":
                      href = "/datasets/employee%20master";
                      break;

                    case "Understand Lineage":
                      href = "/datasets/employee%20master#lineage";
                      break;

                    case "Run SQL Query":
                      href = "/datasets/employee%20master#sql";
                      break;

                    case "Complete AI Learning":
                      href = "/learn";
                      break;

                    case "Take Quiz":
                      href = "/datasets/employee%20master";
                      break;

                    case "Payroll":
                      href = "/datasets/payroll";
                      break;

                    case "Expense Reports":
                      href = "/datasets/expense%20reports";
                      break;

                    case "Budget":
                      href = "/datasets/budget";
                      break;

                    case "Campaign Performance":
                      href = "/datasets/campaign%20performance";
                      break;

                    case "Customer Segments":
                      href = "/datasets/customer%20segments";
                      break;

                    case "Email Analytics":
                      href = "/datasets/email%20analytics";
                      break;

                    default:
                      href = "/datasets";
                  }

                  return (
                    <Link key={task} href={href} className="transition hover:scale-[1.02]">
                      <div className="flex items-center gap-3 rounded-xl border bg-slate-50 p-4 hover:border-blue-400 hover:bg-blue-50">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            index < 3 ? "bg-green-500 text-white" : "bg-slate-300"
                          }`}
                        >
                          {index < 3 ? "✓" : "→"}
                        </div>

                        <div>
                          <p className="font-medium">{task}</p>

                          <p className="text-sm text-gray-500">Click to open</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>

      <p className="mt-3 text-4xl font-bold">{value}</p>
    </div>
  );
}
