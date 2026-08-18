import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { SkipNav } from "./SkipNav";
import { Sidebar } from "./Sidebar";
import { IconSidebar } from "./IconSidebar";
import { MobileHeader } from "./MobileHeader";
import { AuthModal } from "../auth/AuthModal";
import { NotificationToastContainer } from "../ui/NotificationToast";
import { FloatingAppsMenu } from "../ui/FloatingAppsMenu";
import { SousWidget } from "../sous/SousWidget";
import { useShoppingListStream } from "../../hooks/useShoppingListStream";
import { MenuProvider, useMenu } from "../../context/MenuContext";
import { useSidebarStore } from "../../store/sidebarStore";
import { BP_DESKTOP, BP_TABLET } from "../../constants/breakpoints";
import "./Layout.scss";

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

function LayoutInner() {
  const width = useWindowWidth();
  const { isMobileMenuOpen, closeMobileMenu } = useMenu();
  const expanded = useSidebarStore((s) => s.expanded);
  useShoppingListStream();

  const isDesktop = width > BP_DESKTOP;
  const isTablet = width > BP_TABLET && width <= BP_DESKTOP;
  const isMobile = width <= BP_TABLET;

  let mainContainerClass = "main-container ";
  if (isDesktop) {
    mainContainerClass += expanded ? "main-container--desktop-expanded" : "main-container--desktop-collapsed";
  } else if (isTablet) {
    mainContainerClass += "main-container--tablet";
  } else {
    mainContainerClass += "main-container--mobile";
  }

  let sidebarWidthPx = 0;
  if (isDesktop) sidebarWidthPx = expanded ? 240 : 60;
  else if (isTablet) sidebarWidthPx = 60;

  return (
    <div className="app-layout">
      <SkipNav />
      {!isDesktop && isMobileMenuOpen && (
        <button
          type="button"
          className="app-drawer-backdrop"
          onClick={closeMobileMenu}
          onKeyDown={(e) => e.key === "Escape" && closeMobileMenu()}
          aria-label="Close menu"
        />
      )}
      <Sidebar />
      <IconSidebar />
      <div
        className={mainContainerClass}
        style={{ "--sidebar-width": `${sidebarWidthPx}px` } as React.CSSProperties}
      >
        <main className="app-main" id="main-content" tabIndex={-1}>
          {isMobile && <MobileHeader />}
          <div className="app-content" role="main">
            <Outlet />
          </div>
        </main>
      </div>
      <AuthModal />
      <NotificationToastContainer />
      <SousWidget />
      <FloatingAppsMenu />
    </div>
  );
}

export function Layout() {
  return (
    <MenuProvider>
      <LayoutInner />
    </MenuProvider>
  );
}
