import { ShieldIcon, PlaneLandingIcon, PlaneIcon, LockIcon } from "@/lib/icons";
import type { LucideProps } from "@/lib/icons";
import type { CoordinationBody } from "../logic";

export const BODY_ICONS: Record<CoordinationBody, React.ComponentType<LucideProps>> = {
  mi: ShieldIcon,
  helipuerto: PlaneLandingIcon,
  aeropuerto: PlaneIcon,
  defensa: LockIcon,
};
