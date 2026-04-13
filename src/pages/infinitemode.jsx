import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function InfiniteMode() {
  const navigate = useNavigate();

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const isResizing = useRef(false);
  
  const baseUnitSize = 50; 
  
  const [funcText, setFuncText] = useState(''); 
  const [score, setScore] = useState(0);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [autoStart, setAutoStart] = useState(false);
  const [winMsg, setWinMsg] = useState("");

  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(0.5); 

  const gravity = 0.0002; 
  const friction = 0.999; 

  const ballRef = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const checkpointRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 }); 

  const generateRandomLevel = () => {
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    
    let tx = rand(-15, 15);
    let ty = rand(-15, 5); 
    
    let bx = rand(-18, 18);
    let by = rand(ty + 4, 18); 

    if (Math.abs(bx - tx) < 4) {
      bx = bx > 0 ? bx - 6 : bx + 6;
    }

    ballRef.current = { x: bx, y: by, vx: 0, vy: 0 };
    checkpointRef.current = { x: bx, y: by };
    targetRef.current = { x: tx, y: ty };
    
    setFuncText("");
  };

  useEffect(() => {
    generateRandomLevel();
  }, []);

  useEffect(() => {
    const handleMouseMoveResize = (e) => {
      if (!isResizing.current) return;
      const newWidth = e.clientX;
      if (newWidth > 250 && newWidth < 800) setSidebarWidth(newWidth);
    };
    const handleMouseUpResize = () => { 
      isResizing.current = false; 
      document.body.style.cursor = 'default';
    };
    window.addEventListener('mousemove', handleMouseMoveResize);
    window.addEventListener('mouseup', handleMouseUpResize);
    return () => {
      window.removeEventListener('mousemove', handleMouseMoveResize);
      window.removeEventListener('mouseup', handleMouseUpResize);
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false); setIsPaused(true);
    } else if (isPaused) {
      setIsPlaying(true); setIsPaused(false);
    } else {
      ballRef.current = { ...checkpointRef.current, vx: 0, vy: 0 };
      setIsPlaying(true); setIsPaused(false); setWinMsg("");
    }
  };

  const resetSim = () => {
    setIsPlaying(false); setIsPaused(false);
    ballRef.current = { ...checkpointRef.current, vx: 0, vy: 0 };
  };

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Enter') togglePlay(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isPaused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      if (containerRef.current) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;
      }
    };
    resize(); window.addEventListener('resize', resize);

    const getFuncY = (xVal) => {
      if (!funcText) return 0; 
      try {
        let expr = funcText.toLowerCase().replace(/\s+/g, ''); 
        expr = expr.replace(/\^/g, '**'); 
        expr = expr.replace(/(\d)([a-z\(])/g, "$1*$2"); 
        const f = new Function('x', `return ${expr};`);
        const res = f(xVal);
        return isNaN(res) || !isFinite(res) ? 0 : res;
      } catch (e) {
        return 0; 
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const currentUnitSize = baseUnitSize * zoomRef.current;
      const cx = canvas.width / 2 + panRef.current.x; 
      const cy = canvas.height / 2 + panRef.current.y;

      ctx.strokeStyle = 'rgba(59, 130, 246, 0.05)'; ctx.lineWidth = 1;
      const startX = Math.floor(-cx / currentUnitSize) - 1; const endX = Math.ceil((canvas.width - cx) / currentUnitSize) + 1;
      const startY = Math.floor((cy - canvas.height) / currentUnitSize) - 1; const endY = Math.ceil(cy / currentUnitSize) + 1;

      for (let x = startX; x <= endX; x++) {
        ctx.beginPath(); ctx.moveTo(cx + x * currentUnitSize, 0); ctx.lineTo(cx + x * currentUnitSize, canvas.height); ctx.stroke();
        if (x !== 0) { ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'; ctx.font = '10px monospace'; ctx.fillText(x, cx + x * currentUnitSize + 4, cy + 12); }
      }
      for (let y = startY; y <= endY; y++) {
        ctx.beginPath(); ctx.moveTo(0, cy - y * currentUnitSize); ctx.lineTo(canvas.width, cy - y * currentUnitSize); ctx.stroke();
        if (y !== 0) { ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'; ctx.font = '10px monospace'; ctx.fillText(y, cx + 6, cy - y * currentUnitSize - 4); }
      }

      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; 
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(canvas.width, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, canvas.height); ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; ctx.fillText("0", cx + 4, cy + 12);

      const tx = cx + targetRef.current.x * currentUnitSize; const ty = cy - targetRef.current.y * currentUnitSize;
      ctx.beginPath(); ctx.ellipse(tx, ty, 24 * zoomRef.current, 8 * zoomRef.current, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#020617'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = '#a855f7'; ctx.shadowBlur = 20; ctx.shadowColor = '#a855f7'; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(tx, ty, 12 * zoomRef.current, 3 * zoomRef.current, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#d8b4fe'; ctx.lineWidth = 1; ctx.shadowBlur = 0; ctx.stroke();

      ctx.beginPath(); ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 4;
      for (let sx = 0; sx < canvas.width; sx += 2) { 
        const mx = (sx - cx) / currentUnitSize; const my = getFuncY(mx); const sy = cy - (my * currentUnitSize);
        if (sx === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      const bx = cx + ballRef.current.x * currentUnitSize; const by = cy - ballRef.current.y * currentUnitSize;
      ctx.beginPath(); ctx.arc(bx, by, 12 * zoomRef.current, 0, Math.PI * 2); ctx.fillStyle = '#f43f5e'; ctx.fill();

      if (isPlaying) for(let i=0; i<4; i++) updatePhysics(canvas, cx, cy, currentUnitSize);
      animationFrameId = window.requestAnimationFrame(render);
    };

    const updatePhysics = (canvas, cx, cy, currentUnitSize) => {
      const b = ballRef.current;
      b.vy -= gravity; b.x += b.vx; b.y += b.vy;
      const lineY = getFuncY(b.x);
      
      if (b.y - 0.24 <= lineY && b.y - 0.24 > lineY - 2.0) {
        b.y = lineY + 0.24;
        const dx = 0.01; const y1 = getFuncY(b.x - dx); const y2 = getFuncY(b.x + dx);
        const derivative = (y2 - y1) / (2 * dx); 
        const slopeEffect = derivative * 0.0005; 
        b.vx -= slopeEffect; b.vy = derivative * b.vx; b.vx *= friction; 
      }

      const distToTarget = Math.hypot(b.x - targetRef.current.x, b.y - targetRef.current.y);
      if (distToTarget < 0.45) {
        b.x = 9999; 
        setIsPlaying(false);
        setScore(s => s + 1);
        setWinMsg("PORTALA GİRDİ!");
        setTimeout(() => {
          setWinMsg("");
          generateRandomLevel();
        }, 1500);
      }

      if (b.x < -25 || b.x > 25 || b.y < -25 || b.y > 25) {
        if (b.x !== 9999) { 
          if (autoStart) ballRef.current = { ...checkpointRef.current, vx: 0, vy: 0 }; else resetSim();
        }
      }
    };
    
    render();
    return () => { window.cancelAnimationFrame(animationFrameId); window.removeEventListener('resize', resize); };
  }, [funcText, isPlaying, isPaused, autoStart, winMsg]); 

  return (
    <div className="h-screen w-screen bg-[#020617] flex overflow-hidden font-mono text-slate-300">
      <aside style={{ width: `${sidebarWidth}px` }} className="bg-[#0f172a] border-r border-blue-500/30 flex flex-col shadow-2xl z-20 relative">
        <div className="p-6 border-b border-blue-500/20 bg-blue-500/5 text-center">
          <h2 className="text-blue-500 font-black tracking-widest text-xl uppercase italic">SAİPFUNCS.CO</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter opacity-80 mt-1">SONSUZ MOD</p>
        </div>
        
        <div className="flex-1 p-6 space-y-8 overflow-y-auto">
          <div className="space-y-6">
            
            <div className="flex flex-col items-center p-4 bg-[#020617] border border-blue-500/30 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">GÜNCEL SKOR</span>
              <span className="text-5xl font-black text-white">{score}</span>
            </div>

            <div className="p-4 bg-[#020617] rounded-lg border border-purple-500/30 relative mt-4">
              <span className="absolute -top-2 left-3 bg-[#0f172a] px-2 text-[10px] text-purple-400 font-bold uppercase tracking-widest">Denklem f(x)</span>
              
              <div className="flex items-center bg-[#0f172a] border border-slate-700 rounded-md overflow-hidden focus-within:border-purple-500 transition-colors mt-2 shadow-inner">
                <span className="text-xs text-slate-500 font-bold pl-3 pr-2 select-none italic">y =</span>
                <input 
                  type="text" 
                  value={funcText} 
                  onChange={(e) => setFuncText(e.target.value)} 
                  placeholder="Denklemi girin..."
                  className="w-full bg-transparent text-purple-400 font-black text-sm py-4 outline-none tracking-wider"
                />
              </div>
            </div>

          </div>
          
          <div className="space-y-4">
            <div className="flex gap-3">
              <button onClick={togglePlay} className={`flex-1 py-4 rounded-md font-black border-2 tracking-widest transition-all shadow-xl active:scale-95 ${isPlaying ? 'bg-amber-500 text-slate-900 border-amber-400 shadow-amber-500/20' : isPaused ? 'bg-emerald-500 text-slate-900 border-emerald-400 shadow-emerald-500/20' : 'bg-blue-600 text-white border-blue-400 hover:bg-blue-500 shadow-blue-500/20'}`}>{isPlaying ? 'DURAKLAT' : isPaused ? 'DEVAM ET' : 'BAŞLAT'}</button>
              {(isPlaying || isPaused) && <button onClick={resetSim} className="px-4 py-4 bg-rose-600 border-2 border-rose-400 text-white font-bold rounded-md hover:bg-rose-500 transition-all shadow-lg shadow-rose-600/20">⏹</button>}
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <span className="text-[10px] font-bold text-blue-400 italic">OTOMATİK TEKRAR</span>
              <button onClick={() => setAutoStart(!autoStart)} className={`w-10 h-5 rounded-full p-1 transition-all ${autoStart ? 'bg-blue-600' : 'bg-slate-800'}`}><div className={`w-3 h-3 bg-white rounded-full transform transition-transform ${autoStart ? 'translate-x-5' : ''}`}></div></button>
            </div>
          </div>
        </div>
        
        <div onMouseDown={() => { isResizing.current = true; document.body.style.cursor = 'ew-resize'; }} className="absolute top-0 right-0 w-3 h-full cursor-ew-resize hover:bg-blue-500/30 transition-colors z-30"></div>
      </aside>
      
      <main className="flex-1 relative bg-[#020617] overflow-hidden" ref={containerRef}>
        <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />
        
        <button onClick={() => navigate('/')} className="absolute top-6 right-6 px-6 py-2 bg-[#0f172a] border border-blue-500 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-lg font-bold tracking-widest z-10">MENÜ</button>
        
        <button onClick={generateRandomLevel} className="absolute bottom-6 left-6 px-6 py-2 bg-rose-600/20 border border-rose-500 text-rose-400 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-lg font-bold tracking-widest z-10">ZORU GEÇ</button>
        
        {winMsg && (
          <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
            <h2 className="text-6xl font-black text-emerald-500 mb-4 animate-bounce drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]">{winMsg}</h2>
            <p className="text-slate-300 tracking-widest animate-pulse">YENİ KOORDİNATLAR HESAPLANIYOR...</p>
          </div>
        )}
        
        <div className="absolute bottom-10 right-10 text-right pointer-events-none opacity-40">
          <p className="text-4xl font-black text-purple-400 italic drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]">y = {funcText || "0"}</p>
        </div>
      </main>
    </div>
  );
}   