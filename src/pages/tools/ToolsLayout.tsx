import { Outlet } from "react-router-dom";
import { ToolsNav } from "../../components/tools/ToolsNav";
import "./ToolsLayout.scss";

export function ToolsLayout() {
  return (
    <section className="tools-layout" aria-label="Tools">
      <ToolsNav />
      <Outlet />
    </section>
  );
}
