import React from "react";
import "./CategorySlider.css";

export interface Item {
  id: string;
  title: string;
  image: string;
  tag: string;
  category?: string;
  color?: string;
};

type Props = {
  items: Item[];
  selectedIds?: string[];
  onToggle: (item: Item) => void;
};

export const CategorySlider: React.FC<Props> = ({
  items,
  selectedIds = [],
  onToggle,
}) => {
  if (!items || items.length === 0) return <div>No items</div>;

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        width: "100%",
        maxWidth: "100%",
        overflowX: "auto",
        padding: "8px 0",
        scrollSnapType: "x mandatory",
        msOverflowStyle: "none",
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
      }}
      className="hide-scrollbar"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className="category-slider-item"
          style={{
            width: "160px",
            minWidth: "160px",
            flexShrink: 0,
            scrollSnapAlign: "start",
            borderRadius: "8px",
            overflow: "hidden",
            backgroundColor: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            cursor: "pointer",
            transition: "transform 0.2s",
            transform: "translateY(0)",
          }}
        >
          <div
            style={{
              width: "160px",
              height: "180px",
              position: "relative",
              backgroundColor: "#f8f9fa",
            }}
          >
            {item.image ? (
              <img
                src={item.image}
                alt={item.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "12px",
                  textAlign: "center",
                  color: "#666",
                }}
              >
                {item.title}
              </div>
            )}
            <button
              onClick={() => onToggle(item)}
              style={{
                position: "absolute",
                bottom: "8px",
                right: "8px",
                background: selectedIds.includes(item.id)
                  ? "#e63946"
                  : "#0466c8",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "14px",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              {selectedIds.includes(item.id) ? "Remove" : "Select"}
            </button>
          </div>
          <div style={{ padding: "12px" }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: "15px",
                marginBottom: "4px",
              }}
            >
              {item.title}
            </div>
            {item.tag && (
              <div
                style={{
                  color: "#666",
                  fontSize: "13px",
                }}
              >
                {item.tag}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CategorySlider;
