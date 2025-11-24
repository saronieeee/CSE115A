import React, { useState, useEffect, useRef } from "react";
import { CategorySlider } from "../components/CategorySlider";
import "./AI.css";
import { Item as ClothingItem } from "../components/CategorySlider";

interface BodyProfile {
  heightFt: number;
  heightIn: number;
  weight?: number;
  bodyType: string;
  topsSize?: string;
  bottomsSize?: string;
  shoesSize?: string;
  imageUrl?: string | null;
}

interface SavedBodyProfile extends BodyProfile {
  imageUrl?: string | null;
}

export const AI: React.FC = () => {
  const [step, setStep] = useState<"upload" | "profile" | "styling">("upload");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [profile, setProfile] = useState<BodyProfile>({
    heightFt: 5,
    heightIn: 8,
    bodyType: "Athletic",
  });
  const [savedProfile, setSavedProfile] = useState<SavedBodyProfile | null>(
    null
  );
  const [selectedItems, setSelectedItems] = useState<ClothingItem[]>([]);
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);

  // single hidden file input for both upload + retake
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentImage = photoUrl || profile.imageUrl || null;

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
          title: item.category || item.title || "Item",
          image: item.image_url || item.image_path || "",
          tag:
            (item.category || "Other").charAt(0).toUpperCase() +
            (item.category || "Other").slice(1),
        }));

        setItems(fetchedItems);
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          console.error("Error fetching items:", error);
          setItems([]);
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  // Load existing body profile on mount (if any)
  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        const token = localStorage.getItem("DTI_ACCESS_TOKEN");
        if (!token) {
          setStep("upload");
          return;
        }

        const res = await fetch("/api/body-profile", {
          signal: ac.signal,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.warn("Failed to load body profile:", res.status);
          setStep("upload");
          return;
        }

        const data = await res.json();

        // No saved profile yet → show upload flow
        if (!data.profile) {
          setStep("upload");
          return;
        }

        const p = data.profile;
        const hasImage = !!p.imageUrl;

        const mergedProfile: BodyProfile = {
          heightFt: p.heightFt ?? 5,
          heightIn: p.heightIn ?? 8,
          weight: p.weight ?? undefined,
          bodyType: p.bodyType || "Athletic",
          topsSize: p.topsSize ?? undefined,
          bottomsSize: p.bottomsSize ?? undefined,
          shoesSize: p.shoesSize ?? undefined,
          imageUrl: p.imageUrl ?? null,
        };

        setProfile(mergedProfile);
        setSavedProfile({
          ...mergedProfile,
          imageUrl: p.imageUrl ?? null,
        });

        if (p.imageUrl) {
          setPhotoUrl(p.imageUrl);
        }

        // ✅ If profile has an image → go straight to styling
        // ✅ If profile has no image → go to profile step so you can upload one
        setStep(hasImage ? "styling" : "profile");
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Error loading body profile:", err);
        }
        setStep("upload");
      }
    })();

    return () => ac.abort();
  }, []);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setPhotoFile(f);
    setPhotoUrl(URL.createObjectURL(f));
    // Always go to profile view after choosing a file
    setStep("profile");
  }

  function onRetake() {
    // Clear current image and immediately reopen picker
    setPhotoFile(null);
    setPhotoUrl(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }

async function onSaveProfile() {
  try {
    const token = localStorage.getItem("DTI_ACCESS_TOKEN");
    if (!token) {
      alert("You need to be signed in to save your profile.");
      return;
    }

    const form = new FormData();

    if (photoFile) {
      form.append("photo", photoFile);
    }

    const profilePayload = {
      heightFt: profile.heightFt,
      heightIn: profile.heightIn,
      weight: profile.weight ?? null,
      bodyType: profile.bodyType,
      topsSize: profile.topsSize ?? "",
      bottomsSize: profile.bottomsSize ?? "",
      shoesSize: profile.shoesSize ?? "",
    };

    form.append("profile", JSON.stringify(profilePayload));

    // 1️⃣ Save profile (we don't trust its body shape; we just care it succeeded)
    const saveRes = await fetch("/api/body-profile", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });

    if (!saveRes.ok) {
      const err = await saveRes.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${saveRes.status}`);
    }

    // 2️⃣ Immediately refetch canonical profile (with imageUrl)
    const refetchRes = await fetch("/api/body-profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!refetchRes.ok) {
      const err = await refetchRes.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${refetchRes.status}`);
    }

    const refData = await refetchRes.json();
    const p = refData.profile;
    if (!p) {
      throw new Error("No profile returned after save");
    }

    const mergedProfile: BodyProfile = {
      heightFt: p.heightFt ?? 5,
      heightIn: p.heightIn ?? 8,
      weight: p.weight ?? undefined,
      bodyType: p.bodyType || "Athletic",
      topsSize: p.topsSize ?? undefined,
      bottomsSize: p.bottomsSize ?? undefined,
      shoesSize: p.shoesSize ?? undefined,
      imageUrl: p.imageUrl ?? null,
    };

    setProfile(mergedProfile);
    setSavedProfile(mergedProfile);

    // 3️⃣ Update photoUrl with cache-buster so browser doesn't show old image
    if (p.imageUrl) {
      setPhotoUrl(`${p.imageUrl}?t=${Date.now()}`);
    }

    // 4️⃣ Go to styling view
    setStep("styling");
  } catch (e: any) {
    console.error("Failed to save body profile:", e);
    alert(
      e?.message || "Could not save your body profile. Please try again."
    );
  }
}


  function toggleSelectItem(item: ClothingItem) {
    setSelectedItems((prev) => {
      // If item is already selected, remove it
      if (prev.find((p) => p.id === item.id)) {
        return prev.filter((p) => p.id !== item.id);
      }

      // Get the tag of the item being selected
      const itemTag = items.find((mi) => mi.id === item.id)?.tag;

      // Remove any previously selected item with the same tag
      const withoutSameTag = prev.filter((p) => {
        const selectedItemTag = items.find((mi) => mi.id === p.id)?.tag;
        return selectedItemTag !== itemTag;
      });

      // Add the new item
      return [...withoutSameTag, item];
    });
  }

  async function generateOutfit() {
    try {
      setAiError(null);
      setAiImageUrl(null);

      if (!selectedItems.length) {
        setAiError('Select at least one item to guide the AI outfit.');
        return;
      }

      const token = localStorage.getItem('DTI_ACCESS_TOKEN');
      if (!token) {
        setAiError('Please sign in to generate outfits.');
        return;
      }

      setAiLoading(true);

      const payloadItems = selectedItems.map((sel) => ({
        id: sel.id,
        title: sel.title,
        category: sel.tag?.toLowerCase?.() || sel.category,
        color: sel.color,
        image: sel.image,
      }));

      const candidateUrls = [
        'http://localhost:4000/api/ai/outfit',
        '/api/ai/outfit',
      ];

      let lastErr: string | null = null;

      for (const url of candidateUrls) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ items: payloadItems }),
          });

          const contentType = res.headers.get('content-type') || '';
          const body = contentType.includes('application/json') ? await res.json() : await res.text();

          if (!res.ok) {
            const message = (body && typeof body === 'object' && (body as any).error) || body || 'Failed to generate outfit';
            lastErr = typeof message === 'string' ? message : 'Failed to generate outfit';
            continue;
          }

          const imageUrl = (body as any)?.imageUrl;
          if (!imageUrl) {
            lastErr = 'AI did not return an image URL.';
            continue;
          }

          setAiImageUrl(imageUrl);
          setAiError(null);
          return;
        } catch (err: any) {
          if (err?.name === 'AbortError') return;
          lastErr = err?.message || 'Failed to generate outfit';
        }
      }

      setAiError(lastErr || 'Failed to generate outfit');
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="page page-ai">
      {/* 🔒 single hidden file input used by both upload area & Retake button */}
      <input
        ref={fileInputRef}
        id="photo-upload"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={onFileChange}
        style={{ display: "none" }}
      />

      {step === "upload" && (
        <div className="upload-container">
          <div style={{ textAlign: "center" }}>
            <div className="upload-icon">
              <span style={{ fontSize: "32px" }}>👤</span>
            </div>
            <h2>Upload Body Photo</h2>
            <p style={{ color: "#666" }}>
              For best results, use a full-body photo taken from the front with
              good lighting
            </p>
          </div>

          <div
            className="upload-area"
            onClick={() => fileInputRef.current?.click()}
          >
            <div style={{ fontSize: 28 }}>⬆️</div>
            <div>Click to upload or drag and drop</div>
            <div style={{ color: "#99a" }}>PNG, JPG up to 10MB</div>
          </div>

          <div className="privacy-notice">
            <strong>Privacy Notice</strong>
            <div style={{ color: "#666" }}>
              Your photos are processed locally and stored securely. They are
              only used to generate your body profile for virtual try-on
              features.
            </div>
          </div>
        </div>
      )}

      {step === "profile" && (
        <div className="profile-container">
          <div className="success-banner">
            <strong>Photo Processed Successfully</strong>
            <div style={{ opacity: 0.9 }}>
              We've analyzed your body profile. Review and adjust the
              measurements below.
            </div>
          </div>

          <div className="preview-container">
            <div className="photo-preview">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt="Body profile"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ color: "#aaa" }}>Body Profile Preview</div>
              )}
            </div>
            <div className="measurements-form">
              <h3>Body Measurements</h3>

              <div className="form-group">
                <label>Height</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="number"
                    value={profile.heightFt}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        heightFt: Number(e.target.value),
                      })
                    }
                    style={{ width: 80 }}
                  />
                  <span>ft</span>
                  <input
                    type="number"
                    value={profile.heightIn}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        heightIn: Number(e.target.value),
                      })
                    }
                    style={{ width: 80 }}
                  />
                  <span>in</span>
                </div>
              </div>

              <div className="form-group">
                <label>Weight (optional)</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="number"
                    value={profile.weight ?? ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        weight: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    style={{ width: 120 }}
                  />
                  <span>lbs</span>
                </div>
              </div>

              <div className="form-group">
                <label>Body Type</label>
                <select
                  value={profile.bodyType}
                  onChange={(e) =>
                    setProfile({ ...profile, bodyType: e.target.value })
                  }
                >
                  <option>Athletic</option>
                  <option>Slim</option>
                  <option>Curvy</option>
                </select>
              </div>

              <div className="form-group">
                <label>Common Sizes</label>
                <div style={{ display: "flex", gap: 12 }}>
                  <select
                    value={profile.topsSize}
                    onChange={(e) =>
                      setProfile({ ...profile, topsSize: e.target.value })
                    }
                  >
                    <option value="">Tops</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                  </select>
                  <select
                    value={profile.bottomsSize}
                    onChange={(e) =>
                      setProfile({ ...profile, bottomsSize: e.target.value })
                    }
                  >
                    <option value="">Bottoms</option>
                    <option value="6">6</option>
                    <option value="8">8</option>
                    <option value="10">10</option>
                  </select>
                  <select
                    value={profile.shoesSize}
                    onChange={(e) =>
                      setProfile({ ...profile, shoesSize: e.target.value })
                    }
                  >
                    <option value="">Shoes</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                  </select>
                </div>
              </div>

              <div className="button-group">
                <button className="btn" onClick={onRetake} type="button">
                  Retake Photo
                </button>
                <button
                  className="btn btn-primary"
                  onClick={onSaveProfile}
                  type="button"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === "styling" && (
        <div className="styling-container">
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div className="upload-icon">
              <span style={{ fontSize: "32px" }}>👗</span>
            </div>
            <h2>Start Styling</h2>
            <p>
              Select items from the categories below to create your virtual
              outfit
            </p>
          </div>
          {/* 🔹 Body profile summary at top */}
          <div className="profile-summary">
            {(savedProfile?.imageUrl || photoUrl) && (
              <div className="profile-summary-photo">
                <img
                  src={savedProfile?.imageUrl || photoUrl!}
                  alt="Body profile"
                />
              </div>
            )}
            <div className="profile-summary-details">
              <h3>Your Body Profile</h3>
              <p>
                Height: {profile.heightFt}' {profile.heightIn}"
              </p>
              {profile.weight && <p>Weight: {profile.weight} lbs</p>}
              <p>Body type: {profile.bodyType}</p>
              <p>
                Sizes: Tops {profile.topsSize || "–"}, Bottoms{" "}
                {profile.bottomsSize || "–"}, Shoes {profile.shoesSize || "–"}
              </p>
            </div>
            {/* ✨ Edit button to go back to profile step */}
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setStep("profile")}
            >
              Edit body profile
            </button>
          </div>

          <div className="selected-items">
            {selectedItems.length === 0 && (
              <div
                style={{ color: "#888", width: "100%", textAlign: "center" }}
              >
                No items selected yet
              </div>
            )}
            {selectedItems.map((it) => (
              <div key={it.id} className="selected-item">
                {it.image ? (
                  <img
                    src={it.image}
                    alt={it.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div style={{ padding: 8, fontSize: 11 }}>{it.title}</div>
                )}
              </div>
            ))}
          </div>

          <div className="ai-generator-card">
            <div className="ai-generator-header">
              <div>
                <h3 style={{ margin: 0 }}>AI Outfit Generator</h3>
              </div>
              <button className="btn btn-primary" onClick={generateOutfit} disabled={aiLoading}>
                {aiLoading ? 'Generating…' : 'Generate outfit'}
              </button>
            </div>

            <div className="ai-meta">
              <span>{selectedItems.length} item{selectedItems.length === 1 ? '' : 's'} selected</span>
              <span>OpenAI image generation • 1024x1024</span>
            </div>

            {aiError && <div className="ai-error">{aiError}</div>}

            {aiImageUrl && (
              <div className="ai-result">
                <img src={aiImageUrl} alt="AI generated outfit" />
              </div>
            )}
          </div>

          {/* Group items by tag and create a section for each tag */}
          {loading ? (
            <div
              style={{ textAlign: "center", padding: "40px", color: "#888" }}
            >
              Loading items...
            </div>
          ) : items.length === 0 ? (
            <div
              style={{ textAlign: "center", padding: "40px", color: "#888" }}
            >
              No items found in your wardrobe
            </div>
          ) : (
            Array.from(new Set(items.map((item) => item.tag))).map((tag) => (
              <div key={tag} className="category-section">
                <h3>{tag}</h3>
                <CategorySlider
                  items={items.filter((item) => item.tag === tag)}
                  onToggle={toggleSelectItem}
                  selectedIds={selectedItems.map((s) => s.id)}
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
