import React from 'react';
import './Profile.css';
import StatCard from '../components/StatCard';
import HistoryItem from '../components/HistoryItem';
import ForgottenFinds from '../components/ForgottenFinds';

type Stat = { title: string; value: string; sub?: string; positive?: boolean };
type History = { name: string; subtitle?: string; count: number; icon: 'sneaker' | 'shirt' };
type ProfileData = {
  name: string;
  email: string;
  stats: Stat[];
  history: History[];
  forgotten?: { id: string; name: string; subtitle?: string; count: number }[];
};

const mockProfile: ProfileData = {
  name: 'Jane Doe',
  email: 'jane.doe@email.com',
  stats: [
    { title: 'Total Items', value: '124', sub: '+3 this month', positive: true },
    { title: 'Outfits', value: '32', sub: '12 AI-generated' },
    { title: 'Most Worn', value: 'Sneakers', sub: '15 times' },
    { title: 'Favorites', value: '24', sub: '19% of wardrobe' },
  ],
  history: [
    { name: 'Sneakers', subtitle: 'Most worn item', count: 15, icon: 'sneaker' },
    { name: 'White Shirt', subtitle: 'Second most worn', count: 12, icon: 'shirt' },
  ],
  forgotten: [
    { id: 'f1', name: 'Black Dress', subtitle: "Not worn in 3 months", count: 3 },
  ],
};

const initials = (fullName: string) =>
  fullName
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const Profile: React.FC = () => {
  const data = mockProfile;

  return (
    <div className="profile-page">
      <section className="profile-card">
        <div className="profile-avatar">{initials(data.name)}</div>
        <div className="profile-info">
          <h2 className="profile-name">{data.name}</h2>
          <p className="profile-email">{data.email}</p>
        </div>
      </section>

      <h3 className="section-title">Wardrobe Statistics</h3>
      <section className="stats-grid">
        {data.stats.map((s) => (
          <StatCard key={s.title} title={s.title} value={s.value} sub={s.sub} positive={s.positive} />
        ))}
      </section>

      <h3 className="section-title">Wearing History</h3>
      <section className="history-list">
        {data.history.map((h) => (
          <HistoryItem key={h.name} name={h.name} subtitle={h.subtitle} count={h.count} icon={h.icon} />
        ))}
      </section>
      
      <h3 className="section-title">Forgotten Finds</h3>
      <ForgottenFinds items={data.forgotten ?? []} />

      <div className="notice">You have 8 items that haven't been worn in over 2 months</div>
    </div>
  );
};

export default Profile;
