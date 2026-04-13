import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Simulator() {
  const navigate = useNavigate();
  const query = new URLSearchParams(window.location.search);
  const mode = query.get('mode') || 'sandbox'; 
  const levelId = parseInt(query.get('id')) || 1;

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const isResizing = useRef(false);
  
  const baseUnitSize = 50; 
  
  const [params, setParams] = useState({ a: 0.50, b: 0.00 });
  const [inputMode, setInputMode] = useState('slider'); 
  const [funcText, setFuncText] = useState('x^2'); 
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [autoStart, setAutoStart] = useState(false);
  const [winStatus, setWinStatus] = useState(false);
  const [sandboxMsg, setSandboxMsg] = useState("");

  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const [viewChanged, setViewChanged] = useState(false); 
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragging = useRef(null); 

  const gravity = 0.0002; 
  const friction = 0.999; 

  const ballRef = useRef({ x: -5, y: 5, vx: 0, vy: 0 });
  const checkpointRef = useRef({ x: -5, y: 5 });
  const targetRef = useRef({ x: 5, y: -2 }); 

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

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      dragging.current = null;
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  useEffect(() => {
    if (mode === 'level') {
      const levels = {
        1: { bx: -6, by: 4, tx: 6, ty: -3, a: 0.2, b: 1 },
        2: { bx: -7, by: 6, tx: 5, ty: -4, a: -0.5, b: 0 },
        3: { bx: -4, by: 8, tx: 7, ty: 0, a: 1.2, b: -2 },
        4: { bx: -8, by: 2, tx: 4, ty: -6, a: 0.8, b: 3 },
        5: { bx: 0, by: 7, tx: 0, ty: -5, a: 0.1, b: 0 },
      };
      const l = levels[levelId] || levels[1];
      ballRef.current = { x: l.bx, y: l.by, vx: 0, vy: 0 };
      checkpointRef.current = { x: l.bx, y: l.by };
      targetRef.current = { x: l.tx, y: l.ty };
      setParams({ a: l.a, b: l.b || 0 });
      setInputMode('slider'); 
      panRef.current = { x: 0, y: 0 };
      zoomRef.current = 1;
      setViewChanged(false);
    }
  }, [levelId, mode]);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      setIsPaused(true);
    } else if (isPaused) {
      setIsPlaying(true);
      setIsPaused(false);
    } else {
      ballRef.current = { ...checkpointRef.current, vx: 0, vy: 0 };
      setIsPlaying(true);
      setIsPaused(false);
      setWinStatus(false);
      setSandboxMsg("");
    }
  };

  const resetSim = () => {
    setIsPlaying(false);
    setIsPaused(false);
    ballRef.current = { ...checkpointRef.current, vx: 0, vy: 0 };
  };

  const resetView = () => {
    panRef.current = { x: 0, y: 0 };
    zoomRef.current = 1;
    setViewChanged(false);
  };

  const nextLevel = () => {
    const next = levelId + 1;
    localStorage.setItem('unlockedLevel', next);
    navigate(`/simulator?mode=level&id=${next}`);
    setWinStatus(false);
    setIsPlaying(false);
    setIsPaused(false);
  };

  const getMouseCoord = (e) => {
    if (!canvasRef.current) return { mx: 0, my: 0, rawX: 0, rawY: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    
    const currentUnitSize = baseUnitSize * zoomRef.current;
    const cx = canvasRef.current.width / 2 + panRef.current.x;
    const cy = canvasRef.current.height / 2 + panRef.current.y;
    
    return {
      mx: (sx - cx) / currentUnitSize,
      my: (cy - sy) / currentUnitSize,
      rawX: sx,
      rawY: sy
    };
  };

  const onMouseDown = (e) => {
    const mouse = getMouseCoord(e);

    if (!isPlaying) {
      if (mode === 'sandbox') {
        const distBall = Math.hypot(mouse.mx - ballRef.current.x, mouse.my - ballRef.current.y);
        if (distBall < 0.6) { dragging.current = 'ball'; return; }

        const distTarget = Math.hypot(mouse.mx - targetRef.current.x, mouse.my - targetRef.current.y);
        if (distTarget < 0.55) { dragging.current = 'target'; return; }
      }
    }

    dragging.current = 'canvas';
    dragStartRef.current = { 
      x: mouse.rawX - panRef.current.x, 
      y: mouse.rawY - panRef.current.y 
    };
  };

  const onMouseMove = (e) => {
    if (!canvasRef.current) return;
    const mouse = getMouseCoord(e);

    if (!isPlaying) {
      const distBall = Math.hypot(mouse.mx - ballRef.current.x, mouse.my - ballRef.current.y);
      const distTarget = Math.hypot(mouse.mx - targetRef.current.x, mouse.my - targetRef.current.y);
      
      if (dragging.current === 'ball' || dragging.current === 'target') {
        canvasRef.current.style.cursor = 'grabbing'; 
      } else if (mode === 'sandbox' && (distBall < 0.6 || distTarget < 0.55)) {
        canvasRef.current.style.cursor = 'grab'; 
      } else if (dragging.current === 'canvas') {
        canvasRef.current.style.cursor = 'move';
      } else {
        canvasRef.current.style.cursor = 'grab'; 
      }
    } else {
      canvasRef.current.style.cursor = dragging.current === 'canvas' ? 'move' : 'crosshair';
    }

    if (!dragging.current) return;
    
    if (dragging.current === 'ball' && !isPlaying && mode === 'sandbox') {
      ballRef.current.x = mouse.mx;
      ballRef.current.y = mouse.my;
      checkpointRef.current = { x: mouse.mx, y: mouse.my };
    } else if (dragging.current === 'target' && !isPlaying && mode === 'sandbox') {
      targetRef.current.x = mouse.mx;
      targetRef.current.y = mouse.my;
    } else if (dragging.current === 'canvas') {
      panRef.current.x = mouse.rawX - dragStartRef.current.x;
      panRef.current.y = mouse.rawY - dragStartRef.current.y;
      setViewChanged(true);
    }
  };

  const onWheel = (e) => {
    const zoomSpeed = 0.1;
    if (e.deltaY < 0) {
      zoomRef.current = Math.min(zoomRef.current + zoomSpeed, 3); 
    } else {
      zoomRef.current = Math.max(zoomRef.current - zoomSpeed, 0.3); 
    }
    setViewChanged(true);
  };

  useEffect(() => {
    const handleKeyDown = (e) => { 
      if (e.key === 'Enter') togglePlay(); 
    };
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
    resize();
    window.addEventListener('resize', resize);

    const currentA = isNaN(parseFloat(params.a)) ? 0 : parseFloat(params.a);
    const currentB = isNaN(parseFloat(params.b)) ? 0 : parseFloat(params.b);

    const getFuncY = (xVal) => {
      if (inputMode === 'slider') return currentA * xVal + currentB;
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

      ctx.strokeStyle = 'rgba(59, 130, 246, 0.05)';
      ctx.lineWidth = 1;
      
      const startX = Math.floor(-cx / currentUnitSize) - 1;
      const endX = Math.ceil((canvas.width - cx) / currentUnitSize) + 1;
      const startY = Math.floor((cy - canvas.height) / currentUnitSize) - 1;
      const endY = Math.ceil(cy / currentUnitSize) + 1;

      for (let x = startX; x <= endX; x++) {
        ctx.beginPath(); ctx.moveTo(cx + x * currentUnitSize, 0); ctx.lineTo(cx + x * currentUnitSize, canvas.height); ctx.stroke();
        if (x !== 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.font = '10px monospace';
          ctx.fillText(x, cx + x * currentUnitSize + 4, cy + 12);
        }
      }
      
      for (let y = startY; y <= endY; y++) {
        ctx.beginPath(); ctx.moveTo(0, cy - y * currentUnitSize); ctx.lineTo(canvas.width, cy - y * currentUnitSize); ctx.stroke();
        if (y !== 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.font = '10px monospace';
          ctx.fillText(y, cx + 6, cy - y * currentUnitSize - 4);
        }
      }

      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; 
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(canvas.width, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, canvas.height); ctx.stroke();
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillText("0", cx + 4, cy + 12);

      const tx = cx + targetRef.current.x * currentUnitSize;
      const ty = cy - targetRef.current.y * currentUnitSize;
      
      ctx.beginPath();
      ctx.ellipse(tx, ty, 24 * zoomRef.current, 8 * zoomRef.current, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#020617'; 
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#a855f7'; 
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#a855f7';
      ctx.stroke();
      
      ctx.beginPath();
      ctx.ellipse(tx, ty, 12 * zoomRef.current, 3 * zoomRef.current, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#d8b4fe';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      ctx.stroke();

      ctx.beginPath(); 
      ctx.strokeStyle = inputMode === 'text' ? '#a855f7' : '#3b82f6'; 
      ctx.lineWidth = 4;
      
      for (let sx = 0; sx < canvas.width; sx += 2) { 
        const mx = (sx - cx) / currentUnitSize;
        const my = getFuncY(mx);
        const sy = cy - (my * currentUnitSize);
        if (sx === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      const bx = cx + ballRef.current.x * currentUnitSize;
      const by = cy - ballRef.current.y * currentUnitSize;
      ctx.beginPath(); ctx.arc(bx, by, 12 * zoomRef.current, 0, Math.PI * 2); 
      ctx.fillStyle = '#f43f5e'; ctx.fill();

      if (isPlaying) {
        for(let i=0; i<4; i++) updatePhysics(canvas, cx, cy, currentUnitSize);
      }
      animationFrameId = window.requestAnimationFrame(render);
    };

    const updatePhysics = (canvas, cx, cy, currentUnitSize) => {
      const b = ballRef.current;
      
      b.vy -= gravity;
      b.x += b.vx;
      b.y += b.vy;

      const lineY = getFuncY(b.x);
      
      if (b.y - 0.24 <= lineY && b.y - 0.24 > lineY - 2.0) {
        b.y = lineY + 0.24;
        
        const dx = 0.01;
        const y1 = getFuncY(b.x - dx);
        const y2 = getFuncY(b.x + dx);
        const derivative = (y2 - y1) / (2 * dx); 

        const slopeEffect = derivative * 0.0005; 
        b.vx -= slopeEffect; 
        b.vy = derivative * b.vx; 
        b.vx *= friction; 
      }

      const distToTarget = Math.hypot(b.x - targetRef.current.x, b.y - targetRef.current.y);
      if (distToTarget < 0.45) {
        if (mode === 'level') {
          setWinStatus(true);
          setIsPlaying(false);
        } else {
          setSandboxMsg("PORTALA GİRDİ!");
          setTimeout(() => setSandboxMsg(""), 2000);
          resetSim();
        }
      }

      const bx_px = cx + b.x * currentUnitSize;
      const by_px = cy - b.y * currentUnitSize;

      if (bx_px < -100 || bx_px > canvas.width + 100 || by_px < -100 || by_px > canvas.height + 100) {
        if (autoStart) {
            ballRef.current = { ...checkpointRef.current, vx: 0, vy: 0 };
        } else {
            resetSim();
        }
      }
    };

    render();
    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [params, inputMode, funcText, isPlaying, isPaused, autoStart, mode]); 

  const handleInputChange = (param, value) => {
    setParams(prev => ({ ...prev, [param]: value }));
  };

  const handleBlur = (param) => {
    if (params[param] === '' || params[param] === '-' || isNaN(parseFloat(params[param]))) {
      setParams(prev => ({ ...prev, [param]: 0 }));
    }
  };

  const currentA = isNaN(parseFloat(params.a)) ? 0 : parseFloat(params.a);
  const currentB = isNaN(parseFloat(params.b)) ? 0 : parseFloat(params.b);

  return (
    <div className="h-screen w-screen bg-[#020617] flex overflow-hidden font-mono text-slate-300">
      
      <aside style={{ width: `${sidebarWidth}px` }} className="bg-[#0f172a] border-r border-blue-500/30 flex flex-col shadow-2xl z-20 relative">
        <div className="p-6 border-b border-blue-500/20 bg-blue-500/5 text-center">
          <h2 className="text-blue-500 font-black tracking-widest text-xl uppercase italic">SAİPFUNCS.CO</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter opacity-80 mt-1">{mode === 'sandbox' ? 'SANDBOX MODU' : `BÖLÜM ${levelId}`}</p>
        </div>

        <div className="flex-1 p-6 space-y-8 overflow-y-auto">
          
          <div className="space-y-6">
            
            {mode === 'sandbox' && (
              <div className="flex gap-2 p-1 bg-[#020617] rounded-lg border border-slate-800">
                <button 
                  onClick={() => setInputMode('slider')} 
                  className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded transition-colors ${inputMode === 'slider' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                >
                  Sürükleme
                </button>
                <button 
                  onClick={() => setInputMode('text')} 
                  className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded transition-colors ${inputMode === 'text' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                >
                  Yazma
                </button>
              </div>
            )}

            {inputMode === 'slider' ? (
              <>
                <div className="p-4 bg-[#020617] rounded-lg border border-slate-800 relative">
                  <span className="absolute -top-2 left-3 bg-[#0f172a] px-2 text-[10px] text-blue-400 font-bold uppercase">Eğim (A)</span>
                  <div className="flex items-center gap-3 mt-3">
                    <input type="range" min="-5" max="5" step="0.01" value={currentA} onChange={(e) => handleInputChange('a', e.target.value)} className="flex-1 h-1 bg-slate-800 accent-blue-500 cursor-pointer" />
                    <div className="flex items-center bg-[#0f172a] border border-slate-700 rounded-md overflow-hidden focus-within:border-blue-500 transition-colors">
                      <span className="text-[10px] text-slate-500 font-bold pl-2 pr-1 select-none">A=</span>
                      <input type="number" step="0.01" value={params.a} onChange={(e) => handleInputChange('a', e.target.value)} onBlur={() => handleBlur('a')} className="w-16 bg-transparent text-blue-400 font-bold text-xs py-1 outline-none text-center [&::-webkit-inner-spin-button]:appearance-none" />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#020617] rounded-lg border border-slate-800 relative">
                  <span className="absolute -top-2 left-3 bg-[#0f172a] px-2 text-[10px] text-blue-400 font-bold uppercase">Y-Keseni (B)</span>
                  <div className="flex items-center gap-3 mt-3">
                    <input type="range" min="-8" max="8" step="0.01" value={currentB} onChange={(e) => handleInputChange('b', e.target.value)} className="flex-1 h-1 bg-slate-800 accent-blue-500 cursor-pointer" />
                    <div className="flex items-center bg-[#0f172a] border border-slate-700 rounded-md overflow-hidden focus-within:border-blue-500 transition-colors">
                      <span className="text-[10px] text-slate-500 font-bold pl-2 pr-1 select-none">B=</span>
                      <input type="number" step="0.01" value={params.b} onChange={(e) => handleInputChange('b', e.target.value)} onBlur={() => handleBlur('b')} className="w-16 bg-transparent text-blue-400 font-bold text-xs py-1 outline-none text-center [&::-webkit-inner-spin-button]:appearance-none" />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-4 bg-[#020617] rounded-lg border border-purple-500/30 relative">
                <span className="absolute -top-2 left-3 bg-[#0f172a] px-2 text-[10px] text-purple-400 font-bold uppercase tracking-widest">Denklem f(x)</span>
                
                <div className="flex items-center bg-[#0f172a] border border-slate-700 rounded-md overflow-hidden focus-within:border-purple-500 transition-colors mt-2">
                  <span className="text-xs text-slate-500 font-bold pl-3 pr-2 select-none italic">y =</span>
                  <input 
                    type="text" 
                    value={funcText} 
                    onChange={(e) => setFuncText(e.target.value)} 
                    placeholder="Örn: x^2 - 2x + 1"
                    className="w-full bg-transparent text-purple-400 font-bold text-sm py-3 outline-none"
                  />
                </div>
                <p className="text-[9px] text-slate-500 mt-3 italic leading-relaxed">
                  * Üs almak için <strong className="text-slate-300">^</strong> kullanabilirsin (Örn: <strong className="text-purple-300">x^2</strong> veya <strong className="text-purple-300">x^3</strong>).<br/>
                  * Çarpma işlemleri otomatiktir (Örn: <strong className="text-purple-300">2x</strong> sistem tarafından 2*x olarak algılanır).
                </p>
              </div>
            )}
            
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
                <button 
                    onClick={togglePlay} 
                    className={`flex-1 py-4 rounded-md font-black border-2 tracking-widest transition-all shadow-xl active:scale-95 ${
                        isPlaying 
                        ? 'bg-amber-500 text-slate-900 border-amber-400 shadow-amber-500/20' 
                        : isPaused 
                            ? 'bg-emerald-500 text-slate-900 border-emerald-400 shadow-emerald-500/20'
                            : 'bg-blue-600 text-white border-blue-400 hover:bg-blue-500 shadow-blue-500/20'
                    }`}
                >
                    {isPlaying ? 'DURAKLAT' : isPaused ? 'DEVAM ET' : 'BAŞLAT'}
                </button>

                {(isPlaying || isPaused) && (
                    <button 
                        onClick={resetSim} 
                        className="px-4 py-4 bg-rose-600 border-2 border-rose-400 text-white font-bold rounded-md hover:bg-rose-500 transition-all shadow-lg shadow-rose-600/20"
                        title="Başa Dön"
                    >
                        ⏹
                    </button>
                )}
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                <span className="text-[10px] font-bold text-blue-400 italic">OTOMATİK TEKRAR</span>
                <button onClick={() => setAutoStart(!autoStart)} className={`w-10 h-5 rounded-full p-1 transition-all ${autoStart ? 'bg-blue-600' : 'bg-slate-800'}`}><div className={`w-3 h-3 bg-white rounded-full transform transition-transform ${autoStart ? 'translate-x-5' : ''}`}></div></button>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-800 flex flex-col relative">
          <div className="text-[10px] text-slate-600 italic mb-2">
            Asukam da Asukam demiş Mevlana.
          </div>
          {mode === 'sandbox' && (
            <button 
              onClick={() => window.alert("İnanmıyorsan ana menüden sağ üstteki tuşa bas!")}
              className="w-fit text-[9px] text-purple-600 hover:text-purple-400 font-black tracking-widest uppercase transition-colors"
            >
              BANA İNANMIYOR MUSUN?
            </button>
          )}
        </div>

        <div 
          onMouseDown={() => { 
            isResizing.current = true; 
            document.body.style.cursor = 'ew-resize';
          }} 
          className="absolute top-0 right-0 w-3 h-full cursor-ew-resize hover:bg-blue-500/30 transition-colors z-30"
          title="Paneli Genişlet/Daralt"
        ></div>
      </aside>

      <main className="flex-1 relative bg-[#020617] overflow-hidden" ref={containerRef}>
        <canvas 
          ref={canvasRef} 
          onMouseDown={onMouseDown} 
          onMouseMove={onMouseMove} 
          onWheel={onWheel}
          className="w-full h-full" 
        />
        
        <button onClick={() => navigate('/')} className="absolute top-6 right-6 px-6 py-2 bg-[#0f172a] border border-blue-500 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-lg font-bold tracking-widest z-10">MENÜ</button>

        {viewChanged && (
          <button 
            onClick={resetView}
            className="absolute bottom-6 left-6 px-4 py-3 bg-[#0f172a]/80 backdrop-blur-md border border-emerald-500 text-emerald-400 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] font-bold tracking-widest z-10 flex items-center gap-2"
          >
            <span className="text-xl leading-none">⌖</span> MERKEZE DÖN
          </button>
        )}

        {sandboxMsg && <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-8 py-3 rounded-full font-black animate-bounce shadow-xl shadow-purple-500/20 z-10 text-center whitespace-nowrap">{sandboxMsg}</div>}

        {winStatus && (
          <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md flex flex-col items-center justify-center z-50">
            <h2 className="text-6xl font-black text-purple-500 mb-8 animate-pulse drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]">BAŞARILI!</h2>
            <div className="flex gap-4">
              <button onClick={() => navigate('/levels')} className="px-8 py-4 border-2 border-slate-600 text-slate-300 font-bold hover:bg-slate-800 rounded-xl transition-all tracking-widest">BÖLÜMLER</button>
              <button onClick={nextLevel} className="px-8 py-4 bg-purple-500 text-white font-black rounded-xl shadow-xl shadow-purple-500/30 hover:scale-105 transition-all tracking-widest">SONRAKİ BÖLÜM</button>
            </div>
          </div>
        )}

        <div className="absolute bottom-10 right-10 text-right pointer-events-none opacity-40">
            {inputMode === 'slider' ? (
              <p className="text-3xl font-black text-white italic">y = {currentA.toFixed(2)}x {currentB >= 0 ? `+ ${currentB.toFixed(2)}` : `- ${Math.abs(currentB).toFixed(2)}`}</p>
            ) : (
              <p className="text-3xl font-black text-purple-400 italic">y = {funcText || "0"}</p>
            )}
        </div>
      </main>
    </div>
  );
}