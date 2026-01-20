class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-orange-50">
          <div className="text-center p-8 bg-white rounded-xl shadow-xl">
            <h1 className="text-2xl font-bold text-red-600 mb-4">哎呀，锅开了！</h1>
            <p className="text-gray-600 mb-4">游戏遇到了一些小问题。</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              重新开火
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==================== 新增：GameLevel 组件 ====================
function GameLevel({ onBack }) {
  const [gameOver, setGameOver] = React.useState(false);
  const [win, setWin] = React.useState(false);
  const [message, setMessage] = React.useState('');

  // 关卡地图：0=空气, 1=泥土, 2=岩石, 3=火锅, 4=温水池, 5=流动水, 6=食材
  const initialGrid = React.useMemo(() => [
    [2,2,2,2,2,2,2,2,2,2],
    [2,1,1,1,1,1,1,1,1,2],
    [2,1,1,1,1,1,1,1,1,2],
    [2,1,1,4,1,1,1,1,1,2], // 温水池
    [2,1,1,1,1,1,1,1,1,2],
    [2,1,1,1,1,1,1,1,1,2],
    [2,1,1,1,1,1,1,1,1,2],
    [2,1,1,1,1,3,1,1,1,2], // 火锅
    [2,1,6,1,1,1,1,1,1,2], // 食材（冻肉）
    [2,2,2,2,2,2,2,2,2,2]
  ], []);

  const [grid, setGrid] = React.useState(initialGrid);

  // 模拟水流扩散（BFS）
  const simulateWaterFlow = React.useCallback((currentGrid) => {
    const rows = currentGrid.length;
    const cols = currentGrid[0].length;
    const newGrid = currentGrid.map(row => [...row]);
    const queue = [];
    const visited = Array(rows).fill().map(() => Array(cols).fill(false));

    // 找到所有水源（4）和已流动水（5）
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (newGrid[r][c] === 4 || newGrid[r][c] === 5) {
          queue.push([r, c]);
          visited[r][c] = true;
        }
      }
    }

    const directions = [[-1,0],[1,0],[0,-1],[0,1]];
    let potReached = false;

    while (queue.length > 0) {
      const [r, c] = queue.shift();

      // 检查是否是火锅
      if (newGrid[r][c] === 3) {
        potReached = true;
        break;
      }

      for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
          // 水只能流向空气(0)或食材(6)（但会冲走食材）
          if (newGrid[nr][nc] === 0 || newGrid[nr][nc] === 6) {
            newGrid[nr][nc] = 5; // 标记为流动水
            visited[nr][nc] = true;
            queue.push([nr, nc]);
          }
          // 如果旁边是火锅(3)，也标记失败
          if (newGrid[nr][nc] === 3) {
            potReached = true;
            break;
          }
        }
      }
      if (potReached) break;
    }

    return { newGrid, potReached };
  }, []);

  const handleCellClick = (r, c) => {
    if (gameOver || win) return;
    const currentGrid = [...grid];
    if (currentGrid[r][c] !== 1) return; // 只能挖泥土

    // 挖掘：泥土(1) -> 空气(0)
    currentGrid[r][c] = 0;

    // 模拟水流
    const { newGrid, potReached } = simulateWaterFlow(currentGrid);

    if (potReached) {
      setGameOver(true);
      setMessage('失败！温水混入火锅了！');
    }

    setGrid(newGrid);
  };

  // 简单胜利条件：食材(6)到达火锅(3)上方（可扩展）
  React.useEffect(() => {
    if (gameOver) return;
    const rows = grid.length;
    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] === 6) {
          // 检查下方是否是火锅
          if (grid[r + 1][c] === 3) {
            setWin(true);
            setMessage('成功！食材入锅！');
            return;
          }
        }
      }
    }
  }, [grid, gameOver]);

  const resetLevel = () => {
    setGrid(initialGrid);
    setGameOver(false);
    setWin(false);
    setMessage('');
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-blue-50">
      {/* 控制按钮 */}
      <div className="absolute top-4 left-4 z-10 space-x-2">
        <button onClick={onBack} className="px-3 py-1 bg-gray-500 text-white rounded">返回</button>
        <button onClick={resetLevel} className="px-3 py-1 bg-yellow-500 text-white rounded">重置</button>
      </div>

      {/* 游戏区域 */}
      <div 
        className="grid gap-0.5 p-2 bg-gray-800 rounded"
        style={{ 
          gridTemplateColumns: `repeat(${grid[0].length}, 32px)`,
          width: 'fit-content'
        }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className={`w-8 h-8 flex items-center justify-center text-xs font-bold cursor-pointer ${
                cell === 0 ? 'bg-white' :
                cell === 1 ? 'bg-amber-800' : // 泥土
                cell === 2 ? 'bg-gray-600' :   // 岩石
                cell === 3 ? 'bg-red-600 text-white' : // 火锅
                cell === 4 ? 'bg-cyan-300' :   // 温水池
                cell === 5 ? 'bg-cyan-400' :   // 流动水
                cell === 6 ? 'bg-green-500' : '' // 食材
              }`}
              onClick={() => handleCellClick(r, c)}
            >
              {cell === 3 ? '🍲' : cell === 6 ? '🥩' : ''}
            </div>
          ))
        )}
      </div>

      {/* 消息提示 */}
      {(gameOver || win) && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded shadow-lg z-20">
          <p className={`text-lg font-bold ${gameOver ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
          <button 
            onClick={resetLevel}
            className="mt-2 px-4 py-1 bg-blue-500 text-white rounded"
          >
            再试一次
          </button>
        </div>
      )}

      {/* 说明文字 */}
      <div className="absolute bottom-4 text-sm text-gray-700 text-center max-w-md">
        <p>点击棕色格子挖土。小心！温水流进火锅会失败 ❌</p>
        <p>目标：让冻肉(🥩)掉进火锅(🍲)</p>
      </div>
    </div>
  );
}
// ==================== GameLevel 结束 ====================

function App() {
  const [gameState, setGameState] = React.useState('menu'); // menu, playing, won, lost
  const startGame = () => { setGameState('playing'); };
  const backToMenu = () => { setGameState('menu'); };

  return (
    <div className="w-full h-screen relative overflow-hidden flex flex-col items-center justify-center bg-orange-100" data-name="app" data-file="app.js">
      {gameState === 'menu' && (
        <div className="z-10 text-center space-y-8 animate-fade-in panel max-w-md mx-4">
          <div className="space-y-2">
            <h1 className="text-5xl font-black text-red-600 tracking-wider" style={{textShadow: '2px 2px 0px #fbbf24'}}>火锅大冒险</h1>
            <p className="text-lg text-orange-800 font-medium">挖土寻味，食材归位！</p>
          </div>
          <div className="space-y-4 text-left bg-orange-50 p-4 rounded-xl border border-orange-200 text-sm text-gray-700">
            <p className="flex items-center"><span className="icon-shovel mr-2 text-orange-500"></span> <strong>玩法：</strong> 用手指/鼠标滑动屏幕挖开泥土</p>
            <p className="flex items-center"><span className="icon-arrow-down mr-2 text-blue-500"></span> <strong>目标：</strong> 引导食材掉进底部的火锅</p>
            <p className="flex items-center"><span className="icon-snowflake mr-2 text-cyan-400"></span> <strong>注意：</strong> 冻肉必须先经过温水池解冻</p>
            <p className="flex items-center"><span className="icon-triangle-alert mr-2 text-red-500"></span> <strong>危险：</strong> 温水流入火锅会导致失败！</p>
            <p className="flex items-center"><span className="icon-ban mr-2 text-purple-500"></span> <strong>避开：</strong> 辣椒和花椒会弹飞食材</p>
          </div>
          <button onClick={startGame} className="btn-game text-xl w-full">
            <div className="flex items-center justify-center gap-2">
              <span className="icon-circle-play"></span> 开始涮火锅
            </div>
          </button>
        </div>
      )}
      {gameState === 'playing' && (
        <GameLevel onBack={backToMenu} />
      )}
      <div className="absolute bottom-2 text-xs text-gray-400 pointer-events-none">
        &copy; 2026 火锅大冒险工作室
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);