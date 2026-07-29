import { useState, useRef, useEffect } from "react";
import type { Recipe } from "../../api/client";
import {
  downloadWhiskRecipeFile,
  downloadRecipePlainText,
  downloadRecipePdf,
} from "../../utils/recipeTransfer";
import { toastSuccess, toastError } from "../../store/toastStore";
import "./RecipeExportMenu.scss";

interface RecipeExportMenuProps {
  recipe: Recipe;
  className?: string;
  variant?: "default" | "compact" | "card";
  dropdownAlign?: "left" | "right";
  onOpenChange?: (open: boolean) => void;
}

export function RecipeExportMenu({
  recipe,
  className = "",
  variant = "default",
  dropdownAlign = "right",
  onOpenChange,
}: RecipeExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleWhiskFile = () => {
    downloadWhiskRecipeFile(recipe);
    toastSuccess("Recipe file downloaded.");
    setOpen(false);
  };

  const handlePlainText = async () => {
    downloadRecipePlainText(recipe);
    toastSuccess("Plain text recipe downloaded.");
    setOpen(false);
  };

  const handlePdf = async () => {
    setExportingPdf(true);
    try {
      await downloadRecipePdf(recipe);
      toastSuccess("PDF downloaded.");
      setOpen(false);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to create PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div
      className={`recipe-export-menu recipe-export-menu--${variant} ${className}`.trim()}
      ref={wrapRef}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="recipe-export-menu__trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Export
      </button>
      {open && (
        <div
          className={`recipe-export-menu__dropdown recipe-export-menu__dropdown--${dropdownAlign}`}
          role="menu"
        >
          <button type="button" role="menuitem" onClick={handleWhiskFile}>
            Whisk file (.whisk.json)
          </button>
          <button type="button" role="menuitem" onClick={() => void handlePlainText()}>
            Plain text (.txt)
          </button>
          <button type="button" role="menuitem" onClick={() => void handlePdf()} disabled={exportingPdf}>
            {exportingPdf ? "Creating PDF…" : "PDF (.pdf)"}
          </button>
        </div>
      )}
    </div>
  );
}
