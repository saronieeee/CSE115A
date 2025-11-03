import React from 'react';
import { ShirtIcon } from './Icons';

type ForgottenItem = {
  id: string;
  name: string;
  subtitle?: string;
  count: number;
};

type ForgottenFindsProps = {
  items: ForgottenItem[];
};

const ForgottenFinds: React.FC<ForgottenFindsProps> = ({ items }) => {
  return (
    <div className="forgotten-card">
      <h4 className="forgotten-title">Forgotten Finds</h4>

      <div className="forgotten-list">
        {items.map((it) => (
          <div className="forgotten-item" key={it.id}>
            <div className="forgotten-left">
              <div className="forgotten-icon"><ShirtIcon /></div>
              <div className="forgotten-info">
                <div className="forgotten-name">{it.name}</div>
                {it.subtitle && <div className="forgotten-sub">{it.subtitle}</div>}
              </div>
            </div>

            <div className="forgotten-badge">{it.count} wears</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForgottenFinds;
