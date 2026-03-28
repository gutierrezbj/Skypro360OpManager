import { STATUS_LABELS, STATUS_COLORS } from "../state-machine";

export default function MissionStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? "bg-gray-100 text-gray-600"}`}
    >
      {STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status}
    </span>
  );
}
