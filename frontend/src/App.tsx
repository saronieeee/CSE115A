import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import Wardrobe from './pages/Wardrobe';
import AI from './pages/AI';
import Outfits from './pages/Outfits';
import Profile from './pages/Profile';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ResetPassword from './pages/ResetPassword';
import BottomNav from './components/BottomNav';

function App(): JSX.Element {
  const Layout = () => {
    const location = useLocation();
    const hideNav = ['/', '/signin', '/signup', '/reset-password'].includes(location.pathname);
    return (
      <div className="app-container">
        <main className={`content${hideNav ? ' auth-content' : ''}`}>
          <Routes>
            {/* Show auth first */}
            <Route path="/" element={<SignIn />} />
            {/* Move Wardrobe to its own path to avoid clobbering auth as the landing page */}
            <Route path="/wardrobe" element={<Wardrobe />} />
            <Route path="/ai" element={<AI />} />
            <Route path="/outfits" element={<Outfits />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
        </main>
        {!hideNav && <BottomNav />}
      </div>
    );
  };

  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;
