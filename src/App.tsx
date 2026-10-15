/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { onAuthStateChanged, User } from 'firebase/auth';
import { AppMode, CameraPreset, CheatAction, GameMode, GridSize, MoveDirection, TileData, VisualTheme } from './types';
import { ThreeBoard } from './three/ThreeBoard';
import { sound } from './audio/synth';
import {
  calculateBestMove,
  createGridMatrix,
  executeMove,
  getEmptyCells,
  getUniqueTileId,
  hasAvailableMoves,
  initializeBoard,
  spawnRandomTile,
} from './game/logic';
import { GameHUD } from './components/GameHUD';
import { LeaderboardModal } from './components/LeaderboardModal';
import { CommunityChatModal } from './components/CommunityChatModal';
import { GeminiHomeworkModal } from './components/GeminiHomeworkModal';
import { MemePartyGame } from './components/meme/MemePartyGame';
import { auth } from './firebase/config';
import { isUserCheatAdmin, submitLeaderboardScore } from './firebase/leaderboard';

interface HistorySnapshot {
  tiles: TileData[];
  score: number;
  moves: number;
}

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const board3DRef = useRef<ThreeBoard | null>(null);

  // App Mode (Make It Meme vs 2048 3D Deluxe)
  const [appMode, setAppMode] = useState<AppMode>('meme_party');

  // Auth & Modals State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isHomeworkOpen, setIsHomeworkOpen] = useState(false);

  // Game Settings State
  const [gridSize, setGridSize] = useState<GridSize>(4);
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [theme, setTheme] = useState<VisualTheme>('cyberpunk');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('iso');
  const [is8KMode, setIs8KMode] = useState(false);

  // Auto-Play Bot State
  const [autoPlayActive, setAutoPlayActive] = useState(false);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState<'normal' | 'fast' | 'turbo'>('fast');

  // Game Play State
  const [inTitleScreen, setInTitleScreen] = useState(true);
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [hasWonAcknowledged, setHasWonAcknowledged] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | undefined>(undefined);
  const [isMuted, setIsMuted] = useState(sound.isMuted());

  // Cheat Mode State
  const [activeCheat, setActiveCheat] = useState<CheatAction | null>(null);
  const [selectedSpawnValue, setSelectedSpawnValue] = useState(2);
  const [hintDirection, setHintDirection] = useState<MoveDirection | null>(null);
  const [godMode, setGodMode] = useState(false);
  const [history, setHistory] = useState<HistorySnapshot[]>([]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // State refs for access inside stable listeners & loops
  const stateRef = useRef({
    appMode,
    gridSize,
    gameMode,
    tiles,
    score,
    bestScore,
    moves,
    gameOver,
    won,
    hasWonAcknowledged,
    activeCheat,
    selectedSpawnValue,
    godMode,
    inTitleScreen,
    currentUser,
    autoPlayActive,
  });

  useEffect(() => {
    stateRef.current = {
      appMode,
      gridSize,
      gameMode,
      tiles,
      score,
      bestScore,
      moves,
      gameOver,
      won,
      hasWonAcknowledged,
      activeCheat,
      selectedSpawnValue,
      godMode,
      inTitleScreen,
      currentUser,
      autoPlayActive,
    };
  }, [
    appMode,
    gridSize,
    gameMode,
    tiles,
    score,
    bestScore,
    moves,
    gameOver,
    won,
    hasWonAcknowledged,
    activeCheat,
    selectedSpawnValue,
    godMode,
    inTitleScreen,
    currentUser,
    autoPlayActive,
  ]);

  // Sync 3D Scene tiles whenever state changes
  useEffect(() => {
    if (board3DRef.current && tiles.length > 0) {
      board3DRef.current.syncTiles(tiles);
    }
  }, [tiles]);

  // Handle Best Score persistence & Leaderboard submission
  const updateBestScore = useCallback((newScore: number, currentTiles: TileData[], currentMoves: number) => {
    setBestScore((prev) => {
      const highest = Math.max(prev, newScore);
      localStorage.setItem(`2048_3d_best_${gridSize}`, String(highest));
      return highest;
    });

    // If logged in, submit to global Firestore Leaderboard
    if (auth.currentUser && newScore > 0) {
      const highestTile = currentTiles.reduce((max, t) => Math.max(max, t.value), 2);
      submitLeaderboardScore(gridSize, newScore, highestTile, currentMoves).catch((err) => {
        console.warn('Leaderboard submission:', err);
      });
    }
  }, [gridSize]);

  // Start new game setup
  const startNewGame = useCallback((size: GridSize = gridSize, mode: GameMode = gameMode) => {
    const initialState = initializeBoard(size);
    setGridSize(size);
    setGameMode(mode);
    setTiles(initialState.tiles);
    setScore(0);
    setMoves(0);
    setGameOver(false);
    setWon(false);
    setHasWonAcknowledged(false);
    setHistory([]);
    setActiveCheat(null);
    setHintDirection(null);
    setAutoPlayActive(false);

    const savedBest = localStorage.getItem(`2048_3d_best_${size}`);
    setBestScore(savedBest ? parseInt(savedBest, 10) || 0 : 0);

    if (mode === 'time_attack') {
      setTimeRemaining(120);
    } else {
      setTimeRemaining(undefined);
    }

    if (board3DRef.current) {
      board3DRef.current.setGridSize(size);
      board3DRef.current.syncTiles(initialState.tiles);
    }
  }, [gridSize, gameMode]);

  // Initialize Three.js scene once
  useEffect(() => {
    if (!mountRef.current) return;

    const b3d = new ThreeBoard(mountRef.current, gridSize, theme);
    board3DRef.current = b3d;

    // Handle 3D click interactions for Cheats
    b3d.onTileClick = (tileId: string, value: number) => {
      const current = stateRef.current;
      if (current.activeCheat === 'hammer') {
        sound.playHammer();
        const clickedTile = current.tiles.find((t) => t.id === tileId);
        if (clickedTile) {
          const { x, z } = b3d.gridToWorld(clickedTile.row, clickedTile.col);
          b3d.emitMergeParticles({ x, y: 0.2, z } as any, value, true);
        }

        setTiles((prev) => prev.filter((t) => t.id !== tileId));
        setActiveCheat(null);
      } else if (current.activeCheat === 'double') {
        sound.playMerge(value * 2);
        setTiles((prev) =>
          prev.map((t) => (t.id === tileId ? { ...t, value: t.value * 2, justMerged: true } : t))
        );
        setActiveCheat(null);
      }
    };

    b3d.onCellClick = (row: number, col: number) => {
      const current = stateRef.current;
      if (current.activeCheat === 'spawn') {
        const isOccupied = current.tiles.some((t) => t.row === row && t.col === col);
        if (!isOccupied) {
          sound.playSpawn();
          const newTile: TileData = {
            id: getUniqueTileId(),
            value: current.selectedSpawnValue,
            row,
            col,
            isNew: true,
          };
          setTiles((prev) => [...prev, newTile]);
          setActiveCheat(null);
        }
      }
    };

    // Initialize board state
    startNewGame(gridSize, gameMode);

    return () => {
      b3d.dispose();
      board3DRef.current = null;
    };
  }, []);

  // Time Attack Timer Effect
  useEffect(() => {
    if (gameMode !== 'time_attack' || inTitleScreen || gameOver) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === undefined) return 120;
        if (prev <= 1) {
          clearInterval(timer);
          setGameOver(true);
          sound.playGameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameMode, inTitleScreen, gameOver]);

  // Main Move Handler
  const handleMove = useCallback((direction: MoveDirection) => {
    const current = stateRef.current;
    if (current.gameOver || current.inTitleScreen) return;

    // Clear active AI hint on user move
    setHintDirection(null);

    const result = executeMove(current.gridSize, current.tiles, direction);
    if (!result.moved) return;

    // Save history snapshot for Undo
    setHistory((prev) => [
      ...prev.slice(-25),
      {
        tiles: JSON.parse(JSON.stringify(current.tiles)),
        score: current.score,
        moves: current.moves,
      },
    ]);

    // Tilt 3D board
    if (board3DRef.current) {
      board3DRef.current.tiltBoard(direction);
    }

    // Sound and celebration
    if (result.highestMergedValue > 0) {
      sound.playMerge(result.highestMergedValue);
      if (result.highestMergedValue >= 2048) {
        sound.playMilestone(result.highestMergedValue);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } else {
      sound.playMove();
    }

    // Check Victory (2048)
    const hasReached2048 = result.tiles.some((t) => t.value >= 2048);
    if (hasReached2048 && !current.won && current.gameMode === 'classic') {
      setWon(true);
    }

    // Spawn new random tile
    const newTile = spawnRandomTile(current.gridSize, result.tiles);
    const updatedTiles = newTile ? [...result.tiles, newTile] : result.tiles;

    const newScore = current.score + result.scoreGained;
    const newMoves = current.moves + 1;

    setTiles(updatedTiles);
    setScore(newScore);
    setMoves(newMoves);
    updateBestScore(newScore, updatedTiles, newMoves);

    // Check Game Over
    if (!hasAvailableMoves(current.gridSize, updatedTiles)) {
      if (current.godMode) {
        // God Mode prevents game over: remove the lowest tile
        const minTile = [...updatedTiles].sort((a, b) => a.value - b.value)[0];
        if (minTile) {
          setTiles((prev) => prev.filter((t) => t.id !== minTile.id));
        }
      } else {
        setGameOver(true);
        setAutoPlayActive(false);
        sound.playGameOver();
      }
    }
  }, [updateBestScore]);

  // Auto-Play Bot Loop Effect
  useEffect(() => {
    if (!autoPlayActive || gameOver || inTitleScreen) return;

    const speedMs = autoPlaySpeed === 'turbo' ? 45 : autoPlaySpeed === 'fast' ? 140 : 360;

    const interval = setInterval(() => {
      const current = stateRef.current;
      if (!isUserCheatAdmin(current.currentUser?.email) || current.gameOver || current.inTitleScreen) {
        setAutoPlayActive(false);
        return;
      }

      const best = calculateBestMove(current.gridSize, current.tiles);
      if (best) {
        handleMove(best);
      } else {
        setAutoPlayActive(false);
      }
    }, speedMs);

    return () => clearInterval(interval);
  }, [autoPlayActive, autoPlaySpeed, gameOver, inTitleScreen, handleMove]);

  // Undo Action
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));

    setTiles(last.tiles);
    setScore(last.score);
    setMoves(last.moves);
    setGameOver(false);
    sound.playClick();
  }, [history]);

  // Shuffle Action
  const handleShuffle = useCallback(() => {
    const current = stateRef.current;
    if (current.tiles.length <= 1) return;

    sound.playClick();
    const positions: { row: number; col: number }[] = [];
    for (let r = 0; r < current.gridSize; r++) {
      for (let c = 0; c < current.gridSize; c++) {
        positions.push({ row: r, col: c });
      }
    }

    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    const shuffled = current.tiles.map((t, idx) => ({
      ...t,
      row: positions[idx].row,
      col: positions[idx].col,
      prevRow: t.row,
      prevCol: t.col,
    }));

    setTiles(shuffled);
  }, []);

  // AI Hint Action
  const handleHint = useCallback(() => {
    const current = stateRef.current;
    const best = calculateBestMove(current.gridSize, current.tiles);
    if (best) {
      setHintDirection(best);
      sound.playClick();
    }
  }, []);

  // Keyboard controls listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (stateRef.current.appMode !== '2048') return;

      if (stateRef.current.inTitleScreen) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setInTitleScreen(false);
          sound.playClick();
        }
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        handleMove('up');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleMove('down');
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleMove('left');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        handleMove('right');
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleMove, handleUndo]);

  // Touch Swipe Gesture Detection
  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (stateRef.current.appMode !== '2048') return;
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 1) {
        const deltaX = e.changedTouches[0].clientX - startX;
        const deltaY = e.changedTouches[0].clientY - startY;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        const threshold = 35;
        if (Math.max(absX, absY) > threshold) {
          if (absX > absY) {
            handleMove(deltaX > 0 ? 'right' : 'left');
          } else {
            handleMove(deltaY > 0 ? 'down' : 'up');
          }
        }
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleMove]);

  // Changing Theme
  const handleChangeTheme = (newTheme: VisualTheme) => {
    setTheme(newTheme);
    if (board3DRef.current) {
      board3DRef.current.applyTheme(newTheme);
    }
  };

  // Changing Camera Angle Preset
  const handleChangeCamera = (preset: CameraPreset) => {
    setCameraPreset(preset);
    if (board3DRef.current) {
      board3DRef.current.setCameraPreset(preset);
    }
  };

  // Toggle 8K Ultra Graphic Mode
  const handleToggle8K = () => {
    const next = !is8KMode;
    setIs8KMode(next);
    if (board3DRef.current) {
      board3DRef.current.set8KMode(next);
    }
    sound.playClick();
  };

  // Changing Grid Size
  const handleChangeGridSize = (newSize: GridSize) => {
    setGridSize(newSize);
    startNewGame(newSize, gameMode);
  };

  // Changing Game Mode
  const handleChangeGameMode = (newMode: GameMode) => {
    setGameMode(newMode);
    startNewGame(gridSize, newMode);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 select-none">
      {/* Isolated Three.js WebGL Canvas Mount Container */}
      <div
        ref={mountRef}
        className={`absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing ${
          appMode === '2048' ? 'block' : 'hidden'
        }`}
      />

      {/* Low-occlusion 2048 Game UI Overlay */}
      {appMode === '2048' && (
        <GameHUD
          score={score}
          bestScore={bestScore}
          moves={moves}
          gridSize={gridSize}
          gameMode={gameMode}
          theme={theme}
          cameraPreset={cameraPreset}
          timeRemaining={timeRemaining}
          isMuted={isMuted}
          canUndo={history.length > 0}
          activeCheat={activeCheat}
          hintDirection={hintDirection}
          godMode={godMode}
          selectedSpawnValue={selectedSpawnValue}
          inTitleScreen={inTitleScreen}
          gameOver={gameOver}
          won={won}
          hasWonAcknowledged={hasWonAcknowledged}
          autoPlayActive={autoPlayActive}
          autoPlaySpeed={autoPlaySpeed}
          onToggleAutoPlay={() => {
            if (!isUserCheatAdmin(currentUser?.email)) return;
            setAutoPlayActive(!autoPlayActive);
            sound.playClick();
          }}
          onChangeAutoPlaySpeed={(spd) => {
            setAutoPlaySpeed(spd);
            sound.playClick();
          }}
          is8KMode={is8KMode}
          onToggle8KMode={handleToggle8K}
          currentUser={currentUser}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenChat={() => setIsChatOpen(true)}
          onOpenHomework={() => setIsHomeworkOpen(true)}
          onOpenMemeParty={() => {
            setAppMode('meme_party');
            sound.playClick();
          }}
          onMove={handleMove}
          onNewGame={() => startNewGame(gridSize, gameMode)}
          onStartGame={() => {
            setInTitleScreen(false);
            sound.playClick();
          }}
          onContinueEndless={() => {
            setHasWonAcknowledged(true);
            sound.playClick();
          }}
          onToggleMute={() => setIsMuted(sound.toggleMute())}
          onChangeGridSize={handleChangeGridSize}
          onChangeGameMode={handleChangeGameMode}
          onChangeTheme={handleChangeTheme}
          onChangeCamera={handleChangeCamera}
          onUndo={handleUndo}
          onShuffle={handleShuffle}
          onHint={handleHint}
          setActiveCheat={setActiveCheat}
          setSelectedSpawnValue={setSelectedSpawnValue}
          setGodMode={setGodMode}
        />
      )}

      {/* Dedicated MEME-MASTER Party Game Mode */}
      {appMode === 'meme_party' && (
        <MemePartyGame
          currentUser={currentUser}
          onBackTo2048={() => {
            setAppMode('2048');
            sound.playClick();
          }}
          onOpenAuth={() => setIsLeaderboardOpen(true)}
        />
      )}

      {/* Firebase Global Leaderboard & Auth Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        currentUser={currentUser}
        currentGridSize={gridSize}
      />

      {/* Community Real-Time Chat Modal */}
      <CommunityChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentUser={currentUser}
        onOpenHomework={() => {
          setIsChatOpen(false);
          setIsHomeworkOpen(true);
        }}
      />

      {/* Free Gemini Homework & School Assistant Modal */}
      <GeminiHomeworkModal
        isOpen={isHomeworkOpen}
        onClose={() => setIsHomeworkOpen(false)}
        onOpenChat={() => {
          setIsHomeworkOpen(false);
          setIsChatOpen(true);
        }}
      />
    </div>
  );
}
