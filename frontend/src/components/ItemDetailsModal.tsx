import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import './ItemDetailsModal.css';

interface ItemDetailsModalProps {
  id: string;
  imageUrl: string;
  title: string;
  category?: string;
  tags?: string[];
  color?: string;
  onClose: () => void;
  onSave: (updatedItem: {
    title: string;
    category: string;
    tags: string[];
    color: string;
  }) => void;
}

const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({
  id,
  imageUrl,
  title: initialTitle,
  category: initialCategory = '',
  tags: initialTags = [],
  color: initialColor = '',
  onClose,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [category, setCategory] = useState(initialCategory);
  const [tags, setTags] = useState(initialTags);
  const [color, setColor] = useState(initialColor);
  const [newTag, setNewTag] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      category,
      tags,
      color,
    });
    setIsEditing(false);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      if (!tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()]);
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const modalContent = (
    <div className="item-details-modal-overlay" onClick={onClose}>
      <div className="item-details-modal" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        
        <div className="image-section">
          <img src={imageUrl} alt={title} className="item-image" />
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="details-form">
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <input
                type="text"
                id="category"
                value={category}
                onChange={e => setCategory(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="color">Color</label>
              <input
                type="text"
                id="color"
                value={color}
                onChange={e => setColor(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags</label>
              <div className="tags-container">
                {tags.map(tag => (
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
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Type and press Enter to add tag"
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
              <button type="submit" className="save-button">Save Changes</button>
            </div>
          </form>
        ) : (
          <div className="details-section">
            <h2>{title}</h2>
            {category && <p className="category">Category: {category}</p>}
            {color && <p className="color">Color: {color}</p>}
            {tags.length > 0 && (
              <div className="tags">
                <p>Tags:</p>
                <div className="tags-container">
                  {tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}
            <button 
              className="edit-button"
              onClick={() => setIsEditing(true)}
            >
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