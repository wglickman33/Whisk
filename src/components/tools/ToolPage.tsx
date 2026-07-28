import type { ReactNode } from "react";
import { getToolById } from "../../constants/tools";
import { ToolsBreadcrumb } from "./shell/ToolsBreadcrumb";
import { ToolSwitcher } from "./shell/ToolSwitcher";
import { StepIndicator } from "./shell/StepIndicator";
import { RelatedTools } from "./shell/RelatedTools";
import "./ToolPage.scss";

export interface ToolPrimaryAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface ToolPageProps {
  toolId: string;
  activeStep?: number;
  primaryAction?: ToolPrimaryAction;
  children: ReactNode;
}

export function ToolPage({ toolId, activeStep = 0, primaryAction, children }: ToolPageProps) {
  const tool = getToolById(toolId);
  if (!tool) {
    return <p className="tool-page__error">This tool could not be found.</p>;
  }

  return (
    <article className="tool-page">
      <div className="tool-page__toolbar">
        <ToolsBreadcrumb toolId={toolId} />
        <ToolSwitcher currentToolId={toolId} />
      </div>

      <header className="tool-page__header">
        <h1 className="tool-page__title">{tool.label}</h1>
        <p className="tool-page__desc">{tool.description}</p>
      </header>

      <StepIndicator steps={tool.steps} activeStep={activeStep} />

      <div className="tool-page__body">{children}</div>

      {primaryAction && (
        <div className="tool-page__action">
          <button
            type="button"
            className="tool-page__action-btn"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
          >
            {primaryAction.label}
          </button>
        </div>
      )}

      <RelatedTools toolId={toolId} />
    </article>
  );
}
