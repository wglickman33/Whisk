import { Link } from "react-router-dom";
import { getToolById, TOOL_CATEGORY_LABELS } from "../../../constants/tools";
import "./ToolsBreadcrumb.scss";

type Props = {
  toolId: string;
};

export function ToolsBreadcrumb({ toolId }: Props) {
  const tool = getToolById(toolId);
  if (!tool) return null;

  const categoryLabel = TOOL_CATEGORY_LABELS[tool.category];

  return (
    <nav className="tools-breadcrumb" aria-label="Breadcrumb">
      <ol className="tools-breadcrumb__list">
        <li className="tools-breadcrumb__item">
          <Link to="/tools">Tools</Link>
        </li>
        <li className="tools-breadcrumb__item" aria-hidden>
          ›
        </li>
        <li className="tools-breadcrumb__item">
          <Link to={`/tools?category=${tool.category}`}>{categoryLabel}</Link>
        </li>
        <li className="tools-breadcrumb__item" aria-hidden>
          ›
        </li>
        <li className="tools-breadcrumb__item tools-breadcrumb__item--current" aria-current="page">
          {tool.label}
        </li>
      </ol>
    </nav>
  );
}
