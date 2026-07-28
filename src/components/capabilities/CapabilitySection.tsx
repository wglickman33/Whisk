import { FormatChipList } from "./FormatChipList";
import "./CapabilitySection.scss";

interface CapabilitySectionProps {
  id?: string;
  title: string;
  note?: string;
  items: readonly string[];
  variant?: "supported" | "unsupported" | "neutral";
}

export function CapabilitySection({
  id,
  title,
  note,
  items,
  variant = "supported",
}: CapabilitySectionProps) {
  return (
    <section className="capability-section" id={id} aria-labelledby={id ? `${id}-title` : undefined}>
      <h2 className="capability-section__title" id={id ? `${id}-title` : undefined}>
        {title}
      </h2>
      {note && <p className="capability-section__note">{note}</p>}
      <FormatChipList items={items} variant={variant} />
    </section>
  );
}
