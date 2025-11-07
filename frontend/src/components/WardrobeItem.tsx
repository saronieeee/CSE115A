import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

type WardrobeItemProps = {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  imageUrl?: string;
  favorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onClick?: (id: string) => void;
  onDelete?: (id: string) => void;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
};

const WardrobeItem: React.FC<WardrobeItemProps> = ({
  id,
  title,
  description,
  tags = [],
  imageUrl,
  favorite = false,
  onToggleFavorite,
  onClick,
  onDelete,
  selected,
  onSelect,
}) => {
  const [internalSelected, setInternalSelected] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const optionsBtnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isSelected = selected ?? internalSelected;

  const handleSelectToggle = () => {
    if (onSelect) onSelect(id, !isSelected);
    else setInternalSelected((s: boolean) => !s);
  };

  const handleDelete = () => {
    setMenuOpen(false);
    onDelete?.(id);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const computePos = () => {
      const btn = optionsBtnRef.current;
      if (!btn) return setMenuPos(null);
      const rect = btn.getBoundingClientRect();
      // position menu slightly below the button, aligned to the right edge
      setMenuPos({ top: rect.bottom + 8, left: rect.right - 160 });
    };

    computePos();
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!btnContains(target) && !menuContains(target)) setMenuOpen(false);
    };

    function btnContains(target: Node | null) {
      if (!optionsBtnRef.current) return false;
      return optionsBtnRef.current.contains(target);
    }

    function menuContains(target: Node | null) {
      if (!menuRef.current) return false;
      return menuRef.current.contains(target);
    }

    window.addEventListener('resize', computePos);
    window.addEventListener('scroll', computePos, true);
    document.addEventListener('click', onDocClick);
    return () => {
      window.removeEventListener('resize', computePos);
      window.removeEventListener('scroll', computePos, true);
      document.removeEventListener('click', onDocClick);
    };
  }, [menuOpen]);

  return (
    <article className={`wardrobe-item ${isSelected ? 'selected' : ''}`} role="article" aria-label={title}>
      <div className="wardrobe-media" onClick={() => onClick?.(id)}>
        {imageUrl ? <img src={imageUrl} alt={title} /> : <div className="wardrobe-placeholder">No image</div>}

        <button
          type="button"
          className={`select-toggle ${isSelected ? 'checked' : ''}`}
          aria-pressed={isSelected}
          onClick={(e) => {
            e.stopPropagation();
            handleSelectToggle();
          }}
        >
          {isSelected ? '✔' : ''}
        </button>
      </div>
    </article>
  );
};

export type { WardrobeItemProps };
export default WardrobeItem;
