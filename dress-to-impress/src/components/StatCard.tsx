import React from 'react';

type StatCardProps = {
  title: string;
  value: string | number;
  sub?: string;
  positive?: boolean;
  className?: string;
};

const StatCard: React.FC<StatCardProps> = ({ title, value, sub, positive, className }) => {
  return (
    <div className={`stat-card ${className ?? ''}`}>
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className={`stat-sub ${positive ? 'stat-positive' : ''}`}>{sub}</div>}
    </div>
  );
};

export default StatCard;
