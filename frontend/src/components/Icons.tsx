import React from 'react';

type IconProps = { className?: string; title?: string };

export const WardrobeIcon: React.FC<IconProps> = ({ className, title = 'Wardrobe' }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <title>{title}</title>
    <path d="M3 6h18v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6z" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 6V4a2 2 0 1 1 4 0v2" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 6V4a2 2 0 1 1 4 0v2" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const AIIcon: React.FC<IconProps> = ({ className, title = 'AI' }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <title>{title}</title>
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="#374151" strokeWidth="1.2"/>
    <path d="M8 8h8M8 12h8M8 16h5" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const OutfitsIcon: React.FC<IconProps> = ({ className, title = 'Outfits' }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <title>{title}</title>
    <path d="M12 2l3 4h4v12a1 1 0 0 1-1 1h-14a1 1 0 0 1-1-1V6h4l3-4z" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 14h6" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ProfileIcon: React.FC<IconProps> = ({ className, title = 'Profile' }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <title>{title}</title>
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 20a8 8 0 0 1 16 0" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ className, title = 'Settings' }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <title>{title}</title>
    <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 2.3 16.9l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09c.7 0 1.3-.39 1.51-1a1.65 1.65 0 0 0-.33-1.82L4.3 3.7A2 2 0 1 1 7.13.87l.06.06c.48.48 1.1.77 1.82.77h.09c.7 0 1.3.39 1.51 1A1.65 1.65 0 0 0 12 4.09V4a2 2 0 1 1 4 0v.09c.7 0 1.3.39 1.51 1 .24.6.86 1 1.56 1H21a2 2 0 1 1 0 4h-.09c-.7 0-1.3.39-1.51 1-.24.6-.86 1-1.56 1H19a2 2 0 1 1-3.6 1.1z" stroke="#374151" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const BellIcon: React.FC<IconProps> = ({ className, title = 'Notifications' }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <title>{title}</title>
    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 1 0-3 0v.68C7.64 5.36 6 7.92 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1h6z" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const SneakerIcon: React.FC<IconProps> = ({ className, title = 'Sneakers' }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <title>{title}</title>
    <path d="M2 12s2-4 7-4 7 4 11 4v3H2v-3z" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 8v4" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ShirtIcon: React.FC<IconProps> = ({ className, title = 'Shirt' }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <title>{title}</title>
    <path d="M4 7l4-2 2 2 2-2 4 2v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7z" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default {};
