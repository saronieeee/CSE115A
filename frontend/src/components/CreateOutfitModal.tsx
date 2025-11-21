import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./CreateOutfitModal.css";

type Props = {
  open: boolean;
  defaultName?: string;
  onCancel: () => void;
  onSubmit: (name: string) => void;
};

const CreateOutfitModal: React.FC<Props> = ({
  open,
  defaultName = "",
  onCancel,
  onSubmit,
}) => {
  const [name, setName] = useState(defaultName);
  const dialogRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    // reset name from default when opening
    setName(defaultName);

    const t = setTimeout(() => nameRef.current?.focus(), 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, defaultName, onCancel]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  const body = (
    <div className="co-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="co-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="co-title"
        onClick={(e) => e.stopPropagation()}
        ref={dialogRef}
      >
        <h2 id="co-title" className="co-title">
          Save Outfit
        </h2>

        <form className="co-form" onSubmit={handleSubmit}>
          <label className="co-label">
            <span>Outfit name</span>
            <input
              ref={nameRef}
              className="co-input"
              type="text"
              value={name}
              placeholder=""
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <div className="co-actions">
            <button
              type="button"
              className="co-btn co-btn-ghost"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="co-btn co-btn-primary"
              disabled={!name.trim()}
            >
              Save Outfit
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(body, document.body);
};

export default CreateOutfitModal;
