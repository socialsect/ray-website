import { statusLabels } from "@/lib/content";

// Verification status in the map's own grammar: a filled station is built
// (verified), a hollow one is awaiting confirmation, a dashed one is planned.
export function StationMark({ status, color = "currentColor", size = 14 }) {
  const r = size / 2 - 2;
  const c = size / 2;
  if (status === "verified") {
    return (
      <svg width={size} height={size} aria-hidden="true" className="shrink-0">
        <circle cx={c} cy={c} r={r} fill={color} stroke={color} strokeWidth="3" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} aria-hidden="true" className="shrink-0">
      <circle
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeDasharray={status === "future-possibility" ? "3 3" : undefined}
      />
    </svg>
  );
}

export default function Status({ status, className = "" }) {
  return (
    <p className={`flex items-center gap-2 text-[14px] leading-snug ${className}`}>
      <StationMark status={status} />
      <span>{statusLabels[status]}</span>
    </p>
  );
}
