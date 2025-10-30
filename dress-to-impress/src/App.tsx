import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Wardrobe from './pages/Wardrobe';
import AI from './pages/AI';
import Outfits from './pages/Outfits';
import Profile from './pages/Profile';
import BottomNav from './components/BottomNav';

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <div className="app-container">
        <main className="content">
          <Routes>
            <Route path="/" element={<Wardrobe />} />
            <Route path="/ai" element={<AI />} />
            <Route path="/outfits" element={<Outfits />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>

        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
