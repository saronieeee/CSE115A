import React from 'react';

type StatCardProps = {
  title: string;
  value?: string | number;
  sub?: string;
  positive?: boolean;
  className?: string;
  imageUrl?: string | null;
  icon?: React.ReactNode;
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  sub,
  positive,
  className,
  imageUrl,
  icon,
}) => {
  return (
    <div className={`stat-card ${className ?? ''}`}>
      <div className="stat-card-header">
        <div className="stat-title">{title}</div>
        {icon && <span className="stat-icon">{icon}</span>}
      </div>
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
