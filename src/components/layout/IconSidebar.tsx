import { NavLink } from "react-router-dom";
import { useMenu } from "../../context/menuContextShared";
import { IconHamburger } from "../ui/IconHamburger";
import {
  IconHome,
  IconConverter,
  IconTools,
  IconRecipe,
  IconDocs,
  IconCapabilities,
  IconShoppingList,
  IconSettings,
  IconShield,
  IconInfo,
} from "../ui/SidebarIcons";
import "./IconSidebar.scss";

const mainNavItems = [
  { to: "/", label: "Home", icon: IconHome },
  { to: "/converter", label: "Converter", icon: IconConverter },
  { to: "/tools", label: "Tools", icon: IconTools },
  { to: "/recipes", label: "Recipes", icon: IconRecipe },
  { to: "/shopping-list", label: "Shopping list", icon: IconShoppingList },
  { to: "/settings", label: "Settings", icon: IconSettings },
];

const secondaryNavItems = [
  { to: "/how-it-works", label: "How it works", icon: IconInfo },
  { to: "/privacy", label: "Privacy", icon: IconShield },
  { to: "/capabilities", label: "Capabilities", icon: IconCapabilities },
  { to: "/docs", label: "Documentation", icon: IconDocs },
];

export function IconSidebar() {
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useMenu();

  const handleLinkClick = () => {
    closeMobileMenu();
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  };

  return (
    <aside
      className={`icon-sidebar ${isMobileMenuOpen ? "icon-sidebar--menu-open" : ""}`}
      role="complementary"
      aria-label="Icon navigation"
    >
      <button
        type="button"
        className="hamburger-button icon-sidebar__hamburger"
        onClick={toggleMobileMenu}
        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        aria-expanded={isMobileMenuOpen}
      >
        <IconHamburger open={isMobileMenuOpen} />
      </button>
      <nav className="icon-sidebar__nav" aria-label="Main">
        <ul className="icon-sidebar__list">
          {mainNavItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `icon-sidebar__link ${isActive ? "icon-sidebar__link--active" : ""}`
                }
                end={to === "/"}
                title={label}
                aria-label={label}
                onClick={handleLinkClick}
              >
                <Icon />
              </NavLink>
            </li>
          ))}
        </ul>
        <ul className="icon-sidebar__list icon-sidebar__list--secondary">
          {secondaryNavItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `icon-sidebar__link ${isActive ? "icon-sidebar__link--active" : ""}`
                }
                title={label}
                aria-label={label}
                onClick={handleLinkClick}
              >
                <Icon />
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
