import React from 'react';
import './Wardrobe.css';

const Wardrobe: React.FC = () => {
  return (
    <div className="page page-wardrobe">
      <header className="wardrobe-header">
        <h1 className="wardrobe-title">Dress To Impress</h1>
        <button className="wardrobe-add-button" type="button">
          Add Item
        </button>
      </header>
      <section className="wardrobe-content">
        <h2 className="wardrobe-section-heading">Wardrobe</h2>
        <p>Welcome to your wardrobe. This is a placeholder page — replace with your content.</p>
      </section>
    </div>
  );
};

export default Wardrobe;
