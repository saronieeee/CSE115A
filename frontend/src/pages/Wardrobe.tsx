import React, { useState } from 'react';
import './Wardrobe.css';
import WardrobeAddItemForm from '../components/WardrobeAddItemForm';

const Wardrobe: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleOpenForm = () => {
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  return (
    <div className="page page-wardrobe">
      <header className="wardrobe-header">
        <h1 className="wardrobe-title">Dress To Impress</h1>
        <button className="wardrobe-add-button" type="button" onClick={handleOpenForm}>
          Add Item
        </button>
      </header>
      {isFormOpen && <WardrobeAddItemForm onClose={handleCloseForm} />}
      <section className="wardrobe-content">
        <h2 className="wardrobe-section-heading">Wardrobe</h2>
        <p>Welcome to your wardrobe. This is a placeholder page — replace with your content.</p>
      </section>
    </div>
  );
};

export default Wardrobe;
