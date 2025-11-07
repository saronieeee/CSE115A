import React from "react";
import "./OutfitCard.css";

type Thumb = { url: string; label?: string };

type OutfitCardProps = {
  id: string;
  name: string;
  wornCount?: number;
  lastWorn?: string | null;
  thumbs: Thumb[]; // up to 3 images (shirt/pants/jacket)
  onClick?: (id: string) => void;
};

const OutfitCard: React.FC<OutfitCardProps> = ({
  id,
  name,
  wornCount,
  lastWorn,
  thumbs,
  onClick,
}) => {
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
    </button>
  );
};

export default OutfitCard;
