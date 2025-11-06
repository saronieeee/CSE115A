import React, { ChangeEvent, FormEvent, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import './WardrobeAddItemForm.css';

type Props = {
  onClose: () => void;
};

type FormState = {
  category: string;
  occasion: string;
  color: string;
  imagePath: string;
  favorite: boolean;
  timesWorn: string;
};

const initialState: FormState = {
  category: '',
  occasion: '',
  color: '',
  imagePath: '',
  favorite: false,
  timesWorn: '',
};

const WardrobeAddItemForm: React.FC<Props> = ({ onClose }) => {
  const [formState, setFormState] = useState<FormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (event.target as HTMLInputElement).checked : value,
    }));
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setFormState(initialState);
    setError(null);
    setSuccess(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedCategory = formState.category.trim();

    if (!trimmedCategory) {
      setError('Category is required.');
      return;
    }

    const {
      data: sessionData,
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      setError(sessionError.message);
      return;
    }

    const userId = sessionData.session?.user.id;
    if (!userId) {
      setError('You must be signed in.');
      return;
    }

    const timesWornValue = formState.timesWorn.trim()
      ? Number(formState.timesWorn.trim())
      : null;

    if (timesWornValue !== null && Number.isNaN(timesWornValue)) {
      setError('Times worn must be a number.');
      return;
    }

    const insertPayload = {
      user_id: userId,
      category: trimmedCategory,
      occasion: formState.occasion.trim() || null,
      color: formState.color.trim() || null,
      image_path: formState.imagePath.trim() || null,
      favorite: formState.favorite,
      times_worn: timesWornValue,
    };

    setIsSubmitting(true);
    try {
      const { error: insertError } = await supabase.from('closet_items').insert([insertPayload]);
      if (insertError) {
        throw new Error(insertError.message);
      }
      setSuccess('Item added to your wardrobe!');
      setFormState(initialState);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong while adding the item.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="wardrobe-form-wrapper">
      <button
        type="button"
        className="wardrobe-close-button"
        onClick={handleClose}
        aria-label="Close add item form"
        disabled={isSubmitting}
      >
        &times;
      </button>
      <h2 className="wardrobe-section-heading">Add a new item</h2>
      <form className="wardrobe-add-form" onSubmit={handleSubmit}>
        <div className="wardrobe-form-row">
          <label htmlFor="category">Category *</label>
          <select
            id="category"
            name="category"
            value={formState.category}
            onChange={handleChange}
            required
          >
            <option value="" disabled>
              Select a category
            </option>
            <option value="shirt">Shirt</option>
            <option value="pants">Pants</option>
            <option value="outerwear">Outerwear</option>
            <option value="accessories">Accessories</option>
            <option value="shoes">Shoes</option>
          </select>
        </div>

        <div className="wardrobe-form-row">
          <label htmlFor="occasion">Occasion</label>
          <input
            id="occasion"
            name="occasion"
            value={formState.occasion}
            onChange={handleChange}
            placeholder="Optional"
          />
        </div>

        <div className="wardrobe-form-row">
          <label htmlFor="color">Color</label>
          <input
            id="color"
            name="color"
            value={formState.color}
            onChange={handleChange}
            placeholder="Optional"
          />
        </div>

        <div className="wardrobe-form-row">
          <label htmlFor="imagePath">Image path</label>
          <input
            id="imagePath"
            name="imagePath"
            value={formState.imagePath}
            onChange={handleChange}
            placeholder="storage path"
          />
        </div>

        <div className="wardrobe-form-row">
          <label htmlFor="timesWorn">Times worn</label>
          <input
            id="timesWorn"
            name="timesWorn"
            type="number"
            value={formState.timesWorn}
            onChange={handleChange}
            placeholder="0"
            inputMode="numeric"
            min="0"
          />
        </div>

        <label className="wardrobe-checkbox">
          <input
            type="checkbox"
            name="favorite"
            checked={formState.favorite}
            onChange={handleChange}
          />
          Mark as favorite
        </label>

        {error && <p className="wardrobe-form-error">{error}</p>}
        {success && <p className="wardrobe-form-success">{success}</p>}

        <div className="wardrobe-form-actions">
          <button className="wardrobe-submit-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save item'}
          </button>
        </div>
      </form>
    </section>
  );
};

export default WardrobeAddItemForm;
