import "./FormatChipList.scss";

interface FormatChipListProps {
  items: readonly string[];
  variant?: "supported" | "unsupported" | "neutral";
  id?: string;
}

export function FormatChipList({ items, variant = "supported", id }: FormatChipListProps) {
  if (!items.length) return null;

  return (
    <ul className={`format-chip-list format-chip-list--${variant}`} id={id}>
      {items.map((item) => (
        <li key={item} className="format-chip-list__chip">
          {item}
        </li>
      ))}
    </ul>
  );
}
