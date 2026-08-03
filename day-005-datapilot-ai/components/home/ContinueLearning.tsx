import { ArrowRight } from "lucide-react";

const courses = [
  {
    title: "Employee Master",
    progress: 82,
  },
  {
    title: "Compensation",
    progress: 55,
  },
  {
    title: "Performance Reviews",
    progress: 30,
  },
];

export default function ContinueLearning() {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Continue Learning
        </h2>

        <ArrowRight size={18} />
      </div>

      <div className="space-y-5">
        {courses.map((course) => (
          <div key={course.title}>
            <div className="mb-2 flex justify-between">
              <span>{course.title}</span>

              <span>{course.progress}%</span>
            </div>

            <div className="h-2 rounded-full bg-zinc-800">
              <div
                className="h-2 rounded-full bg-blue-500"
                style={{
                  width: `${course.progress}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}