const STATUS_HEX: Record<string, string> = {
  active:               "#00D97E",
  maintenance:          "#F5C518",
  retired:              "#3A5570",
  pending_registration: "#4A8FD4",
};

const LABELS: Record<string, string> = {
  active: "Activo", maintenance: "Mantenimiento", retired: "Retirado", pending_registration: "Pendiente",
};

export default function DroneStatusBadge({ status }: { status: string }) {
  const color = STATUS_HEX[status] ?? "#3A5570";
  return (
    <span
      style={{
        background: `${color}18`,
        color,
        border: `1px solid ${color}40`,
        display: "inline-block",
        borderRadius: "9999px",
        padding: "1px 10px",
        fontSize: "11px",
        fontWeight: 600,
      }}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
