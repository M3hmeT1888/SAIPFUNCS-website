import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4 text-center overflow-hidden relative font-mono">
      <button 
        onClick={() => navigate('/extra')} 
        className="absolute top-6 right-6 w-12 h-12 border-2 border-blue-500/50 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg flex items-center justify-center transition-all z-20 group text-xl font-bold shadow-[0_0_15px_rgba(59,130,246,0.3)]"
      >
        +
      </button>
      
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#020617] to-[#020617]"></div>
      
      <div className="relative z-10 space-y-12">
        <h1 className="text-8xl font-black text-white tracking-tighter italic uppercase drop-shadow-2xl">
          SAİP<span className="text-blue-500">FUNCS.CO</span>
        </h1>
        
        <div className="flex flex-col md:flex-row gap-6 justify-center">
          <button 
            onClick={() => navigate('/sandbox')}
            className="px-12 py-6 bg-[#020617] border-2 border-blue-600 text-blue-400 font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] uppercase tracking-widest hover:scale-105"
          >
            Sandbox Modu
          </button>

          <button 
            onClick={() => navigate('/infinitemode')}
            className="px-12 py-6 bg-[#020617] border-2 border-purple-600 text-purple-400 font-bold rounded-xl hover:bg-purple-600 hover:text-white transition-all shadow-[0_0_20px_rgba(147,51,234,0.2)] uppercase tracking-widest hover:scale-105"
          >
            Sonsuz Mod
          </button>
          
          <button 
            onClick={() => navigate('/levels')}
            className="px-12 py-6 bg-[#020617] border-2 border-emerald-600 text-emerald-400 font-bold rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] uppercase tracking-widest hover:scale-105"
          >
            Bölümler
          </button>
        </div>
      </div>
    </div>
  );
}