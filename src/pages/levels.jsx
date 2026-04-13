import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Levels() {
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState(() => parseInt(localStorage.getItem('unlockedLevel')) || 1);

  const levelNames = [
    "BAŞLANGIÇ",
    "İŞLER KIZIŞIYOR",
    "DOĞRU ZAMAN doğru adam",
    "ATEŞTEN GÖMLEK",
    "HAH GÖRMEDEN!"
  ];

  return (
    <div className="min-h-screen bg-[#020617] p-8 font-mono text-slate-300">
      <button 
        onClick={() => navigate('/')} 
        className="mb-12 text-blue-500 hover:text-white transition-colors hover:underline tracking-widest"
      >
        ← ANA MENÜ
      </button>
      
      <h2 className="text-4xl font-black text-center mb-12 uppercase italic tracking-widest">BÖLÜMLER</h2>
      
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-6">
        {[...Array(5)].map((_, i) => {
          const levelNum = i + 1;
          const isLocked = levelNum > unlocked;

          return (
            <button
              key={levelNum}
              disabled={isLocked}
              onClick={() => navigate(`/lvl${levelNum}`)}
              className={`h-40 rounded-2xl border-2 flex flex-col items-center justify-center p-4 transition-all duration-300 relative group
                ${isLocked 
                  ? 'border-slate-800/50 text-slate-800 bg-slate-900/20 cursor-not-allowed' 
                  : 'border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:scale-105'
                }
              `}
            >
              <span className="text-4xl font-black mb-2">{isLocked ? '🔒' : levelNum}</span>
              {!isLocked && (
                <span className="text-[10px] font-bold text-center tracking-widest uppercase opacity-80 group-hover:text-slate-900 mt-2">
                  {levelNames[i]}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}