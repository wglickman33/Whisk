import { Link } from "react-router-dom";
import { getRelatedTools } from "../../../constants/tools";
import "./RelatedTools.scss";

type Props = {
  toolId: string;
};

export function RelatedTools({ toolId }: Props) {
  const related = getRelatedTools(toolId);
  if (related.length === 0) return null;

  return (
    <footer className="related-tools">
      <p className="related-tools__heading">You might also need</p>
      <ul className="related-tools__list">
        {related.map((tool) => (
          <li key={tool.id}>
            <Link to={tool.route}>{tool.label}</Link>
          </li>
        ))}
      </ul>
    </footer>
  );
}
