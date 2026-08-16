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

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

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
  pickup_deadline?: string | null;
  minutes_remaining?: number | null;
  expires_at?: string | null;
  expired?: boolean;

  route?: {
    volunteer?: { zip?: string; lat: number; lng: number } | null;
    pickup?: { zip?: string; lat: number; lng: number } | null;
    delivery?: { zip?: string; lat: number; lng: number } | null;
  };

  delivery_organization?: string | null;
  delivery_address?: string | null;
  delivery_city?: string | null;
  delivery_instructions?: string | null;

  vapi_call_id?: string | null;
  calendar_event_id?: string | null;
  calendar_event_url?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
  rescue_activity_at?: string | null;

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
  expiring_donations?: Array<{
    id?: string;
    name?: string | null;
    meals?: number;
    city?: string | null;
    pickup_deadline?: string | null;
    minutes_remaining?: number | null;
  }>;
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

type Volunteer = {
  id?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  availability?: string | null;
  city?: string | null;
  created_at?: string | null;
  timestamp?: string | null;

  // Raw Supabase "Volunteer Signup" field names. Some backend deploys
  // return these unmapped — fall back to them so the UI still shows a
  // real name/phone instead of a placeholder.
  full_name?: string | null;
  phone_number?: string | null;
  whalesync_postgres_id?: string | null;

  // Additional raw signup-form fields, shown in the volunteer detail
  // drill-through when present.
  what_transportation_do_you_have?: string | null;
  how_many_meals_or_food_packages_can_you_transport?: string | number | null;
  when_are_you_available_from?: string | null;
  when_are_you_available_until?: string | null;
  what_is_the_maximum_distance_you_re_comfortable_traveling?: string | null;
  what_would_you_like_to_help_with?: string | null;
  starting_location_zip_code?: string | null;
  are_there_any_transportation_or_scheduling_limitations_we_shoul?: string | null;
};

type Dashboard = {
  stats: {
    meals_rescued: number;
    meals_at_donor?: number;
    meals_in_transit?: number;
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

  // Supported when the backend returns richer collections.
  rescue_queue?: Assignment[];
  volunteers_list?: Volunteer[];
  volunteers?: Volunteer[];
};

function statusLabel(status?: string | null) {
  switch (status) {
    case "completed":
    case "delivered":
      return "Delivered";

    case "accepted":
    case "confirmed":
      return "Accepted";

    case "declined":
      return "Declined";

    case "needs_reassignment":
      return "Needs new volunteer";

    case "match_pending":
      return "Volunteer match pending";

    case "picked_up":
    case "in_transit":
      return "Picked up";

    case "no_answer":
      return "No answer";

    case "outreach_pending":
      return "Ready to call";

    default:
      return status
        ? status.replaceAll("_", " ")
        : "Unknown";
  }
}

function statusColor(status?: string | null) {
  if (status === "completed" || status === "delivered") return C.green;
  if (status === "picked_up" || status === "in_transit") return C.orange;
  if (status === "accepted" || status === "confirmed") return C.green;
  if (status === "declined" || status === "needs_reassignment") return C.red;
  return C.orange;
}

function canPlaceCall(assignment?: Assignment | null) {
  if (!assignment?.id) return false;
  if (String(assignment.id).startsWith("donation-")) return false;
  if (assignment.vapi_call_id) return false;
  if (assignment.volunteer_outcome) return false;

  if (
    assignment.status === "delivered" ||
    assignment.status === "completed" ||
    assignment.status === "declined" ||
    assignment.status === "needs_reassignment" ||
    assignment.status === "needs_dispatch" ||
    assignment.status === "match_pending"
  ) {
    return false;
  }

  return (
    Boolean(assignment.volunteer?.name) ||
    Boolean(assignment.volunteer?.phone)
  );
}

function canConfirmDelivery(assignment?: Assignment | null) {
  if (!assignment?.id) return false;
  if (String(assignment.id).startsWith("donation-")) return false;

  if (
    assignment.status === "delivered" ||
    assignment.status === "completed" ||
    assignment.workflow?.delivery_completed
  ) {
    return false;
  }

  if (
    assignment.status === "declined" ||
    assignment.status === "needs_reassignment" ||
    assignment.volunteer_outcome === "declined"
  ) {
    return false;
  }

  return (
    assignment.volunteer_outcome === "accepted" ||
    assignment.status === "accepted" ||
    assignment.status === "confirmed" ||
    assignment.status === "picked_up" ||
    assignment.status === "in_transit" ||
    Boolean(assignment.calendar_event_id)
  );
}

function canConfirmPickup(assignment?: Assignment | null) {
  if (!canConfirmDelivery(assignment)) return false;

  if (
    assignment?.status === "picked_up" ||
    assignment?.status === "in_transit" ||
    assignment?.workflow?.pickup_confirmed
  ) {
    return false;
  }

  return true;
}

function canRecordDecline(assignment?: Assignment | null) {
  if (!assignment?.id) return false;
  if (String(assignment.id).startsWith("donation-")) return false;
  if (assignment.volunteer_outcome === "declined") return false;
  if (assignment.volunteer_outcome === "accepted") return false;

  if (
    assignment.status === "delivered" ||
    assignment.status === "completed" ||
    assignment.status === "declined" ||
    assignment.status === "needs_reassignment" ||
    assignment.status === "needs_dispatch" ||
    assignment.status === "match_pending" ||
    assignment.status === "accepted" ||
    assignment.status === "confirmed"
  ) {
    return false;
  }

  return (
    Boolean(assignment.volunteer?.name) ||
    Boolean(assignment.volunteer?.phone) ||
    Boolean(assignment.workflow?.match_found)
  );
}

// The dispatch queue previously derived its badge only from
// volunteer_outcome / vapi_call_id, ignoring assignment.status. That
// meant an assignment already marked "completed" (or any other status)
// with no volunteer_outcome recorded showed up as "Needs dispatch" even
// though the ledger — which reads status directly — correctly showed it
// as Completed. These helpers make the queue badge agree with the same
// status field the ledger uses, falling back to outreach/dispatch state
// only when status itself is unset or still "needs_dispatch".
function queueStatusLabel(assignment: Assignment): string {
  if (
    assignment.status &&
    assignment.status !== "needs_dispatch" &&
    assignment.status !== "pending"
  ) {
    return statusLabel(assignment.status);
  }

  if (assignment.volunteer_outcome) {
    return statusLabel(assignment.volunteer_outcome);
  }

  if (assignment.vapi_call_id) {
    return "AI outreach";
  }

  return "Needs dispatch";
}

function queueStatusColor(assignment: Assignment): string {
  if (
    assignment.status &&
    assignment.status !== "needs_dispatch" &&
    assignment.status !== "pending"
  ) {
    return statusColor(assignment.status);
  }

  if (assignment.volunteer_outcome === "declined") return C.red;
  if (assignment.volunteer_outcome === "accepted") return C.green;
  if (assignment.vapi_call_id) return C.orange;
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

function formatDateTime(value?: string | null) {
  if (!value) return undefined;

  try {
    return new Date(value).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return undefined;
  }
}

function formatExpiry(minutes?: number | null, expired?: boolean) {
  if (expired || (minutes != null && minutes < 0)) return "Expired";
  if (minutes == null) return null;
  if (minutes < 60) return `Expires in ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `Expires in ${hours} hr`;
}

function RescueRouteMap({
  route,
  volunteerName,
  donorName,
  recipientName,
}: {
  route?: Assignment["route"];
  volunteerName?: string | null;
  donorName?: string | null;
  recipientName?: string | null;
}) {
  const points = [
    route?.volunteer
      ? { ...route.volunteer, label: volunteerName || "Volunteer", tone: C.green }
      : null,
    route?.pickup
      ? { ...route.pickup, label: donorName || "Donor", tone: C.orange }
      : null,
    route?.delivery
      ? { ...route.delivery, label: recipientName || "Recipient", tone: C.text }
      : null,
  ].filter(Boolean) as Array<{
    lat: number;
    lng: number;
    zip?: string;
    label: string;
    tone: string;
  }>;

  if (points.length < 2) return null;

  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = Math.max(maxLat - minLat, 0.02);
  const lngSpan = Math.max(maxLng - minLng, 0.02);
  const pad = 18;
  const width = 280;
  const height = 150;

  const xy = (lat: number, lng: number) => ({
    x: pad + ((lng - minLng) / lngSpan) * (width - pad * 2),
    y: pad + ((maxLat - lat) / latSpan) * (height - pad * 2),
  });

  const plotted = points.map((point) => ({ ...point, ...xy(point.lat, point.lng) }));

  return (
    <div className="mt-3 overflow-hidden rounded-xl" style={{ border: `1px solid ${C.line}`, background: "rgba(0,0,0,0.18)" }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[150px] w-full">
        {plotted.slice(0, -1).map((point, index) => {
          const next = plotted[index + 1];
          return (
            <line
              key={`leg-${index}`}
              x1={point.x}
              y1={point.y}
              x2={next.x}
              y2={next.y}
              stroke="rgba(255,107,53,0.55)"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
          );
        })}
        {plotted.map((point) => (
          <g key={`${point.label}-${point.lat}`}>
            <circle cx={point.x} cy={point.y} r="5" fill={point.tone} />
            <text
              x={point.x}
              y={point.y - 10}
              textAnchor="middle"
              fill={C.text}
              fontSize="8"
              fontFamily="IBM Plex Mono, monospace"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
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

function AgenticNode({
  label,
  detail,
  icon: Icon,
  active,
}: {
  label: string;
  detail: string;
  icon: React.ElementType;
  active: boolean;
}) {
  const color = active ? C.green : C.faint;

  return (
    <div
      className="flex min-w-[120px] flex-1 flex-col items-center gap-2 rounded-xl p-4 text-center"
      style={{
        background: active
          ? "rgba(92,156,116,0.10)"
          : "rgba(241,234,217,0.03)",
        border: `1px solid ${color}`,
      }}
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full"
        style={{
          background: active
            ? "rgba(92,156,116,0.16)"
            : "rgba(241,234,217,0.04)",
          border: `1px solid ${color}`,
        }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>

      <div
        className="text-[9px] font-bold uppercase tracking-[0.13em]"
        style={{
          color: active ? C.text : C.muted,
          fontFamily: "IBM Plex Mono, monospace",
        }}
      >
        {label}
      </div>

      <div className="text-[9px]" style={{ color: C.faint }}>
        {detail}
      </div>
    </div>
  );
}

function AgenticConnector({ active }: { active: boolean }) {
  const color = active ? C.green : C.line;

  return (
    <div className="flex w-8 shrink-0 items-center justify-center sm:w-10">
      <ArrowRight className="h-4 w-4" style={{ color }} />
    </div>
  );
}

function DetailModal({
  title,
  subtitle,
  badge,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-10 sm:items-center"
      style={{ background: "rgba(10,14,11,0.72)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 sm:p-7"
        style={{ background: C.paper, color: C.ink }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div
              className="truncate text-lg font-semibold"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {title}
            </div>

            {subtitle && (
              <div
                className="mt-1 text-xs"
                style={{ color: "rgba(28,27,20,0.55)" }}
              >
                {subtitle}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {badge}

            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ background: "rgba(28,27,20,0.08)" }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-5 max-h-[65vh] overflow-y-auto pr-1">
          {children}
        </div>
      </div>
    </div>
  );
}

function DetailSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5 last:mb-0">
      <div
        className="mb-2 text-[8px] font-bold uppercase tracking-[0.16em]"
        style={{
          color: "rgba(28,27,20,0.42)",
          fontFamily: "IBM Plex Mono, monospace",
        }}
      >
        {label}
      </div>

      <div
        className="rounded-xl p-4"
        style={{ background: "rgba(28,27,20,0.04)" }}
      >
        {children}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return (
    <div
      className="flex items-start justify-between gap-4 border-b py-2 text-xs last:border-b-0"
      style={{ borderColor: "rgba(28,27,20,0.08)" }}
    >
      <div
        className="shrink-0 uppercase tracking-[0.1em]"
        style={{
          color: "rgba(28,27,20,0.45)",
          fontSize: 9,
          fontFamily: "IBM Plex Mono, monospace",
        }}
      >
        {label}
      </div>

      <div
        className="text-right text-xs font-medium"
        style={{ color: C.ink }}
      >
        {value}
      </div>
    </div>
  );
}

type RescueStep = {
  label: string;
  detail: string;
  complete: boolean;
  declined?: boolean;
  icon: React.ElementType;
};

// Shared by the ledger's inline drill-through and the queue detail modal
// so both surfaces describe the same rescue in the same terms.
function buildRescueSteps(assignment: Assignment): RescueStep[] {
  const wf = assignment.workflow;

  const declined =
    assignment.status === "declined" ||
    assignment.volunteer_outcome === "declined";

  return [
    {
      label: "Donation received",
      detail: "Food donation entered into Community Pilot",
      complete: wf?.donation_logged ?? false,
      icon: Database,
    },
    {
      label: "AI match found",
      detail:
        assignment.recipient?.name ??
        assignment.delivery_organization ??
        "Community destination matched",
      complete: wf?.match_found ?? false,
      icon: Sparkles,
    },
    {
      label: "Volunteer outreach",
      detail: assignment.volunteer?.name
        ? `AI contacted ${assignment.volunteer.name}`
        : "AI volunteer outreach initiated",
      complete: wf?.ai_call_placed ?? false,
      icon: PhoneCall,
    },
    {
      label: declined ? "Volunteer declined" : "Volunteer accepted",
      detail:
        assignment.volunteer_outcome === "accepted"
          ? `${assignment.volunteer?.name ?? "Volunteer"} accepted the assignment`
          : assignment.volunteer_outcome === "declined"
            ? `${assignment.volunteer?.name ?? "Volunteer"} declined the assignment`
            : "Waiting for volunteer response",
      complete: assignment.volunteer_outcome === "accepted" && !declined,
      declined,
      icon: UserCheck,
    },
    {
      label: "Picked up",
      detail:
        assignment.status === "picked_up" ||
        assignment.status === "in_transit" ||
        wf?.pickup_confirmed
          ? "Food left the donor"
          : "Waiting for pickup",
      complete: Boolean(
        wf?.pickup_confirmed ||
          assignment.status === "picked_up" ||
          assignment.status === "in_transit"
      ) && !declined,
      icon: Truck,
    },
    {
      label: "Calendar scheduled",
      detail: assignment.calendar_event_id
        ? "Pickup event created in Google Calendar"
        : "Calendar event pending",
      complete: Boolean(assignment.calendar_event_id),
      icon: CalendarCheck2,
    },
    {
      label: "Delivery completed",
      detail: wf?.delivery_completed
        ? "Food delivered to the community destination"
        : "Awaiting pickup and delivery",
      complete: wf?.delivery_completed ?? false,
      icon: Truck,
    },
  ];
}

function RescueStepList({ steps }: { steps: RescueStep[] }) {
  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const isActive =
          !step.complete &&
          !step.declined &&
          (index === 0 || steps[index - 1]?.complete);

        const color = step.declined
          ? C.red
          : step.complete
            ? C.green
            : isActive
              ? C.orange
              : "rgba(28,27,20,0.3)";

        return (
          <div key={step.label} className="flex items-start gap-3">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
              style={{
                background: step.declined
                  ? "rgba(217,108,95,0.14)"
                  : step.complete
                    ? "rgba(92,156,116,0.14)"
                    : isActive
                      ? "rgba(255,107,53,0.14)"
                      : "rgba(28,27,20,0.05)",
                border: `1px solid ${color}`,
              }}
            >
              {step.declined ? (
                <X className="h-3.5 w-3.5" style={{ color }} />
              ) : step.complete ? (
                <Check className="h-3.5 w-3.5" style={{ color }} />
              ) : (
                <step.icon className="h-3.5 w-3.5" style={{ color }} />
              )}
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <div
                className="text-xs font-semibold"
                style={{ color: step.complete || step.declined ? color : C.ink }}
              >
                {step.label}
              </div>

              <div
                className="mt-0.5 text-[10px] leading-4"
                style={{ color: "rgba(28,27,20,0.55)" }}
              >
                {step.detail}
              </div>
            </div>
          </div>
        );
      })}
    </div>
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

  const [dispatchState, setDispatchState] =
    useState<"idle" | "running" | "done" | "error">("idle");

  const [dispatchMessage, setDispatchMessage] =
    useState<string | null>(null);

  const [completeState, setCompleteState] =
    useState<"idle" | "running" | "done" | "error">("idle");

  const [pickupState, setPickupState] =
    useState<"idle" | "running" | "done" | "error">("idle");

  const [callingId, setCallingId] =
    useState<string | null>(null);

  const [decliningId, setDecliningId] =
    useState<string | null>(null);

  const [lastMatches, setLastMatches] =
    useState<Assignment[]>([]);

  const [selectedQueueId, setSelectedQueueId] =
    useState<string | null>(null);

  const [selectedVolunteerKey, setSelectedVolunteerKey] =
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

  async function runDispatchOutreach() {
    try {
      setDispatchState("running");
      setDispatchMessage(null);

      const response = await fetch(
        `${API_URL}/api/dispatch/outreach`,
        { method: "POST" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ?? `Backend returned ${response.status}`
        );
      }

      setDispatchState("done");

      if (data.status === "outreach_ready") {
        const matched: Assignment[] = [];

        for (const plan of data.plans ?? []) {
          const donation = plan?.plan?.donation ?? {};
          const request = plan?.plan?.request ?? {};

          for (const item of plan?.assignments ?? []) {
            if (!item?.assignment_id) continue;

            matched.push({
              id: item.assignment_id,
              meals_assigned: item.meals_assigned,
              status: item.status ?? "outreach_pending",
              vapi_call_id: item.vapi_call_id ?? null,
              donor: {
                name: donation.restaurant_name ?? null,
              },
              recipient: {
                name: request.organization_name ?? null,
              },
              volunteer: {
                name: item.volunteer_name ?? null,
                phone: item.phone ?? null,
                email: item.email ?? null,
              },
              delivery_organization: request.organization_name ?? null,
              workflow: {
                form_submitted: true,
                donation_logged: true,
                match_found: true,
                ai_call_placed: Boolean(item.vapi_call_id),
                pickup_confirmed: false,
                delivery_scheduled: false,
                delivery_completed: false,
              },
            });
          }
        }

        setLastMatches(matched);
        setDispatchMessage(
          matched.length > 0
            ? `Matched ${matched.length} volunteer(s). Place a call below.`
            : (data.message ?? "No new matches were found.")
        );
      } else {
        setDispatchMessage(
          data.message ?? "No new matches were found."
        );
      }

      loadDashboard();
    } catch (err) {
      console.error("Dispatch outreach failed:", err);
      setDispatchState("error");
      setDispatchMessage("Unable to run AI matching right now.");
    }
  }

  async function placeVolunteerCall(assignmentId: string) {
    try {
      setCallingId(assignmentId);

      const response = await fetch(
        `${API_URL}/api/dispatch/outreach/${assignmentId}/call`,
        { method: "POST" }
      );

      const data = await response.json();

      if (data.status === "call_initiated") {
        setDispatchState("done");
        setDispatchMessage(
          `Calling ${data.volunteer?.name ?? "the volunteer"} now.`
        );
        setLastMatches((previous) =>
          previous.map((item) =>
            item.id === assignmentId
              ? {
                  ...item,
                  vapi_call_id: data.vapi_call_id ?? "placed",
                  workflow: {
                    form_submitted: true,
                    donation_logged: true,
                    match_found: true,
                    ai_call_placed: true,
                    pickup_confirmed: false,
                    delivery_scheduled: false,
                    delivery_completed: false,
                  },
                }
              : item
          )
        );
        loadDashboard();
        return;
      }

      const errorMessage =
        data.status === "volunteer_not_found"
          ? "That volunteer is no longer available. Run AI matching again."
          : data.status === "missing_phone"
            ? "That volunteer does not have a phone number."
            : data.status === "assignment_not_found"
              ? "That dispatch assignment could not be found."
              : data.status === "call_failed"
                ? (data.message || data.error || "The volunteer call could not be placed.")
                : (data.message || "Unable to place the volunteer call.");

      setDispatchState("error");
      setDispatchMessage(errorMessage);
    } catch (err) {
      console.error("Place volunteer call failed:", err);
      setDispatchState("error");
      setDispatchMessage("Unable to place the volunteer call.");
    } finally {
      setCallingId(null);
    }
  }

  async function confirmDelivery(assignmentId: string) {
    try {
      setCompleteState("running");

      const response = await fetch(
        `${API_URL}/api/dispatch/${assignmentId}/complete`,
        { method: "POST" }
      );

      const data = await response.json();

      if (
        !response.ok ||
        (data.status !== "delivered" && data.status !== "already_delivered")
      ) {
        throw new Error(
          data?.message ?? `Backend returned ${response.status}`
        );
      }

      setCompleteState("done");
      loadDashboard();
    } catch (err) {
      console.error("Confirm delivery failed:", err);
      setCompleteState("error");
    }
  }

  async function confirmPickup(assignmentId: string) {
    try {
      setPickupState("running");

      const response = await fetch(
        `${API_URL}/api/dispatch/${assignmentId}/pickup`,
        { method: "POST" }
      );

      const data = await response.json();

      if (
        !response.ok ||
        (data.status !== "picked_up" && data.status !== "already_delivered")
      ) {
        throw new Error(
          data?.message ?? `Backend returned ${response.status}`
        );
      }

      setPickupState("done");
      loadDashboard();
    } catch (err) {
      console.error("Confirm pickup failed:", err);
      setPickupState("error");
    }
  }

  async function recordDecline(assignmentId: string) {
    try {
      setDecliningId(assignmentId);
      setDispatchState("running");

      const response = await fetch(
        `${API_URL}/api/dispatch/${assignmentId}/decline`,
        { method: "POST" }
      );

      const data = await response.json();

      if (!response.ok || data.status === "assignment_not_found") {
        throw new Error(
          data?.message ?? `Backend returned ${response.status}`
        );
      }

      const reassignment = data.reassignment ?? {};
      const replacementName = reassignment.volunteer_name as
        | string
        | undefined;

      setLastMatches((previous) =>
        previous.filter((item) => item.id !== assignmentId)
      );

      if (reassignment.status === "reassigned" && replacementName) {
        setDispatchState("done");
        setDispatchMessage(
          `${replacementName} was matched as a replacement. Place a call when you are ready.`
        );
      } else {
        setDispatchState("done");
        setDispatchMessage("Volunteer match pending");
      }

      loadDashboard();
    } catch (err) {
      console.error("Record volunteer decline failed:", err);
      setDispatchState("error");
      setDispatchMessage("Unable to record the volunteer decline.");
    } finally {
      setDecliningId(null);
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
        assignments.find((a) => canPlaceCall(a)) ??
        assignments.find(
          (a) =>
            a.status === "accepted" ||
            a.status === "confirmed"
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

  const rescueQueue = useMemo(() => {
    const source =
      Array.isArray(dashboard?.rescue_queue) &&
      dashboard.rescue_queue.length > 0
        ? dashboard.rescue_queue
        : assignments;

    return [...source].sort((a, b) => {
      const aTime = new Date(
        a.rescue_activity_at ??
          a.updated_at ??
          a.created_at ??
          0
      ).getTime();

      const bTime = new Date(
        b.rescue_activity_at ??
          b.updated_at ??
          b.created_at ??
          0
      ).getTime();

      return bTime - aTime;
    });
  }, [dashboard?.rescue_queue, assignments]);

  // "Rescues in queue" should only show work that's still in flight —
  // once an item reaches completed/delivered it belongs in the ledger
  // below, not the active queue. Without this filter the two panels
  // showed the exact same list.
  const activeRescueQueue = useMemo(() => {
    return rescueQueue.filter(
      (item) =>
        item.status !== "completed" &&
        item.status !== "delivered" &&
        item.status !== "declined" &&
        item.status !== "needs_reassignment" &&
        item.volunteer_outcome !== "declined"
    );
  }, [rescueQueue]);

  const readyCalls = useMemo(() => {
    const fromLast = lastMatches.filter((item) => canPlaceCall(item));
    if (fromLast.length > 0) return fromLast;

    return activeRescueQueue.filter((item) => canPlaceCall(item)).slice(0, 5);
  }, [lastMatches, activeRescueQueue]);

  const volunteerNetwork = useMemo<Volunteer[]>(() => {
    const backendVolunteers =
      dashboard?.volunteers_list ??
      dashboard?.volunteers ??
      [];

    const byKey = new Map<string, Volunteer>();

    for (const raw of backendVolunteers) {
      const volunteer: Volunteer = {
        ...raw,
        id: raw.id ?? raw.whalesync_postgres_id ?? undefined,
        name: raw.name ?? raw.full_name ?? undefined,
        phone: raw.phone ?? raw.phone_number ?? undefined,
      };

      const key =
        volunteer.id ??
        volunteer.email ??
        volunteer.phone ??
        volunteer.name ??
        `volunteer-${byKey.size}`;

      byKey.set(key, volunteer);
    }

    for (const assignment of assignments) {
      const volunteer = assignment.volunteer;

      if (
        !volunteer?.name &&
        !volunteer?.email &&
        !volunteer?.phone
      ) {
        continue;
      }

      const key =
        volunteer.email ??
        volunteer.phone ??
        volunteer.name ??
        `assignment-${assignment.id}`;

      if (!byKey.has(key)) {
        byKey.set(key, {
          id: key,
          name: volunteer.name,
          email: volunteer.email,
          phone: volunteer.phone,
          status:
            assignment.volunteer_outcome ??
            (assignment.vapi_call_id
              ? "outreach"
              : "matched"),
          city:
            assignment.pickup_city ??
            assignment.delivery_city ??
            null,
          created_at: assignment.created_at,
        });
      }
    }

    return Array.from(byKey.values()).sort(
      (a, b) => {
        const aRaw = a.timestamp ?? a.created_at ?? "";
        const bRaw = b.timestamp ?? b.created_at ?? "";

        const aTime = Date.parse(aRaw);
        const bTime = Date.parse(bRaw);

        if (Number.isFinite(aTime) && Number.isFinite(bTime)) {
          return bTime - aTime;
        }

        if (Number.isFinite(aTime)) return -1;
        if (Number.isFinite(bTime)) return 1;

        return 0;
      }
    );
  }, [
    dashboard?.volunteers_list,
    dashboard?.volunteers,
    assignments,
  ]);

  // Donations that have not been matched to a volunteer yet — the "food
  // ready for pickup" side of the agentic trigger condition.
  const foodAwaitingMatch = useMemo(() => {
    return rescueQueue.filter(
      (item) =>
        item.status === "match_pending" ||
        item.status === "needs_dispatch" ||
        (!item.volunteer_outcome &&
          !(item.workflow?.match_found ?? false))
    );
  }, [rescueQueue]);

  // Volunteers not currently mid-assignment — the "volunteer ready" side
  // of the agentic trigger condition.
  const volunteersAvailable = useMemo(() => {
    return volunteerNetwork.filter((volunteer) => {
      const status = volunteer.status?.toLowerCase();
      return !status || status === "available";
    });
  }, [volunteerNetwork]);

  // Assignments where the AI has placed an outreach call and is still
  // waiting on the volunteer's response.
  const callsInProgress = useMemo(() => {
    return assignments.filter(
      (assignment) =>
        Boolean(assignment.vapi_call_id) &&
        !assignment.volunteer_outcome
    );
  }, [assignments]);

  const selectedQueueItem = useMemo(() => {
    if (!selectedQueueId) return null;
    return (
      rescueQueue.find((item) => item.id === selectedQueueId) ?? null
    );
  }, [rescueQueue, selectedQueueId]);

  const selectedVolunteer = useMemo(() => {
    if (!selectedVolunteerKey) return null;

    return (
      volunteerNetwork.find((volunteer, index) => {
        const key =
          volunteer.id ??
          volunteer.email ??
          volunteer.phone ??
          `${volunteer.name}-${index}`;

        return key === selectedVolunteerKey;
      }) ?? null
    );
  }, [volunteerNetwork, selectedVolunteerKey]);

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
        assignment.status === "delivered" ||
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
              dashboard?.stats.meals_at_donor ??
                0,
              "Still at donor",
            ],
            [
              dashboard?.stats.meals_in_transit ??
                0,
              "In transit",
            ],
            [
              dashboard?.stats.meals_delivered ??
                0,
              "Meals delivered",
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

                <RescueRouteMap
                  route={activeAssignment.route}
                  volunteerName={activeAssignment.volunteer?.name}
                  donorName={activeAssignment.donor?.name}
                  recipientName={
                    activeAssignment.recipient?.name ??
                    activeAssignment.delivery_organization
                  }
                />
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

                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
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

                    {canPlaceCall(activeAssignment) && (
                      <button
                        type="button"
                        onClick={() =>
                          placeVolunteerCall(activeAssignment.id)
                        }
                        disabled={callingId === activeAssignment.id}
                        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] disabled:opacity-60"
                        style={{
                          background: C.orange,
                          color: C.ink,
                          fontFamily:
                            "IBM Plex Mono, monospace",
                        }}
                      >
                        <PhoneOutgoing className="h-3.5 w-3.5" />
                        {callingId === activeAssignment.id
                          ? "Calling..."
                          : "Place call"}
                      </button>
                    )}

                    {canRecordDecline(activeAssignment) && (
                      <button
                        type="button"
                        onClick={() =>
                          recordDecline(activeAssignment.id)
                        }
                        disabled={decliningId === activeAssignment.id}
                        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] disabled:opacity-60"
                        style={{
                          background: "transparent",
                          color: C.red,
                          border: `1px solid ${C.red}`,
                          fontFamily:
                            "IBM Plex Mono, monospace",
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                        {decliningId === activeAssignment.id
                          ? "Updating..."
                          : "Mark declined"}
                      </button>
                    )}

                    {canConfirmPickup(activeAssignment) && (
                      <button
                        type="button"
                        onClick={() =>
                          confirmPickup(activeAssignment.id)
                        }
                        disabled={pickupState === "running"}
                        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] disabled:opacity-60"
                        style={{
                          background: "transparent",
                          color: C.ink,
                          border: `1px solid ${C.ink}`,
                          fontFamily:
                            "IBM Plex Mono, monospace",
                        }}
                      >
                        <Truck className="h-3.5 w-3.5" />
                        {pickupState === "running"
                          ? "Updating..."
                          : "Picked up"}
                      </button>
                    )}

                    {canConfirmDelivery(activeAssignment) && (
                      <button
                        type="button"
                        onClick={() =>
                          confirmDelivery(activeAssignment.id)
                        }
                        disabled={completeState === "running"}
                        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] disabled:opacity-60"
                        style={{
                          background: C.ink,
                          color: C.paper,
                          fontFamily:
                            "IBM Plex Mono, monospace",
                        }}
                      >
                        <Check className="h-3.5 w-3.5" />
                        {completeState === "running"
                          ? "Confirming..."
                          : completeState === "error"
                            ? "Retry confirm"
                            : "Confirm delivery"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* RESCUE QUEUE + VOLUNTEER NETWORK */}

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-4 lg:px-10">
        <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
          <div
            className="overflow-hidden rounded-2xl"
            style={{
              background: "rgba(241,234,217,0.025)",
              border: `1px solid ${C.line}`,
            }}
          >
            <div
              className="flex items-center justify-between border-b px-6 py-5 lg:px-7"
              style={{ borderColor: C.line }}
            >
              <div>
                <div
                  className="text-[9px] font-semibold uppercase tracking-[0.2em]"
                  style={{
                    color: C.orange,
                    fontFamily: "IBM Plex Mono, monospace",
                  }}
                >
                  Dispatch queue
                </div>
                <h2
                  className="mt-1 text-xl font-semibold"
                  style={{ fontFamily: "Space Grotesk, sans-serif" }}
                >
                  Rescues in queue
                </h2>
                <p
                  className="mt-1 text-xs"
                  style={{ color: C.faint }}
                >
                  Active only — completed and delivered rescues move to the
                  ledger below.
                </p>
              </div>

              <span
                className="rounded-full px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.14em]"
                style={{
                  color: C.orange,
                  border: `1px solid ${C.orange}`,
                  fontFamily: "IBM Plex Mono, monospace",
                }}
              >
                {activeRescueQueue.length} active
              </span>
            </div>

            <div className="max-h-[470px] overflow-y-auto p-5 lg:p-6">
              <div className="grid gap-2">
              {activeRescueQueue.length === 0 ? (
                <div
                  className="rounded-xl p-5 text-center text-[10px]"
                  style={{
                    background: "rgba(241,234,217,0.025)",
                    border: `1px solid ${C.line}`,
                    color: C.faint,
                  }}
                >
                  No rescues are waiting in the dispatch queue.
                  <div
                    className="mt-2 text-[8px] uppercase tracking-[0.12em]"
                    style={{
                      fontFamily: "IBM Plex Mono, monospace",
                    }}
                  >
                    New food requests and matched donations will appear here.
                  </div>
                </div>
              ) : (
                activeRescueQueue.map((assignment) => {
                  const queueColor = queueStatusColor(assignment);

                  return (
                    <div
                      key={`queue-${assignment.id}`}
                      className="card-hover rounded-xl p-4"
                      style={{
                        background: "rgba(241,234,217,0.035)",
                        border: `1px solid ${C.line}`,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedQueueId(assignment.id)}
                        className="flex w-full flex-col gap-3 text-left sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div
                              className="truncate text-sm font-semibold"
                              style={{ color: C.text }}
                            >
                              {assignment.donor?.name ?? "Food rescue"}
                            </div>

                            <span
                              className="rounded-full px-2 py-1 text-[7px] font-bold uppercase tracking-[0.12em]"
                              style={{
                                color: queueColor,
                                border: `1px solid ${queueColor}`,
                                fontFamily: "IBM Plex Mono, monospace",
                              }}
                            >
                              {queueStatusLabel(assignment)}
                            </span>
                            {formatExpiry(
                              assignment.minutes_remaining,
                              assignment.expired
                            ) && (
                              <span
                                className="rounded-full px-2 py-1 text-[7px] font-bold uppercase tracking-[0.12em]"
                                style={{
                                  color:
                                    assignment.expired ||
                                    (assignment.minutes_remaining ?? 999) < 60
                                      ? C.red
                                      : C.orange,
                                  border: `1px solid ${
                                    assignment.expired ||
                                    (assignment.minutes_remaining ?? 999) < 60
                                      ? C.red
                                      : C.orange
                                  }`,
                                  fontFamily: "IBM Plex Mono, monospace",
                                }}
                              >
                                {formatExpiry(
                                  assignment.minutes_remaining,
                                  assignment.expired
                                )}
                              </span>
                            )}
                          </div>

                          <div
                            className="mt-1 text-[9px]"
                            style={{ color: C.muted }}
                          >
                            {assignment.meals_assigned ?? 0} meals ·{" "}
                            {assignment.pickup_city ?? "San Jose"} →{" "}
                            {assignment.delivery_city ??
                              assignment.recipient?.name ??
                              assignment.delivery_organization ??
                              "Community destination"}
                            {assignment.volunteer?.name
                              ? ` · ${assignment.volunteer.name}`
                              : ""}
                          </div>
                        </div>

                        <div
                          className="shrink-0 text-[8px] sm:text-right"
                          style={{ color: C.faint }}
                        >
                          {formatTime(
                            assignment.rescue_activity_at ??
                              assignment.updated_at ??
                              assignment.created_at
                          )}
                        </div>
                      </button>
                    </div>
                  );
                })
              )}
              </div>
            </div>
          </div>

          <div
            className="overflow-hidden rounded-2xl"
            style={{
              background: "rgba(241,234,217,0.025)",
              border: `1px solid ${C.line}`,
            }}
          >
            <div
              className="flex items-center justify-between border-b px-6 py-5 lg:px-7"
              style={{ borderColor: C.line }}
            >
              <div>
                <div
                  className="text-[9px] font-semibold uppercase tracking-[0.2em]"
                  style={{
                    color: C.green,
                    fontFamily: "IBM Plex Mono, monospace",
                  }}
                >
                  Volunteer network
                </div>

                <h2
                  className="mt-1 text-xl font-semibold"
                  style={{ fontFamily: "Space Grotesk, sans-serif" }}
                >
                  People ready to help
                </h2>
              </div>

              <div
                className="text-[8px] uppercase tracking-[0.12em]"
                style={{
                  color: C.faint,
                  fontFamily: "IBM Plex Mono, monospace",
                }}
              >
                {dashboard?.counts.volunteers ??
                  volunteerNetwork.length}{" "}
                registered
              </div>
            </div>

            <div className="p-5 lg:p-6">
              {volunteerNetwork.length === 0 ? (
                <div
                  className="rounded-xl p-5 text-center text-[10px]"
                  style={{
                    background: "rgba(241,234,217,0.025)",
                    border: `1px solid ${C.line}`,
                    color: C.faint,
                  }}
                >
                  No volunteer profiles are available in the dashboard yet.

                  <div
                    className="mt-2 text-[8px] uppercase tracking-[0.12em]"
                    style={{
                      fontFamily: "IBM Plex Mono, monospace",
                    }}
                  >
                    New volunteer registrations will appear here once the
                    backend exposes them.
                  </div>
                </div>
              ) : (
                <div className="max-h-[430px] space-y-2 overflow-y-auto pr-1">
                  {volunteerNetwork.map(
                    (volunteer, index) => {
                      const normalizedStatus =
                        volunteer.status?.toLowerCase();

                      const isAccepted =
                        normalizedStatus === "accepted";

                      const isDeclined =
                        normalizedStatus === "declined";

                      const isOutreach =
                        normalizedStatus === "outreach" ||
                        normalizedStatus === "outreach_pending";

                      const color = isDeclined
                        ? C.red
                        : isAccepted
                          ? C.green
                          : isOutreach
                            ? C.orange
                            : C.green;

                      const volunteerKey =
                        volunteer.id ??
                        volunteer.email ??
                        volunteer.phone ??
                        `${volunteer.name}-${index}`;

                      return (
                        <button
                          key={volunteerKey}
                          type="button"
                          onClick={() =>
                            setSelectedVolunteerKey(volunteerKey)
                          }
                          className="card-hover flex w-full items-center gap-3 rounded-xl p-3 text-left"
                          style={{
                            background:
                              "rgba(241,234,217,0.035)",
                            border: `1px solid ${C.line}`,
                          }}
                        >
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                            style={{
                              background: `${color}18`,
                              border: `1px solid ${color}`,
                            }}
                          >
                            <UserRound
                              className="h-4 w-4"
                              style={{ color }}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div
                              className="truncate text-xs font-semibold"
                              style={{ color: C.text }}
                            >
                              {volunteer.name ??
                                "New volunteer"}
                            </div>

                            <div
                              className="mt-0.5 truncate text-[8px]"
                              style={{ color: C.faint }}
                            >
                              {volunteer.city ??
                                volunteer.email ??
                                volunteer.phone ??
                                "Volunteer registration"}
                            </div>
                          </div>

                          <span
                            className="shrink-0 rounded-full px-2 py-1 text-[7px] font-bold uppercase tracking-[0.11em]"
                            style={{
                              color,
                              border: `1px solid ${color}`,
                              fontFamily:
                                "IBM Plex Mono, monospace",
                            }}
                          >
                            {isAccepted
                              ? "Accepted"
                              : isDeclined
                                ? "Declined"
                                : isOutreach
                                  ? "AI outreach"
                                  : "Available"}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* AGENTIC TRIGGER FLOW */}

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-4 lg:px-10">
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background: "rgba(241,234,217,0.025)",
            border: `1px solid ${C.line}`,
          }}
        >
          <div
            className="flex flex-col gap-4 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8"
            style={{ borderColor: C.line }}
          >
            <div>
              <div
                className="text-[9px] font-semibold uppercase tracking-[0.2em]"
                style={{
                  color: C.orange,
                  fontFamily: "IBM Plex Mono, monospace",
                }}
              >
                Agentic trigger flow
              </div>

              <h2
                className="mt-2 text-xl font-semibold"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                When does Community Pilot call a volunteer?
              </h2>

              <p
                className="mt-1 max-w-xl text-xs leading-5"
                style={{ color: C.muted }}
              >
                The matching agent looks for a donation that still needs a
                pickup and a volunteer who is not already on an assignment.
                After a match is saved, place the AI outreach call from the
                dispatch queue.
              </p>
            </div>

            <button
              type="button"
              onClick={runDispatchOutreach}
              disabled={dispatchState === "running"}
              className="flex shrink-0 items-center justify-center gap-2 rounded-full px-5 py-3 text-[9px] font-bold uppercase tracking-[0.14em] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: C.paper,
                color: C.ink,
                fontFamily: "IBM Plex Mono, monospace",
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {dispatchState === "running"
                ? "Matching..."
                : "Run AI matching now"}
            </button>
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr_1fr] lg:p-8">
            {/* FLOW DIAGRAM */}

            <div>
              <div className="flex flex-wrap items-stretch gap-2 sm:flex-nowrap">
                <AgenticNode
                  label="Food ready"
                  detail={`${foodAwaitingMatch.length} awaiting pickup`}
                  icon={Database}
                  active={foodAwaitingMatch.length > 0}
                />

                <AgenticConnector
                  active={
                    foodAwaitingMatch.length > 0 &&
                    volunteersAvailable.length > 0
                  }
                />

                <AgenticNode
                  label="Volunteer ready"
                  detail={`${volunteersAvailable.length} available`}
                  icon={UserRound}
                  active={volunteersAvailable.length > 0}
                />

                <AgenticConnector active={callsInProgress.length > 0} />

                <AgenticNode
                  label="AI call placed"
                  detail={`${callsInProgress.length} in progress`}
                  icon={PhoneOutgoing}
                  active={callsInProgress.length > 0}
                />
              </div>

              <div
                className="mt-5 rounded-xl p-4 text-[10px] leading-5"
                style={{
                  background: "rgba(241,234,217,0.035)",
                  border: `1px solid ${C.line}`,
                  color: C.muted,
                }}
              >
                {foodAwaitingMatch.length > 0 &&
                volunteersAvailable.length > 0 ? (
                  <>
                    <span style={{ color: C.orange, fontWeight: 600 }}>
                      Ready to match:
                    </span>{" "}
                    {foodAwaitingMatch.length} donation(s) and{" "}
                    {volunteersAvailable.length} volunteer(s) are waiting.
                    Run AI matching, then place a call.
                  </>
                ) : (
                  <>
                    Nothing is waiting to be matched right now — Community
                    Pilot needs both an unmatched donation and an available
                    volunteer before it places a call.
                  </>
                )}

                {dispatchMessage && (
                  <div
                    className="mt-2"
                    style={{
                      color:
                        dispatchState === "error" ? C.red : C.green,
                    }}
                  >
                    {dispatchMessage}
                  </div>
                )}
              </div>

              {readyCalls.length > 0 && (
                <div
                  className="mt-4 space-y-2"
                >
                  <div
                    className="text-[8px] font-bold uppercase tracking-[0.15em]"
                    style={{
                      color: C.orange,
                      fontFamily: "IBM Plex Mono, monospace",
                    }}
                  >
                    Matched · ready to call
                  </div>
                  {readyCalls.map((assignment) => (
                    <div
                      key={`ready-${assignment.id}`}
                      className="flex flex-col gap-3 rounded-xl p-3 sm:flex-row sm:items-center sm:justify-between"
                      style={{
                        background: "rgba(255,107,53,0.08)",
                        border: "1px solid rgba(255,107,53,0.22)",
                      }}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">
                          {assignment.volunteer?.name ?? "Matched volunteer"}
                        </div>
                        <div
                          className="mt-1 text-[9px]"
                          style={{ color: C.muted }}
                        >
                          {assignment.meals_assigned ?? 0} meals ·{" "}
                          {assignment.donor?.name ?? "Food donor"} →{" "}
                          {assignment.recipient?.name ??
                            assignment.delivery_organization ??
                            "Community destination"}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => placeVolunteerCall(assignment.id)}
                          disabled={callingId === assignment.id}
                          className="flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[8px] font-bold uppercase tracking-[0.12em] disabled:opacity-60"
                          style={{
                            background: C.orange,
                            color: C.ink,
                            fontFamily: "IBM Plex Mono, monospace",
                          }}
                        >
                          <PhoneOutgoing className="h-3.5 w-3.5" />
                          {callingId === assignment.id
                            ? "Calling..."
                            : "Place call"}
                        </button>
                        {canRecordDecline(assignment) && (
                          <button
                            type="button"
                            onClick={() => recordDecline(assignment.id)}
                            disabled={decliningId === assignment.id}
                            className="flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[8px] font-bold uppercase tracking-[0.12em] disabled:opacity-60"
                            style={{
                              background: "transparent",
                              color: C.red,
                              border: `1px solid ${C.red}`,
                              fontFamily: "IBM Plex Mono, monospace",
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                            {decliningId === assignment.id
                              ? "Updating..."
                              : "Mark declined"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* LIVE QUEUES */}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div
                className="rounded-xl p-4"
                style={{
                  background: "rgba(255,107,53,0.06)",
                  border: "1px solid rgba(255,107,53,0.16)",
                }}
              >
                <div
                  className="text-[8px] font-bold uppercase tracking-[0.15em]"
                  style={{
                    color: C.orange,
                    fontFamily: "IBM Plex Mono, monospace",
                  }}
                >
                  Awaiting pickup match
                </div>

                {foodAwaitingMatch.length === 0 ? (
                  <div
                    className="mt-2 text-[10px]"
                    style={{ color: C.faint }}
                  >
                    No unmatched donations.
                  </div>
                ) : (
                  <div className="mt-2 space-y-1">
                    {foodAwaitingMatch.slice(0, 4).map((item) => (
                      <div
                        key={`ready-food-${item.id}`}
                        className="truncate text-[10px]"
                        style={{ color: C.muted }}
                      >
                        {item.donor?.name ?? "Food donation"} ·{" "}
                        {item.meals_assigned ?? 0} meals
                        {item.status === "match_pending"
                          ? " · volunteer match pending"
                          : ""}
                      </div>
                    ))}

                    {foodAwaitingMatch.length > 4 && (
                      <div className="text-[9px]" style={{ color: C.faint }}>
                        +{foodAwaitingMatch.length - 4} more
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div
                className="rounded-xl p-4"
                style={{
                  background: "rgba(92,156,116,0.07)",
                  border: "1px solid rgba(92,156,116,0.16)",
                }}
              >
                <div
                  className="text-[8px] font-bold uppercase tracking-[0.15em]"
                  style={{
                    color: C.green,
                    fontFamily: "IBM Plex Mono, monospace",
                  }}
                >
                  Available volunteers
                </div>

                {volunteersAvailable.length === 0 ? (
                  <div
                    className="mt-2 text-[10px]"
                    style={{ color: C.faint }}
                  >
                    No volunteers available.
                  </div>
                ) : (
                  <div className="mt-2 space-y-1">
                    {volunteersAvailable
                      .slice(0, 4)
                      .map((volunteer, index) => (
                        <div
                          key={`ready-volunteer-${volunteer.id ?? index}`}
                          className="truncate text-[10px]"
                          style={{ color: C.muted }}
                        >
                          {volunteer.name ?? "Volunteer"}
                          {volunteer.city ? ` · ${volunteer.city}` : ""}
                        </div>
                      ))}

                    {volunteersAvailable.length > 4 && (
                      <div className="text-[9px]" style={{ color: C.faint }}>
                        +{volunteersAvailable.length - 4} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

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

            <p
              className="mt-1 text-xs"
              style={{ color: C.faint }}
            >
              Full history — includes everything that's moved through the
              dispatch queue above, at any stage.
            </p>
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
          {[...assignments]
            .sort((a, b) => {
              const aTime = new Date(
                a.updated_at ?? a.created_at ?? 0
              ).getTime();
              const bTime = new Date(
                b.updated_at ?? b.created_at ?? 0
              ).getTime();
              return bTime - aTime;
            })
            .map(
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

                  {(intelligence?.expiring_donations?.length ?? 0) > 0 && (
                    <div className="mt-5">
                      <div
                        className="text-[8px] font-bold uppercase tracking-[0.15em]"
                        style={{
                          color: C.orange,
                          fontFamily: "IBM Plex Mono, monospace",
                        }}
                      >
                        Match these first
                      </div>
                      <div className="mt-2 space-y-2">
                        {intelligence?.expiring_donations?.map((item) => (
                          <div
                            key={item.id ?? item.name ?? String(item.minutes_remaining)}
                            className="flex items-center justify-between gap-3 text-[10px]"
                            style={{ color: C.muted }}
                          >
                            <span className="truncate">
                              {item.name ?? "Food donation"}
                              {item.city ? ` · ${item.city}` : ""}
                              {item.meals ? ` · ${item.meals} meals` : ""}
                            </span>
                            <span
                              className="shrink-0 uppercase tracking-[0.08em]"
                              style={{
                                color: C.orange,
                                fontFamily: "IBM Plex Mono, monospace",
                              }}
                            >
                              {formatExpiry(item.minutes_remaining)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                <p className="mt-2 max-w-2xl text-xs leading-5" style={{ color: C.muted }}>Talk to Community Pilot to donate food, request meals, or sign up as a volunteer — then watch matching, outreach, and calendar updates in one place.</p>
              </div>
              <div className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.16em]" style={{ color: C.green, fontFamily: "IBM Plex Mono, monospace" }}><span className="h-2 w-2 rounded-full" style={{ background: C.green }} /> System operational</div>
            </div>

            <div className="grid gap-0 lg:grid-cols-[1.05fr_1.2fr_0.9fr]">
              <div className="border-b p-6 lg:border-b-0 lg:border-r lg:p-7" style={{ borderColor: C.line }}>
                <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: C.faint, fontFamily: "IBM Plex Mono, monospace" }}><MessageSquare className="h-3.5 w-3.5" /> Conversation</div>
                <div className="mt-4 max-h-[430px] min-h-[260px] space-y-3 overflow-y-auto rounded-xl p-4" style={{ background: "rgba(0,0,0,0.18)", border: `1px solid ${C.line}` }}>
                  {transcript.length === 0 ? <div className="flex h-full min-h-[220px] items-center justify-center text-center text-[10px]" style={{ color: C.faint }}>Start the browser call and say whether you want to donate, request food, or volunteer.</div> : transcript.map((m, i) => <div key={`${i}-${m.text}`} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}><div className="max-w-[88%] rounded-xl px-4 py-3" style={{ background: m.role === "user" ? "rgba(255,107,53,0.10)" : "rgba(92,156,116,0.10)", border: `1px solid ${m.role === "user" ? "rgba(255,107,53,0.22)" : "rgba(92,156,116,0.22)"}` }}><div className="text-[7px] font-bold uppercase tracking-[0.15em]" style={{ color: m.role === "user" ? C.orange : C.green, fontFamily: "IBM Plex Mono, monospace" }}>{m.role === "user" ? "You" : "Community Pilot"}</div><div className="mt-1 text-xs leading-5" style={{ color: C.text }}>{m.text}</div></div></div>)}
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
                          <div className="mt-0.5 text-[8px] uppercase tracking-[0.12em]" style={{ color: C.faint, fontFamily: "IBM Plex Mono, monospace" }}>
                            {activeAssignment?.volunteer?.name
                              ? "Volunteer match found"
                              : "Searching volunteer network"}
                          </div>
                        </div>
                      </div>
                      <span className="rounded-full px-2 py-1 text-[7px] font-bold uppercase tracking-[0.12em]" style={{ color: activeAssignment?.volunteer?.name ? C.green : C.orange, border: `1px solid ${activeAssignment?.volunteer?.name ? C.green : C.orange}`, fontFamily: "IBM Plex Mono, monospace" }}>
                        {activeAssignment?.volunteer?.name ? "MATCHED" : "SEARCHING"}
                      </span>
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

      {/* RESCUE QUEUE ITEM DETAIL */}

      {selectedQueueItem && (
        <DetailModal
          title={selectedQueueItem.donor?.name ?? "Food rescue"}
          subtitle={`${selectedQueueItem.meals_assigned ?? 0} meals · ${
            selectedQueueItem.pickup_city ?? "San Jose"
          } → ${
            selectedQueueItem.delivery_city ??
            selectedQueueItem.recipient?.name ??
            selectedQueueItem.delivery_organization ??
            "Community destination"
          }`}
          badge={
            <span
              className="rounded-full px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.12em]"
              style={{
                color: queueStatusColor(selectedQueueItem),
                border: `1px solid ${queueStatusColor(selectedQueueItem)}`,
                fontFamily: "IBM Plex Mono, monospace",
              }}
            >
              {queueStatusLabel(selectedQueueItem)}
            </span>
          }
          onClose={() => setSelectedQueueId(null)}
        >
          <DetailSection label="Pickup">
            <DetailRow
              label="Donor"
              value={selectedQueueItem.donor?.name}
            />
            <DetailRow
              label="Contact"
              value={selectedQueueItem.donor?.contact}
            />
            <DetailRow
              label="Address"
              value={selectedQueueItem.pickup_address}
            />
            <DetailRow
              label="City"
              value={selectedQueueItem.pickup_city}
            />
            <DetailRow
              label="Deadline"
              value={
                formatExpiry(
                  selectedQueueItem.minutes_remaining,
                  selectedQueueItem.expired
                ) || selectedQueueItem.pickup_deadline
              }
            />
            <DetailRow
              label="Meals"
              value={selectedQueueItem.meals_assigned}
            />
          </DetailSection>

          {(selectedQueueItem.recipient?.name ||
            selectedQueueItem.delivery_organization) && (
            <DetailSection label="Delivery">
              <DetailRow
                label="Organization"
                value={
                  selectedQueueItem.recipient?.name ??
                  selectedQueueItem.delivery_organization
                }
              />
              <DetailRow
                label="Contact"
                value={selectedQueueItem.recipient?.contact}
              />
              <DetailRow
                label="Address"
                value={selectedQueueItem.delivery_address}
              />
              <DetailRow
                label="City"
                value={selectedQueueItem.delivery_city}
              />
              <DetailRow
                label="Instructions"
                value={selectedQueueItem.delivery_instructions}
              />
            </DetailSection>
          )}

          {selectedQueueItem.volunteer?.name && (
            <DetailSection label="Volunteer">
              <DetailRow
                label="Name"
                value={selectedQueueItem.volunteer?.name}
              />
              <DetailRow
                label="Phone"
                value={selectedQueueItem.volunteer?.phone}
              />
              <DetailRow
                label="Email"
                value={selectedQueueItem.volunteer?.email}
              />
              <DetailRow
                label="Outcome"
                value={
                  selectedQueueItem.volunteer_outcome
                    ? statusLabel(selectedQueueItem.volunteer_outcome)
                    : selectedQueueItem.vapi_call_id
                      ? "Awaiting response"
                      : undefined
                }
              />
            </DetailSection>
          )}

          <RescueRouteMap
            route={selectedQueueItem.route}
            volunteerName={selectedQueueItem.volunteer?.name}
            donorName={selectedQueueItem.donor?.name}
            recipientName={
              selectedQueueItem.recipient?.name ??
              selectedQueueItem.delivery_organization
            }
          />

          <DetailSection label="Rescue lifecycle">
            <RescueStepList steps={buildRescueSteps(selectedQueueItem)} />
          </DetailSection>

          <DetailSection label="Timestamps & links">
            <DetailRow
              label="Created"
              value={formatTime(selectedQueueItem.created_at) || undefined}
            />
            <DetailRow
              label="Updated"
              value={formatTime(selectedQueueItem.updated_at) || undefined}
            />
            <DetailRow
              label="Vapi call"
              value={selectedQueueItem.vapi_call_id}
            />
            <DetailRow
              label="Calendar"
              value={
                selectedQueueItem.calendar_event_url ? (
                  <a
                    href={selectedQueueItem.calendar_event_url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold"
                    style={{ color: C.green }}
                  >
                    Open event
                  </a>
                ) : undefined
              }
            />
          </DetailSection>

          {canPlaceCall(selectedQueueItem) && (
            <button
              type="button"
              onClick={() => placeVolunteerCall(selectedQueueItem.id)}
              disabled={callingId === selectedQueueItem.id}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-[9px] font-bold uppercase tracking-[0.14em] disabled:opacity-60"
              style={{
                background: C.orange,
                color: C.ink,
                fontFamily: "IBM Plex Mono, monospace",
              }}
            >
              <PhoneOutgoing className="h-3.5 w-3.5" />
              {callingId === selectedQueueItem.id
                ? "Calling..."
                : "Place call"}
            </button>
          )}

          {canRecordDecline(selectedQueueItem) && (
            <button
              type="button"
              onClick={() => recordDecline(selectedQueueItem.id)}
              disabled={decliningId === selectedQueueItem.id}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-[9px] font-bold uppercase tracking-[0.14em] disabled:opacity-60"
              style={{
                background: "transparent",
                color: C.red,
                border: `1px solid ${C.red}`,
                fontFamily: "IBM Plex Mono, monospace",
              }}
            >
              <X className="h-3.5 w-3.5" />
              {decliningId === selectedQueueItem.id
                ? "Updating..."
                : "Mark declined"}
            </button>
          )}

          {canConfirmPickup(selectedQueueItem) && (
            <button
              type="button"
              onClick={() => confirmPickup(selectedQueueItem.id)}
              disabled={pickupState === "running"}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-[9px] font-bold uppercase tracking-[0.14em] disabled:opacity-60"
              style={{
                background: "transparent",
                color: C.paper,
                border: `1px solid ${C.paper}`,
                fontFamily: "IBM Plex Mono, monospace",
              }}
            >
              <Truck className="h-3.5 w-3.5" />
              {pickupState === "running" ? "Updating..." : "Mark picked up"}
            </button>
          )}

          {canConfirmDelivery(selectedQueueItem) && (
            <button
              type="button"
              onClick={() => confirmDelivery(selectedQueueItem.id)}
              disabled={completeState === "running"}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-[9px] font-bold uppercase tracking-[0.14em] disabled:opacity-60"
              style={{
                background: C.ink,
                color: C.paper,
                fontFamily: "IBM Plex Mono, monospace",
              }}
            >
              <Check className="h-3.5 w-3.5" />
              {completeState === "running"
                ? "Confirming..."
                : "Confirm delivery"}
            </button>
          )}
        </DetailModal>
      )}

      {/* VOLUNTEER DETAIL */}

      {selectedVolunteer && (
        <DetailModal
          title={selectedVolunteer.name ?? "Volunteer"}
          subtitle={
            selectedVolunteer.city
              ? `Based in ${selectedVolunteer.city}`
              : undefined
          }
          badge={
            <span
              className="rounded-full px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.12em]"
              style={{
                color: statusColor(selectedVolunteer.status),
                border: `1px solid ${statusColor(selectedVolunteer.status)}`,
                fontFamily: "IBM Plex Mono, monospace",
              }}
            >
              {selectedVolunteer.status
                ? statusLabel(selectedVolunteer.status)
                : "Available"}
            </span>
          }
          onClose={() => setSelectedVolunteerKey(null)}
        >
          <DetailSection label="Contact">
            <DetailRow label="Name" value={selectedVolunteer.name} />
            <DetailRow label="Email" value={selectedVolunteer.email} />
            <DetailRow label="Phone" value={selectedVolunteer.phone} />
            <DetailRow label="City" value={selectedVolunteer.city} />
            <DetailRow
              label="Zip code"
              value={selectedVolunteer.starting_location_zip_code}
            />
          </DetailSection>

          <DetailSection label="Availability">
            <DetailRow
              label="From"
              value={
                formatTime(selectedVolunteer.when_are_you_available_from) ||
                selectedVolunteer.when_are_you_available_from ||
                undefined
              }
            />
            <DetailRow
              label="Until"
              value={
                formatTime(selectedVolunteer.when_are_you_available_until) ||
                selectedVolunteer.when_are_you_available_until ||
                undefined
              }
            />
            <DetailRow
              label="Max distance"
              value={
                selectedVolunteer.what_is_the_maximum_distance_you_re_comfortable_traveling
              }
            />
          </DetailSection>

          <DetailSection label="Transport capacity">
            <DetailRow
              label="Transportation"
              value={selectedVolunteer.what_transportation_do_you_have}
            />
            <DetailRow
              label="Meal capacity"
              value={
                selectedVolunteer.how_many_meals_or_food_packages_can_you_transport
              }
            />
            <DetailRow
              label="Wants to help with"
              value={selectedVolunteer.what_would_you_like_to_help_with}
            />
          </DetailSection>

          {selectedVolunteer.are_there_any_transportation_or_scheduling_limitations_we_shoul && (
            <DetailSection label="Limitations">
              <div
                className="text-xs leading-5"
                style={{ color: "rgba(28,27,20,0.65)" }}
              >
                {
                  selectedVolunteer.are_there_any_transportation_or_scheduling_limitations_we_shoul
                }
              </div>
            </DetailSection>
          )}

          <DetailSection label="Signup">
            <DetailRow
              label="Registered"
              value={
                formatTime(
                  selectedVolunteer.timestamp ??
                    selectedVolunteer.created_at
                ) || undefined
              }
            />
          </DetailSection>
        </DetailModal>
      )}

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
