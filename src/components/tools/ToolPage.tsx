import type { ReactNode } from "react";
import "./ToolPage.scss";

interface ToolPageProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function ToolPage({ title, description, children }: ToolPageProps) {
  return (
    <div className="tool-page">
      <header className="tool-page__header">
        <h1 className="tool-page__title">{title}</h1>
        <p className="tool-page__desc">{description}</p>
      </header>
      <div className="tool-page__body">{children}</div>
    </div>
  );
}
