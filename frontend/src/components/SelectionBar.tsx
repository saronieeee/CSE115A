import React from "react";
import { createPortal } from "react-dom";
import "./SelectionBar.css";

type SelectionBarProps = {
  count: number;
  onClear: () => void;
  onCreate: () => void;
  invalidMessage?: string | null;   // ⭐ NEW
  bottomOffset?: number;
};

const SelectionBar: React.FC<SelectionBarProps> = ({
  count,
  onClear,
  onCreate,
  invalidMessage = null,
  bottomOffset = 80,
}) => {
  const content = (
    <div
      className="selection-fab-wrap"
      style={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom, 0px))`,
        zIndex: 10000,
        pointerEvents: "none",
      }}
      aria-hidden={false}
    >
      <div className="selection-fab">
        <span className="selection-fab__count">{count} selected</span>

        <div className="selection-fab__actions">

          {/* Save Outfit */}
          <button
            type="button"
            className="selection-fab__button save"
            onClick={onCreate}
            aria-label="Create outfit"
          >
            <span className="selection-fab__label">Save Outfit</span>
          </button>

          {/* Clear */}
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
      
      {invalidMessage && (
        <div className="selection-fab__error">
          {invalidMessage}
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
};

export default SelectionBar;
