import React, { useState } from 'react';
import './Wardrobe.css';
import WardrobeItem from '../components/WardrobeItem';
import ItemDetails from '../components/ItemDetails';

type WardrobeItem = {
  id: string;
  title: string;
  category?: string;
  imageUrl?: string;
  favorite?: boolean;
};

const sampleItems: WardrobeItem[] = [
  { id: '1', title: 'White Tee', category: 'Tops', imageUrl: 'https://img.sonofatailor.com/images/customizer/product/extra-heavy-cotton/ss/Black.jpg', favorite: false },
  { id: '2', title: 'Blue Jeans', category: 'Bottoms', imageUrl: 'https://m.media-amazon.com/images/I/715K4AhGLZS._AC_UY1000_.jpg', favorite: true },
  { id: '3', title: 'Black Dress', category: 'Dresses', imageUrl: 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/99486859-0ff3-46b4-949b-2d16af2ad421/custom-nike-dunk-high-by-you-shoes.png', favorite: false },
  { id: '4', title: 'Red Sneakers', category: 'Shoes', imageUrl: 'https://vader-prod.s3.amazonaws.com/1651851897-best-babydoll-dresses-matteau-dress-1651851878.png', favorite: false },
  { id: '5', title: 'Leather Jacket', category: 'Outerwear', imageUrl: 'https://img.sonofatailor.com/images/customizer/product/extra-heavy-cotton/ss/Black.jpg', favorite: true },
];

const Wardrobe: React.FC = () => {
  // Start empty to show the empty-state by default; developer can add sample items for preview.
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [query, setQuery] = useState('');

  const filtered = items.filter((it) => it.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="wardrobe-page">
      <div className="wardrobe-header">
        <h2>Hi User!</h2>
      </div>

      <main className="wardrobe-content">
        {items.length === 0 ? (
          <div className="empty-card">
            <div className="empty-icon">🖼️</div>
            <h3>Your wardrobe is empty</h3>
            <p>Start building your digital wardrobe by adding your first item. Upload photos of your clothes and let our AI help organize them automatically.</p>
            <button className="btn btn-primary" onClick={() => setItems(sampleItems)}>
              Add Your First Item
            </button>
          </div>
        ) : (
          <div className="grid">
            {filtered.map((it) => (
              <div key={it.id} className="item-card">
                <WardrobeItem
                  id={it.id}
                  title={it.title}
                  description={it.category}
                  tags={[it.category ?? '']}
                  imageUrl={it.imageUrl}
                  favorite={!!it.favorite}
                  onClick={() => {
                    /* placeholder for viewing details */
                  }}
                />

                <ItemDetails
                  id={it.id}
                  favorite={!!it.favorite}
                  onToggleFavorite={(id) =>
                    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p)))
                  }
                  onDelete={(id) => setItems((prev) => prev.filter((p) => p.id !== id))}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Wardrobe;
