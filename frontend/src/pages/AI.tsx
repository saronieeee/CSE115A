import React, { useState, useEffect } from 'react';
import { CategorySlider } from '../components/CategorySlider';
import './AI.css';
import { Item as ClothingItem } from '../components/CategorySlider';

interface BodyProfile {
  heightFt: number;
  heightIn: number;
  weight?: number;
  bodyType: string;
  topsSize?: string;
  bottomsSize?: string;
  shoesSize?: string;
}




export const AI: React.FC = () => {
  const [step, setStep] = useState<'upload' | 'profile' | 'styling'>('upload');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [profile, setProfile] = useState<BodyProfile>({ heightFt: 5, heightIn: 8, bodyType: 'Athletic' });
  const [selectedItems, setSelectedItems] = useState<Array<{ id: string; title: string; image?: string }>>([]);
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all closet items from backend (similar to Wardrobe page)
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("DTI_ACCESS_TOKEN");
        const currentUserId = localStorage.getItem("DTI_DEV_USER_ID");

        if (!token) {
          setItems([]);
          setLoading(false);
          return;
        }

        const params = new URLSearchParams();
        params.set("limit", "100");
        params.set("offset", "0");

        const apiBase = "http://localhost:4000";
        const primaryUrl = `${apiBase}/api/public/closet-items?${params.toString()}`;
        const fallbackUrl = `/api/clothing-items?${params.toString()}`;

        let res = await fetch(primaryUrl, {
          credentials: "include",
          signal: ac.signal,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          res = await fetch(fallbackUrl, {
            signal: ac.signal,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        }

        if (!res.ok) throw new Error(`Network error ${res.status}`);

        const data = await res.json();
        const rows: any[] = Array.isArray(data?.items) ? data.items : [];

        // Filter by current user if userId is available
        const visibleRows = currentUserId
          ? rows.filter((r) => r.user_id === currentUserId)
          : rows;

        const fetchedItems: ClothingItem[] = visibleRows.map((item: any) => ({
          id: item.id,
          title: item.category || item.title || 'Item',
          image: item.image_url || item.image_path || '',
          tag: (item.category || 'Other').charAt(0).toUpperCase() + (item.category || 'Other').slice(1),
        }));

        setItems(fetchedItems);
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          console.error('Error fetching items:', error);
          setItems([]);
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setPhotoFile(f);
    setPhotoUrl(URL.createObjectURL(f));
    // Simulate processing and move to profile view
    setTimeout(() => setStep('profile'), 700);
  }

  function onRetake() {
    setPhotoFile(null);
    setPhotoUrl(null);
    setStep('upload');
  }

  function onSaveProfile() {
    // Here you would send profile + photo to server; we just advance
    setStep('styling');
  }

  function toggleSelectItem(item: ClothingItem) {
    setSelectedItems(prev => {
      // If item is already selected, remove it
      if (prev.find(p => p.id === item.id)) {
        return prev.filter(p => p.id !== item.id);
      }

      // Get the tag of the item being selected
      const itemTag = items.find(mi => mi.id === item.id)?.tag;

      // Remove any previously selected item with the same tag
      const withoutSameTag = prev.filter(p => {
        const selectedItemTag = items.find(mi => mi.id === p.id)?.tag;
        return selectedItemTag !== itemTag;
      });

      // Add the new item
      return [...withoutSameTag, item];
    });
  }

  return (
    <div className="page page-ai">
      {step === 'upload' && (
        <div className="upload-container">
          <div style={{ textAlign: 'center' }}>
            <div className="upload-icon">
              <span style={{ fontSize: '32px' }}>👤</span>
            </div>
            <h2>Upload Body Photo</h2>
            <p style={{ color: '#666' }}>For best results, use a full-body photo taken from the front with good lighting</p>
          </div>

          <label htmlFor="photo-upload">
            <div className="upload-area">
              <div style={{ fontSize: 28 }}>⬆️</div>
              <div>Click to upload or drag and drop</div>
              <div style={{ color: '#99a' }}>PNG, JPG up to 10MB</div>
            </div>
          </label>
          <input id="photo-upload" type="file" accept="image/png, image/jpeg" onChange={onFileChange} style={{ display: 'none' }} />

          <div className="privacy-notice">
            <strong>Privacy Notice</strong>
            <div style={{ color: '#666' }}>Your photos are processed locally and stored securely. They are only used to generate your body profile for virtual try-on features.</div>
          </div>
        </div>
      )}

      {step === 'profile' && (
        <div className="profile-container">
          <div className="success-banner">
            <strong>Photo Processed Successfully</strong>
            <div style={{ opacity: 0.9 }}>We've analyzed your body profile. Review and adjust the measurements below.</div>
          </div>

          <div className="preview-container">
            <div className="photo-preview">
              {photoUrl ? (
                <img src={photoUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ color: '#aaa' }}>Body Profile Preview</div>
              )}
            </div>

            <div className="measurements-form">
              <h3>Body Measurements</h3>

              <div className="form-group">
                <label>Height</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="number"
                    value={profile.heightFt}
                    onChange={e => setProfile({ ...profile, heightFt: Number(e.target.value) })}
                    style={{ width: 80 }}
                  />
                  <span>ft</span>
                  <input
                    type="number"
                    value={profile.heightIn}
                    onChange={e => setProfile({ ...profile, heightIn: Number(e.target.value) })}
                    style={{ width: 80 }}
                  />
                  <span>in</span>
                </div>
              </div>

              <div className="form-group">
                <label>Weight (optional)</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="number"
                    value={profile.weight ?? ''}
                    onChange={e => setProfile({ ...profile, weight: e.target.value ? Number(e.target.value) : undefined })}
                    style={{ width: 120 }}
                  />
                  <span>lbs</span>
                </div>
              </div>

              <div className="form-group">
                <label>Body Type</label>
                <select value={profile.bodyType} onChange={e => setProfile({ ...profile, bodyType: e.target.value })}>
                  <option>Athletic</option>
                  <option>Slim</option>
                  <option>Curvy</option>
                </select>
              </div>

              <div className="form-group">
                <label>Common Sizes</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <select value={profile.topsSize} onChange={e => setProfile({ ...profile, topsSize: e.target.value })}>
                    <option value="">Tops</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                  </select>
                  <select value={profile.bottomsSize} onChange={e => setProfile({ ...profile, bottomsSize: e.target.value })}>
                    <option value="">Bottoms</option>
                    <option value="6">6</option>
                    <option value="8">8</option>
                    <option value="10">10</option>
                  </select>
                  <select value={profile.shoesSize} onChange={e => setProfile({ ...profile, shoesSize: e.target.value })}>
                    <option value="">Shoes</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                  </select>
                </div>
              </div>

              <div className="button-group">
                <button className="btn" onClick={onRetake}>Retake Photo</button>
                <button className="btn btn-primary" onClick={onSaveProfile}>Save Profile</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'styling' && (
        <div className="styling-container">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div className="upload-icon">
              <span style={{ fontSize: '32px' }}>👗</span>
            </div>
            <h2>Start Styling</h2>
            <p>Select items from the categories below to create your virtual outfit</p>
          </div>

          <div className="selected-items">
            {selectedItems.length === 0 && <div style={{ color: '#888', width: '100%', textAlign: 'center' }}>No items selected yet</div>}
            {selectedItems.map(it => (
              <div key={it.id} className="selected-item">
                {it.image ? (
                  <img src={it.image} alt={it.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ padding: 8, fontSize: 11 }}>{it.title}</div>
                )}
              </div>
            ))}
          </div>

          {/* Group items by tag and create a section for each tag */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading items...</div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No items found in your wardrobe</div>
          ) : (
            Array.from(new Set(items.map(item => item.tag))).map(tag => (
              <div key={tag} className="category-section">
                <h3>{tag}</h3>
                <CategorySlider
                  items={items.filter(item => item.tag === tag)}
                  onToggle={toggleSelectItem}
                  selectedIds={selectedItems.map(s => s.id)}
                />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AI;
