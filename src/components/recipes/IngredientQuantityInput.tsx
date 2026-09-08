import { useEffect, useState } from "react";
import { formatQuantity } from "../../utils/formatQuantity";
import { parseQuantity } from "../../utils/parseQuantity";

const FRACTION_SUGGESTIONS = [
  "1/8",
  "1/4",
  "1/3",
  "1/2",
  "2/3",
  "3/4",
  "1 1/2",
  "1 1/3",
  "1 1/4",
  "2 1/2",
];

interface IngredientQuantityInputProps {
  id?: string;
  value: number;
  onChange: (quantity: number) => void;
  className?: string;
  listId?: string;
}

export function IngredientQuantitySuggestions({ listId }: { listId: string }) {
  return (
    <datalist id={listId}>
      {FRACTION_SUGGESTIONS.map((option) => (
        <option key={option} value={option} />
      ))}
    </datalist>
  );
}

export function IngredientQuantityInput({
  id,
  value,
  onChange,
  className,
  listId,
}: IngredientQuantityInputProps) {
  const [text, setText] = useState(() => (value > 0 ? formatQuantity(value) : ""));

  useEffect(() => {
    setText(value > 0 ? formatQuantity(value) : "");
  }, [value]);

  const commit = (raw: string) => {
    const parsed = parseQuantity(raw);
    if (parsed === null) {
      setText(value > 0 ? formatQuantity(value) : "");
      return;
    }
    onChange(parsed);
    setText(parsed > 0 ? formatQuantity(parsed) : "");
  };

  return (
    <>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        className={className}
        placeholder="Qty"
        value={text}
        list={listId}
        autoComplete="off"
        onChange={(e) => setText(e.target.value)}
        onBlur={() => commit(text)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(text);
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
    </>
  );
}
