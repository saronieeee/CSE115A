import React, { useState, useRef, useEffect } from "react";
import "./OutfitCard.css"; // reuse the same styling for consistent look

type AiImageCardProps = {
  id: string;
  imageUrl: string;
  createdAt?: string | null;
  itemCount?: number;
  onClick?: (id: string) => void;   // open "items used" view/modal
  onDelete?: (id: string) => void;  // delete this AI outfit
};

const AiImageCard: React.FC<AiImageCardProps> = ({
  id,
  imageUrl,
  createdAt,
  itemCount,
  onClick,
  onDelete,
}) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <button
      className="outfit-card ai-outfit-card"
      onClick={() => onClick?.(id)}
      type="button"
    >
      {/* Single AI image filling the top area */}
      <div className="outfit-thumbs ai-outfit-thumb-wrapper">
        <div className="outfit-thumb ai-outfit-thumb">
          <img src={imageUrl} alt="AI generated outfit" />
          <span className="thumb-badge">AI outfit</span>
        </div>
      </div>

      <div className="outfit-meta">
        <div className="outfit-name">
          AI Outfit
        </div>
        <div className="outfit-sub">
          <div className="stat-row">
            <span className="stat-badge">
              <span className="stat-dot" />
              {typeof itemCount === "number"
                ? `${itemCount} item${itemCount === 1 ? "" : "s"} used`
                : "Generated with your wardrobe"}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-badge stat-muted">
              {createdAt
                ? `Generated ${new Date(createdAt).toLocaleDateString()}`
                : "Recently generated"}
            </span>
          </div>
        </div>
      </div>

      {/* three dots in bottom-right (same pattern as OutfitCard) */}
      <div
        className="outfit-menu-anchor outfit-menu-bottom-left"
        ref={menuRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="outfit-kebab"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Open AI outfit actions"
          onClick={() => setOpen((v) => !v)}
          type="button"
        >
          ⋯
        </button>

        {open && (
          <div role="menu" className="outfit-menu">
            <button
              role="menuitem"
              className="outfit-menu-item danger"
              onClick={() => {
                onDelete?.(id);
                setOpen(false);
              }}
            >
              Delete AI outfit
            </button>
          </div>
        )}
      </div>
    </button>
  );
};

export default AiImageCard;
