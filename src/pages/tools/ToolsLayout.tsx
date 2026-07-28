import { Outlet } from "react-router-dom";
import "./ToolsLayout.scss";

export function ToolsLayout() {
  return (
    <section className="tools-layout" aria-label="Tools">
      <Outlet />
    </section>
  );
}
