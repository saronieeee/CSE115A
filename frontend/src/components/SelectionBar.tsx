import React from "react";
import { createPortal } from "react-dom";
import "./SelectionBar.css";

type SelectionBarProps = {
  count: number;
  onClear: () => void;
  onCreate: () => void;
  disabled?: boolean;
  /** distance from the very bottom of the viewport so we float above your footer */
  bottomOffset?: number; // px; default 80
};

const SelectionBar: React.FC<SelectionBarProps> = ({
  count,
  onClear,
  onCreate,
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
            className="selection-fab__clear"
            onClick={onClear}
          >
            Clear
          </button>
          <button
            type="button"
            className="selection-fab__create"
            onClick={onCreate}
            disabled={disabled}
          >
            Create outfit
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default SelectionBar;
