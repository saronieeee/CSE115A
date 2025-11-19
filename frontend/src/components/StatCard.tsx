import React from 'react';

type StatCardProps = {
  title: string;
  value?: string | number;
  sub?: string;
  positive?: boolean;
  className?: string;
  imageUrl?: string | null;
};

const StatCard: React.FC<StatCardProps> = ({ title, value, sub, positive, className, imageUrl }) => {
  return (
    <div className={`stat-card ${className ?? ''}`}>
      <div className="stat-title">{title}</div>
      {imageUrl ? (
        <div className="stat-image-wrapper">
          <img src={imageUrl} alt={title} className="stat-image" />
        </div>
      ) : (
        <div className="stat-value">{value ?? '—'}</div>
      )}
      {sub && <div className={`stat-sub ${positive ? 'stat-positive' : ''}`}>{sub}</div>}
    </div>
  );
};

export default StatCard;
