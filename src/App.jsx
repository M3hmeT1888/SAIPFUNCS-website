import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Home from './pages/home';
import Levels from './pages/levels';
import Sandbox from './pages/sandbox';
import InfiniteMode from './pages/infinitemode';
import Lvl1 from './pages/lvl1';
import Lvl2 from './pages/lvl2';
import Lvl3 from './pages/lvl3';
import Lvl4 from './pages/lvl4';
import Lvl5 from './pages/lvl5';
import Extra from './pages/extra';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/levels" element={<Levels />} />
      <Route path="/sandbox" element={<Sandbox />} />
      <Route path="/infinitemode" element={<InfiniteMode />} />
      <Route path="/lvl1" element={<Lvl1 />} />
      <Route path="/lvl2" element={<Lvl2 />} />
      <Route path="/lvl3" element={<Lvl3 />} />
      <Route path="/lvl4" element={<Lvl4 />} />
      <Route path="/lvl5" element={<Lvl5 />} />
      <Route path="/extra" element={<Extra />} />
    </Routes>
  );
}