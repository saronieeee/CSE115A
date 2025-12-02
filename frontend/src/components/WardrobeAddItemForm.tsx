import React, { ChangeEvent, FormEvent, useRef, useState } from "react";
import "./WardrobeAddItemForm.css";
import { CATEGORY_OPTIONS } from "../constants/categories";

type Props = {
  onClose: () => void;
};

type FormState = {
  category: string;
  occasion: string;
  color: string;
  imagePath: string;
  imageUrl: string;
  favorite: boolean;
  timesWorn: string;
};

const initialState: FormState = {
  category: "",
  occasion: "",
  color: "",
  imagePath: "",
  imageUrl: "",
  favorite: false,
  timesWorn: "",
};

const WardrobeAddItemForm: React.FC<Props> = ({ onClose }) => {
  const [formState, setFormState] = useState<FormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasUploadedImage =
    formState.imagePath.trim().length > 0 ||
    formState.imageUrl.trim().length > 0;

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (event.target as HTMLInputElement).checked
          : value,
    }));
  };

  // avoid closing/resetting while a save or upload is running
  const handleClose = () => {
    if (isSubmitting || isUploadingImage) return;
    setFormState(initialState);
    setError(null);
    setSuccess(null);
    setImageUploadError(null);
    setImagePreviewUrl(null);
    onClose();
  };

  // upload the selected file to API and store the resulting storage path and public URL
  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const fileInput = event.target;
    const file = fileInput.files?.[0];
    if (!file) return;

    setImageUploadError(null);
    setError(null);
    setSuccess(null);
    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/uploads/images", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const payload = await response.json();
      if (!response.ok) {
        const serverError =
          typeof payload?.error === "string"
            ? payload.error
            : "Failed to upload image.";
        throw new Error(serverError);
      }

      const newPath: string = payload?.image_path || payload?.path || "";
      const newPublicUrl: string | null = payload?.publicUrl ?? null;

      if (!newPath && !newPublicUrl) {
        throw new Error("Upload response did not include an image path.");
      }

      setFormState((prev) => ({
        ...prev,
        imagePath: newPath || prev.imagePath,
        imageUrl: newPublicUrl || prev.imageUrl,
      }));
      console.log("Image uploaded", {
        path: newPath,
        publicUrl: newPublicUrl,
        size: payload?.size,
        contentType: payload?.contentType,
      });
      setImagePreviewUrl(newPublicUrl);
    } catch (uploadErr) {
      const message =
        uploadErr instanceof Error
          ? uploadErr.message
          : "Something went wrong while uploading the image.";
      setImageUploadError(message);
    } finally {
      setIsUploadingImage(false);
      // allow uploading the same file again later
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      fileInput.value = "";
    }
  };

  // allow users to cancel an upload without reloading form
  const handleRemoveImage = () => {
    setFormState((prev) => ({
      ...prev,
      imagePath: "",
      imageUrl: "",
    }));
    setImagePreviewUrl(null);
    setImageUploadError(null);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // synchronous validation first, then persist via backend API (which infers user_id from JWT)
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (isUploadingImage) {
      setError("Please wait for the image upload to finish.");
      return;
    }

    const token = localStorage.getItem("DTI_ACCESS_TOKEN");
    if (!token) {
      setError("You must be signed in to add items.");
      return;
    }

    const trimmedCategory = formState.category.trim();
    if (!trimmedCategory) {
      setError("Category is required.");
      return;
    }

    if (!hasUploadedImage) {
      setError("Please upload an image before saving an item.");
      return;
    }

    const timesWornValue = formState.timesWorn.trim()
      ? Number(formState.timesWorn.trim())
      : null;

    if (timesWornValue !== null && Number.isNaN(timesWornValue)) {
      setError("Times worn must be a number.");
      return;
    }

    const insertPayload = {
      // user_id is NOT sent; backend uses req.user.id via requireUser
      category: trimmedCategory,
      occasion: formState.occasion.trim() || null,
      color: formState.color.trim() || null,
      image_path: formState.imagePath.trim() || null,
      image_url: formState.imageUrl.trim() || null,
      favorite: formState.favorite,
      times_worn: timesWornValue,
    };

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/clothing-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // 🔐 supplies JWT for requireUser
        },
        body: JSON.stringify(insertPayload),
      });

      const payload = await response.json().catch(() => ({} as any));

      if (!response.ok) {
        const serverError =
          typeof (payload as any)?.error === "string"
            ? (payload as any).error
            : "Something went wrong while adding the item.";
        throw new Error(serverError);
      }

      // Try to grab the new item's id from the response
      const newItemId: string | undefined =
        (payload as any)?.item?.id?.toString?.() ??
        (payload as any)?.id?.toString?.();

      setSuccess("Item added to your wardrobe!");
      console.log("Wardrobe item saved", {
        imagePath: insertPayload.image_path,
        imageUrl: insertPayload.image_url,
        newItemId,
      });

      if (newItemId) {
        try {
          const aiRes = await fetch("/api/ai/describe-closet-item", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ itemId: newItemId }),
          });

          const aiPayload = await aiRes.json().catch(() => ({} as any));

          if (!aiRes.ok) {
            const aiError =
              typeof (aiPayload as any)?.error === "string"
                ? (aiPayload as any).error
                : "Unknown AI description error";
            console.error("AI description failed:", aiError);
          } else {
            console.log(
              "AI description stored for item:",
              newItemId,
              aiPayload
            );
          }
        } catch (aiErr) {
          console.error("AI description request failed:", aiErr);
        }
      } else {
        console.warn(
          "No newItemId returned from /api/clothing-items; skipping AI description"
        );
      }

      setFormState(initialState);
      setImagePreviewUrl(null);
      setImageUploadError(null);

      // reload so latest items (and AI description) are visible immediately
      window.location.reload();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while adding the item.";
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
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
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
          <label htmlFor="imageUpload">Image upload *</label>
          <input
            id="imageUpload"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleImageUpload}
            disabled={isSubmitting || isUploadingImage}
            ref={fileInputRef}
          />
          {!hasUploadedImage && !imagePreviewUrl && (
            <p className="wardrobe-form-hint">
              Upload an image to add this item.
            </p>
          )}
          {isUploadingImage && (
            <p className="wardrobe-form-hint">Uploading image…</p>
          )}
          {imageUploadError && (
            <p className="wardrobe-form-error">{imageUploadError}</p>
          )}
          {imagePreviewUrl && (
            <img
              src={imagePreviewUrl}
              alt="Uploaded preview"
              className="wardrobe-image-preview"
            />
          )}
          {(formState.imagePath || formState.imageUrl || imagePreviewUrl) && (
            <button
              type="button"
              className="wardrobe-remove-image-button"
              onClick={handleRemoveImage}
              disabled={isSubmitting || isUploadingImage}
            >
              Remove image
            </button>
          )}
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
          <button
            className="wardrobe-submit-button"
            type="submit"
            disabled={isSubmitting || isUploadingImage || !hasUploadedImage}
          >
            {isSubmitting ? "Saving..." : "Save item"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default WardrobeAddItemForm;