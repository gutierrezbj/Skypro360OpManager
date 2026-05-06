/**
 * OpsManager Icon System — Skypro360
 *
 * Thin wrappers over lucide-react + custom SVG assets.
 * All icons accept className for size/color via Tailwind.
 *
 * Usage:
 *   import { DroneIcon, MissionIcon } from "@/lib/icons"
 *   <DroneIcon className="h-5 w-5 text-blue-500" />
 */

import type { SVGProps } from "react";

/** Custom quadcopter icon — top-down view, 4 rotors */
export function DroneIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Central body */}
      <rect x="9" y="9" width="6" height="6" rx="1" />
      {/* Arms */}
      <line x1="9" y1="9" x2="5.5" y2="5.5" />
      <line x1="15" y1="9" x2="18.5" y2="5.5" />
      <line x1="9" y1="15" x2="5.5" y2="18.5" />
      <line x1="15" y1="15" x2="18.5" y2="18.5" />
      {/* Rotors */}
      <circle cx="4" cy="4" r="2" />
      <circle cx="20" cy="4" r="2" />
      <circle cx="4" cy="20" r="2" />
      <circle cx="20" cy="20" r="2" />
      {/* Camera */}
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export {
  // Navigation / map
  Compass       as MapIcon,
  Radar         as RadarIcon,
  Navigation    as NavigationIcon,
  MapPin        as MapPinIcon,
  Route         as RouteIcon,
  LocateFixed   as LocateIcon,

  // Drone / flight
  Plane         as PlaneIcon,
  PlaneLanding  as PlaneLandingIcon,
  Wind          as WindIcon,
  Gauge         as GaugeIcon,

  // People / pilots
  UserCheck     as PilotIcon,
  Users         as PilotsIcon,
  User          as UserIcon,
  ContactRound  as ContactIcon,

  // Missions
  Target        as MissionIcon,
  Crosshair     as CrosshairIcon,
  Flag          as FlagIcon,
  Goal          as GoalIcon,
  ClipboardList as ChecklistIcon,

  // Compliance / docs
  ShieldCheck   as ComplianceIcon,
  Shield        as ShieldIcon,
  BadgeCheck    as BadgeCheckIcon,
  FileText      as DocumentIcon,
  FileBadge     as FileBadgeIcon,
  ScrollText    as ScrollIcon,
  Lock          as LockIcon,

  // Analytics / charts
  BarChart2     as AnalyticsIcon,
  ChartPie      as ChartPieIcon,
  TrendingUp    as TrendingUpIcon,
  Activity      as ActivityIcon,
  CircleGauge   as CircleGaugeIcon,

  // Status / alerts
  CircleCheck   as CheckCircleIcon,
  CircleX       as ErrorCircleIcon,
  CircleAlert   as AlertCircleIcon,
  TriangleAlert as AlertTriangleIcon,
  Clock         as ClockIcon,
  Timer         as TimerIcon,
  Hourglass     as HourglassIcon,

  // Battery / telemetry
  Battery       as BatteryIcon,
  BatteryLow    as BatteryLowIcon,
  BatteryCharging as BatteryChargingIcon,
  SatelliteDish as TelemetryIcon,
  Signal        as SignalIcon,
  Radio         as RadioIcon,

  // Weather
  Sun           as SunIcon,
  Sunrise       as SunriseIcon,
  Sunset        as SunsetIcon,
  Cloud         as CloudIcon,
  CloudRain     as CloudRainIcon,
  CloudSun      as CloudSunIcon,
  CloudLightning as ThunderstormIcon,
  Thermometer   as ThermometerIcon,
  Snowflake     as SnowflakeIcon,

  // UI general
  Plus          as PlusIcon,
  Pencil        as EditIcon,
  Trash2        as DeleteIcon,
  X             as CloseIcon,
  ChevronRight  as ChevronRightIcon,
  ChevronDown   as ChevronDownIcon,
  ChevronLeft   as ChevronLeftIcon,
  ArrowLeft     as ArrowLeftIcon,
  ArrowRight    as ArrowRightIcon,
  Search        as SearchIcon,
  Filter        as FilterIcon,
  Download      as DownloadIcon,
  Upload        as UploadIcon,
  RefreshCw     as RefreshIcon,
  Settings      as SettingsIcon,
  LogOut        as LogOutIcon,
  Bell          as BellIcon,
  Moon          as MoonIcon,
  Menu          as MenuIcon,
  MoreVertical  as MoreIcon,
  ExternalLink  as ExternalLinkIcon,
  Copy          as CopyIcon,
  Check         as CheckIcon,
  Info          as InfoIcon,
  HelpCircle    as HelpIcon,
  Eye           as EyeIcon,
  EyeOff        as EyeOffIcon,
  Calendar      as CalendarIcon,
  MapPinned     as MapPinnedIcon,
  Layers        as LayersIcon,
  Zap           as ZapIcon,
} from "lucide-react";

// Re-export lucide type for prop typing
export type { LucideProps } from "lucide-react";
