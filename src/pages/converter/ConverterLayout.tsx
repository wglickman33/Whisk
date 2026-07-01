import { Outlet } from "react-router-dom";
import { ConverterNav } from "../../components/converter/ConverterNav";
import "./ConverterLayout.scss";

export function ConverterLayout() {
  return (
    <section className="converter-layout" aria-label="Converter">
      <ConverterNav />
      <Outlet />
    </section>
  );
}
