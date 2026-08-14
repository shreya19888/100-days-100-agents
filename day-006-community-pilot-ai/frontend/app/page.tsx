"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";
import {
  ArrowRight,
  CalendarCheck2,
  Check,
  Database,
  MapPin,
  MessageSquare,
  PhoneCall,
  PhoneOutgoing,
  Radio,
  Server,
  Sparkles,
  Truck,
  UserCheck,
  UserRound,
  X,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://community-pilot-ai.onrender.com";

const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY ?? "";
const VAPI_ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ?? "";

const COMMUNITY_FORMS = [
  {
    title: "Donate surplus food",
    description: "Have prepared food to rescue?",
    label: "Food donation",
    href: "https://forms.gle/9wqyjDU8hsH51RdA8",
  },
  {
    title: "Request food",
    description: "Request meals for your organization.",
    label: "Food request",
    href: "https://forms.gle/beBkCSJj183DA2eu7",
  },
  {
    title: "Volunteer",
    description: "Help transport rescued food.",
    label: "Volunteer",
    href: "https://forms.gle/xZCcbr6d5PBWw2Vq5",
  },
];

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

type ActivityEvent = {
  id: string;
  assignment_id?: string | null;
  type: string;
  icon: string;
  title: string;
  description: string;
  timestamp?: string | null;
  status?: string | null;
};

type Intelligence = {
  supply?: { meals_available?: number; donation_count?: number };
  demand?: { meals_requested?: number; request_count?: number };
  food_balance?: { gap?: number; pressure?: string };
  community_need?: {
    location?: string;
    pit_count?: number;
    unsheltered_count?: number;
    sheltered_count?: number;
    data_year?: number;
    signal?: string;
    source?: string;
    source_type?: string;
  };
  shelter_system?: {
    year_round_beds?: number;
    occupancy_rate?: number;
    snapshot_date?: string;
    source?: string;
  };
  weather?: {
    status?: string;
    location?: string;
    temperature_f?: number;
    feels_like_f?: number;
    condition?: string;
    wind_mph?: number;
    precipitation_in?: number;
    humidity?: number;
    last_updated?: string;
    alert_count?: number;
  };
  coordination_signal?: {
    priority?: string;
    message?: string;
    headline?: string;
    recommendation?: string;
    rationale?: string;
    signals_considered?: string[];
    model?: string;
    source?: string;
  };
};

type VolunteerCall = {
  call_id?: string | null;
  status?: string | null;
  ended_reason?: string | null;
  transcript?: string | null;
  messages?: Array<{ role?: string; message?: string; time?: number | null }>;
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
          background: declined
            ? "rgba(217,108,95,0.14)"
            : complete
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
      className="inline-flex w-fit rounded-full px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.14em]"
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

  const [activeTab, setActiveTab] =
    useState<"operations" | "intelligence" | "demo">("operations");

  const [intelligence, setIntelligence] =
    useState<Intelligence | null>(null);

  const [transcript, setTranscript] =
    useState<Array<{ role: "user" | "assistant"; text: string }>>([]);

  const [trace, setTrace] =
    useState<Array<{ id: string; label: string; detail: string; time: string; tone: "green" | "orange" | "red" }>>([]);

  const [voiceState, setVoiceState] =
    useState<"idle" | "connecting" | "active" | "ending" | "error">("idle");

  const [voiceError, setVoiceError] =
    useState<string | null>(null);

  const [volunteerCall, setVolunteerCall] =
    useState<VolunteerCall | null>(null);

  const [volunteerCallError, setVolunteerCallError] =
    useState<string | null>(null);

  const vapiRef = useRef<any>(null);

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

  async function loadIntelligence() {
    try {
      const response = await fetch(
        `${API_URL}/api/intelligence`,
        { cache: "no-store" }
      );

      if (!response.ok) return;

      const data: Intelligence = await response.json();
      console.log("[Community Pilot] intelligence backend:", API_URL, data);
      setIntelligence(data);
    } catch (err) {
      console.error("Intelligence fetch failed:", err);
    }
  }

  async function loadVolunteerCall(callId?: string | null) {
    if (!callId) {
      setVolunteerCall(null);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/volunteer-call/${callId}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(`Volunteer call returned ${response.status}`);
      }

      const data: VolunteerCall = await response.json();
      setVolunteerCall(data);
      setVolunteerCallError(null);
    } catch (err) {
      console.error("Volunteer call fetch failed:", err);
      setVolunteerCallError("Waiting for volunteer call details...");
    }
  }

  useEffect(() => {
    loadDashboard();
    loadIntelligence();

    const interval = setInterval(() => {
      loadDashboard();
      if (activeTab === "intelligence") loadIntelligence();
    }, 5000);

    return () => clearInterval(interval);
  }, [activeTab]);

  function addTrace(label: string, detail: string, tone: "green" | "orange" | "red" = "green") {
    const now = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    setTrace((previous) => [
      ...previous.slice(-11),
      {
        id: `${Date.now()}-${Math.random()}`,
        label,
        detail,
        time: now,
        tone,
      },
    ]);
  }

  useEffect(() => {
    if (!VAPI_PUBLIC_KEY) return;

    const vapi = new Vapi(VAPI_PUBLIC_KEY);
    vapiRef.current = vapi;

    const handleCallStart = () => {
      setVoiceState("active");
      setVoiceError(null);
      setTranscript([]);
      setTrace([]);
      addTrace("VOICE SESSION", "Browser conversation connected to Community Pilot", "green");
    };

    const handleCallEnd = () => {
      setVoiceState("idle");
      addTrace("VOICE SESSION", "Conversation ended", "orange");
      loadDashboard();
    };

    const handleMessage = (message: any) => {
      if (!message) return;

      if (message.type === "transcript") {
        const text = typeof message.transcript === "string" ? message.transcript.trim() : "";
        if (!text) return;
        const role = message.role === "assistant" ? "assistant" : "user";
        if (message.transcriptType === "final" || message.transcriptType == null) {
          setTranscript((previous) => {
            const last = previous[previous.length - 1];
            if (last && last.role === role && last.text === text) return previous;
            return [...previous, { role, text }];
          });
        }
        return;
      }

      if (message.type === "tool-calls") {
        const calls = message.toolCallList ?? message.toolCalls ?? [];
        const name = calls?.[0]?.function?.name ?? calls?.[0]?.name ?? "backend tool";
        addTrace("TOOL CALL", String(name), "orange");
        return;
      }

      if (message.type === "tool-calls-result" || message.type === "tool.completed") {
        addTrace("TOOL RESULT", "Backend tool completed; refreshing system state", "green");
        loadDashboard();
        return;
      }

      if (message.type === "status-update") {
        const status = message.status ?? message.statusUpdate?.status;
        if (status) addTrace("VAPI STATUS", String(status), "green");
      }
    };

    const handleError = (event: unknown) => {
      console.error("Vapi error:", event);
      setVoiceState("error");
      setVoiceError("Voice connection failed. Please try again.");
      addTrace("VOICE ERROR", "Vapi reported a voice connection error", "red");
    };

    vapi.on("call-start", handleCallStart);
    vapi.on("call-end", handleCallEnd);
    vapi.on("message", handleMessage);
    vapi.on("error", handleError);

    return () => {
      vapi.off("message", handleMessage);
      vapi.stop();
      vapiRef.current = null;
    };
  }, []);

  async function startVoiceCall() {
    if (!VAPI_PUBLIC_KEY || !VAPI_ASSISTANT_ID) {
      setVoiceState("error");
      setVoiceError(
        "Vapi is not configured. Add NEXT_PUBLIC_VAPI_PUBLIC_KEY and NEXT_PUBLIC_VAPI_ASSISTANT_ID to frontend/.env.local."
      );
      return;
    }

    try {
      setVoiceState("connecting");
      setVoiceError(null);
      setActiveTab("demo");
      setTrace([]);
      setTranscript([]);
      addTrace("VOICE INTAKE", "Requesting browser microphone and starting Vapi", "orange");

      if (!vapiRef.current) {
        const vapi = new Vapi(VAPI_PUBLIC_KEY);
        vapiRef.current = vapi;
      }

      await vapiRef.current.start(VAPI_ASSISTANT_ID);
    } catch (err) {
      console.error("Unable to start Vapi call:", err);
      setVoiceState("error");
      setVoiceError("Unable to start the voice call. Check your Vapi configuration.");
    }
  }

  async function endVoiceCall() {
    try {
      setVoiceState("ending");
      await vapiRef.current?.stop();
      setVoiceState("idle");
      loadDashboard();
    } catch (err) {
      console.error("Unable to end Vapi call:", err);
      setVoiceState("idle");
    }
  }

  const assignments =
    dashboard?.recent_assignments ?? [];

  const latestAssignment = assignments[0];

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

  // Poll the selected volunteer call only after activeAssignment has been
  // derived. This keeps the effect dependency safe and avoids referencing
  // activeAssignment before it is initialized.
  useEffect(() => {
    if (activeTab !== "demo") return;

    const callId = activeAssignment?.vapi_call_id;
    if (!callId) {
      setVolunteerCall(null);
      return;
    }

    loadVolunteerCall(callId);
    const interval = setInterval(() => loadVolunteerCall(callId), 3000);

    return () => clearInterval(interval);
  }, [activeTab, activeAssignment?.vapi_call_id]);

  // Build a compact live tail directly from the latest dashboard state.
  // This avoids a second activity endpoint and keeps the feed tied to the
  // same 5-second dashboard refresh.
  const activity = useMemo<ActivityEvent[]>(() => {
    const events: ActivityEvent[] = [];

    for (const assignment of assignments) {
      const wf = assignment.workflow;
      const timestamp =
        assignment.updated_at ??
        assignment.created_at ??
        null;

      const donor =
        assignment.donor?.name ??
        "Food donor";

      const destination =
        assignment.recipient?.name ??
        assignment.delivery_organization ??
        "Community destination";

      const volunteer =
        assignment.volunteer?.name ??
        "Volunteer";

      const meals =
        assignment.meals_assigned ?? 0;

      if (wf?.donation_logged) {
        events.push({
          id: `${assignment.id}-donation`,
          assignment_id: assignment.id,
          type: "donation",
          icon: "database",
          title: "Donation received",
          description: `${donor} - ${meals} meals logged`,
          timestamp,
          status: "complete",
        });
      }

      if (wf?.match_found) {
        events.push({
          id: `${assignment.id}-match`,
          assignment_id: assignment.id,
          type: "match",
          icon: "sparkles",
          title: "AI match found",
          description: `${meals} meals matched - ${destination}`,
          timestamp,
          status: "complete",
        });
      }

      if (wf?.ai_call_placed || assignment.vapi_call_id) {
        events.push({
          id: `${assignment.id}-call`,
          assignment_id: assignment.id,
          type: "call",
          icon: "phone",
          title: "AI volunteer outreach",
          description: `Community Pilot contacted ${volunteer}`,
          timestamp,
          status: "complete",
        });
      }

      if (assignment.volunteer_outcome === "accepted") {
        events.push({
          id: `${assignment.id}-accepted`,
          assignment_id: assignment.id,
          type: "accepted",
          icon: "check",
          title: "Volunteer accepted",
          description: `${volunteer} confirmed the assignment`,
          timestamp,
          status: "complete",
        });
      }

      if (assignment.volunteer_outcome === "declined") {
        events.push({
          id: `${assignment.id}-declined`,
          assignment_id: assignment.id,
          type: "declined",
          icon: "x",
          title: "Volunteer declined",
          description: `${volunteer} declined the assignment`,
          timestamp,
          status: "declined",
        });
      }

      if (assignment.calendar_event_id) {
        events.push({
          id: `${assignment.id}-calendar`,
          assignment_id: assignment.id,
          type: "calendar",
          icon: "calendar",
          title: "Calendar event created",
          description: `Pickup scheduled for ${donor}`,
          timestamp,
          status: "complete",
        });
      }

      if (
        assignment.status === "completed" ||
        wf?.delivery_completed
      ) {
        events.push({
          id: `${assignment.id}-delivery`,
          assignment_id: assignment.id,
          type: "delivery",
          icon: "truck",
          title: "Delivery completed",
          description: `${meals} meals delivered to ${destination}`,
          timestamp,
          status: "complete",
        });
      }
    }

    return events
      .sort((a, b) => {
        const aTime = a.timestamp
          ? new Date(a.timestamp).getTime()
          : 0;
        const bTime = b.timestamp
          ? new Date(b.timestamp).getTime()
          : 0;

        return bTime - aTime;
      })
      .slice(0, 5);
  }, [assignments]);

  const workflow =
    activeAssignment?.workflow;

  const activeDeclined =
    activeAssignment?.status === "declined" ||
    activeAssignment?.volunteer_outcome ===
      "declined";

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

      {/* PRIMARY NAV */}

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-2 lg:px-10">
        <div className="flex flex-wrap gap-2 rounded-xl p-1" style={{ border: `1px solid ${C.line}`, background: "rgba(241,234,217,0.025)" }}>
          {[
            ["operations", "Operations"],
            ["intelligence", "Community Intelligence"],
            ["demo", "Operational Demo"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key as "operations" | "intelligence" | "demo")}
              className="rounded-lg px-4 py-2 text-[9px] font-bold uppercase tracking-[0.14em] transition-opacity hover:opacity-90"
              style={{
                background: activeTab === key ? C.paper : "transparent",
                color: activeTab === key ? C.ink : C.muted,
                fontFamily: "IBM Plex Mono, monospace",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === "operations" && (
      <>
      {/* COMMUNITY INTAKE */}

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-4 lg:px-10">
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
              Community intake
            </div>

            <h2
              className="mt-2 text-xl font-semibold"
              style={{
                fontFamily:
                  "Space Grotesk, sans-serif",
              }}
            >
              Start a food rescue
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
            Open community forms
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {COMMUNITY_FORMS.map((form) => (
            <div
              key={form.title}
              className="card-hover rounded-xl p-5"
              style={{
                background:
                  "rgba(241,234,217,0.025)",
                border:
                  `1px solid ${C.line}`,
              }}
            >
              <div
                className="text-[9px] font-semibold uppercase tracking-[0.18em]"
                style={{
                  color: C.orange,
                  fontFamily:
                    "IBM Plex Mono, monospace",
                }}
              >
                {form.label}
              </div>

              <div
                className="mt-3 text-base font-semibold"
                style={{
                  fontFamily:
                    "Space Grotesk, sans-serif",
                }}
              >
                {form.title}
              </div>

              <p
                className="mt-1 text-xs leading-5"
                style={{
                  color: C.muted,
                }}
              >
                {form.description}
              </p>

              {form.label === "Food donation" && (
                <a
                  href="tel:+19498798713"
                  className="mt-3 flex w-fit items-center gap-2 text-[10px] font-semibold"
                  style={{
                    color: C.text,
                    fontFamily:
                      "IBM Plex Mono, monospace",
                  }}
                >
                  <PhoneCall className="h-3 w-3" />
                  +1 (949) 879-8713
                </a>
              )}

              <a
                href={form.href}
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex w-fit items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.14em]"
                style={{
                  color: C.green,
                  fontFamily:
                    "IBM Plex Mono, monospace",
                }}
              >
                Open form
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* VOICE AI */}

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-4 lg:px-10">
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background: "rgba(241,234,217,0.035)",
            border: `1px solid ${C.line}`,
          }}
        >
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between lg:p-7">
            <div>
              <div
                className="text-[9px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: C.orange, fontFamily: "IBM Plex Mono, monospace" }}
              >
                Voice intake
              </div>
              <h2
                className="mt-2 text-xl font-semibold"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                Talk to Community Pilot
              </h2>
              <p className="mt-1 max-w-xl text-xs leading-5" style={{ color: C.muted }}>
                Speak directly with the food-rescue AI from this browser. The conversation uses the same Vapi assistant as the phone workflow.
              </p>
              {voiceError && (
                <div className="mt-3 text-[10px]" style={{ color: C.red }}>
                  {voiceError}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={voiceState === "active" || voiceState === "connecting" ? endVoiceCall : startVoiceCall}
              disabled={voiceState === "ending"}
              className="flex shrink-0 items-center justify-center gap-2 rounded-full px-5 py-3 text-[9px] font-bold uppercase tracking-[0.14em] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: voiceState === "active" ? C.red : C.paper,
                color: voiceState === "active" ? C.paper : C.ink,
                fontFamily: "IBM Plex Mono, monospace",
              }}
            >
              <PhoneCall className="h-3.5 w-3.5" />
              {voiceState === "connecting"
                ? "Connecting..."
                : voiceState === "active"
                  ? "End call"
                  : voiceState === "ending"
                    ? "Ending..."
                    : "Talk to AI"}
            </button>
          </div>

          {voiceState === "active" && (
            <div
              className="flex items-center gap-3 px-6 pb-5 lg:px-7"
              style={{ color: C.green }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full" style={{ background: C.green, opacity: 0.6 }} />
                <span className="relative h-2 w-2 rounded-full" style={{ background: C.green }} />
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.16em]" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
                Live conversation · microphone active
              </span>
            </div>
          )}
        </div>
      </section>

      {/* LIVE ACTIVITY */}

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-4 lg:px-10">
        <div
          className="overflow-hidden rounded-2xl"
          style={{ background: C.paper, color: C.ink }}
        >
          <div
            className="flex items-center justify-between px-6 py-5 lg:px-8"
            style={{ borderBottom: "1px dashed rgba(28,27,20,0.25)" }}
          >
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: "rgba(28,27,20,0.50)", fontFamily: "IBM Plex Mono, monospace" }}>
                Agent observability
              </div>
              <div className="mt-1 text-xl font-semibold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                Live activity
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full" style={{ background: C.green, opacity: 0.45 }} />
                <span className="relative h-2 w-2 rounded-full" style={{ background: C.green }} />
              </span>
              <span className="text-[8px] font-semibold uppercase tracking-[0.16em]" style={{ color: "rgba(28,27,20,0.50)", fontFamily: "IBM Plex Mono, monospace" }}>
                Live · dashboard tail · 5s refresh
              </span>
            </div>
          </div>

          <div className="grid gap-3 p-6 lg:grid-cols-2 lg:p-8">
            {activity.length === 0 ? (
              <div className="py-8 text-xs" style={{ color: "rgba(28,27,20,0.48)" }}>
                Waiting for Community Pilot activity...
              </div>
            ) : (
              activity.slice(0, 8).map((event) => {
                const EventIcon =
                  event.icon === "phone" ? PhoneCall :
                  event.icon === "sparkles" ? Sparkles :
                  event.icon === "calendar" ? CalendarCheck2 :
                  event.icon === "truck" ? Truck :
                  event.icon === "check" ? Check :
                  event.icon === "x" ? X : Database;

                const eventColor = event.status === "declined" ? C.red : C.green;

                return (
                  <div key={event.id} className="flex gap-4 rounded-xl p-4" style={{ background: "rgba(28,27,20,0.045)" }}>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: `${eventColor}18`, border: `1px solid ${eventColor}` }}>
                      <EventIcon className="h-3.5 w-3.5" style={{ color: eventColor }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-semibold">{event.title}</div>
                        <div className="text-[8px]" style={{ color: "rgba(28,27,20,0.40)", fontFamily: "IBM Plex Mono, monospace" }}>
                          {formatTime(event.timestamp)}
                        </div>
                      </div>
                      <div className="mt-1 text-[10px] leading-5" style={{ color: "rgba(28,27,20,0.52)" }}>
                        {event.description}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
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
                        (workflow?.pickup_confirmed ??
                          false) &&
                        !activeDeclined
                      }
                    />

                    <WorkflowStep
                      label={
                        activeDeclined
                          ? "Declined"
                          : "Accepted"
                      }
                      icon={UserCheck}
                      complete={
                        (workflow?.pickup_confirmed ??
                          false) &&
                        !activeDeclined
                      }
                      declined={activeDeclined}
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
                          true &&
                        !activeDeclined
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

        {/* TABLE HEADER */}

        <div
          className="mb-2 hidden grid-cols-[minmax(0,1.5fr)_100px_minmax(0,1.5fr)_150px] gap-4 px-5 text-[8px] font-semibold uppercase tracking-[0.16em] sm:grid"
          style={{
            color: C.faint,
            fontFamily:
              "IBM Plex Mono, monospace",
          }}
        >
          <div>Source</div>
          <div>Meals</div>
          <div>Destination</div>
          <div>Status</div>
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
                  {/* DESKTOP TABLE ROW */}

                  <div className="hidden grid-cols-[minmax(0,1.5fr)_100px_minmax(0,1.5fr)_150px] items-center gap-4 sm:grid">
                    <div className="min-w-0">
                      <div
                        className="truncate text-sm font-semibold"
                        style={{
                          color: C.text,
                        }}
                      >
                        {assignment.donor?.name ??
                          "Food donation"}
                      </div>

                      <div
                        className="mt-1 truncate text-[10px]"
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

                    <div className="flex min-w-0 items-center gap-2">
                      <ArrowRight
                        className="h-3.5 w-3.5 shrink-0"
                        style={{
                          color: C.orange,
                        }}
                      />

                      <span
                        className="truncate text-xs"
                        style={{
                          color: C.muted,
                        }}
                      >
                        {assignment.recipient?.name ??
                          assignment.delivery_organization ??
                          "Community destination"}
                      </span>
                    </div>

                    <div>
                      <StatusBadge
                        status={
                          assignment.status
                        }
                      />
                    </div>
                  </div>

                  {/* MOBILE ROW */}

                  <div className="flex items-center justify-between gap-4 sm:hidden">
                    <div className="min-w-0">
                      <div
                        className="truncate text-sm font-semibold"
                        style={{
                          color: C.text,
                        }}
                      >
                        {assignment.donor?.name ??
                          "Food donation"}
                      </div>

                      <div
                        className="mt-1 truncate text-[10px]"
                        style={{
                          color: C.faint,
                        }}
                      >
                        {assignment.pickup_city ||
                          "San Jose"}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
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

                    <StatusBadge
                      status={
                        assignment.status
                      }
                    />
                  </div>

                  {/* DRILL-THROUGH TIMELINE */}

                  {selected && (
                    <div
                      className="mt-5 pt-5"
                      style={{
                        borderTop: `1px solid ${C.line}`,
                      }}
                    >
                      <div
                        className="mb-5 text-[8px] font-semibold uppercase tracking-[0.18em]"
                        style={{
                          color: C.faint,
                          fontFamily:
                            "IBM Plex Mono, monospace",
                        }}
                      >
                        Rescue lifecycle
                      </div>

                      {(() => {
                        const wf =
                          assignment.workflow;

                        const declined =
                          assignment.status ===
                            "declined" ||
                          assignment.volunteer_outcome ===
                            "declined";

                        const steps = [
                          {
                            label:
                              "Donation received",
                            detail:
                              "Food donation entered into Community Pilot",
                            complete:
                              wf?.donation_logged ??
                              false,
                            icon: Database,
                          },
                          {
                            label:
                              "AI match found",
                            detail:
                              assignment
                                .recipient
                                ?.name ??
                              assignment.delivery_organization ??
                              "Community destination matched",
                            complete:
                              wf?.match_found ??
                              false,
                            icon: Sparkles,
                          },
                          {
                            label:
                              "Volunteer outreach",
                            detail:
                              assignment
                                .volunteer
                                ?.name
                                ? `AI contacted ${assignment.volunteer.name}`
                                : "AI volunteer outreach initiated",
                            complete:
                              wf?.ai_call_placed ??
                              false,
                            icon: PhoneCall,
                          },
                          {
                            label:
                              declined
                                ? "Volunteer declined"
                                : "Volunteer accepted",
                            detail:
                              assignment.volunteer_outcome ===
                              "accepted"
                                ? `${
                                    assignment
                                      .volunteer
                                      ?.name ??
                                    "Volunteer"
                                  } accepted the assignment`
                                : assignment.volunteer_outcome ===
                                    "declined"
                                  ? `${
                                      assignment
                                        .volunteer
                                        ?.name ??
                                      "Volunteer"
                                    } declined the assignment`
                                  : "Waiting for volunteer response",
                            complete:
                              (wf?.pickup_confirmed ??
                                false) &&
                              !declined,
                            declined,
                            icon: UserCheck,
                          },
                          {
                            label:
                              "Calendar scheduled",
                            detail:
                              assignment.calendar_event_id
                                ? "Pickup event created in Google Calendar"
                                : "Calendar event pending",
                            complete:
                              Boolean(
                                assignment.calendar_event_id
                              ),
                            icon: CalendarCheck2,
                          },
                          {
                            label:
                              "Delivery completed",
                            detail:
                              wf?.delivery_completed
                                ? "Food delivered to the community destination"
                                : "Awaiting pickup and delivery",
                            complete:
                              wf?.delivery_completed ??
                              false,
                            icon: Truck,
                          },
                        ];

                        return (
                          <div className="relative">
                            {steps.map(
                              (
                                step,
                                index
                              ) => {
                                const isActive =
                                  !step.complete &&
                                  !step.declined &&
                                  (index === 0 ||
                                    steps[
                                      index -
                                        1
                                    ]?.complete);

                                const stepColor =
                                  step.declined
                                    ? C.red
                                    : step.complete
                                      ? C.green
                                      : isActive
                                        ? C.orange
                                        : C.faint;

                                return (
                                  <div
                                    key={
                                      step.label
                                    }
                                    className="relative flex gap-4"
                                  >
                                    <div className="relative flex w-8 shrink-0 justify-center">
                                      {index <
                                        steps.length -
                                          1 && (
                                        <div
                                          className="absolute left-1/2 top-8 h-full w-px -translate-x-1/2"
                                          style={{
                                            background:
                                              step.complete
                                                ? C.green
                                                : C.line,
                                          }}
                                        />
                                      )}

                                      <div
                                        className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full"
                                        style={{
                                          background:
                                            step.declined
                                              ? "rgba(217,108,95,0.14)"
                                              : step.complete
                                                ? "rgba(92,156,116,0.14)"
                                                : isActive
                                                  ? "rgba(255,107,53,0.14)"
                                                  : "rgba(241,234,217,0.035)",
                                          border: `1px solid ${stepColor}`,
                                        }}
                                      >
                                        {step.declined ? (
                                          <X
                                            className="h-3.5 w-3.5"
                                            style={{
                                              color:
                                                C.red,
                                            }}
                                          />
                                        ) : step.complete ? (
                                          <Check
                                            className="h-3.5 w-3.5"
                                            style={{
                                              color:
                                                C.green,
                                            }}
                                          />
                                        ) : (
                                          <step.icon
                                            className="h-3.5 w-3.5"
                                            style={{
                                              color:
                                                stepColor,
                                            }}
                                          />
                                        )}
                                      </div>
                                    </div>

                                    <div className="min-w-0 flex-1 pb-6">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <div
                                          className="text-xs font-semibold"
                                          style={{
                                            color:
                                              stepColor ===
                                              C.faint
                                                ? C.muted
                                                : stepColor,
                                          }}
                                        >
                                          {
                                            step.label
                                          }
                                        </div>

                                        {step.complete && (
                                          <span
                                            className="text-[7px] font-semibold uppercase tracking-[0.13em]"
                                            style={{
                                              color:
                                                C.green,
                                              fontFamily:
                                                "IBM Plex Mono, monospace",
                                            }}
                                          >
                                            complete
                                          </span>
                                        )}

                                        {step.declined && (
                                          <span
                                            className="text-[7px] font-semibold uppercase tracking-[0.13em]"
                                            style={{
                                              color:
                                                C.red,
                                              fontFamily:
                                                "IBM Plex Mono, monospace",
                                            }}
                                          >
                                            declined
                                          </span>
                                        )}

                                        {isActive && (
                                          <span
                                            className="text-[7px] font-semibold uppercase tracking-[0.13em]"
                                            style={{
                                              color:
                                                C.orange,
                                              fontFamily:
                                                "IBM Plex Mono, monospace",
                                            }}
                                          >
                                            current
                                          </span>
                                        )}
                                      </div>

                                      <div
                                        className="mt-1 text-[10px] leading-5"
                                        style={{
                                          color:
                                            C.faint,
                                        }}
                                      >
                                        {
                                          step.detail
                                        }
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                            )}

                            <div
                              className="mt-1 grid gap-3 rounded-lg p-4 sm:grid-cols-3"
                              style={{
                                background:
                                  "rgba(241,234,217,0.025)",
                                border:
                                  `1px solid ${C.line}`,
                              }}
                            >
                              <div>
                                <div
                                  className="text-[7px] uppercase tracking-[0.15em]"
                                  style={{
                                    color:
                                      C.faint,
                                    fontFamily:
                                      "IBM Plex Mono, monospace",
                                  }}
                                >
                                  Volunteer
                                </div>

                                <div className="mt-1 text-[10px]">
                                  {assignment
                                    .volunteer
                                    ?.name ??
                                    "—"}
                                </div>
                              </div>

                              <div>
                                <div
                                  className="text-[7px] uppercase tracking-[0.15em]"
                                  style={{
                                    color:
                                      C.faint,
                                    fontFamily:
                                      "IBM Plex Mono, monospace",
                                  }}
                                >
                                  Last updated
                                </div>

                                <div className="mt-1 text-[10px]">
                                  {formatTime(
                                    assignment.updated_at
                                  ) || "—"}
                                </div>
                              </div>

                              <div>
                                <div
                                  className="text-[7px] uppercase tracking-[0.15em]"
                                  style={{
                                    color:
                                      C.faint,
                                    fontFamily:
                                      "IBM Plex Mono, monospace",
                                  }}
                                >
                                  Calendar
                                </div>

                                {assignment.calendar_event_url ? (
                                  <a
                                    href={
                                      assignment.calendar_event_url
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(
                                      event
                                    ) =>
                                      event.stopPropagation()
                                    }
                                    className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold"
                                    style={{
                                      color:
                                        C.green,
                                    }}
                                  >
                                    Open event
                                    <ArrowRight className="h-3 w-3" />
                                  </a>
                                ) : (
                                  <div className="mt-1 text-[10px]">
                                    Not scheduled
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </button>
              );
            }
          )}
        </div>
      </section>

      </>
      )}

      {/* COMMUNITY INTELLIGENCE */}
      {activeTab === "intelligence" && (
        <section className="relative z-10 mx-auto max-w-7xl px-6 py-8 lg:px-10">
          <div
            className="overflow-hidden rounded-2xl"
            style={{
              border: `1px solid ${C.line}`,
              background: "rgba(241,234,217,0.025)",
            }}
          >
            <div
              className="border-b p-6 lg:p-8"
              style={{ borderColor: C.line }}
            >
              <div
                className="text-[9px] font-bold uppercase tracking-[0.2em]"
                style={{
                  color: C.orange,
                  fontFamily: "IBM Plex Mono, monospace",
                }}
              >
                Decision support
              </div>

              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2
                    className="text-3xl font-semibold"
                    style={{
                      color: C.text,
                      fontFamily: "Space Grotesk, sans-serif",
                    }}
                  >
                    Community Intelligence
                  </h2>

                  <p
                    className="mt-2 max-w-3xl text-xs leading-5"
                    style={{ color: C.muted }}
                  >
                    Context for coordinators: food supply, recorded demand,
                    community need, shelter-system pressure, and environmental
                    conditions.
                  </p>
                </div>

                <div
                  className="text-[8px] font-bold uppercase tracking-[0.16em]"
                  style={{
                    color: C.faint,
                    fontFamily: "IBM Plex Mono, monospace",
                  }}
                >
                  Refresh · 5s
                </div>
              </div>
            </div>

            <div className="p-6 lg:p-8">
              {/* Food supply / demand */}
              <div className="grid gap-3 md:grid-cols-3">
                <div
                  className="rounded-xl p-5"
                  style={{
                    background: "rgba(92,156,116,0.08)",
                    border: "1px solid rgba(92,156,116,0.18)",
                  }}
                >
                  <div
                    className="text-[8px] font-bold uppercase tracking-[0.16em]"
                    style={{
                      color: C.green,
                      fontFamily: "IBM Plex Mono, monospace",
                    }}
                  >
                    Available supply
                  </div>

                  <div
                    className="mt-2 text-4xl font-semibold"
                    style={{ color: C.text }}
                  >
                    {intelligence?.supply?.meals_available ?? "—"}
                  </div>

                  <div
                    className="mt-1 text-[9px] uppercase tracking-[0.12em]"
                    style={{ color: C.muted }}
                  >
                    meals · {intelligence?.supply?.donation_count ?? "—"} donations
                  </div>
                </div>

                <div
                  className="rounded-xl p-5"
                  style={{
                    background: "rgba(255,107,53,0.07)",
                    border: "1px solid rgba(255,107,53,0.16)",
                  }}
                >
                  <div
                    className="text-[8px] font-bold uppercase tracking-[0.16em]"
                    style={{
                      color: C.orange,
                      fontFamily: "IBM Plex Mono, monospace",
                    }}
                  >
                    Recorded demand
                  </div>

                  <div
                    className="mt-2 text-4xl font-semibold"
                    style={{ color: C.text }}
                  >
                    {intelligence?.demand?.meals_requested ?? "—"}
                  </div>

                  <div
                    className="mt-1 text-[9px] uppercase tracking-[0.12em]"
                    style={{ color: C.muted }}
                  >
                    meals · {intelligence?.demand?.request_count ?? "—"} requests
                  </div>
                </div>

                <div
                  className="rounded-xl p-5"
                  style={{
                    background: "rgba(241,234,217,0.045)",
                    border: `1px solid ${C.line}`,
                  }}
                >
                  <div
                    className="text-[8px] font-bold uppercase tracking-[0.16em]"
                    style={{
                      color: C.faint,
                      fontFamily: "IBM Plex Mono, monospace",
                    }}
                  >
                    Food balance
                  </div>

                  <div
                    className="mt-2 text-4xl font-semibold"
                    style={{
                      color:
                        (intelligence?.food_balance?.gap ?? 0) >= 0
                          ? C.green
                          : C.red,
                    }}
                  >
                    {(intelligence?.food_balance?.gap ?? 0) >= 0 ? "+" : ""}
                    {intelligence?.food_balance?.gap ?? "—"}
                  </div>

                  <div
                    className="mt-1 text-[9px] uppercase tracking-[0.12em]"
                    style={{ color: C.muted }}
                  >
                    meal balance · {intelligence?.food_balance?.pressure ?? "pending"}
                  </div>
                </div>
              </div>

              {/* Community need + shelter */}
              <div className="mt-3 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
                <div
                  className="rounded-xl p-6"
                  style={{
                    background: "rgba(241,234,217,0.035)",
                    border: `1px solid ${C.line}`,
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className="text-[8px] font-bold uppercase tracking-[0.16em]"
                      style={{
                        color: C.faint,
                        fontFamily: "IBM Plex Mono, monospace",
                      }}
                    >
                      Community need · {intelligence?.community_need?.location ?? "San Francisco"}
                    </div>

                    <span
                      className="rounded-full px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.14em]"
                      style={{
                        color: C.orange,
                        border: `1px solid ${C.orange}`,
                        fontFamily: "IBM Plex Mono, monospace",
                      }}
                    >
                      {intelligence?.community_need?.signal ?? "PENDING"} SIGNAL
                    </span>
                  </div>

                  <div className="mt-5 grid gap-5 sm:grid-cols-3">
                    <div>
                      <div
                        className="text-3xl font-semibold"
                        style={{ color: C.text }}
                      >
                        {intelligence?.community_need?.pit_count?.toLocaleString() ?? "—"}
                      </div>
                      <div
                        className="mt-1 text-[8px] uppercase tracking-[0.13em]"
                        style={{ color: C.muted }}
                      >
                        PIT count
                      </div>
                    </div>

                    <div>
                      <div
                        className="text-3xl font-semibold"
                        style={{ color: C.text }}
                      >
                        {intelligence?.community_need?.unsheltered_count?.toLocaleString() ?? "—"}
                      </div>
                      <div
                        className="mt-1 text-[8px] uppercase tracking-[0.13em]"
                        style={{ color: C.muted }}
                      >
                        unsheltered
                      </div>
                    </div>

                    <div>
                      <div
                        className="text-3xl font-semibold"
                        style={{ color: C.text }}
                      >
                        {intelligence?.community_need?.sheltered_count?.toLocaleString() ?? "—"}
                      </div>
                      <div
                        className="mt-1 text-[8px] uppercase tracking-[0.13em]"
                        style={{ color: C.muted }}
                      >
                        sheltered
                      </div>
                    </div>
                  </div>

                  <div
                    className="mt-5 border-t pt-4 text-[9px] leading-5"
                    style={{
                      borderColor: C.line,
                      color: C.faint,
                    }}
                  >
                    Public snapshot · {intelligence?.community_need?.data_year ?? "—"} ·{" "}
                    {intelligence?.community_need?.source ??
                      "San Francisco HSH"}
                  </div>
                </div>

                <div
                  className="rounded-xl p-6"
                  style={{
                    background: "rgba(241,234,217,0.035)",
                    border: `1px solid ${C.line}`,
                  }}
                >
                  <div
                    className="text-[8px] font-bold uppercase tracking-[0.16em]"
                    style={{
                      color: C.faint,
                      fontFamily: "IBM Plex Mono, monospace",
                    }}
                  >
                    Shelter system
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div>
                      <div
                        className="text-3xl font-semibold"
                        style={{ color: C.text }}
                      >
                        {intelligence?.shelter_system?.year_round_beds?.toLocaleString() ?? "—"}
                      </div>
                      <div
                        className="mt-1 text-[8px] uppercase tracking-[0.12em]"
                        style={{ color: C.muted }}
                      >
                        year-round beds
                      </div>
                    </div>

                    <div>
                      <div
                        className="text-3xl font-semibold"
                        style={{
                          color:
                            (intelligence?.shelter_system?.occupancy_rate ?? 0) >= 90
                              ? C.orange
                              : C.green,
                        }}
                      >
                        {intelligence?.shelter_system?.occupancy_rate != null
                          ? `${intelligence.shelter_system.occupancy_rate}%`
                          : "—"}
                      </div>
                      <div
                        className="mt-1 text-[8px] uppercase tracking-[0.12em]"
                        style={{ color: C.muted }}
                      >
                        occupancy
                      </div>
                    </div>
                  </div>

                  <div
                    className="mt-5 rounded-lg p-3 text-[9px] leading-4"
                    style={{
                      background: "rgba(255,107,53,0.06)",
                      border: "1px solid rgba(255,107,53,0.13)",
                      color: C.muted,
                    }}
                  >
                    Snapshot data — not real-time bed vacancy.
                    {intelligence?.shelter_system?.snapshot_date
                      ? ` Snapshot: ${intelligence.shelter_system.snapshot_date}.`
                      : ""}
                  </div>
                </div>
              </div>

              {/* Weather + coordination */}
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <div
                  className="rounded-xl p-6"
                  style={{
                    background: "rgba(241,234,217,0.035)",
                    border: `1px solid ${C.line}`,
                  }}
                >
                  <div
                    className="text-[8px] font-bold uppercase tracking-[0.16em]"
                    style={{
                      color: C.faint,
                      fontFamily: "IBM Plex Mono, monospace",
                    }}
                  >
                    Environmental signal
                  </div>

                  {intelligence?.weather?.status === "ok" ? (
                    <div className="mt-4">
                      <div className="flex items-end gap-4">
                        <div
                          className="text-4xl font-semibold"
                          style={{ color: C.text }}
                        >
                          {intelligence?.weather?.temperature_f != null
                            ? `${Math.round(intelligence.weather.temperature_f)}°F`
                            : "—"}
                        </div>

                        <div
                          className="pb-1 text-sm"
                          style={{ color: C.muted }}
                        >
                          {intelligence?.weather?.condition ?? "Weather signal"}
                        </div>
                      </div>

                      <div
                        className="mt-4 grid grid-cols-3 gap-3 text-[9px]"
                        style={{ color: C.muted }}
                      >
                        <div>
                          <div className="font-semibold" style={{ color: C.text }}>
                            {intelligence?.weather?.feels_like_f != null
                              ? `${Math.round(intelligence.weather.feels_like_f)}°F`
                              : "—"}
                          </div>
                          feels like
                        </div>
                        <div>
                          <div className="font-semibold" style={{ color: C.text }}>
                            {intelligence?.weather?.wind_mph != null
                              ? `${Math.round(intelligence.weather.wind_mph)} mph`
                              : "—"}
                          </div>
                          wind
                        </div>
                        <div>
                          <div className="font-semibold" style={{ color: C.text }}>
                            {intelligence?.weather?.precipitation_in != null
                              ? `${intelligence.weather.precipitation_in}"`

                              : "—"}
                          </div>
                          precipitation
                        </div>
                      </div>

                      <div
                        className="mt-4 text-[8px] uppercase tracking-[0.12em]"
                        style={{
                          color: C.faint,
                          fontFamily: "IBM Plex Mono, monospace",
                        }}
                      >
                        {intelligence?.weather?.location ?? "San Francisco"} ·{" "}
                        {intelligence?.weather?.last_updated
                          ? `updated ${intelligence.weather.last_updated}`
                          : "current conditions"}
                      </div>
                    </div>
                  ) : intelligence?.weather?.status === "not_configured" ? (
                    <div className="mt-4">
                      <div
                        className="text-xl font-semibold"
                        style={{ color: C.text }}
                      >
                        WeatherAPI not configured
                      </div>
                      <p
                        className="mt-2 text-xs leading-5"
                        style={{ color: C.muted }}
                      >
                        The backend did not return live weather data. Verify
                        WEATHER_API_KEY on the backend service.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <div
                        className="text-xl font-semibold"
                        style={{ color: C.text }}
                      >
                        Weather unavailable
                      </div>
                      <p
                        className="mt-2 text-xs leading-5"
                        style={{ color: C.muted }}
                      >
                        The backend returned a weather status of {intelligence?.weather?.status ?? "unknown"}.
                      </p>
                    </div>
                  )}
                </div>

                <div
                  className="rounded-xl p-6"
                  style={{
                    background: "rgba(92,156,116,0.07)",
                    border: "1px solid rgba(92,156,116,0.16)",
                  }}
                >
                  <div
                    className="text-[8px] font-bold uppercase tracking-[0.16em]"
                    style={{
                      color: C.green,
                      fontFamily: "IBM Plex Mono, monospace",
                    }}
                  >
                    Coordination signal
                  </div>

                  <div
                    className="mt-3 text-2xl font-semibold"
                    style={{ color: C.text }}
                  >
                    {intelligence?.coordination_signal?.priority ?? "PENDING"}
                  </div>

                  <div
                    className="mt-2 text-sm leading-6"
                    style={{ color: C.muted }}
                  >
                    {intelligence?.coordination_signal?.headline ??
                      intelligence?.coordination_signal?.message ??
                      "Waiting for the coordination signal."}
                  </div>

                  {intelligence?.coordination_signal?.recommendation && (
                    <div
                      className="mt-4 text-[10px] leading-5"
                      style={{ color: C.muted }}
                    >
                      <span style={{ color: C.text, fontWeight: 600 }}>
                        Recommended action:{" "}
                      </span>
                      {intelligence.coordination_signal.recommendation}
                    </div>
                  )}

                  {intelligence?.coordination_signal?.model && (
                    <div
                      className="mt-3 text-[8px] uppercase tracking-[0.12em]"
                      style={{
                        color: C.faint,
                        fontFamily: "IBM Plex Mono, monospace",
                      }}
                    >
                      Intelligence · {intelligence.coordination_signal.model}
                    </div>
                  )}

                  <div
                    className="mt-5 rounded-lg p-3 text-[9px] leading-4"
                    style={{
                      background: "rgba(0,0,0,0.12)",
                      color: C.muted,
                    }}
                  >
                    Community Pilot combines operational food data with public
                    community context to help coordinators prioritize action.
                  </div>
                </div>
              </div>

              {/* Sources */}
              <div
                className="mt-5 border-t pt-4 text-[8px] leading-5"
                style={{
                  borderColor: C.line,
                  color: C.faint,
                  fontFamily: "IBM Plex Mono, monospace",
                }}
              >
                SOURCES · Community Pilot operational data · San Francisco HSH
                public homelessness / shelter-system snapshots · WeatherAPI
              </div>
            </div>
          </div>
        </section>
      )}

      {/* OPERATIONAL DEMO */}
      {activeTab === "demo" && (
        <section className="relative z-10 mx-auto max-w-7xl px-6 py-8 lg:px-10">
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}`, background: "rgba(241,234,217,0.025)" }}>
            <div className="flex flex-col gap-4 border-b p-6 sm:flex-row sm:items-center sm:justify-between lg:p-8" style={{ borderColor: C.line }}>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: C.orange, fontFamily: "IBM Plex Mono, monospace" }}>Operational demo</div>
                <h2 className="mt-2 text-3xl font-semibold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Watch the agents work.</h2>
                <p className="mt-2 max-w-2xl text-xs leading-5" style={{ color: C.muted }}>Real browser voice, real Vapi tool events, real dashboard state, real volunteer outreach, and real calendar state.</p>
              </div>
              <div className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.16em]" style={{ color: C.green, fontFamily: "IBM Plex Mono, monospace" }}><span className="h-2 w-2 rounded-full" style={{ background: C.green }} /> System operational</div>
            </div>

            <div className="grid gap-0 lg:grid-cols-[1.05fr_1.2fr_0.9fr]">
              <div className="border-b p-6 lg:border-b-0 lg:border-r lg:p-7" style={{ borderColor: C.line }}>
                <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: C.faint, fontFamily: "IBM Plex Mono, monospace" }}><MessageSquare className="h-3.5 w-3.5" /> Conversation</div>
                <div className="mt-4 max-h-[430px] min-h-[260px] space-y-3 overflow-y-auto rounded-xl p-4" style={{ background: "rgba(0,0,0,0.18)", border: `1px solid ${C.line}` }}>
                  {transcript.length === 0 ? <div className="flex h-full min-h-[220px] items-center justify-center text-center text-[10px]" style={{ color: C.faint }}>Start the browser call to watch the conversation appear here.</div> : transcript.map((m, i) => <div key={`${i}-${m.text}`} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}><div className="max-w-[88%] rounded-xl px-4 py-3" style={{ background: m.role === "user" ? "rgba(255,107,53,0.10)" : "rgba(92,156,116,0.10)", border: `1px solid ${m.role === "user" ? "rgba(255,107,53,0.22)" : "rgba(92,156,116,0.22)"}` }}><div className="text-[7px] font-bold uppercase tracking-[0.15em]" style={{ color: m.role === "user" ? C.orange : C.green, fontFamily: "IBM Plex Mono, monospace" }}>{m.role === "user" ? "You" : "Community Pilot"}</div><div className="mt-1 text-xs leading-5" style={{ color: C.text }}>{m.text}</div></div></div>)}
                </div>
                <button type="button" onClick={voiceState === "active" || voiceState === "connecting" ? endVoiceCall : startVoiceCall} disabled={voiceState === "ending"} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[9px] font-bold uppercase tracking-[0.14em]" style={{ background: voiceState === "active" ? C.red : C.paper, color: voiceState === "active" ? C.paper : C.ink, fontFamily: "IBM Plex Mono, monospace" }}><PhoneCall className="h-3.5 w-3.5" />{voiceState === "connecting" ? "Connecting..." : voiceState === "active" ? "End call" : "Talk to Community Pilot"}</button>
                {voiceError && <div className="mt-2 text-[9px]" style={{ color: C.red }}>{voiceError}</div>}
              </div>

              <div className="border-b p-6 lg:border-b-0 lg:border-r lg:p-7" style={{ borderColor: C.line }}>
                <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: C.faint, fontFamily: "IBM Plex Mono, monospace" }}><Server className="h-3.5 w-3.5" /> Agent execution</div><span className="text-[8px] uppercase tracking-[0.12em]" style={{ color: C.faint, fontFamily: "IBM Plex Mono, monospace" }}>Operational trace</span></div>
                <div className="mt-4 space-y-3">
                  {(trace.length ? trace.slice().reverse() : [{ id: "empty", label: "READY", detail: "Start a voice intake to observe tool calls and agent execution.", time: "--:--:--", tone: "green" as const }]).map((e) => { const tone = e.tone === "red" ? C.red : e.tone === "orange" ? C.orange : C.green; return <div key={e.id} className="rounded-xl p-4" style={{ background: "rgba(241,234,217,0.035)", border: `1px solid ${C.line}` }}><div className="flex items-center justify-between gap-3"><div className="text-[9px] font-bold uppercase tracking-[0.13em]" style={{ color: tone, fontFamily: "IBM Plex Mono, monospace" }}>{e.label}</div><div className="text-[8px]" style={{ color: C.faint, fontFamily: "IBM Plex Mono, monospace" }}>{e.time}</div></div><div className="mt-2 text-[10px] leading-5" style={{ color: C.muted }}>{e.detail}</div></div>; })}
                </div>
              </div>

              <div className="p-6 lg:p-7">
                <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: C.faint, fontFamily: "IBM Plex Mono, monospace" }}><Database className="h-3.5 w-3.5" /> System state</div>
                <div className="mt-4 rounded-xl p-5" style={{ background: "rgba(241,234,217,0.035)", border: `1px solid ${C.line}` }}>
                  <div className="text-[8px] font-bold uppercase tracking-[0.15em]" style={{ color: C.green, fontFamily: "IBM Plex Mono, monospace" }}>Supabase · latest assignment</div>
                  <div className="mt-4 text-2xl font-semibold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{latestAssignment?.meals_assigned ?? 0} meals</div>
                  <div className="mt-1 text-xs" style={{ color: C.muted }}>{latestAssignment?.donor?.name ?? "Waiting for donation"}</div>
                  <div className="mt-4 space-y-2 text-[9px]" style={{ color: C.muted }}>
                    <div className="flex justify-between gap-3"><span>Status</span><span style={{ color: C.text }}>{statusLabel(latestAssignment?.status)}</span></div>
                    <div className="flex justify-between gap-3"><span>Updated</span><span style={{ color: C.text }}>{formatTime(latestAssignment?.updated_at)}</span></div>
                    <div className="flex justify-between gap-3"><span>Vapi call</span><span style={{ color: latestAssignment?.vapi_call_id ? C.green : C.faint }}>{latestAssignment?.vapi_call_id ? "Connected" : "Pending"}</span></div>
                    <div className="flex justify-between gap-3"><span>Calendar</span><span style={{ color: latestAssignment?.calendar_event_id ? C.green : C.faint }}>{latestAssignment?.calendar_event_id ? "Created" : "Pending"}</span></div>
                  </div>
                </div>
                <div className="mt-3 rounded-xl p-5" style={{ background: "rgba(241,234,217,0.035)", border: `1px solid ${C.line}` }}>
                  <div className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.15em]" style={{ color: C.orange, fontFamily: "IBM Plex Mono, monospace" }}><PhoneOutgoing className="h-3.5 w-3.5" /> Volunteer outreach</div>

                  <div className="mt-4 rounded-lg p-3" style={{ background: "rgba(92,156,116,0.07)", border: `1px solid rgba(92,156,116,0.18)` }}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <UserRound className="h-3.5 w-3.5" style={{ color: C.green }} />
                        <div>
                          <div className="text-sm font-semibold">{activeAssignment?.volunteer?.name ?? "Volunteer pending"}</div>
                          <div className="mt-0.5 text-[8px] uppercase tracking-[0.12em]" style={{ color: C.faint, fontFamily: "IBM Plex Mono, monospace" }}>Volunteer match found</div>
                        </div>
                      </div>
                      <span className="rounded-full px-2 py-1 text-[7px] font-bold uppercase tracking-[0.12em]" style={{ color: C.green, border: `1px solid ${C.green}`, fontFamily: "IBM Plex Mono, monospace" }}>MATCHED</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[8px]" style={{ color: C.muted }}>
                      <div>Meals <span style={{ color: C.text }}>{activeAssignment?.meals_assigned ?? 0}</span></div>
                      <div>Route <span style={{ color: C.text }}>{activeAssignment?.pickup_city ?? "San Jose"} → {activeAssignment?.delivery_city ?? "San Jose"}</span></div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg p-3" style={{ background: "rgba(255,107,53,0.07)", border: `1px solid rgba(255,107,53,0.18)` }}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.14em]" style={{ color: C.orange, fontFamily: "IBM Plex Mono, monospace" }}>
                        <PhoneOutgoing className="h-3.5 w-3.5" /> AI call placed
                      </div>
                      <span className="text-[7px] uppercase tracking-[0.12em]" style={{ color: C.faint, fontFamily: "IBM Plex Mono, monospace" }}>{volunteerCall?.status ?? (activeAssignment?.vapi_call_id ? "queued" : "pending")}</span>
                    </div>
                    <div className="mt-2 text-[9px]" style={{ color: C.muted }}>
                      {activeAssignment?.vapi_call_id ? `Vapi call ${activeAssignment.vapi_call_id.slice(0, 12)}…` : "Waiting for AI outreach"}
                    </div>
                    <div className="mt-3 rounded-lg px-3 py-2 text-[8px] font-bold uppercase tracking-[0.12em]" style={{ background: activeAssignment?.volunteer_outcome === "declined" ? "rgba(217,108,95,0.12)" : activeAssignment?.volunteer_outcome === "accepted" ? "rgba(92,156,116,0.12)" : "rgba(255,107,53,0.10)", color: activeAssignment?.volunteer_outcome === "declined" ? C.red : activeAssignment?.volunteer_outcome === "accepted" ? C.green : C.orange, fontFamily: "IBM Plex Mono, monospace" }}>
                      {activeAssignment?.volunteer_outcome ? statusLabel(activeAssignment.volunteer_outcome) : activeAssignment?.vapi_call_id ? "Call in progress / awaiting outcome" : "Not contacted yet"}
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg p-3" style={{ background: "rgba(0,0,0,0.18)", border: `1px solid ${C.line}` }}>
                    <div className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.14em]" style={{ color: C.faint, fontFamily: "IBM Plex Mono, monospace" }}>
                      <MessageSquare className="h-3.5 w-3.5" /> Volunteer call transcript
                    </div>
                    <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
                      {volunteerCall?.messages?.length ? volunteerCall.messages.filter((m) => m.role === "assistant" || m.role === "bot" || m.role === "user").map((m, i) => (
                        <div key={`${i}-${m.message}`} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                          <div className="max-w-[92%] rounded-lg px-3 py-2" style={{ background: m.role === "user" ? "rgba(255,107,53,0.10)" : "rgba(92,156,116,0.10)", border: `1px solid ${m.role === "user" ? "rgba(255,107,53,0.18)" : "rgba(92,156,116,0.18)"}` }}>
                            <div className="text-[7px] font-bold uppercase tracking-[0.13em]" style={{ color: m.role === "user" ? C.orange : C.green, fontFamily: "IBM Plex Mono, monospace" }}>{m.role === "user" ? "Volunteer" : "Community Pilot"}</div>
                            <div className="mt-1 text-[9px] leading-4" style={{ color: C.text }}>{m.message}</div>
                          </div>
                        </div>
                      )) : volunteerCall?.transcript ? (
                        <div className="whitespace-pre-wrap text-[9px] leading-4" style={{ color: C.muted }}>{volunteerCall.transcript}</div>
                      ) : (
                        <div className="py-4 text-center text-[8px]" style={{ color: C.faint }}>
                          {activeAssignment?.vapi_call_id ? "Waiting for volunteer conversation transcript…" : "Transcript will appear after outreach begins."}
                        </div>
                      )}
                    </div>
                  </div>

                  {volunteerCallError && <div className="mt-2 text-[8px]" style={{ color: C.faint }}>{volunteerCallError}</div>}
                </div>
                {activeAssignment?.calendar_event_url && <a href={activeAssignment.calendar_event_url} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[9px] font-bold uppercase tracking-[0.13em]" style={{ background: C.paper, color: C.ink, fontFamily: "IBM Plex Mono, monospace" }}><CalendarCheck2 className="h-3.5 w-3.5" /> Open calendar event</a>}
              </div>
            </div>
          </div>
        </section>
      )}

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