import { NavLink } from "react-router-dom";
import {
  IconCrop,
  IconResize,
  IconCompress,
  IconRemoveBg,
  IconSharpen,
  IconColorPicker,
  IconQR,
  IconMarkdown,
} from "../ui/ToolsIcons";
import "./ToolsNav.scss";

export interface ToolDef {
  to: string;
  label: string;
  icon: React.ComponentType;
}

export const TOOL_ITEMS: ToolDef[] = [
  { to: "/tools/crop", label: "Crop", icon: IconCrop },
  { to: "/tools/resize", label: "Resize", icon: IconResize },
  { to: "/tools/compress", label: "Compress", icon: IconCompress },
  { to: "/tools/remove-bg", label: "Remove BG", icon: IconRemoveBg },
  { to: "/tools/sharpen", label: "Sharpen", icon: IconSharpen },
  { to: "/tools/color-picker", label: "Color Picker", icon: IconColorPicker },
  { to: "/tools/qr", label: "QR Generator", icon: IconQR },
  { to: "/tools/markdown", label: "Markdown", icon: IconMarkdown },
];

export function ToolsNav() {
  return (
    <nav className="tools-nav" role="tablist" aria-label="Tool type">
      {TOOL_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `tools-nav__link ${isActive ? "tools-nav__link--active" : ""}`
          }
          role="tab"
        >
          <span className="tools-nav__icon" aria-hidden>
            <Icon />
          </span>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
