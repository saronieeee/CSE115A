import React from 'react';
import { NavLink } from 'react-router-dom';
import './BottomNav.css';
import { WardrobeIcon, AIIcon, OutfitsIcon, ProfileIcon } from './Icons';

const BottomNav: React.FC = () => {
  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      <NavLink to="/" end className={({ isActive }: { isActive: boolean }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <WardrobeIcon className="nav-icon" />
        <span className="nav-label">Wardrobe</span>
      </NavLink>

      <NavLink to="/ai" className={({ isActive }: { isActive: boolean }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <AIIcon className="nav-icon" />
        <span className="nav-label">AI</span>
      </NavLink>

      <NavLink to="/outfits" className={({ isActive }: { isActive: boolean }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <OutfitsIcon className="nav-icon" />
        <span className="nav-label">Outfits</span>
      </NavLink>

      <NavLink to="/profile" className={({ isActive }: { isActive: boolean }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <ProfileIcon className="nav-icon" />
        <span className="nav-label">Profile</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
