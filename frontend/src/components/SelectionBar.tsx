import React from 'react';
import './SelectionBar.css';

type Props = {
  count: number;
  onClear: () => void;
  onVirtualTryOn: () => void;
  onCreateOutfit: () => void;
  onAddFavorites: () => void;
  onDelete: () => void;
};

const SelectionBar: React.FC<Props> = ({
  count,
  onClear,
  onVirtualTryOn,
  onCreateOutfit,
  onAddFavorites,
  onDelete,
}) => {
  return (
    <div className="selection-bar" role="region" aria-label="Selection toolbar">
      <div className="selection-left">
        <div className="selected-count">{count} selected</div>
        <button className="clear-btn" onClick={onClear} aria-label="Clear selection">✕</button>
      </div>

      <div className="selection-actions">
        <button className="action-btn" onClick={onVirtualTryOn}>
          <span className="icon">🔮</span>
          <span className="label">Virtual Try-On</span>
        </button>

        <button className="action-btn create-outfit" onClick={onCreateOutfit}>
          <span className="icon">👗</span>
          <span className="label">Create Outfit</span>
        </button>

        <button className="action-btn" onClick={onAddFavorites}>
          <span className="icon">♥</span>
          <span className="label">Add to Favorites</span>
        </button>

        <button className="action-btn destructive" onClick={onDelete}>
          <span className="icon">🗑️</span>
          <span className="label">Delete</span>
        </button>
      </div>
    </div>
  );
};

export default SelectionBar;
