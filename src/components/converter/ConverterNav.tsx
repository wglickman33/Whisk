import { NavLink } from "react-router-dom";
import { IconFile, IconUnit } from "../ui/ConverterIcons";
import "./ConverterNav.scss";

const CONVERTER_TABS = [
  { to: "/converter/file", label: "File Converter", icon: IconFile },
  { to: "/converter/unit", label: "Unit Converter", icon: IconUnit },
] as const;

export function ConverterNav() {
  return (
    <nav className="converter-nav" role="tablist" aria-label="Converter type">
      {CONVERTER_TABS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `converter-nav__link ${isActive ? "converter-nav__link--active" : ""}`
          }
          role="tab"
        >
          <span className="converter-nav__icon" aria-hidden>
            <Icon />
          </span>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
