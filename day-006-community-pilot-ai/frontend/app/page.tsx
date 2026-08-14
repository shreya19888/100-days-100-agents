"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarCheck2,
  Check,
  Database,
  MapPin,
  PhoneCall,
  Sparkles,
  Truck,
  UserCheck,
  X,
} from "lucide-react";

const API_URL = "https://community-pilot-ai.onrender.com";

const C = {
  canvas: "#141F1A",
  paper: "#E9EDE6",
  ink: "#1C1B14",
  text: "#F1EAD9",
  muted: "rgba(241,234,217,0.55)",
  faint: "rgba(241,234,217,0.30)",
  line: "rgba(241,234,217,0.11)",
  orange: "#FF6B35",
  green: "#5C9C74",
  red: "#D96C5F",
};

type Workflow = {
  form_submitted: boolean;
  donation_logged: boolean;
  match_found: boolean;
  ai_call_placed: boolean;
  pickup_confirmed: boolean;
  delivery_scheduled: boolean;
  delivery_completed: boolean;
};

type Assignment = {
  id: string;
  meals_assigned?: number;
  status?: string | null;
  volunteer_outcome?: string | null;

  pickup_address?: string | null;
  pickup_city?: string | null;

  delivery_organization?: string | null;
  delivery_address?: string | null;
  delivery_city?: string | null;

  vapi_call_id?: string | null;
  calendar_event_id?: string | null;
  calendar_event_url?: string | null;

  created_at?: string | null;
  updated_at?: string | null;

  donor?: {
    name?: string | null;
    contact?: string | null;
  };

  recipient?: {
    name?: string | null;
    contact?: string | null;
  };

  volunteer?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };

  workflow?: Workflow;
};

type Dashboard = {
  stats: {
    meals_rescued: number;
    meals_delivered: number;
    active_dispatches: number;
    volunteers: number;
  };

  counts: {
    donations: number;
    requests: number;
    volunteers: number;
    assignments: number;
  };

  recent_assignments: Assignment[];
};

function statusLabel(status?: string | null) {
  switch (status) {
    case "completed":
      return "Completed";

    case "accepted":
      return "Accepted";

    case "declined":
      return "Declined";

    case "outreach_pending":
      return "Outreach Pending";

    default:
      return status
        ? status.replaceAll("_", " ")
        : "Unknown";
  }
}

function statusColor(status?: string | null) {
  if (status === "completed") return C.green;
  if (status === "accepted") return C.green;
  if (status === "declined") return C.red;
  return C.orange;
}

function formatTime(value?: string | null) {
  if (!value) return "";

  try {
    return new Date(value).toLocaleTimeString(
      "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }
    );
  } catch {
    return "";
  }
}

function WorkflowStep({
  label,
  icon: Icon,
  complete,
  active,
  declined,
}: {
  label: string;
  icon: React.ElementType;
  complete: boolean;
  active?: boolean;
  declined?: boolean;
}) {
  const color = declined
    ? C.red
    : complete
      ? C.green
      : active
        ? C.orange
        : C.faint;

  return (
    <div className="flex min-w-[86px] flex-col items-center text-center">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full"
        style={{
          background: complete
            ? "rgba(92,156,116,0.14)"
            : active
              ? "rgba(255,107,53,0.14)"
              : "rgba(241,234,217,0.035)",
          border: `1px solid ${color}`,
        }}
      >
        {declined ? (
          <X className="h-4 w-4" style={{ color }} />
        ) : complete ? (
          <Check className="h-4 w-4" style={{ color }} />
        ) : (
          <Icon className="h-4 w-4" style={{ color }} />
        )}
      </div>

      <div
        className="mt-2 text-[8px] font-semibold uppercase tracking-[0.13em]"
        style={{
          color,
          fontFamily: "IBM Plex Mono, monospace",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function WorkflowConnector({
  complete,
}: {
  complete: boolean;
}) {
  return (
    <div
      className="hidden h-px flex-1 sm:block"
      style={{
        background: complete ? C.green : C.line,
      }}
    />
  );
}

function StatusBadge({
  status,
}: {
  status?: string | null;
}) {
  const color = statusColor(status);

  return (
    <span
      className="rounded-full px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.14em]"
      style={{
        color,
        border: `1px solid ${color}`,
        fontFamily: "IBM Plex Mono, monospace",
      }}
    >
      {statusLabel(status)}
    </span>
  );
}

export default function CommunityPilot() {
  const [dashboard, setDashboard] =
    useState<Dashboard | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  async function loadDashboard() {
    try {
      const response = await fetch(
        `${API_URL}/api/dashboard`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Backend returned ${response.status}`
        );
      }

      const data: Dashboard =
        await response.json();

      setDashboard(data);
      setError(null);
    } catch (err) {
      console.error(
        "Dashboard fetch failed:",
        err
      );

      setError(
        "Community Pilot backend is unavailable."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(
      loadDashboard,
      10000
    );

    return () => clearInterval(interval);
  }, []);

  const assignments =
    dashboard?.recent_assignments ?? [];

  const activeAssignment =
    useMemo(() => {
      return (
        assignments.find(
          (a) => a.status === "accepted"
        ) ??
        assignments.find(
          (a) =>
            a.status ===
            "outreach_pending"
        ) ??
        assignments[0]
      );
    }, [assignments]);

  const otherAssignments =
    assignments.filter(
      (a) =>
        a.id !== activeAssignment?.id
    );

  const workflow =
    activeAssignment?.workflow;

  return (
    <main
      className="min-h-screen"
      style={{
        background: C.canvas,
        color: C.text,
        fontFamily:
          "IBM Plex Sans, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap');

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: ${C.canvas};
        }

        .grid-bg {
          background-image:
            linear-gradient(
              rgba(241,234,217,0.035) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(241,234,217,0.035) 1px,
              transparent 1px
            );
          background-size: 42px 42px;
        }

        .card-hover {
          transition:
            transform 180ms ease,
            border-color 180ms ease,
            background 180ms ease;
        }

        .card-hover:hover {
          transform: translateY(-2px);
          border-color:
            rgba(241,234,217,0.22) !important;
        }
      `}</style>

      <div
        className="pointer-events-none fixed inset-0 grid-bg"
        style={{
          maskImage:
            "radial-gradient(ellipse 75% 65% at 50% 0%, black, transparent)",
        }}
      />

      <div
        className="pointer-events-none fixed left-1/2 top-[-250px] h-[500px] w-[800px] -translate-x-1/2 rounded-full blur-[140px]"
        style={{
          background:
            "rgba(255,107,53,0.065)",
        }}
      />

      {/* NAV */}

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-7 lg:px-10">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{
              background: C.paper,
              color: C.ink,
            }}
          >
            <Truck className="h-4 w-4" />
          </div>

          <div>
            <div
              className="text-sm font-semibold"
              style={{
                fontFamily:
                  "Space Grotesk, sans-serif",
              }}
            >
              Community Pilot AI
            </div>

            <div
              className="text-[8px] uppercase tracking-[0.22em]"
              style={{
                color: C.faint,
                fontFamily:
                  "IBM Plex Mono, monospace",
              }}
            >
              Autonomous food rescue
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full"
              style={{
                background: C.green,
                opacity: 0.5,
              }}
            />

            <span
              className="relative h-2 w-2 rounded-full"
              style={{
                background: C.green,
              }}
            />
          </span>

          <span
            className="text-[9px] uppercase tracking-[0.18em]"
            style={{
              color: C.muted,
              fontFamily:
                "IBM Plex Mono, monospace",
            }}
          >
            System operational
          </span>
        </div>
      </header>

      {/* HERO */}

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-10 pt-12 lg:px-10">
        <div className="max-w-3xl">
          <div
            className="mb-4 text-[9px] uppercase tracking-[0.2em]"
            style={{
              color: C.orange,
              fontFamily:
                "IBM Plex Mono, monospace",
            }}
          >
            AI coordination layer · San Jose
          </div>

          <h1
            className="text-4xl leading-[1.02] tracking-[-0.035em] sm:text-5xl lg:text-[4rem]"
            style={{
              fontFamily:
                "Space Grotesk, sans-serif",
              fontWeight: 600,
            }}
          >
            Surplus becomes
            <br />
            <span style={{ color: C.orange }}>
              supper.
            </span>
          </h1>

          <p
            className="mt-5 max-w-xl text-sm leading-7"
            style={{
              color: C.muted,
            }}
          >
            Community Pilot coordinates food
            rescue from intake to delivery —
            matching donations, calling
            volunteers, and scheduling the
            handoff automatically.
          </p>
        </div>

        {/* IMPACT */}

        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            [
              dashboard?.stats.meals_rescued ??
                0,
              "Meals rescued",
            ],
            [
              dashboard?.stats.meals_delivered ??
                0,
              "Meals delivered",
            ],
            [
              dashboard?.stats.active_dispatches ??
                0,
              "Active dispatches",
            ],
            [
              dashboard?.stats.volunteers ??
                0,
              "Volunteers",
            ],
          ].map(([value, label]) => (
            <div
              key={String(label)}
              className="rounded-xl p-5"
              style={{
                background:
                  "rgba(241,234,217,0.035)",
                border:
                  `1px solid ${C.line}`,
              }}
            >
              <div
                className="text-3xl font-semibold"
                style={{
                  fontFamily:
                    "Space Grotesk, sans-serif",
                }}
              >
                {loading ? "—" : value}
              </div>

              <div
                className="mt-1 text-[8px] uppercase tracking-[0.17em]"
                style={{
                  color: C.faint,
                  fontFamily:
                    "IBM Plex Mono, monospace",
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ACTIVE OPERATION */}

      {activeAssignment && (
        <section className="relative z-10 mx-auto max-w-7xl px-6 py-4 lg:px-10">
          <div
            className="overflow-hidden rounded-2xl"
            style={{
              background: C.paper,
              color: C.ink,
            }}
          >
            <div
              className="flex flex-col justify-between gap-3 px-6 py-5 sm:flex-row sm:items-center lg:px-8"
              style={{
                borderBottom:
                  "1px dashed rgba(28,27,20,0.25)",
              }}
            >
              <div>
                <div
                  className="text-[9px] font-semibold uppercase tracking-[0.2em]"
                  style={{
                    color:
                      "rgba(28,27,20,0.50)",
                    fontFamily:
                      "IBM Plex Mono, monospace",
                  }}
                >
                  Live dispatch
                </div>

                <div
                  className="mt-1 text-xl font-semibold"
                  style={{
                    fontFamily:
                      "Space Grotesk, sans-serif",
                  }}
                >
                  {activeAssignment.donor?.name ??
                    "Food donation"}
                </div>
              </div>

              <StatusBadge
                status={
                  activeAssignment.status
                }
              />
            </div>

            <div className="grid gap-8 p-6 lg:grid-cols-[0.8fr_1.2fr] lg:p-8">
              <div>
                <div
                  className="text-6xl font-semibold tracking-[-0.04em]"
                  style={{
                    fontFamily:
                      "Space Grotesk, sans-serif",
                  }}
                >
                  {activeAssignment.meals_assigned ??
                    0}
                </div>

                <div
                  className="mt-1 text-[9px] uppercase tracking-[0.18em]"
                  style={{
                    color:
                      "rgba(28,27,20,0.50)",
                    fontFamily:
                      "IBM Plex Mono, monospace",
                  }}
                >
                  meals in this dispatch
                </div>

                <div className="mt-7 flex items-start gap-3">
                  <MapPin
                    className="mt-0.5 h-4 w-4"
                    style={{
                      color: C.orange,
                    }}
                  />

                  <div>
                    <div className="text-sm font-semibold">
                      {activeAssignment.pickup_city ||
                        "San Jose"}
                    </div>

                    <div
                      className="mt-1 text-xs"
                      style={{
                        color:
                          "rgba(28,27,20,0.52)",
                      }}
                    >
                      {activeAssignment.pickup_address ||
                        "Pickup location"}
                    </div>
                  </div>
                </div>

                <div
                  className="my-4 ml-1 h-8 border-l border-dashed"
                  style={{
                    borderColor:
                      "rgba(28,27,20,0.25)",
                  }}
                />

                <div className="flex items-start gap-3">
                  <Truck
                    className="mt-0.5 h-4 w-4"
                    style={{
                      color: C.green,
                    }}
                  />

                  <div>
                    <div className="text-sm font-semibold">
                      {activeAssignment.recipient
                        ?.name ??
                        activeAssignment.delivery_organization ??
                        "Community destination"}
                    </div>

                    <div
                      className="mt-1 text-xs"
                      style={{
                        color:
                          "rgba(28,27,20,0.52)",
                      }}
                    >
                      {activeAssignment.delivery_address ||
                        "Delivery location"}
                    </div>
                  </div>
                </div>
              </div>

              {/* WORKFLOW */}

              <div>
                <div
                  className="mb-4 text-[9px] font-semibold uppercase tracking-[0.18em]"
                  style={{
                    color:
                      "rgba(28,27,20,0.48)",
                    fontFamily:
                      "IBM Plex Mono, monospace",
                  }}
                >
                  Rescue workflow
                </div>

                <div className="rounded-xl p-5 sm:p-6">
                  <div className="flex flex-wrap items-start gap-y-5 sm:flex-nowrap sm:gap-x-2">
                    <WorkflowStep
                      label="Donation"
                      icon={Database}
                      complete={
                        workflow?.donation_logged ??
                        false
                      }
                      active={
                        workflow?.form_submitted ===
                          true &&
                        workflow?.donation_logged !==
                          true
                      }
                    />

                    <WorkflowConnector
                      complete={
                        workflow?.match_found ??
                        false
                      }
                    />

                    <WorkflowStep
                      label="Match"
                      icon={Sparkles}
                      complete={
                        workflow?.match_found ??
                        false
                      }
                    />

                    <WorkflowConnector
                      complete={
                        workflow?.ai_call_placed ??
                        false
                      }
                    />

                    <WorkflowStep
                      label="AI outreach"
                      icon={PhoneCall}
                      complete={
                        workflow?.ai_call_placed ??
                        false
                      }
                    />

                    <WorkflowConnector
                      complete={
                        workflow?.pickup_confirmed ??
                        false
                      }
                    />

                    <WorkflowStep
                      label="Accepted"
                      icon={UserCheck}
                      complete={
                        workflow?.pickup_confirmed ??
                        false
                      }
                    />

                    <WorkflowConnector
                      complete={
                        workflow?.delivery_completed ??
                        false
                      }
                    />

                    <WorkflowStep
                      label="Delivery"
                      icon={Truck}
                      complete={
                        workflow?.delivery_completed ??
                        false
                      }
                      active={
                        workflow?.pickup_confirmed ===
                          true &&
                        workflow?.delivery_completed !==
                          true
                      }
                    />
                  </div>
                </div>

                {/* VOLUNTEER */}

                <div
                  className="mt-4 flex items-center justify-between rounded-xl px-4 py-3"
                  style={{
                    background:
                      "rgba(28,27,20,0.05)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full"
                      style={{
                        background: C.ink,
                        color: C.paper,
                      }}
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                    </div>

                    <div>
                      <div className="text-xs font-semibold">
                        {activeAssignment.volunteer
                          ?.name ??
                          "Volunteer pending"}
                      </div>

                      <div
                        className="text-[9px]"
                        style={{
                          color:
                            "rgba(28,27,20,0.48)",
                        }}
                      >
                        Volunteer
                      </div>
                    </div>
                  </div>

                  {activeAssignment.calendar_event_url && (
                    <a
                      href={
                        activeAssignment.calendar_event_url
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em]"
                      style={{
                        color: C.green,
                        fontFamily:
                          "IBM Plex Mono, monospace",
                      }}
                    >
                      <CalendarCheck2 className="h-3.5 w-3.5" />
                      Calendar confirmed
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* RECENT RESCUES */}

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-10 lg:px-10">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <div
              className="text-[9px] font-semibold uppercase tracking-[0.2em]"
              style={{
                color: C.faint,
                fontFamily:
                  "IBM Plex Mono, monospace",
              }}
            >
              Rescue ledger
            </div>

            <h2
              className="mt-2 text-2xl font-semibold"
              style={{
                fontFamily:
                  "Space Grotesk, sans-serif",
              }}
            >
              Recent food rescues
            </h2>
          </div>

          <div
            className="hidden text-[9px] uppercase tracking-[0.15em] sm:block"
            style={{
              color: C.faint,
              fontFamily:
                "IBM Plex Mono, monospace",
            }}
          >
            {dashboard?.counts.assignments ?? 0}{" "}
            assignments
          </div>
        </div>

        <div className="grid gap-3">
          {otherAssignments.map(
            (assignment) => {
              const selected =
                selectedId === assignment.id;

              return (
                <button
                  key={assignment.id}
                  onClick={() =>
                    setSelectedId(
                      selected
                        ? null
                        : assignment.id
                    )
                  }
                  className="card-hover w-full rounded-xl p-5 text-left"
                  style={{
                    background: selected
                      ? "rgba(241,234,217,0.055)"
                      : "rgba(241,234,217,0.025)",
                    border:
                      `1px solid ${
                        selected
                          ? "rgba(241,234,217,0.22)"
                          : C.line
                      }`,
                  }}
                >
                  <div className="grid gap-4 sm:grid-cols-[1.4fr_0.5fr_1.4fr_auto] sm:items-center">
                    <div>
                      <div
                        className="text-sm font-semibold"
                        style={{
                          color: C.text,
                        }}
                      >
                        {assignment.donor?.name ??
                          "Food donation"}
                      </div>

                      <div
                        className="mt-1 text-[10px]"
                        style={{
                          color: C.faint,
                        }}
                      >
                        {assignment.pickup_city ||
                          "San Jose"}
                      </div>
                    </div>

                    <div>
                      <div
                        className="text-xl font-semibold"
                        style={{
                          fontFamily:
                            "Space Grotesk, sans-serif",
                        }}
                      >
                        {assignment.meals_assigned ??
                          0}
                      </div>

                      <div
                        className="text-[8px] uppercase tracking-[0.12em]"
                        style={{
                          color: C.faint,
                          fontFamily:
                            "IBM Plex Mono, monospace",
                        }}
                      >
                        meals
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <ArrowRight
                        className="h-3.5 w-3.5"
                        style={{
                          color: C.orange,
                        }}
                      />

                      <span
                        className="text-xs"
                        style={{
                          color: C.muted,
                        }}
                      >
                        {assignment.recipient?.name ??
                          assignment.delivery_organization ??
                          "Community destination"}
                      </span>
                    </div>

                    <StatusBadge
                      status={
                        assignment.status
                      }
                    />
                  </div>

                  {selected && (
                    <div
                      className="mt-5 grid gap-4 pt-5 sm:grid-cols-3"
                      style={{
                        borderTop:
                          `1px solid ${C.line}`,
                      }}
                    >
                      <div>
                        <div
                          className="text-[8px] uppercase tracking-[0.15em]"
                          style={{
                            color: C.faint,
                            fontFamily:
                              "IBM Plex Mono, monospace",
                          }}
                        >
                          Volunteer
                        </div>

                        <div className="mt-1 text-xs">
                          {assignment.volunteer
                            ?.name ?? "—"}
                        </div>
                      </div>

                      <div>
                        <div
                          className="text-[8px] uppercase tracking-[0.15em]"
                          style={{
                            color: C.faint,
                            fontFamily:
                              "IBM Plex Mono, monospace",
                          }}
                        >
                          Workflow
                        </div>

                        <div className="mt-1 text-xs">
                          {assignment.workflow
                            ?.delivery_completed
                            ? "Delivery completed"
                            : assignment.workflow
                                  ?.ai_call_placed
                              ? "AI outreach completed"
                              : "Awaiting outreach"}
                        </div>
                      </div>

                      <div>
                        <div
                          className="text-[8px] uppercase tracking-[0.15em]"
                          style={{
                            color: C.faint,
                            fontFamily:
                              "IBM Plex Mono, monospace"
                          }}
                        >
                          Updated
                        </div>

                        <div className="mt-1 text-xs">
                          {formatTime(
                            assignment.updated_at
                          ) || "—"}
                        </div>
                      </div>
                    </div>
                  )}
                </button>
              );
            }
          )}
        </div>
      </section>

      {/* FOOTER */}

      <footer
        className="relative z-10 px-6 py-8 text-center"
        style={{
          borderTop:
            `1px solid ${C.line}`,
        }}
      >
        <div
          className="text-[8px] uppercase tracking-[0.22em]"
          style={{
            color: C.faint,
            fontFamily:
              "IBM Plex Mono, monospace",
          }}
        >
          Community Pilot AI · food rescue
          coordination system
        </div>
      </footer>

      {/* ERROR */}

      {error && (
        <div
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-3 text-xs shadow-2xl"
          style={{
            background: C.paper,
            color: C.ink,
          }}
        >
          {error}
        </div>
      )}
    </main>
  );
}