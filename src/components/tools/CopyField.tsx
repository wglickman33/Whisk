import { toastSuccess, toastError } from "../../store/toastStore";
import "./CopyField.scss";

type Props = {
  label: string;
  value: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  rows?: number;
  placeholder?: string;
  id?: string;
  error?: string;
};

export function CopyField({
  label,
  value,
  readOnly = false,
  onChange,
  rows = 6,
  placeholder,
  id,
  error,
}: Props) {
  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard
      .writeText(value)
      .then(() => toastSuccess("Copied to clipboard."))
      .catch(() => toastError("Copy failed. Your browser may not allow clipboard access."));
  };

  return (
    <div className="copy-field">
      <div className="copy-field__header">
        <label className="copy-field__label" htmlFor={id}>
          {label}
        </label>
        {value && (
          <button type="button" className="copy-field__copy" onClick={handleCopy}>
            Copy
          </button>
        )}
      </div>
      <textarea
        id={id}
        className={`copy-field__textarea ${error ? "copy-field__textarea--error" : ""}`}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        spellCheck={false}
      />
      {error && (
        <p className="copy-field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
