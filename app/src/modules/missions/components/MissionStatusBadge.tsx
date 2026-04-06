import { STATUS_LABELS, STATUS_COLORS } from "../state-machine";

export default function MissionStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-md px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? "bg-[#3A5570]/20 text-[#6A9AB0] border border-[#3A5570]/40"}`}
    >
      {STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status}
    </span>
  );
}
