import React from 'react';
import { SneakerIcon, ShirtIcon } from './Icons';

type HistoryItemProps = {
  name: string;
  subtitle?: string;
  count: number;
  icon: 'sneaker' | 'shirt';
};

const HistoryItem: React.FC<HistoryItemProps> = ({ name, subtitle, count, icon }) => {
  return (
    <div className="history-item">
      <div className="item-icon">{icon === 'sneaker' ? <SneakerIcon /> : <ShirtIcon />}</div>
      <div className="item-info">
        <div className="item-name">{name}</div>
        {subtitle && <div className="item-sub">{subtitle}</div>}
      </div>
      <div className="item-badge">{count} wears</div>
    </div>
  );
};

export default HistoryItem;
