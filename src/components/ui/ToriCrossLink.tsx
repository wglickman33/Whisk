import { toriLogo } from "../../assets/logos";
import { getToriUrl } from "../../utils/toriUrl";
import "./ToriCrossLink.scss";

interface ToriCrossLinkProps {
  variant?: "card" | "inline";
}

export function ToriCrossLink({ variant = "card" }: ToriCrossLinkProps) {
  const href = getToriUrl();

  if (variant === "inline") {
    return (
      <a
        className="tori-cross-link tori-cross-link--inline"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open Tori"
      >
        <img src={toriLogo} alt="" className="tori-cross-link__mark" />
        Tori
      </a>
    );
  }

  return (
    <aside className="tori-cross-link tori-cross-link--card">
      <div className="tori-cross-link__brand">
        <span className="tori-cross-link__logo-wrap">
          <img src={toriLogo} alt="" className="tori-cross-link__logo" />
        </span>
        <div className="tori-cross-link__copy">
          <h2 className="tori-cross-link__title">Explore Tori</h2>
          <p className="tori-cross-link__body">
            Household inventory for the same kitchen. Separate app, no shared login.
          </p>
        </div>
      </div>
      <a
        className="tori-cross-link__cta"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        Open Tori
      </a>
    </aside>
  );
}
