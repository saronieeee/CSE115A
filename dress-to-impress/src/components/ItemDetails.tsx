import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
// refresh

type Props = {
  id: string;
  favorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onDelete?: (id: string) => void;
  onViewDetails?: (id: string) => void;
};

const ItemDetails: React.FC<Props> = ({ id, favorite = false, onToggleFavorite, onDelete, onViewDetails }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const optionsBtnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const MENU_W = 140; // smaller width to fit text

  useEffect(() => {
    if (!menuOpen) return;
    const computePos = () => {
      const btn = optionsBtnRef.current;
      if (!btn) return setMenuPos(null);

      const rect = btn.getBoundingClientRect();
      let left = rect.left + (rect.width - MENU_W) / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - MENU_W - 8));
      const top = rect.bottom + 10;
      setMenuPos({ top, left });
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

  const handleDelete = () => {
    setMenuOpen(false);
    onDelete?.(id);
  };

  return (
    <div className="wardrobe-body">
      <div className="wardrobe-actions">
        <div className="wardrobe-fav-indicator" aria-hidden>
          {favorite ? '♥' : ''}
        </div>

        <div className="wardrobe-options">
          <button
            ref={optionsBtnRef}
            type="button"
            className="options-toggle"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((s) => !s)}
          >
            ⋯
          </button>

          {menuOpen &&
            ReactDOM.createPortal(
              <div
                className="item-options-menu portal square"
                role="menu"
                ref={menuRef}
                style={menuPos ? { position: 'fixed', top: menuPos.top, left: menuPos.left, width: MENU_W } : undefined}
              >
                <div className="menu-square-inner">
                  <div className="menu-square-actions">
                    <button
                      className="menu-square-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onViewDetails?.(id);
                      }}
                    >
                      View details
                    </button>

                    <button
                      className="menu-square-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onToggleFavorite?.(id);
                      }}
                    >
                      {favorite ? 'Unfavorite' : 'Favorite'}
                    </button>

                    <button
                      className="menu-square-btn destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>,
              document.body,
            )}
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;
