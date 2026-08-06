"use client";

import { useState } from "react";
import {
  BookOpen,
  BrainCircuit,
  ExternalLink,
  GraduationCap,
  PlayCircle,
  X,
  Database,
  Code2,
} from "lucide-react";
import type { DatasetMetadata } from "@/lib/datasets/types";
import QuizModal from "./QuizModal";

type Props = {
  dataset: DatasetMetadata;
};

const officialResources = [
  {
    title: "Snowflake Documentation",
    subtitle: "Official Snowflake documentation",
    url: "https://docs.snowflake.com/",
  },
  {
    title: "DataHub Documentation",
    subtitle: "Metadata & Lineage",
    url: "https://docs.datahub.com/",
  },
  {
    title: "dbt Learn",
    subtitle: "Transformation best practices",
    url: "https://learn.getdbt.com/",
  },
  {
    title: "OpenAI Developers",
    subtitle: "Build AI-powered experiences",
    url: "https://platform.openai.com/docs",
  },
];

export default function LearningResourcesDrawer({
  dataset,
}: Props) {
  const [open, setOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border py-4 font-semibold transition hover:bg-slate-100"
      >
        📚 Learning Resources
      </button>

      {open && (
        <div className="fixed inset-0 z-50">

          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 top-0 h-full w-[720px] overflow-y-auto bg-white shadow-2xl">

            <div className="sticky top-0 border-b bg-white p-6">

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="text-3xl font-bold">
                    📚 Learning Hub
                  </h2>

                  <p className="mt-1 text-gray-500">
                    {dataset.title}
                  </p>

                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="rounded-xl border p-2 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>

              </div>

            </div>

            <div className="space-y-8 p-8">

              {/* Official Resources */}

              <Section
                title="Official Learning Resources"
                icon={<BookOpen className="h-6 w-6" />}
              >

                {officialResources.map((resource) => (

                  <a
                    key={resource.title}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl border p-4 transition hover:bg-slate-50"
                  >

                    <div>

                      <p className="font-semibold">
                        {resource.title}
                      </p>

                      <p className="text-sm text-gray-500">
                        {resource.subtitle}
                      </p>

                    </div>

                    <ExternalLink className="h-5 w-5 text-gray-500" />

                  </a>

                ))}

              </Section>

              {/* Dataset Videos */}

              <Section
                title="Dataset Videos"
                icon={<PlayCircle className="h-6 w-6" />}
              >

                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                    `${dataset.title} data engineering`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl border bg-red-50 p-5 transition hover:bg-red-100"
                >

                  <div className="flex items-center gap-3">

                    <PlayCircle className="h-6 w-6 text-red-600" />

                    <div>

                      <p className="font-semibold">
                        Search YouTube
                      </p>

                      <p className="text-sm text-gray-600">
                        Learn {dataset.title} from community tutorials
                      </p>

                    </div>

                  </div>

                </a>

              </Section>

              {/* Hands-on Labs */}

              <Section
                title="Hands-on Labs"
                icon={<Code2 className="h-6 w-6" />}
              >

                <LabCard
                  title="Explore Sample Data"
                  description="Review realistic production sample records."
                />

                <LabCard
                  title="Understand the Schema"
                  description="Study column definitions and business meaning."
                />

                <LabCard
                  title="Practice SQL"
                  description="Run the provided SQL examples against the dataset."
                />

                <LabCard
                  title="Trace Lineage"
                  description="Understand upstream producers and downstream consumers."
                />

              </Section>

              {/* Recommended Courses */}

              <Section
                title="Recommended Courses"
                icon={<GraduationCap className="h-6 w-6" />}
              >

                {dataset.learning.map((course) => (

                  <div
                    key={course.title}
                    className="rounded-xl border bg-slate-50 p-5"
                  >

                    <div className="flex items-center justify-between">

                      <div>

                        <p className="font-semibold">
                          {course.title}
                        </p>

                        <p className="text-sm text-gray-500">
                          {course.level}
                        </p>

                      </div>

                      <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                        {course.duration}
                      </span>

                    </div>

                  </div>

                ))}

              </Section>

              {/* AI Quiz */}

              <Section
                title="AI Knowledge Check"
                icon={<BrainCircuit className="h-6 w-6" />}
              >

                <div className="rounded-3xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 p-8 text-white">

                  <h3 className="text-2xl font-bold">
                    Personalized AI Quiz
                  </h3>

                  <p className="mt-4 opacity-90">

                    Generate a quiz specifically about

                    <strong> {dataset.title}</strong>.

                    Questions are created dynamically from this dataset.

                  </p>

                  <button
                    onClick={() => setQuizOpen(true)}
                    className="mt-6 rounded-xl bg-white px-6 py-3 font-semibold text-indigo-700 transition hover:bg-slate-100"
                  >
                    🚀 Start AI Quiz
                  </button>

                </div>

              </Section>

              {/* Dataset Summary */}

              <Section
                title="Dataset Summary"
                icon={<Database className="h-6 w-6" />}
              >

                <div className="rounded-2xl border bg-slate-50 p-6">

                  <div className="grid grid-cols-2 gap-6">

                    <div>

                      <p className="text-sm text-gray-500">
                        Owner
                      </p>

                      <p className="font-semibold">
                        {dataset.owner}
                      </p>

                    </div>

                    <div>

                      <p className="text-sm text-gray-500">
                        Domain
                      </p>

                      <p className="font-semibold">
                        {dataset.domain}
                      </p>

                    </div>

                    <div>

                      <p className="text-sm text-gray-500">
                        Platform
                      </p>

                      <p className="font-semibold">
                        {dataset.platform}
                      </p>

                    </div>

                    <div>

                      <p className="text-sm text-gray-500">
                        Quality
                      </p>

                      <p className="font-semibold text-green-600">
                        {dataset.quality}%
                      </p>

                    </div>

                  </div>

                </div>

              </Section>

                          </div>

          </div>

        </div>
      )}

      <QuizModal
        open={quizOpen}
        onClose={() => setQuizOpen(false)}
        dataset={dataset}
      />

    </>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>

      <div className="mb-5 flex items-center gap-3">

        <div className="text-blue-600">
          {icon}
        </div>

        <h3 className="text-2xl font-bold">
          {title}
        </h3>

      </div>

      <div className="space-y-4">

        {children}

      </div>

    </section>
  );
}

function LabCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-orange-50 p-5 transition hover:bg-orange-100">

      <div className="flex items-start gap-4">

        <div className="text-2xl">
          🧪
        </div>

        <div>

          <p className="font-semibold">
            {title}
          </p>

          <p className="mt-1 text-sm text-gray-600">
            {description}
          </p>

        </div>

      </div>

    </div>
  );
}