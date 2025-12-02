import React, { useState } from "react";
import ReactDOM from "react-dom";
import "./ItemDetailsModal.css";
import { CATEGORY_OPTIONS } from "../constants/categories";

interface ItemDetailsModalProps {
  id: string;
  imageUrl: string;
  title: string;
  category?: string;
  tags?: string[];
  color?: string;
  times_worn?: number;
  last_worn?: string | null;
  onClose: () => void;
  onSave: (updatedItem: {
    title: string;
    category: string;
    tags: string[];
    color: string;
    times_worn: number;
    last_worn: string | null;
  }) => void;
}

const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({
  id,
  imageUrl,
  title: initialTitle,
  category: initialCategory = "",
  tags: initialTags = [],
  color: initialColor = "",
  times_worn: initialTimesWorn = 0,
  last_worn: initialLastWorn = null,
  onClose,
  onSave,
}) => {
  const normalizedInitialCategory = CATEGORY_OPTIONS.some(
    (option) => option.value === initialCategory
  )
    ? initialCategory
    : "";
  const [isEditing, setIsEditing] = useState(false);
  const [category, setCategory] = useState(normalizedInitialCategory);
  const [tags, setTags] = useState(initialTags);
  const [color, setColor] = useState(initialColor);
  const [timesWorn, setTimesWorn] = useState<number>(initialTimesWorn);
  const [lastWorn, setLastWorn] = useState<string | null>(initialLastWorn);
  const [newTag, setNewTag] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: initialTitle,
      category,
      tags,
      color,
      times_worn: timesWorn,
      last_worn: lastWorn,
    });

    setIsEditing(false);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault();
      if (!tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()]);
      }
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const modalContent = (
    <div className="item-details-modal-overlay" onClick={onClose}>
      <div className="item-details-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          ×
        </button>

        <div className="image-section">
          <img src={imageUrl} alt={initialTitle} className="item-image" />
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="details-form">
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Select a category</option>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="color">Color</label>
              <input
                type="text"
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags</label>
              <div className="tags-container">
                {tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="remove-tag"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Type and press Enter to add tag"
              />
            </div>

            <div className="form-group">
              <label htmlFor="timesWorn">Times worn</label>
              <input
                type="number"
                id="timesWorn"
                min={0}
                value={timesWorn}
                onChange={(e) => setTimesWorn(Number(e.target.value) || 0)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastWorn">Last worn</label>
              <input
                type="date"
                id="lastWorn"
                value={lastWorn ? lastWorn.slice(0, 10) : ""}
                onChange={(e) => {
                  const val = e.target.value; // "YYYY-MM-DD"
                  setLastWorn(val || null); // store date-only string, no timezone
                }}
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button type="submit" className="save-button">
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="details-section">
            {category && (
              <p className="category">
                Category{" "}
                {CATEGORY_OPTIONS.find((option) => option.value === category)
                  ?.label || category}
              </p>
            )}
            {color && <p className="color">Color: {color}</p>}

            {tags.length > 0 && (
              <div className="tags">
                <p>Tags:</p>
                <div className="tags-container">
                  {tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {typeof timesWorn === "number" && (
              <p className="times-worn">Times worn: {timesWorn}</p>
            )}

            <p className="last-worn">
              Last worn:{" "}
              {lastWorn
                ? lastWorn.slice(0, 10) // or format it nicer if you want later
                : "Not worn yet"}
            </p>

            <button className="edit-button" onClick={() => setIsEditing(true)}>
              Edit Details
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default ItemDetailsModal;
