import "./StepIndicator.scss";

type Props = {
  steps: string[];
  activeStep: number;
};

export function StepIndicator({ steps, activeStep }: Props) {
  if (steps.length === 0) return null;

  return (
    <ol className="step-indicator" aria-label="Steps">
      {steps.map((step, i) => {
        const state = i < activeStep ? "done" : i === activeStep ? "active" : "upcoming";
        return (
          <li
            key={step}
            className={`step-indicator__step step-indicator__step--${state}`}
            aria-current={state === "active" ? "step" : undefined}
          >
            <span className="step-indicator__num" aria-hidden>
              {i + 1}
            </span>
            <span className="step-indicator__label">{step}</span>
            {i < steps.length - 1 && (
              <span className="step-indicator__arrow" aria-hidden>
                →
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
