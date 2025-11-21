import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";
import StatCard from "../components/StatCard";
import HistoryItem from "../components/HistoryItem";
import ForgottenFinds from "../components/ForgottenFinds";
import { supabase } from "../lib/supabaseClient";

type Stat = {
  title: string;
  value?: string;
  sub?: string;
  positive?: boolean;
  imageUrl?: string | null;
};

type ProfileInfo = {
  id: string;
  name?: string | null;
  email: string;
  avatarUrl?: string | null;
  bio?: string | null;
};

type DashboardPayload = {
  profile: ProfileInfo;
  stats: Stat[];
  history?: {
    name: string;
    subtitle?: string;
    count: number;
    icon: "sneaker" | "shirt";
  }[];
  forgotten?: { id: string; name: string; subtitle?: string; count: number }[];
};

const initials = (fullName: string) =>
  fullName
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const Profile: React.FC = () => {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [storedEmail, setStoredEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  // restore last email
  useEffect(() => {
    try {
      const saved = localStorage.getItem("DTI_USER_EMAIL");
      if (saved) setStoredEmail(saved);
    } catch {}
  }, []);

  // load profile from backend
  useEffect(() => {
    const controller = new AbortController();

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("DTI_ACCESS_TOKEN");
        if (!token) {
          setErr("sign in to view your profile.");
          setData(null);
          setLoading(false);
          return;
        }

        const storedUserId = localStorage.getItem('DTI_DEV_USER_ID') || undefined;
        const candidateUrls = ['/api/profile/me/dashboard'];
        if (storedUserId) {
          candidateUrls.push(`/api/profile/${storedUserId}/dashboard`);
        }

        let lastError: string | null = null;

        for (const url of candidateUrls) {
          try {
            const res = await fetch(url, {
              headers: { Authorization: `Bearer ${token}` },
              signal: controller.signal,
            });

            const contentType = res.headers.get('content-type') ?? '';
            let payload: any;
            if (contentType.includes('application/json')) {
              payload = await res.json();
            } else {
              const text = await res.text();
              try {
                payload = JSON.parse(text);
              } catch {
                payload = text;
              }
            }

            if (!res.ok) {
              const message =
                (payload && typeof payload === 'object' && 'error' in payload && (payload as any).error) ||
                (typeof payload === 'string' ? payload : null) ||
                `Failed to load profile (${res.status})`;

              lastError = message;

              if (res.status === 404 && url.includes('/me/')) {
                continue;
              }

              throw new Error(message);
            }

            if (!payload || typeof payload !== 'object') {
              lastError = 'Malformed profile response';
              continue;
            }

            setData(payload as DashboardPayload);
            setErr(null);
            return;
          } catch (innerErr: any) {
            if (innerErr?.name === 'AbortError') return;
            lastError = innerErr?.message || 'Failed to load profile';
          }
        }

        throw new Error(lastError || 'Failed to load profile');
      } catch (error: any) {
        if (error?.name === 'AbortError') return;
        console.error('Profile load failed', error);
        setErr(error?.message || 'Failed to load profile');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    return () => controller.abort();
  }, []);

  // save latest email if found
  useEffect(() => {
    const latestEmail = data?.profile?.email?.trim();
    if (!latestEmail) return;
    try {
      localStorage.setItem("DTI_USER_EMAIL", latestEmail);
      setStoredEmail(latestEmail);
    } catch {}
  }, [data?.profile?.email]);

  if (loading) {
    return (
      <div className="profile-page">
        <p>Loading your wardrobe profile...</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="profile-page">
        <p>{err}</p>
      </div>
    );
  }

  if (!data) return null;

  const profile = data.profile;
  const displayName = profile.name?.trim();
  const avatarLabel = displayName || profile.email;
  const displayEmail =
    profile.email?.trim() || storedEmail?.trim() || "Email unavailable";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/signin");
  };

  return (
    <div className="profile-page">
      <button className="logout-btn" onClick={handleLogout}>
        Log Out
      </button>

      <section className="profile-card">
        {profile.avatarUrl ? (
          <img
            className="profile-avatar"
            src={profile.avatarUrl}
            alt={avatarLabel}
          />
        ) : (
          <div className="profile-avatar">{initials(avatarLabel)}</div>
        )}
        <div className="profile-info">
          {displayName && <h2 className="profile-name">{displayName}</h2>}
          <p className="profile-email">{displayEmail}</p>
        </div>
      </section>

      <h3 className="section-title">Wardrobe Statistics</h3>
      <section className="stats-grid">
        {(data.stats ?? []).map((s) => {
          return (
            <StatCard
              key={s.title}
              title={s.title}
              value={s.value ?? ""}
              sub={s.sub}
              positive={s.positive}
            />
          );
        })}
      </section>

      {data.history && (
        <>
          <h3 className="section-title">Wearing History</h3>
          <section className="history-list">
            {data.history.map((h) => (
              <HistoryItem
                key={h.name}
                name={h.name}
                subtitle={h.subtitle}
                count={h.count}
                icon={h.icon}
              />
            ))}
          </section>
        </>
      )}

      <h3 className="section-title">Forgotten Finds</h3>
      <ForgottenFinds items={data.forgotten ?? []} />

      <div className="notice">
        You have items that haven't been worn in a while
      </div>
    </div>
  );
};

export default Profile;
