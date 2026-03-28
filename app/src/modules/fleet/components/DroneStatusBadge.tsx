const COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  maintenance: "bg-yellow-100 text-yellow-700",
  retired: "bg-gray-100 text-gray-600",
  pending_registration: "bg-blue-100 text-blue-700",
};

const LABELS: Record<string, string> = {
  active: "Activo",
  maintenance: "Mantenimiento",
  retired: "Retirado",
  pending_registration: "Pendiente",
};

export default function DroneStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${COLORS[status] ?? "bg-gray-100 text-gray-600"}`}>
      {LABELS[status] ?? status}
    </span>
  );
}
