import React, { useState, useRef, useEffect } from "react";
import "./OutfitCard.css";

type Thumb = { url: string; label?: string };

type OutfitCardProps = {
  id: string;
  name: string;
  wornCount?: number;
  lastWorn?: string | null;
  thumbs: Thumb[];
  onClick?: (id: string) => void;
  onDelete?: (id: string) => void; // if you need delete
};

const OutfitCard: React.FC<OutfitCardProps> = ({
  id,
  name,
  wornCount,
  lastWorn,
  thumbs,
  onClick,
  onDelete,
}) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <button className="outfit-card" onClick={() => onClick?.(id)}>
      <div className="outfit-thumbs">
        {thumbs.slice(0, 3).map((t, i) => (
          <div key={i} className="outfit-thumb">
            <img src={t.url} alt={t.label || "item"} />
            {t.label && <span className="thumb-badge">{t.label}</span>}
          </div>
        ))}
      </div>

      <div className="outfit-meta">
        <div className="outfit-name">{name}</div>
        <div className="outfit-sub">
          <div className="stat-row">
            <span className="stat-badge">
              <span className="stat-dot" />
              {typeof wornCount === "number" ? `Worn ${wornCount}×` : "New"}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-badge stat-muted">
              {lastWorn
                ? `Last worn ${new Date(lastWorn).toLocaleDateString()}`
                : "Not worn yet"}
            </span>
          </div>
        </div>
      </div>

      {/* three dots in bottom-left */}
      <div
        className="outfit-menu-anchor outfit-menu-bottom-left"
        ref={menuRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="outfit-kebab"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Open outfit actions"
          onClick={() => setOpen((v) => !v)}
        >
          ⋯
        </button>

        {open && (
          <div role="menu" className="outfit-menu">
            <button
              role="menuitem"
              className="outfit-menu-item danger"
              onClick={() => onDelete?.(id)}
            >
              Delete outfit
            </button>
          </div>
        )}
      </div>
    </button>
  );
};

export default OutfitCard;
