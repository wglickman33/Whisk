import { Link } from "react-router-dom";
import { TOOL_ITEMS } from "../../components/tools/ToolsNav";
import "./ToolsHomePage.scss";

export function ToolsHomePage() {
  return (
    <div className="tools-home">
      <p className="tools-home__intro">
        Free image editing, QR codes, markdown preview, and more. No account needed.
      </p>
      <div className="tools-home__grid">
        {TOOL_ITEMS.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="tools-home__card">
            <span className="tools-home__card-icon" aria-hidden>
              <Icon />
            </span>
            <span className="tools-home__card-label">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
