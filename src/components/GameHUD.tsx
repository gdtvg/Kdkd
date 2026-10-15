import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Maximize2,
  Minimize2,
  Camera,
  Palette,
  LayoutGrid,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Play,
  Trophy,
  Flame,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  Bot,
  Zap,
  Sliders,
  Sparkle,
  MessageSquare,
  BookOpen,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { CameraPreset, GameMode, GridSize, MoveDirection, VisualTheme } from '../types';
import { CheatDock } from './CheatDock';
import { THEMES } from '../three/themes';
import { isUserCheatAdmin } from '../firebase/leaderboard';

interface GameHUDProps {
  score: number;
  bestScore: number;
  moves: number;
  gridSize: GridSize;
  gameMode: GameMode;
  theme: VisualTheme;
  cameraPreset: CameraPreset;
  timeRemaining?: number;
  isMuted: boolean;
  canUndo: boolean;
  activeCheat: any;
  hintDirection: MoveDirection | null;
  godMode: boolean;
  selectedSpawnValue: number;
  inTitleScreen: boolean;
  gameOver: boolean;
  won: boolean;
  hasWonAcknowledged: boolean;

  // Auto-Play
  autoPlayActive: boolean;
  autoPlaySpeed: 'normal' | 'fast' | 'turbo';
  onToggleAutoPlay: () => void;
  onChangeAutoPlaySpeed: (speed: 'normal' | 'fast' | 'turbo') => void;

  // 8K Graphics
  is8KMode: boolean;
  onToggle8KMode: () => void;

  // Auth & Leaderboard
  currentUser: User | null;
  onOpenLeaderboard: () => void;

  // Chat & Gemini Homework & Meme Party Game
  onOpenChat: () => void;
  onOpenHomework: () => void;
  onOpenMemeParty: () => void;

  onMove: (dir: MoveDirection) => void;
  onNewGame: () => void;
  onStartGame: () => void;
  onContinueEndless: () => void;
  onToggleMute: () => void;
  onChangeGridSize: (size: GridSize) => void;
  onChangeGameMode: (mode: GameMode) => void;
  onChangeTheme: (theme: VisualTheme) => void;
  onChangeCamera: (preset: CameraPreset) => void;
  onUndo: () => void;
  onShuffle: () => void;
  onHint: () => void;
  setActiveCheat: (cheat: any) => void;
  setSelectedSpawnValue: (val: number) => void;
  setGodMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  bestScore,
  moves,
  gridSize,
  gameMode,
  theme,
  cameraPreset,
  timeRemaining,
  isMuted,
  canUndo,
  activeCheat,
  hintDirection,
  godMode,
  selectedSpawnValue,
  inTitleScreen,
  gameOver,
  won,
  hasWonAcknowledged,

  autoPlayActive,
  autoPlaySpeed,
  onToggleAutoPlay,
  onChangeAutoPlaySpeed,

  is8KMode,
  onToggle8KMode,

  currentUser,
  onOpenLeaderboard,
  onOpenChat,
  onOpenHomework,
  onOpenMemeParty,

  onMove,
  onNewGame,
  onStartGame,
  onContinueEndless,
  onToggleMute,
  onChangeGridSize,
  onChangeGameMode,
  onChangeTheme,
  onChangeCamera,
  onUndo,
  onShuffle,
  onHint,
  setActiveCheat,
  setSelectedSpawnValue,
  setGodMode,
}) => {
  const [dockExpanded, setDockExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'settings' | 'cheats' | 'bot'>('settings');
  const [showHowTo, setShowHowTo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isAdmin = isUserCheatAdmin(currentUser?.email);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex flex-col justify-between p-3 md:p-6 font-sans">
      {/* ================= TOP PERIMETER STATUS CLUSTERS ================= */}
      <header className="flex items-start justify-between gap-3 pointer-events-auto">
        {/* Left: Brand title & Mode badge */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-2xl md:text-3xl font-black tracking-tight text-white drop-shadow-md">
              2048 <span className="text-amber-400 font-extrabold text-xl md:text-2xl">3D</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {gridSize}x{gridSize} · {gameMode === 'classic' ? 'Ziel 2048' : gameMode === 'endless' ? 'Endlos' : 'Zeitangriff'}
            </span>
            {is8KMode && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-gradient-to-r from-purple-500 to-cyan-500 text-white">
                8K ULTRA
              </span>
            )}
          </div>
          <div className="text-[11px] font-medium text-neutral-400 hidden sm:block">
            Pfeiltasten / WASD · Perspektive von oben aktiv · Leaderboard & Cheats
          </div>
        </div>

        {/* Center: Auto-Play or AI Hint Banner */}
        {isAdmin && autoPlayActive ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950 border border-emerald-400/60 rounded-xl text-emerald-300 text-xs font-bold shadow-lg shadow-emerald-950/60">
            <Bot className="w-4 h-4 animate-spin text-emerald-400" />
            <span>AUTO-PILOT LÄUFT ({autoPlaySpeed.toUpperCase()})</span>
            <button
              onClick={onToggleAutoPlay}
              className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded font-bold text-[10px] ml-1"
            >
              STOP
            </button>
          </div>
        ) : hintDirection ? (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-cyan-950 border border-cyan-400/50 rounded-xl text-cyan-300 text-xs font-bold animate-bounce shadow-lg shadow-cyan-950/50">
            <span>Bester nächster Zug:</span>
            <span className="px-2 py-0.5 bg-cyan-500 text-neutral-950 rounded font-black uppercase">
              {hintDirection === 'up' && '↑ HOCH'}
              {hintDirection === 'down' && '↓ RUNTER'}
              {hintDirection === 'left' && '← LINKS'}
              {hintDirection === 'right' && '→ RECHTS'}
            </span>
          </div>
        ) : null}

        {/* Right: Score, Leaderboard, & Utility controls */}
        <div className="flex items-center gap-2">
          {gameMode === 'time_attack' && timeRemaining !== undefined && (
            <div className="flex flex-col items-center justify-center px-3 py-1.5 bg-neutral-900/90 border border-red-500/40 rounded-xl text-white">
              <span className="text-[9px] font-bold uppercase tracking-wider text-red-400">Zeit</span>
              <span className="text-sm font-black tabular-nums text-red-300">{formatTime(timeRemaining)}</span>
            </div>
          )}

          {/* Current Score */}
          <div className="flex flex-col items-center justify-center px-3 md:px-4 py-1.5 bg-neutral-900/90 border border-neutral-700/80 rounded-xl text-white shadow-lg">
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Punkte</span>
            <span className="text-base md:text-xl font-black tabular-nums text-amber-400">{score}</span>
          </div>

          {/* Leaderboard CTA Button */}
          <button
            onClick={onOpenLeaderboard}
            className="flex flex-col items-center justify-center px-2.5 sm:px-3.5 py-1.5 bg-gradient-to-b from-neutral-800 to-neutral-900 hover:from-neutral-700 hover:to-neutral-800 border border-amber-500/40 rounded-xl text-white shadow-lg transition-all active:scale-95 group"
            title="Weltweites Leaderboard öffnen"
          >
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1 group-hover:scale-105">
              <Trophy className="w-2.5 h-2.5 text-amber-400 fill-amber-400" /> Rangliste
            </span>
            <span className="text-xs sm:text-sm font-bold text-neutral-200">
              {currentUser ? currentUser.displayName?.split(' ')[0] || 'Profil' : 'Anmelden'}
            </span>
          </button>

          {/* MEME-MASTER Party Mode Toggle Button */}
          <button
            onClick={onOpenMemeParty}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-pink-600/30 to-purple-600/30 hover:from-pink-600/40 hover:to-purple-600/40 border border-pink-500/50 rounded-xl text-pink-300 font-bold text-xs shadow-lg shadow-pink-950/40 transition-all active:scale-95 group"
            title="Neuer Modus: MEME-MASTER Multiplayer Party Game"
          >
            <span className="text-sm group-hover:scale-110 transition-transform">🎭</span>
            <span className="hidden sm:inline text-white font-black">MEME-MASTER</span>
            <span className="px-1.5 py-0.2 rounded bg-pink-500 text-neutral-950 font-black text-[9px]">PARTY</span>
          </button>

          {/* Community Chat Button */}
          <button
            onClick={onOpenChat}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900/90 hover:bg-neutral-800 border border-sky-500/40 rounded-xl text-sky-400 font-bold text-xs shadow-lg transition-all active:scale-95"
            title="Community Chat & Spielerräume"
          >
            <MessageSquare className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline text-white">Chat</span>
          </button>

          {/* Gemini Homework Assistant Button */}
          <button
            onClick={onOpenHomework}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500/20 to-red-500/20 hover:from-amber-500/30 hover:to-red-500/30 border border-amber-500/50 rounded-xl text-amber-300 font-bold text-xs shadow-lg transition-all active:scale-95"
            title="Kostenlos Gemini für Schulaufgaben & Nachhilfe nutzen"
          >
            <BookOpen className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            <span className="hidden md:inline text-white">Schulhelfer</span>
          </button>

          {/* Quick Action Icons */}
          <div className="flex items-center gap-1 bg-neutral-900/90 border border-neutral-700/80 rounded-xl p-1 shadow-lg">
            <button
              onClick={onToggleMute}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition-all"
              title={isMuted ? 'Ton einschalten' : 'Ton stummschalten'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <button
              onClick={onNewGame}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition-all"
              title="Neues Spiel starten"
            >
              <RotateCcw className="w-4 h-4 text-sky-400" />
            </button>
            <button
              onClick={() => setShowHowTo(!showHowTo)}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition-all"
              title="Anleitung & Infos"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition-all"
              title="Vollbild umschalten"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ================= ON-SCREEN D-PAD (MOBILE TOUCH) ================= */}
      <div className="pointer-events-auto self-end sm:hidden flex flex-col items-center gap-1 bg-neutral-900/85 p-2 rounded-2xl border border-neutral-700 shadow-xl mb-2 mr-1">
        <button
          onClick={() => onMove('up')}
          className="p-2.5 bg-neutral-800 active:bg-amber-600 active:scale-95 text-white rounded-xl shadow"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onMove('left')}
            className="p-2.5 bg-neutral-800 active:bg-amber-600 active:scale-95 text-white rounded-xl shadow"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => onMove('down')}
            className="p-2.5 bg-neutral-800 active:bg-amber-600 active:scale-95 text-white rounded-xl shadow"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
          <button
            onClick={() => onMove('right')}
            className="p-2.5 bg-neutral-800 active:bg-amber-600 active:scale-95 text-white rounded-xl shadow"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ================= UNIFIED BOTTOM CONTROL DOCK ================= */}
      <footer className="pointer-events-auto self-center flex flex-col items-center w-full max-w-3xl transition-transform duration-300">
        {/* Dock Collapse / Expand Toggle Button */}
        <button
          onClick={() => setDockExpanded(!dockExpanded)}
          className="flex items-center gap-1.5 px-3 py-1 bg-neutral-900 border border-neutral-700/80 rounded-t-xl text-[11px] font-semibold text-neutral-300 hover:text-white shadow-md hover:bg-neutral-800 transition-all"
        >
          {dockExpanded ? (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Menü einklappen (H)</span>
            </>
          ) : (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>{isAdmin ? 'Optionen, Auto-Pilot & Cheats' : 'Optionen & Einstellungen'}</span>
            </>
          )}
        </button>

        {dockExpanded && (
          <div className="w-full bg-neutral-900/95 border border-neutral-700/80 rounded-2xl p-3 shadow-2xl flex flex-col gap-3">
            {/* Top row: Tab Switcher (Settings vs Auto-Pilot vs Cheats) */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    activeTab === 'settings'
                      ? 'bg-amber-500 text-neutral-950 shadow-md'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Spielfeld & 3D</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => setActiveTab('bot')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                      activeTab === 'bot'
                        ? 'bg-emerald-500 text-neutral-950 shadow-md'
                        : 'bg-neutral-800 text-emerald-300 hover:bg-neutral-700 border border-emerald-500/30'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Auto-Pilot (VIP)</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('cheats')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    activeTab === 'cheats'
                      ? 'bg-gradient-to-r from-amber-500 to-red-500 text-neutral-950 shadow-md'
                      : 'bg-neutral-800 text-amber-300 hover:bg-neutral-700 border border-amber-500/30'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cheat-Menü</span>
                </button>
              </div>

              {/* 8K Graphic Mode Toggle */}
              <button
                onClick={onToggle8KMode}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                  is8KMode
                    ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-neutral-800/80 border-neutral-700 text-neutral-400 hover:text-white'
                }`}
                title="8K Ultra Grafikmodus (Super-Sampling & High-DPI Kantenschärfe)"
              >
                <Sparkle className="w-3 h-3 text-purple-400" />
                <span>8K Grafik: {is8KMode ? 'AN' : 'AUS'}</span>
              </button>
            </div>

            {/* TAB CONTENT: Settings */}
            {activeTab === 'settings' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                {/* 1. Grid Size */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Feldgröße</span>
                  <div className="grid grid-cols-4 gap-1">
                    {([3, 4, 5, 6] as GridSize[]).map((sz) => (
                      <button
                        key={sz}
                        onClick={() => onChangeGridSize(sz)}
                        className={`py-1.5 text-center font-bold rounded-lg border transition-all ${
                          gridSize === sz
                            ? 'bg-amber-500 border-amber-400 text-neutral-950 shadow'
                            : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
                        }`}
                      >
                        {sz}x{sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Game Mode */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Modus</span>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'classic', label: '2048' },
                      { id: 'endless', label: 'Endlos' },
                      { id: 'time_attack', label: 'Zeit' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => onChangeGameMode(m.id as GameMode)}
                        className={`py-1.5 text-center font-bold rounded-lg border text-[11px] transition-all ${
                          gameMode === m.id
                            ? 'bg-amber-500 border-amber-400 text-neutral-950 shadow'
                            : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Theme */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1">
                    <Palette className="w-3 h-3 text-amber-400" /> 3D-Design
                  </span>
                  <div className="grid grid-cols-2 gap-1">
                    {Object.keys(THEMES).map((thKey) => (
                      <button
                        key={thKey}
                        onClick={() => onChangeTheme(thKey as VisualTheme)}
                        className={`py-1 px-2 text-left font-bold rounded-lg border text-[10px] truncate transition-all ${
                          theme === thKey
                            ? 'bg-amber-500 border-amber-400 text-neutral-950 shadow'
                            : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
                        }`}
                      >
                        {THEMES[thKey as VisualTheme].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Camera Angle */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1">
                    <Camera className="w-3 h-3 text-amber-400" /> Perspektive
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'iso', label: 'Von Oben' },
                      { id: 'topdown', label: 'Draufsicht' },
                      { id: 'cinematic', label: 'Kino 3D' },
                    ].map((cam) => (
                      <button
                        key={cam.id}
                        onClick={() => onChangeCamera(cam.id as CameraPreset)}
                        className={`py-1.5 text-center font-bold rounded-lg border text-[10px] transition-all ${
                          cameraPreset === cam.id
                            ? 'bg-amber-500 border-amber-400 text-neutral-950 shadow'
                            : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
                        }`}
                      >
                        {cam.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Auto-Pilot (Bot Mode - VIP Only) */}
            {isAdmin && activeTab === 'bot' && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-neutral-950/70 border border-emerald-500/30 rounded-xl text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Automatischer Spielmodus (AI-Bot)</h4>
                    <p className="text-[11px] text-neutral-400">
                      Lässt den Computer das Spiel vollautomatisch und mit optimaler Heuristik für dich lösen!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Speed selection */}
                  <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-700 rounded-lg p-0.5">
                    {[
                      { id: 'normal', label: 'Normal' },
                      { id: 'fast', label: 'Schnell' },
                      { id: 'turbo', label: '⚡ Turbo' },
                    ].map((spd) => (
                      <button
                        key={spd.id}
                        onClick={() => onChangeAutoPlaySpeed(spd.id as any)}
                        className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                          autoPlaySpeed === spd.id
                            ? 'bg-emerald-500 text-neutral-950 shadow'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {spd.label}
                      </button>
                    ))}
                  </div>

                  {/* Toggle button */}
                  <button
                    onClick={onToggleAutoPlay}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 ${
                      autoPlayActive
                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-emerald-500/30'
                    }`}
                  >
                    <Play className={`w-3.5 h-3.5 fill-current ${autoPlayActive ? 'rotate-90' : ''}`} />
                    <span>{autoPlayActive ? 'Auto-Pilot Stoppen' : 'Auto-Pilot Starten'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Cheats (Strict Auth for l.mueller2@emagym.de & leopoldremscheid@icloud.com) */}
            {activeTab === 'cheats' && (
              <CheatDock
                currentUser={currentUser}
                onOpenAuth={onOpenLeaderboard}
                canUndo={canUndo}
                onUndo={onUndo}
                activeCheat={activeCheat}
                setActiveCheat={setActiveCheat}
                selectedSpawnValue={selectedSpawnValue}
                setSelectedSpawnValue={setSelectedSpawnValue}
                onShuffle={onShuffle}
                onHint={onHint}
                hintDirection={hintDirection}
                godMode={godMode}
                setGodMode={setGodMode}
              />
            )}
          </div>
        )}
      </footer>

      {/* ================= TITLE SCREEN GAME SHELL ================= */}
      {inTitleScreen && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm pointer-events-auto flex flex-col items-center justify-center p-6 text-center z-50 animate-fadeIn">
          <div className="mb-6 max-w-md w-full flex flex-col items-center">
            <svg viewBox="0 0 400 120" className="w-72 md:w-96 drop-shadow-2xl">
              <defs>
                <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <text
                x="200"
                y="85"
                textAnchor="middle"
                fontSize="84"
                fontWeight="900"
                fontFamily="system-ui, sans-serif"
                fill="url(#titleGrad)"
                filter="url(#glow)"
              >
                2048 3D
              </text>
            </svg>
            <p className="text-neutral-300 text-sm md:text-base max-w-sm font-medium">
              3D-Grafik von oben, Auto-Pilot-Modus, weltweites Google-Leaderboard & Cheat-Menü!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md justify-center">
            <button
              onClick={onStartGame}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-base rounded-2xl shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="w-5 h-5 fill-neutral-950" />
              <span>2048 3D Spielen</span>
            </button>

            <button
              onClick={onOpenMemeParty}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:from-pink-400 hover:to-cyan-400 text-white font-black text-base rounded-2xl shadow-xl shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all"
            >
              <span>🎭 MEME-MASTER Party</span>
            </button>
          </div>

          <div className="mt-8 text-neutral-400 text-xs font-semibold tracking-wide">
            WASD / Pfeile Bewegen · Draufsicht & 8K Ultra · Auto-Modus · Leaderboard · MEME-MASTER
          </div>
        </div>
      )}

      {/* ================= VICTORY MODAL ================= */}
      {won && !hasWonAcknowledged && (
        <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-sm pointer-events-auto flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-neutral-900 border border-amber-500/50 rounded-3xl p-6 md:p-8 max-w-md w-full text-center shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-4 animate-bounce">
              <Trophy className="w-9 h-9" />
            </div>

            <h2 className="text-3xl font-black text-white mb-2">2048 Erreicht! 🎉</h2>
            <p className="text-neutral-300 text-sm mb-6">
              Dein Score wurde für das weltweite Leaderboard gewertet!
            </p>

            <div className="flex gap-4 mb-6 w-full justify-center">
              <div className="px-4 py-2 bg-neutral-800 rounded-xl text-center">
                <div className="text-[10px] text-neutral-400 uppercase font-bold">Punkte</div>
                <div className="text-xl font-black text-amber-400">{score}</div>
              </div>
              <div className="px-4 py-2 bg-neutral-800 rounded-xl text-center">
                <div className="text-[10px] text-neutral-400 uppercase font-bold">Züge</div>
                <div className="text-xl font-black text-white">{moves}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={onContinueEndless}
                className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-xl shadow-lg transition-all"
              >
                Endlos Weiterspielen
              </button>
              <button
                onClick={onNewGame}
                className="flex-1 py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-all"
              >
                Neues Spiel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= GAME OVER MODAL ================= */}
      {gameOver && (
        <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-sm pointer-events-auto flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-neutral-900 border border-red-500/40 rounded-3xl p-6 md:p-8 max-w-md w-full text-center shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mb-4">
              <Flame className="w-9 h-9" />
            </div>

            <h2 className="text-3xl font-black text-white mb-2">Game Over!</h2>
            <p className="text-neutral-300 text-sm mb-6">
              Keine weiteren Züge möglich. Dein Ergebnis wurde gespeichert!
            </p>

            <div className="flex gap-4 mb-6 w-full justify-center">
              <div className="px-4 py-2 bg-neutral-800 rounded-xl text-center">
                <div className="text-[10px] text-neutral-400 uppercase font-bold">Endstand</div>
                <div className="text-xl font-black text-amber-400">{score}</div>
              </div>
              <div className="px-4 py-2 bg-neutral-800 rounded-xl text-center">
                <div className="text-[10px] text-neutral-400 uppercase font-bold">Rekord</div>
                <div className="text-xl font-black text-white">{bestScore}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              {canUndo && (
                <button
                  onClick={onUndo}
                  className="flex-1 py-3 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg transition-all"
                >
                  Zug Rückgängig
                </button>
              )}
              <button
                onClick={onNewGame}
                className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-xl shadow-lg transition-all"
              >
                Nochmal Versuchen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= HOW TO PLAY MODAL ================= */}
      {showHowTo && (
        <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-sm pointer-events-auto flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl p-6 md:p-8 max-w-lg w-full text-left shadow-2xl flex flex-col max-h-[85vh] overflow-y-auto">
            <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-amber-400" /> Spielanleitung & Funktionen
            </h3>

            <div className="space-y-4 text-xs md:text-sm text-neutral-300">
              <div>
                <h4 className="font-bold text-amber-400 mb-1">🎮 Steuerung & Draufsicht</h4>
                <p>Verwende Pfeiltasten oder WASD. Die Kamera blickt standardmäßig steil von oben auf das 3D-Feld. Über den Tab "Spielfeld & 3D" kannst du auch auf eine 90°-Draufsicht oder Cinematic wechseln.</p>
              </div>

              <div>
                <h4 className="font-bold text-amber-400 mb-1">🤖 Automatischer Modus (Auto-Pilot)</h4>
                <p>Aktiviere im Tab "Auto-Pilot" den computergesteuerten Modus. Die KI analysiert jeden Zug und spielt das Spiel in Echtzeit mit wählbarer Geschwindigkeit (Normal, Schnell, Turbo) für dich!</p>
              </div>

              <div>
                <h4 className="font-bold text-amber-400 mb-1">🏆 Weltweites Leaderboard mit Google</h4>
                <p>Klicke oben rechts auf "Rangliste" und melde dich mit deinem Google-Konto an. Deine Highscores für 3x3, 4x4, 5x5 und 6x6 werden live synchronisiert!</p>
              </div>

              <div>
                <h4 className="font-bold text-amber-400 mb-1">🔒 Cheat-Menü Schutz</h4>
                <p>Das Cheat-Menü ist aus Fairness-Gründen exklusiv für <strong className="text-white">l.mueller2@emagym.de</strong> und <strong className="text-white">leopoldremscheid@icloud.com</strong> nach Google-Login freigeschaltet.</p>
              </div>
            </div>

            <button
              onClick={() => setShowHowTo(false)}
              className="mt-6 py-2.5 px-6 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl self-end"
            >
              Verstanden
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
