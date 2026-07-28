import { Link } from "react-router-dom";
import type { ToolDef } from "../../../constants/tools";
import "./ToolCard.scss";

type Props = {
  tool: ToolDef;
  variant?: "default" | "popular";
};

export function ToolCard({ tool, variant = "default" }: Props) {
  const Icon = tool.icon;
  return (
    <Link
      to={tool.route}
      className={`tool-card tool-card--${variant}`}
    >
      <span className="tool-card__icon" aria-hidden>
        <Icon />
      </span>
      <span className="tool-card__label">{tool.label}</span>
      <span className="tool-card__desc">{tool.description}</span>
    </Link>
  );
}
