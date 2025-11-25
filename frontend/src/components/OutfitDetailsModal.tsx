import React from 'react';
import './OutfitDetailsModal.css';

type ClosetItem = {
  id: string;
  category: string | null;
  color?: string | null;
  image_path?: string | null;
  image_url?: string | null;
};

type OutfitItemLink = {
  link_id: string;
  category: string | null;
  closet_item: ClosetItem | null;
};

type OutfitDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  outfitName: string;
  items: OutfitItemLink[];
  wornCount?: number;
  lastWorn?: string | null;
};

const OutfitDetailsModal: React.FC<OutfitDetailsModalProps> = ({
  isOpen,
  onClose,
  outfitName,
  items,
  wornCount,
  lastWorn,
}) => {
  if (!isOpen) return null;

  return (
    <div className="outfit-details-overlay" onClick={onClose}>
      <div className="outfit-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="outfit-details-header">
          <h2>{outfitName}</h2>
          <button className="outfit-details-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="outfit-details-stats">
          <div className="outfit-stat">
            <span className="stat-label">Worn</span>
            <span className="stat-value">{typeof wornCount === 'number' ? `${wornCount}×` : 'New'}</span>
          </div>
          <div className="outfit-stat">
            <span className="stat-label">Last Worn</span>
            <span className="stat-value">
              {lastWorn ? new Date(lastWorn).toLocaleDateString() : 'Not worn yet'}
            </span>
          </div>
        </div>

        <div className="outfit-details-content">
          <h3>Items in this outfit</h3>
          {items.length === 0 ? (
            <p className="no-items-message">No items in this outfit</p>
          ) : (
            <div className="outfit-items-grid">
              {items.map((item) => {
                const closetItem = item.closet_item;
                const imageUrl = closetItem?.image_url || closetItem?.image_path || '';
                const category = item.category || closetItem?.category || 'Item';
                const color = closetItem?.color;

                return (
                  <div key={item.link_id} className="outfit-detail-item">
                    <div className="outfit-item-image">
                      {imageUrl ? (
                        <img src={imageUrl} alt={category} />
                      ) : (
                        <div className="outfit-item-placeholder">
                          <span>No Image</span>
                        </div>
                      )}
                    </div>
                    <div className="outfit-item-info">
                      <div className="outfit-item-category">{category}</div>
                      {color && <div className="outfit-item-color">{color}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutfitDetailsModal;
