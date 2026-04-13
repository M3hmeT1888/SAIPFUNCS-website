import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Lvl5() {
  const navigate = useNavigate();

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const isResizing = useRef(false);
  
  const baseUnitSize = 50; 
  
  const [funcText, setFuncText] = useState(''); 
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [autoStart, setAutoStart] = useState(false);
  const [winStatus, setWinStatus] = useState(false);

  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(0.8); 

  const gravity = 0.0002; 
  const friction = 0.999; 

  // YENİ: Başlangıç ve hedef koordinatları isteğine göre güncellendi.
  const levelConfig = { bx: -10, by: 10, tx: 8, ty: 4 };
  
  const ballRef = useRef({ x: levelConfig.bx, y: levelConfig.by, vx: 0, vy: 0 });
  const checkpointRef = useRef({ x: levelConfig.bx, y: levelConfig.by });
  const targetRef = useRef({ x: levelConfig.tx, y: levelConfig.ty }); 

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
      setIsPlaying(true); setIsPaused(false); setWinStatus(false);
    }
  };

  const resetSim = () => {
    setIsPlaying(false); setIsPaused(false);
    ballRef.current = { ...checkpointRef.current, vx: 0, vy: 0 };
  };

  const finishGame = () => {
    navigate('/infinitemode'); 
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

      // Grid çizimi
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

      // Engellerin çizimi
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ef4444';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ef4444';

      const o1X = cx + (-3) * currentUnitSize;
      const o1Y = cy - (16) * currentUnitSize; // y=1'den başlayıp yukarı doğru gidecek
      const o1W = 6 * currentUnitSize;
      const o1H = 15 * currentUnitSize;
      ctx.fillRect(o1X, o1Y, o1W, o1H);
      ctx.strokeRect(o1X, o1Y, o1W, o1H);

      // YENİ: Büyük engel (o2) artık aşağıda bir zemin
      const o2X = cx + (-15) * currentUnitSize;
      const o2Y = cy - (-5) * currentUnitSize; // y=-5'ten başlayıp aşağı doğru gidecek
      const o2W = 30 * currentUnitSize;
      const o2H = 10 * currentUnitSize;
      ctx.fillRect(o2X, o2Y, o2W, o2H);
      ctx.strokeRect(o2X, o2Y, o2W, o2H);

      ctx.shadowBlur = 0;

      // Hedef çizimi
      const tx = cx + targetRef.current.x * currentUnitSize; const ty = cy - targetRef.current.y * currentUnitSize;
      ctx.beginPath(); ctx.ellipse(tx, ty, 24 * zoomRef.current, 8 * zoomRef.current, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#020617'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = '#a855f7'; ctx.shadowBlur = 20; ctx.shadowColor = '#a855f7'; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(tx, ty, 12 * zoomRef.current, 3 * zoomRef.current, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#d8b4fe'; ctx.lineWidth = 1; ctx.shadowBlur = 0; ctx.stroke();

      // Fonksiyon çizimi
      ctx.beginPath(); ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 4;
      for (let sx = 0; sx < canvas.width; sx += 2) { 
        const mx = (sx - cx) / currentUnitSize; const my = getFuncY(mx); const sy = cy - (my * currentUnitSize);
        if (sx === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      // Top çizimi
      const bx = cx + ballRef.current.x * currentUnitSize; const by = cy - ballRef.current.y * currentUnitSize;
      ctx.beginPath(); ctx.arc(bx, by, 12 * zoomRef.current, 0, Math.PI * 2); ctx.fillStyle = '#f43f5e'; ctx.fill();

      if (isPlaying) for(let i=0; i<4; i++) updatePhysics(canvas, cx, cy, currentUnitSize);
      animationFrameId = window.requestAnimationFrame(render);
    };

    const updatePhysics = (canvas, cx, cy, currentUnitSize) => {
      const b = ballRef.current;
      b.vy -= gravity; 
      b.x += b.vx; 
      b.y += b.vy;
      const lineY = getFuncY(b.x);
      
      if (b.x > -3 && b.x < 3 && b.y > 1) {
        if (autoStart) ballRef.current = { ...checkpointRef.current, vx: 0, vy: 0 }; 
        else resetSim();
        return; 
      }
      // Alttaki zemine çarpma (y < -5)
      if (b.y < -5) {
        if (autoStart) ballRef.current = { ...checkpointRef.current, vx: 0, vy: 0 }; 
        else resetSim();
        return; 
      }

      if (b.y - 0.24 <= lineY && b.y - 0.24 > lineY - 2.0) {
        b.y = lineY + 0.24;
        const dx = 0.01; const y1 = getFuncY(b.x - dx); const y2 = getFuncY(b.x + dx);
        const derivative = (y2 - y1) / (2 * dx); 
        const slopeEffect = derivative * 0.0005; 
        b.vx -= slopeEffect; 
        b.vy = derivative * b.vx; 
        b.vx *= friction; 
      }

      const distToTarget = Math.hypot(b.x - targetRef.current.x, b.y - targetRef.current.y);
      if (distToTarget < 0.45) {
        setWinStatus(true); setIsPlaying(false);
      }

      const bx_px = cx + b.x * currentUnitSize; const by_px = cy - b.y * currentUnitSize;
      if (bx_px < -100 || bx_px > canvas.width + 100 || by_px < -100 || by_px > canvas.height + 100) {
        if (autoStart) ballRef.current = { ...checkpointRef.current, vx: 0, vy: 0 }; else resetSim();
      }
    };
    
    render();
    return () => { window.cancelAnimationFrame(animationFrameId); window.removeEventListener('resize', resize); };
  }, [funcText, isPlaying, isPaused, autoStart]); 

  return (
    <div className="h-screen w-screen bg-[#020617] flex overflow-hidden font-mono text-slate-300">
      <aside style={{ width: `${sidebarWidth}px` }} className="bg-[#0f172a] border-r border-blue-500/30 flex flex-col shadow-2xl z-20 relative">
        <div className="p-6 border-b border-blue-500/20 bg-blue-500/5 text-center">
          <h2 className="text-blue-500 font-black tracking-widest text-xl uppercase italic">SAİPFUNCS.CO</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter opacity-80 mt-1">BÖLÜM 5: HAH GÖRMEDEN!</p>
        </div>
        
        <div className="flex-1 p-6 space-y-8 overflow-y-auto">
          <div className="space-y-6">
            
            <div className="p-4 bg-[#020617] rounded-lg border border-purple-500/30 relative">
              <span className="absolute -top-2 left-3 bg-[#0f172a] px-2 text-[10px] text-purple-400 font-bold uppercase tracking-widest">Denklem f(x)</span>
              
              <div className="flex items-center bg-[#0f172a] border border-slate-700 rounded-md overflow-hidden focus-within:border-purple-500 transition-colors mt-2 shadow-inner">
                <span className="text-xs text-slate-500 font-bold pl-3 pr-2 select-none italic">y =</span>
                <input 
                  type="text" 
                  value={funcText} 
                  onChange={(e) => setFuncText(e.target.value)} 
                  placeholder="Örn: 0.1x^2 - 3"
                  className="w-full bg-transparent text-purple-400 font-black text-sm py-4 outline-none tracking-wider"
                />
              </div>
              <p className="text-[9px] text-slate-500 mt-3 italic leading-relaxed">
                * Ortadaki engelin altından geçerek hedefe ulaşmalısın.<br/>
                * İpucu: Bu sefer pozitif bir parabol oluşturup, dip noktasını (Y-Keseni) hassas bir şekilde ayarlaman gerekiyor.
              </p>
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
        
        <div className="p-4 border-t border-slate-800 flex flex-col relative text-center">
          <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            BÖLÜM 5 / 5 (FİNAL)
          </div>
        </div>
        <div onMouseDown={() => { isResizing.current = true; document.body.style.cursor = 'ew-resize'; }} className="absolute top-0 right-0 w-3 h-full cursor-ew-resize hover:bg-blue-500/30 transition-colors z-30"></div>
      </aside>
      
      <main className="flex-1 relative bg-[#020617] overflow-hidden" ref={containerRef}>
        <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />
        
        <button onClick={() => navigate('/')} className="absolute top-6 right-6 px-6 py-2 bg-[#0f172a] border border-blue-500 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-lg font-bold tracking-widest z-10">MENÜ</button>
        
        {winStatus && (
          <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md flex flex-col items-center justify-center z-50">
            <h2 className="text-6xl font-black text-emerald-500 mb-8 animate-pulse drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]">OYUNU BİTİRDİN!</h2>
            <div className="flex gap-4">
              <button onClick={() => navigate('/levels')} className="px-8 py-4 border-2 border-slate-600 text-slate-300 font-bold hover:bg-slate-800 rounded-xl transition-all tracking-widest">BÖLÜMLER</button>
              <button onClick={finishGame} className="px-8 py-4 bg-emerald-600 text-white font-black rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:bg-emerald-500 hover:scale-105 transition-all tracking-widest">SONSUZ MODA GEÇ</button>
            </div>
          </div>
        )}
        
        <div className="absolute bottom-10 right-10 text-right pointer-events-none opacity-40">
          <p className="text-4xl font-black text-purple-400 italic drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]">y = {funcText || "0"}</p>
        </div>
      </main>
    </div>
  );
}