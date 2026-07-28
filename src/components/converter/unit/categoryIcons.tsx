import type { ReactElement, ReactNode } from "react";
import type { UnitCategory } from "../../../converters/units/unitUtils";

type IconProps = { className?: string };

function IconBase({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

const ICONS: Record<UnitCategory, (props: IconProps) => ReactElement> = {
  volume: (p) => (
    <IconBase {...p}>
      <path d="M8 4h8v3a4 4 0 0 1-8 0V4z" />
      <path d="M7 20h10a2 2 0 0 0 2-2v-1H5v1a2 2 0 0 0 2 2z" />
      <path d="M9 7v2M15 7v2" />
    </IconBase>
  ),
  weight: (p) => (
    <IconBase {...p}>
      <path d="M12 3v4" />
      <path d="M8 7h8" />
      <path d="M6 10l-2 10h16l-2-10H6z" />
      <path d="M9 14h6" />
    </IconBase>
  ),
  length: (p) => (
    <IconBase {...p}>
      <path d="M4 12h16" />
      <path d="M6 10v4M10 10v4M14 10v4M18 10v4" />
    </IconBase>
  ),
  area: (p) => (
    <IconBase {...p}>
      <rect x="4" y="6" width="16" height="12" rx="1" />
      <path d="M4 12h16M12 6v12" />
    </IconBase>
  ),
  time: (p) => (
    <IconBase {...p}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </IconBase>
  ),
  speed: (p) => (
    <IconBase {...p}>
      <path d="M4 16c2-4 6-6 8-6s6 2 8 6" />
      <path d="M12 10v6l3 2" />
    </IconBase>
  ),
  pressure: (p) => (
    <IconBase {...p}>
      <path d="M12 4v16" />
      <path d="M8 8h8M7 12h10M6 16h12" />
    </IconBase>
  ),
  energy: (p) => (
    <IconBase {...p}>
      <path d="M13 3L7 14h6l-1 7 8-14h-7z" />
    </IconBase>
  ),
  data: (p) => (
    <IconBase {...p}>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </IconBase>
  ),
  temp: (p) => (
    <IconBase {...p}>
      <path d="M14 4a2 2 0 0 0-4 0v10a4 4 0 1 0 4 0V4z" />
      <path d="M12 16v2" />
    </IconBase>
  ),
};

export function CategoryIcon({
  category,
  className,
}: {
  category: UnitCategory;
  className?: string;
}) {
  const Icon = ICONS[category];
  return <Icon className={className} />;
}
