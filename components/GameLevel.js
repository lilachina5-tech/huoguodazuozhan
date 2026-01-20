function GameLevel({ onBack }) {
  const containerRef = React.useRef(null);
  const canvasDirtRef = React.useRef(null);
  const canvasObjectsRef = React.useRef(null);
  
  const [score, setScore] = React.useState(0);
  const [gameStatus, setGameStatus] = React.useState('playing'); // playing, win, lost
  const [showWinModal, setShowWinModal] = React.useState(false);
  const [tool, setTool] = React.useState('shovel'); // 'shovel' or 'brush'
  const [ink, setInk] = React.useState(100); // Percentage 0-100
  
  const totalIngredients = React.useRef(3);
  const ingredientsRef = React.useRef([]);
  const obstaclesRef = React.useRef([]);
  const waterZonesRef = React.useRef([]);
  const requestRef = React.useRef();
  
  // Mouse/Touch tracking
  const isDragging = React.useRef(false);
  const lastPos = React.useRef({x:0, y:0});

  React.useEffect(() => {
    // Load assets first
    if (window.GameAssets) {
        window.GameAssets.load(() => {
            const timer = setTimeout(() => {
                initGame();
            }, 100);
        });
    } else {
        const timer = setTimeout(() => {
            initGame();
        }, 100);
    }

    return () => {
        cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const resetGame = () => {
    if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
    }
    setScore(0);
    setGameStatus('playing');
    setShowWinModal(false);
    setInk(100); // Reset ink
    setTool('shovel'); // Reset tool
    
    initGame();
  };

  const initGame = () => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    if (width === 0 || height === 0) return;

    if (typeof window.Ingredient === 'undefined') {
        console.error("Ingredient class not found!");
        return;
    }

    // 1. Setup Canvas Dimensions
    [canvasDirtRef, canvasObjectsRef].forEach(ref => {
        if(ref.current) {
            ref.current.width = width;
            ref.current.height = height;
        }
    });

    // 2. Initialize Dirt Layer
    const dirtCtx = canvasDirtRef.current.getContext('2d', { willReadFrequently: true });
    
    // Fill with "Dirt"
    dirtCtx.fillStyle = '#8d6e63';
    dirtCtx.fillRect(0, 0, width, height);
    
    // Add texture
    for(let i=0; i<500; i++) {
        dirtCtx.fillStyle = '#795548';
        dirtCtx.fillRect(Math.random()*width, Math.random()*height, 4, 4);
    }

    const clearCircle = (ctx, x, y, r) => {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI*2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    };

    // Clear Start Zone
    clearCircle(dirtCtx, width/2, 80, 60);
    
    // Clear Pot Zone
    dirtCtx.clearRect(0, height - 80, width, 80);

    // Randomize Zones
    const waterSide = Math.random() > 0.5 ? 'left' : 'right';
    const waterX = waterSide === 'left' ? width * 0.15 : width * 0.65; // Slightly closer to center
    const waterY = height * (0.35 + Math.random() * 0.2);
    
    // Water Zone Hole
    clearCircle(dirtCtx, waterX + (width * 0.1), waterY + 50, 60); // Bigger hole

    waterZonesRef.current = [
        { x: waterX, y: waterY, w: width * 0.2, h: 100 }
    ];

    // 3. Initialize Ingredients
    const IngredientClass = window.Ingredient;
    const types = ['meatball', 'vegetable', 'mushroom'];
    
    ingredientsRef.current = [
        new IngredientClass(width/2 - 20, 80, types[Math.floor(Math.random()*types.length)], 1),
        new IngredientClass(width/2 + 20, 80, types[Math.floor(Math.random()*types.length)], 2),
        new IngredientClass(width/2, 50, 'frozen_meat', 3),
    ];
    totalIngredients.current = ingredientsRef.current.length;

    // Random obstacles
    obstaclesRef.current = [];
    const numObstacles = 2 + Math.floor(Math.random() * 3);
    for(let i=0; i<numObstacles; i++) {
        obstaclesRef.current.push({
            x: width * 0.2 + Math.random() * width * 0.6,
            y: height * 0.3 + Math.random() * height * 0.4,
            radius: 15 + Math.random() * 10,
            type: Math.random() > 0.5 ? 'chili' : 'pepper'
        });
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const gameLoop = () => {
    if (gameStatus === 'win') return;

    const width = containerRef.current?.clientWidth || 0;
    const height = containerRef.current?.clientHeight || 0;
    
    const objCtx = canvasObjectsRef.current.getContext('2d');
    const dirtCtx = canvasDirtRef.current.getContext('2d', { willReadFrequently: true });

    // Clear Object Layer
    objCtx.clearRect(0, 0, width, height);

    // Draw Static Zones
    waterZonesRef.current.forEach(zone => {
        objCtx.fillStyle = 'rgba(59, 130, 246, 0.4)'; 
        objCtx.fillRect(zone.x, zone.y, zone.w, zone.h);
        objCtx.fillStyle = '#1e3a8a';
        objCtx.font = '12px Arial';
        objCtx.fillText('温水池', zone.x + 10, zone.y + 20);
    });

    // Pot
    objCtx.fillStyle = '#ef4444';
    objCtx.fillRect(0, height - 80, width, 80);
    // Pot bubbles
    objCtx.fillStyle = '#fecaca';
    for(let i=0; i<5; i++) {
        objCtx.beginPath();
        objCtx.arc(Math.random()*width, height - 20 - Math.random()*40, Math.random()*5+2, 0, Math.PI*2);
        objCtx.fill();
    }
    objCtx.fillStyle = '#fff';
    objCtx.font = 'bold 24px Arial';
    objCtx.textAlign = 'center';
    objCtx.fillText('火 锅', width/2, height - 30);

    // Draw Obstacles
    obstaclesRef.current.forEach(obs => {
        objCtx.save();
        objCtx.translate(obs.x, obs.y);
        const img = window.GameAssets ? window.GameAssets.get(obs.type) : null;
        if (img) {
             const size = obs.radius * 2.5; 
             objCtx.drawImage(img, -size/2, -size/2, size, size);
        } else {
             // Fallback
             objCtx.fillStyle = '#dc2626';
             objCtx.beginPath(); objCtx.arc(0, 0, obs.radius, 0, Math.PI*2); objCtx.fill();
        }
        objCtx.restore();
    });

    // Ingredients
    let collectedCount = 0;
    let failedIngredients = 0;

    ingredientsRef.current.forEach(ing => {
        if (ing.inPot) {
            if (ing.type === 'frozen_meat' && ing.state === 'frozen') {
                failedIngredients++;
            } else {
                collectedCount++;
            }
            return;
        }
        ing.update(dirtCtx, width, height, obstaclesRef.current, waterZonesRef.current);
        ing.draw(objCtx);
    });

    setScore(prev => {
        if (prev !== collectedCount) return collectedCount;
        return prev;
    });

    if (!showWinModal) {
        if (collectedCount === totalIngredients.current) {
            setGameStatus('win');
            setShowWinModal(true);
        } else if (failedIngredients > 0) {
             setGameStatus('lost');
        }
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  // Interaction Handlers
  const handleStart = (e) => {
    isDragging.current = true;
    const pos = getPos(e);
    lastPos.current = pos;
    processInteraction(pos.x, pos.y);
  };

  const handleMove = (e) => {
    if (!isDragging.current) return;
    const pos = getPos(e);
    
    // Interpolate
    const dist = Math.sqrt((pos.x - lastPos.current.x)**2 + (pos.y - lastPos.current.y)**2);
    const steps = Math.ceil(dist / 5); 
    
    for(let i=0; i<=steps; i++) {
        const t = steps === 0 ? 0 : i/steps;
        const x = lastPos.current.x + (pos.x - lastPos.current.x)*t;
        const y = lastPos.current.y + (pos.y - lastPos.current.y)*t;
        processInteraction(x, y);
    }
    
    lastPos.current = pos;
  };

  const handleEnd = () => {
    isDragging.current = false;
  };

  const getPos = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
  };

  const processInteraction = (x, y) => {
      if (tool === 'shovel') {
          dig(x, y);
      } else if (tool === 'brush') {
          drawPlank(x, y);
      }
  };

  const dig = (x, y) => {
    const ctx = canvasDirtRef.current.getContext('2d');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI*2); // Slightly smaller shovel for precision
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  };

  const drawPlank = (x, y) => {
      if (ink <= 0) return;

      const ctx = canvasDirtRef.current.getContext('2d');
      // Set wood style
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#a16207'; // Wood color
      ctx.strokeStyle = '#78350f';
      
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI*2); // Plank thickness
      ctx.fill();
      
      // Drain ink
      setInk(prev => Math.max(0, prev - 0.5));
  };

  return (
    <div className="w-full h-full relative bg-gray-900" ref={containerRef}>
        <canvas 
            ref={canvasDirtRef}
            className="game-layer cursor-crosshair"
            style={{zIndex: 10}}
        />
        <canvas 
            ref={canvasObjectsRef}
            className="game-layer pointer-events-none"
            style={{zIndex: 5}}
        />

        {/* Interaction Layer */}
        <div 
            className="absolute inset-0 z-50 touch-none"
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
        >
            {/* HUD Top Left */}
            <div className="absolute top-4 left-4 bg-white/90 px-4 py-2 rounded-full font-bold shadow border-2 border-orange-200 pointer-events-none flex items-center gap-2">
                <span className="text-orange-600">食材:</span> {score} / 3
            </div>
            
            {/* HUD Top Right */}
            <div className="absolute top-4 right-4 flex gap-2 pointer-events-auto">
                <button 
                    onClick={(e) => { e.stopPropagation(); resetGame(); }}
                    className="bg-white/90 p-2 rounded-full shadow hover:bg-gray-100 active:scale-95 transition"
                    title="刷新地图"
                >
                    <div className="icon-rotate-cw text-xl text-blue-600"></div>
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onBack(); }}
                    className="bg-white/90 p-2 rounded-full shadow hover:bg-gray-100 active:scale-95 transition"
                    title="退出"
                >
                    <div className="icon-x text-xl text-gray-600"></div>
                </button>
            </div>

            {/* Bottom Tool Bar */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center items-end gap-6 pointer-events-auto pb-6">
                
                {/* Shovel Tool */}
                <button 
                    onClick={(e) => { e.stopPropagation(); setTool('shovel'); }}
                    className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all border-4 ${tool === 'shovel' ? 'bg-orange-100 border-orange-500 scale-110 -translate-y-2' : 'bg-white border-gray-300 text-gray-400 hover:scale-105'}`}
                >
                    <div className="icon-shovel text-3xl text-orange-600"></div>
                    {tool === 'shovel' && <div className="absolute -bottom-8 text-sm font-bold text-white drop-shadow-md">挖掘</div>}
                </button>

                {/* Brush Tool */}
                <button 
                    onClick={(e) => { e.stopPropagation(); setTool('brush'); }}
                    className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all border-4 ${tool === 'brush' ? 'bg-amber-100 border-amber-600 scale-110 -translate-y-2' : 'bg-white border-gray-300 text-gray-400 hover:scale-105'}`}
                >
                    <div className="icon-pencil text-3xl text-amber-700"></div>
                    {/* Ink Bar */}
                    <div className="absolute inset-0 rounded-full border-4 border-transparent" style={{
                        background: `conic-gradient(transparent ${100-ink}%, #d97706 0)` 
                    }}></div>
                    
                    {tool === 'brush' && <div className="absolute -bottom-8 text-sm font-bold text-white drop-shadow-md">搭桥</div>}
                </button>
            </div>
        </div>

        {/* Win Modal */}
        {showWinModal && (
            <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="panel text-center max-w-sm mx-4 transform transition-all scale-100">
                    <div className="text-5xl mb-4">🍲✨</div>
                    <h2 className="text-3xl font-bold text-red-600 mb-2">开吃啦！</h2>
                    <p className="text-gray-600 mb-6">所有食材都完美下锅！</p>
                    <div className="flex gap-4 justify-center">
                        <button onClick={(e) => { e.stopPropagation(); resetGame(); }} className="btn-game">
                            再来一碗
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Loss/Fail Feedback */}
        {gameStatus === 'lost' && (
             <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="panel text-center max-w-sm mx-4 transform transition-all scale-100 border-gray-400">
                    <div className="text-5xl mb-4">🥶</div>
                    <h2 className="text-3xl font-bold text-blue-600 mb-2">哎呀！</h2>
                    <p className="text-gray-600 mb-6">冻肉还没解冻就下锅了！<br/>下次记得先让它去温水池泡个澡。</p>
                    <div className="flex gap-4 justify-center">
                        <button onClick={(e) => { e.stopPropagation(); resetGame(); }} className="btn-game bg-gray-600 border-gray-700 hover:bg-gray-500">
                            重新尝试
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}