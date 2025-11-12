import React from "react";
import { createPortal } from "react-dom";
import "./SelectionBar.css";

type SelectionBarProps = {
  count: number;
  onClear: () => void;
  onCreate: () => void;
  onVirtualTryOn?: () => void;
  onAddFavorites?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
  /** distance from the very bottom of the viewport so we float above your footer */
  bottomOffset?: number; // px; default 80
};

const SelectionBar: React.FC<SelectionBarProps> = ({
  count,
  onClear,
  onCreate,
  onVirtualTryOn,
  onAddFavorites,
  onDelete,
  disabled = false,
  bottomOffset = 80,
}) => {
  const content = (
    <div
      className="selection-fab-wrap"
      style={{
        // floating wrapper; pointer-events off so it doesn't block the page
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom, 0px))`,
        zIndex: 10000,
        pointerEvents: "none",
      }}
      aria-hidden={false}
      role="region"
      aria-label="Selection actions"
    >
      <div className="selection-fab" role="group" aria-label="Outfit actions">
        <span className="selection-fab__count">{count} selected</span>

        <div className="selection-fab__actions">
          <button
            type="button"
            className="selection-fab__button"
            onClick={onVirtualTryOn}
            aria-label="Virtual try-on"
          >
            <span className="selection-fab__label">Try-On</span>
          </button>

          <button
            type="button"
            className="selection-fab__button"
            onClick={onCreate}
            aria-label="Create outfit"
          >
            <span className="selection-fab__label">Save Outfit</span>
          </button>

          <button
            type="button"
            className="selection-fab__button"
            onClick={onAddFavorites}
            aria-label="Add to favorites"
          >
            <span className="selection-fab__label">Favorite</span>
          </button>

          <button
            type="button"
            className="selection-fab__button selection-fab__destructive"
            onClick={onDelete}
            aria-label="Delete selection"
          >
            <span className="selection-fab__label">Delete</span>
          </button>

          <button
            type="button"
            className="selection-fab__button selection-fab__clear"
            onClick={onClear}
            aria-label="Clear selection"
          >
            <span className="selection-fab__icon">✕</span>
            <span className="selection-fab__label">Clear</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default SelectionBar;
