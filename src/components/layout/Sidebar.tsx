import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useSidebarStore } from "../../store/sidebarStore";
import { useSettingsStore } from "../../store/settingsStore";
import { useAuthStore } from "../../store/authStore";
import { useAuthModalStore } from "../../store/authModalStore";
import { useMenu } from "../../context/menuContextShared";
import { BP_DESKTOP } from "../../constants/breakpoints";
import { whiskLogoWhite, whiskLogoCharcoal } from "../../assets/logos";
import {
  IconHome,
  IconConverter,
  IconTools,
  IconRecipe,
  IconDocs,
  IconUser,
  IconLogin,
  IconLogout,
  IconShoppingList,
} from "../ui/SidebarIcons";
import { IconMoon, IconSun } from "../ui/AnimatedIcon";
import { IconHamburger } from "../ui/IconHamburger";

function useWindowWidth(): number {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}

const mainNavItems = [
  { to: "/", label: "Home", icon: IconHome },
  { to: "/converter", label: "Converter", icon: IconConverter },
  { to: "/tools", label: "Tools", icon: IconTools },
  { to: "/recipes", label: "Recipes", icon: IconRecipe },
  { to: "/shopping-list", label: "Shopping list", icon: IconShoppingList },
];

const secondaryNavItems = [{ to: "/docs", label: "Documentation", icon: IconDocs }];

export function Sidebar() {
  const width = useWindowWidth();
  const isDesktop = width > BP_DESKTOP;
  const expanded = useSidebarStore((s) => s.expanded);
  const toggle = useSidebarStore((s) => s.toggle);
  const { closeMobileMenu, isMobileMenuOpen } = useMenu();
  const theme = useSettingsStore((s) => s.theme);
  const toggleTheme = useSettingsStore((s) => s.toggleTheme);
  const { user, isSignedIn, signOut } = useAuthStore();
  const openAuthModal = useAuthModalStore((s) => s.openAuthModal);

  const showExpanded = isDesktop ? expanded : true;

  const handleLinkClick = () => {
    if (!isDesktop) closeMobileMenu();
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  const renderNavLink = (
    to: string,
    label: string,
    Icon: React.ComponentType
  ) => (
    <NavLink
      to={to}
      className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
      end={to === "/"}
      title={!showExpanded ? label : undefined}
      aria-label={label}
      onClick={handleLinkClick}
    >
      <span className="sidebar-link__icon">
        <Icon />
      </span>
      {showExpanded && <span className="sidebar-link__label">{label}</span>}
    </NavLink>
  );

  return (
    <aside
      className={`sidebar app-sidebar ${showExpanded ? "app-sidebar--expanded" : "app-sidebar--collapsed"} ${!isDesktop ? "app-sidebar--overlay" : ""} ${!isDesktop && isMobileMenuOpen ? "app-sidebar--overlay-open" : ""}`}
      role="complementary"
      aria-label="Site navigation"
    >
      <div className="sidebar-header">
        {showExpanded && (
          <Link to="/" className="sidebar-brand" aria-label="Whisk home" onClick={handleLinkClick}>
            <img
              src={whiskLogoWhite}
              alt=""
              className="sidebar-brand__logo sidebar-brand__logo--white"
              width={28}
              height={28}
            />
            <img
              src={whiskLogoCharcoal}
              alt=""
              className="sidebar-brand__logo sidebar-brand__logo--charcoal"
              width={28}
              height={28}
            />
            <span className="sidebar-brand__text">Whisk</span>
          </Link>
        )}
        <button
          type="button"
          className={`sidebar-toggle ${showExpanded ? "sidebar-toggle--open" : ""}`}
          onClick={isDesktop ? toggle : closeMobileMenu}
          aria-label={isDesktop ? (showExpanded ? "Collapse sidebar" : "Expand sidebar") : "Close menu"}
          title={isDesktop ? (showExpanded ? "Collapse" : "Expand") : "Close"}
        >
          <IconHamburger open={showExpanded} />
        </button>
      </div>
      <div className="sidebar-nav-wrap">
        <nav className="sidebar-section" aria-label="Main">
          <ul className="sidebar-list">
            {mainNavItems.map(({ to, label, icon: Icon }) => (
              <li key={to}>{renderNavLink(to, label, Icon)}</li>
            ))}
          </ul>
        </nav>
        <div className="sidebar-spacer" />
        <nav className="sidebar-section sidebar-section--secondary" aria-label="Documentation">
          {showExpanded && <span className="sidebar-section__label">Documentation</span>}
          <ul className="sidebar-list">
            {secondaryNavItems.map(({ to, label, icon: Icon }) => (
              <li key={to}>{renderNavLink(to, label, Icon)}</li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="sidebar-actions">
        <div className="sidebar-actions__grid">
          {!isSignedIn && (
            <button
              type="button"
              className="sidebar-btn sidebar-btn--primary"
              aria-label="Sign in"
              title="Sign in"
              onClick={openAuthModal}
            >
              {!showExpanded && <IconLogin />}
              {showExpanded && <span>Sign In</span>}
            </button>
          )}
          {isSignedIn && (
            <button
              type="button"
              className="sidebar-btn sidebar-btn--signout"
              onClick={() => {
                signOut();
                handleLinkClick();
              }}
              aria-label="Sign out"
              title="Sign out"
            >
              {!showExpanded && <IconLogout />}
              {showExpanded && <span>Log Out</span>}
            </button>
          )}
          <button
            type="button"
            className="sidebar-btn sidebar-btn--theme"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            title={theme === "light" ? "Dark mode" : "Light mode"}
          >
            <span className="sidebar-btn__icon" aria-hidden>
              <AnimatePresence mode="wait">
                {theme === "light" ? (
                  <IconMoon key="moon" />
                ) : (
                  <IconSun key="sun" />
                )}
              </AnimatePresence>
            </span>
          </button>
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-footer__card">
          <div className="sidebar-footer__user">
            <span className="sidebar-footer__avatar">
              <IconUser />
            </span>
            {showExpanded && (
              <div className="sidebar-footer__info">
                <span className="sidebar-footer__welcome">
                  {isSignedIn ? "Welcome back," : ""}
                </span>
                <span className="sidebar-footer__name">
                  {isSignedIn ? user?.name ?? user?.email ?? "User" : "Guest"}
                </span>
                <span className="sidebar-footer__role">
                  {!isSignedIn && "Sign in"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
