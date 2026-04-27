import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, RotateCcw } from 'lucide-react';

// --- Types & Constants ---
type Point = { x: number; y: number };
type Direction = { x: number; y: number };

const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION: Direction = { x: 0, y: -1 }; // Start moving up
const BASE_SPEED = 150;

const TRACKS = [
  {
    id: 1,
    title: 'Neon Drift (AI Generated)',
    url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3',
  },
  {
    id: 2,
    title: 'Cybernetic Pulse (AI Generated)',
    url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__Natura_Mix.mp3',
  },
  {
    id: 3,
    title: 'Synthetic Nights (AI Generated)',
    url: 'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg',
  },
];

export default function App() {
  // --- Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isGamePaused, setIsGamePaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Refs for game loop to avoid dependency cycles
  const snakeRef = useRef(snake);
  const directionRef = useRef(direction);
  const gamePausedRef = useRef(isGamePaused);
  const gameOverRef = useRef(gameOver);
  const gameStartedRef = useRef(gameStarted);

  // Update refs when state changes
  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { directionRef.current = direction; }, [direction]);
  useEffect(() => { gamePausedRef.current = isGamePaused; }, [isGamePaused]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { gameStartedRef.current = gameStarted; }, [gameStarted]);

  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- Game Logic ---
  const generateFood = useCallback((): Point => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // Ensure food doesn't spawn on snake
      // eslint-disable-next-line no-loop-func
      if (!snakeRef.current.some((segment) => segment.x === newFood.x && segment.y === newFood.y)) {
        break;
      }
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setGameOver(false);
    setIsGamePaused(false);
    setFood(generateFood());
    setGameStarted(true);
  };

  const gameLoop = useCallback(() => {
    if (gameOverRef.current || gamePausedRef.current || !gameStartedRef.current) return;

    const currentSnake = [...snakeRef.current];
    const head = { ...currentSnake[0] };
    const dir = directionRef.current;

    head.x += dir.x;
    head.y += dir.y;

    // Check Wall Collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      setGameOver(true);
      return;
    }

    // Check Self Collision
    if (currentSnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
      setGameOver(true);
      return;
    }

    currentSnake.unshift(head);

    // Check Food Collision
    if (head.x === food.x && head.y === food.y) {
      setScore((s) => s + 10);
      setFood(generateFood());
      // Don't pop, snake grows
    } else {
      currentSnake.pop(); // Remove tail
    }

    setSnake(currentSnake);
  }, [food, generateFood]);

  // Main Interval
  useEffect(() => {
    const speed = Math.max(50, BASE_SPEED - Math.floor(score / 50) * 10); // Speed up slightly as score increases
    const interval = setInterval(gameLoop, speed);
    return () => clearInterval(interval);
  }, [gameLoop, score]);

  // --- Keyboard Controls ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrows and space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' && gameStartedRef.current && !gameOverRef.current) {
        setIsGamePaused((p) => !p);
        return;
      }

      const currentDir = directionRef.current;
      let newDir = { ...currentDir };

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDir.y !== 1) newDir = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDir.y !== -1) newDir = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDir.x !== 1) newDir = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDir.x !== -1) newDir = { x: 1, y: 0 };
          break;
      }

      setDirection(newDir);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Music Logic ---
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleEnded = () => {
    nextTrack();
  };

  return (
    <div className="bg-[#050505] text-white min-h-screen w-full overflow-hidden flex flex-col font-sans relative">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header / Navigation Bar */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-cyan-400 to-fuchsia-500 rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.5)] flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
          <h1 className="text-xl font-bold tracking-tighter uppercase italic">Neon Cobra <span className="text-cyan-400">v1.0</span></h1>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Connection Status</span>
            <span className="text-xs text-green-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> SECURE LINK ACTIVE
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-hidden z-10 min-h-0">
        
        {/* Left Sidebar: Music Info & Playlist */}
        <section className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex-1 flex flex-col gap-6 backdrop-blur-xl min-h-0">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Library</label>
              <div className="space-y-2 mt-2">
                {TRACKS.map((track, idx) => (
                  <div 
                    key={track.id}
                    onClick={() => { setCurrentTrackIndex(idx); setIsPlaying(true); }}
                    className={`p-3 rounded-xl transition-colors flex items-center gap-3 cursor-pointer ${
                      currentTrackIndex === idx 
                        ? 'bg-white/10 border border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.1)]' 
                        : 'bg-transparent hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded flex items-center justify-center font-mono text-xs italic shrink-0 ${
                      currentTrackIndex === idx ? 'bg-black/40 text-cyan-400' : 'bg-black/40 text-white/40'
                    }`}>
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <div className="overflow-hidden">
                      <p className={`text-sm font-semibold truncate ${currentTrackIndex === idx ? 'text-white' : 'text-white/80'}`}>
                        {track.title.replace(' (AI Generated)', '')}
                      </p>
                      <p className={`text-[10px] ${currentTrackIndex === idx ? 'text-white/40' : 'text-white/30'}`}>AI Synth-Generator</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto hidden lg:block">
              <div className="w-full rounded-xl bg-gradient-to-br from-gray-800 to-black p-4 flex flex-col justify-end border border-white/5 h-32">
                 <div className="h-1 bg-white/10 w-full mb-2">
                   <div className="h-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] transition-all duration-300" style={{ width: `${((currentTrackIndex + 1) / TRACKS.length) * 100}%` }}></div>
                 </div>
                 <p className="text-[10px] text-white/40">VISUALIZER STACK</p>
                 <div className="flex items-end gap-1 h-12 mt-1">
                   {[...Array(12)].map((_, i) => (
                     <div 
                       key={i} 
                       className={`flex-1 transition-all duration-300 ${isPlaying ? 'bg-cyan-400' : 'bg-white/20'}`}
                       style={{
                         height: isPlaying ? `${Math.random() * 80 + 20}%` : '20%',
                         animationDuration: `${Math.random() * 0.5 + 0.3}s`,
                         animationDelay: `${Math.random() * 0.2}s`,
                       }}
                     />
                   ))}
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Center: Snake Game Window */}
        <section className="lg:col-span-6 flex flex-col gap-4 items-center justify-center overflow-hidden">
          <div className="bg-black w-full max-w-xl mx-auto border-2 border-fuchsia-500/50 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(217,70,239,0.2)] flex flex-col aspect-square relative">
            <div className="h-10 shrink-0 bg-fuchsia-500/10 border-b border-fuchsia-500/30 flex items-center justify-between px-4">
               <span className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-widest truncate">Snake Console v3.1</span>
               <span className="text-xs font-mono text-fuchsia-300 flex items-center gap-2 shrink-0">
                 {isGamePaused && !gameOver && gameStarted && <span className="animate-pulse text-yellow-400">PAUSED</span>}
                 FPS: 60.00
               </span>
            </div>
            
            <div className="flex-1 flex items-center justify-center overflow-hidden relative bg-[radial-gradient(circle_at_center,_#1a1a1a_1px,_transparent_1px)] bg-[size:24px_24px] p-2">
              
              <div 
                className="relative bg-neutral-950/80 border-2 border-neutral-800 rounded shadow-[inset_0_0_20px_rgba(0,0,0,1)]"
                style={{
                  width: GRID_SIZE * 20,
                  height: GRID_SIZE * 20,
                }}
              >
                {!gameStarted && !gameOver && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 backdrop-blur-sm">
                    <button 
                      onClick={resetGame}
                      className="px-6 py-3 border border-cyan-500 text-cyan-400 font-mono text-lg uppercase hover:bg-cyan-950/50 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all"
                    >
                      Start Program
                    </button>
                  </div>
                )}

                {gameOver && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-fuchsia-950/40 z-10 backdrop-blur-[2px]">
                    <span className="text-3xl font-black text-rose-500 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(244,63,94,0.8)] mb-4 px-2 text-center">SYSTEM FAILURE</span>
                    <span className="font-mono text-neutral-300 mb-6">FINAL SCORE: {score}</span>
                    <button 
                      onClick={resetGame}
                      className="flex items-center gap-2 px-5 py-2 border border-rose-500 text-rose-400 font-mono hover:bg-rose-950/50 hover:shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all"
                    >
                      <RotateCcw size={18} />
                      REBOOT
                    </button>
                  </div>
                )}

                {/* Grid Lines (Subtle) */}
                <div 
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    backgroundImage: `linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)`,
                    backgroundSize: `20px 20px`
                  }}
                />

                {/* Snake */}
                {snake.map((segment, index) => {
                  const isHead = index === 0;
                  return (
                    <div
                      key={`${segment.x}-${segment.y}-${index}`}
                      className="absolute"
                      style={{
                        left: segment.x * 20,
                        top: segment.y * 20,
                        width: 20,
                        height: 20,
                        padding: 1,
                      }}
                    >
                      <div 
                        className={`w-full h-full rounded-[2px] ${
                          isHead 
                            ? 'bg-green-400 shadow-[0_0_10px_#4ade80] border border-black z-20 relative' 
                            : 'bg-green-400 shadow-[0_0_10px_#4ade80] opacity-90 border border-black'
                        }`} 
                      >
                         {isHead && (
                           <div className="flex justify-around mt-1 px-1"><div className="w-1 h-1 bg-black"></div><div className="w-1 h-1 bg-black"></div></div>
                         )}
                      </div>
                    </div>
                  );
                })}

                {/* Food */}
                <div
                  className="absolute flex items-center justify-center animate-pulse"
                  style={{
                    left: food.x * 20,
                    top: food.y * 20,
                    width: 20,
                    height: 20,
                  }}
                >
                  <div className="w-full h-full bg-fuchsia-500 rounded-full shadow-[0_0_15px_#f5d0fe] border border-white" />
                </div>
              </div>

              {/* Score Overlay Absolute on Game Container */}
              <div className="absolute top-4 right-4 flex flex-col items-end pointer-events-none">
                <span className="text-[10px] text-fuchsia-400 uppercase tracking-widest font-bold">Score</span>
                <span className="text-2xl font-mono leading-none drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]">{String(score).padStart(6, '0')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Sidebar: Game Stats & Controls */}
        <section className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-fuchsia-400 font-bold uppercase tracking-widest">Session Stats</label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                  <p className="text-[10px] text-white/40 uppercase">Current Score</p>
                  <p className="text-xl font-mono text-fuchsia-300">{score}</p>
                </div>
                <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                  <p className="text-[10px] text-white/40 uppercase">Snake Size</p>
                  <p className="text-xl font-mono text-green-400">{snake.length}m</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[10px] text-fuchsia-400 font-bold uppercase tracking-widest">Game Controls</label>
              <div className="flex justify-center items-center gap-4 py-2">
                <div className="grid grid-cols-3 gap-1">
                  <div></div>
                  <div className="w-10 h-10 bg-white/10 border border-white/20 rounded flex items-center justify-center font-bold text-xs shadow-[0_0_10px_rgba(255,255,255,0.05)] text-white/70">W</div>
                  <div></div>
                  <div className="w-10 h-10 bg-white/10 border border-white/20 rounded flex items-center justify-center font-bold text-xs shadow-[0_0_10px_rgba(255,255,255,0.05)] text-white/70">A</div>
                  <div className="w-10 h-10 bg-white/10 border border-white/20 rounded flex items-center justify-center font-bold text-xs shadow-[0_0_10px_rgba(255,255,255,0.05)] text-white/70">S</div>
                  <div className="w-10 h-10 bg-white/10 border border-white/20 rounded flex items-center justify-center font-bold text-xs shadow-[0_0_10px_rgba(255,255,255,0.05)] text-white/70">D</div>
                </div>
              </div>
              <p className="text-[10px] text-white/30 text-center italic mt-2">Use WASD or ARROWS to maneuver the synth-snake</p>
              <p className="text-[10px] text-white/30 text-center italic">SPACE to pause</p>
            </div>
            
            <button 
              onClick={resetGame}
              className="w-full py-4 bg-fuchsia-600/20 border border-fuchsia-500/50 rounded-xl text-fuchsia-300 font-bold uppercase tracking-widest text-xs hover:bg-fuchsia-600/30 transition-all shadow-[0_0_20px_rgba(217,70,239,0.1)] mt-4"
            >
              Reset Grid Protocol
            </button>
          </div>
        </section>

      </main>

      {/* Bottom: Global Media Player */}
      <footer className="h-24 bg-white/5 border-t border-white/10 backdrop-blur-2xl flex items-center px-4 md:px-10 gap-4 md:gap-10 z-20 shrink-0">
        {/* Track Info */}
        <div className="w-48 md:w-64 flex items-center gap-4 hidden sm:flex">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-900 shadow-lg flex items-center justify-center text-xl shrink-0">💿</div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate tracking-tight">{TRACKS[currentTrackIndex].title.replace(' (AI Generated)', '')}</p>
            <p className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">Now Streaming</p>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="flex items-center gap-6">
            <button onClick={prevTrack} className="text-white/60 hover:text-cyan-400 transition-colors focus:outline-none">
               <SkipBack size={20} />
            </button>
            <button 
              onClick={togglePlay}
              className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:bg-cyan-400 hover:text-white transition-colors focus:outline-none"
            >
              {isPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current ml-1" />}
            </button>
            <button onClick={nextTrack} className="text-white/60 hover:text-cyan-400 transition-colors focus:outline-none">
               <SkipForward size={20} />
            </button>
          </div>
          <div className="w-full max-w-md flex items-center gap-3">
            <span className="text-[10px] font-mono text-white/40">{isPlaying ? "00:00" : "--:--"}</span>
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden relative">
              <div className="absolute h-full w-[40%] bg-gradient-to-r from-cyan-500 to-fuchsia-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
            </div>
            <span className="text-[10px] font-mono text-white/40">--:--</span>
          </div>
        </div>

        {/* Volume & Settings */}
        <div className="w-32 md:w-64 flex justify-end items-center gap-4">
          <button onClick={toggleMute} className="text-white/40 hover:text-white transition-colors focus:outline-none">
             {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <div className="w-16 md:w-24 h-1 bg-white/20 rounded-full hidden sm:block">
            <div className={`h-full ${isMuted ? 'w-0' : 'w-3/4'} bg-white/60 transition-all`}></div>
          </div>
          <div className="w-8 h-8 rounded border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors cursor-pointer shrink-0">
            <span className="text-[10px] font-mono">HQ</span>
          </div>
        </div>

        <audio 
          ref={audioRef}
          src={TRACKS[currentTrackIndex].url}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      </footer>
    </div>
  );
}
