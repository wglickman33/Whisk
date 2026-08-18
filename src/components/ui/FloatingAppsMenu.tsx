import { useEffect, useId, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { whiskLogoAmber, toriLogo } from "../../assets/logos";
import { getToriUrl } from "../../utils/toriUrl";
import { useSousStore } from "../../store/sousStore";
import { toastInfo } from "../../store/toastStore";
import "./FloatingAppsMenu.scss";

function FabPlusIcon() {
  return (
    <svg className="floating-apps__fab-svg" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FabCloseIcon() {
  return (
    <svg className="floating-apps__fab-svg" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FloatingAppsMenu() {
  const toriHref = getToriUrl();
  const togglerId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<"none" | "tori">("none");
  const openWidget = useSousStore((s) => s.openWidget);
  const location = useLocation();

  useEffect(() => {
    if (!open && panel === "none") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPanel("none");
        setOpen(false);
      }
    };
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setPanel("none");
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, panel]);

  const closeAll = () => {
    setPanel("none");
    setOpen(false);
  };

  return (
    <nav
      ref={rootRef}
      className={`floating-apps${open ? " is-open" : ""}${panel !== "none" ? " has-panel" : ""}`}
      aria-label="Apps"
    >
      {panel === "tori" ? (
        <aside className="floating-apps__panel" aria-label="Tori">
          <div className="floating-apps__panel-top">
            <div className="floating-apps__panel-brand">
              <span className="floating-apps__panel-logo-wrap">
                <img src={toriLogo} alt="" className="floating-apps__panel-logo" />
              </span>
              <div>
                <p className="floating-apps__panel-eyebrow">Also from us</p>
                <p className="floating-apps__panel-title">Tori</p>
              </div>
            </div>
            <button type="button" className="floating-apps__panel-close" onClick={closeAll} aria-label="Close">
              <FabCloseIcon />
            </button>
          </div>
          <p className="floating-apps__panel-body">
            Household inventory for your pantry and fridge, a sibling app to Whisk.
          </p>
          <a
            className="floating-apps__panel-cta floating-apps__panel-cta--tori"
            href={toriHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeAll}
          >
            Open Tori
          </a>
        </aside>
      ) : null}

      <input
        type="checkbox"
        id={togglerId}
        className="floating-apps__toggler"
        checked={open}
        onChange={() => {
          setOpen((v) => !v);
          setPanel("none");
        }}
      />
      <label htmlFor={togglerId} className="floating-apps__fab" aria-label={open ? "Close apps menu" : "Open apps menu"}>
        <span className="floating-apps__fab-icon" aria-hidden>
          <FabPlusIcon />
        </span>
      </label>

      <ul className="floating-apps__list">
        <li className="floating-apps__item floating-apps__item--1">
          <button
            type="button"
            className="floating-apps__bubble floating-apps__bubble--tori"
            data-tooltip="Tori"
            aria-label="Open Tori"
            onClick={() => {
              setPanel("tori");
              setOpen(false);
            }}
          >
            <span className="floating-apps__bubble-mark">
              <img src={toriLogo} alt="" />
            </span>
          </button>
        </li>
        <li className="floating-apps__item floating-apps__item--2">
          <button
            type="button"
            className="floating-apps__bubble floating-apps__bubble--sous"
            data-tooltip="Sous AI"
            aria-label="Open Sous AI"
            onClick={() => {
              setPanel("none");
              setOpen(false);
              if (location.pathname === "/sous") {
                toastInfo("You're already in the full Sous AI view.", {
                  actionLabel: "Use widget on Home",
                  actionHref: "/",
                  onAction: openWidget,
                });
                return;
              }
              openWidget();
            }}
          >
            <img src={whiskLogoAmber} alt="" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
