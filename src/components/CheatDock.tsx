import React, { useState } from 'react';
import { Sparkles, Undo2, Hammer, PlusCircle, ArrowUpRight, Shuffle, Bot, Shield, X, Lock, Crown, LogIn } from 'lucide-react';
import { User } from 'firebase/auth';
import { CheatAction } from '../types';
import { isUserCheatAdmin } from '../firebase/leaderboard';

interface CheatDockProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  canUndo: boolean;
  onUndo: () => void;
  activeCheat: CheatAction | null;
  setActiveCheat: (cheat: CheatAction | null) => void;
  selectedSpawnValue: number;
  setSelectedSpawnValue: (val: number) => void;
  onShuffle: () => void;
  onHint: () => void;
  hintDirection: string | null;
  godMode: boolean;
  setGodMode: React.Dispatch<React.SetStateAction<boolean>>;
}

const SPAWN_VALUES = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];

export const CheatDock: React.FC<CheatDockProps> = ({
  currentUser,
  onOpenAuth,
  canUndo,
  onUndo,
  activeCheat,
  setActiveCheat,
  selectedSpawnValue,
  setSelectedSpawnValue,
  onShuffle,
  onHint,
  hintDirection,
  godMode,
  setGodMode,
}) => {
  const [showSpawnPicker, setShowSpawnPicker] = useState(false);

  const isAdmin = isUserCheatAdmin(currentUser?.email);

  // If not admin, display access gate
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-neutral-900/95 border border-red-500/30 rounded-2xl text-center text-white">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-2">
          <Lock className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-black text-white mb-1">Cheat-Menü Gesperrt</h4>
        <p className="text-xs text-neutral-400 max-w-md mb-3">
          Der Cheat-Modus ist aus Sicherheitsgründen exklusiv für <strong className="text-amber-400">l.mueller2@emagym.de</strong> und <strong className="text-amber-400">leopoldremscheid@icloud.com</strong> freigeschaltet.
        </p>
        <button
          onClick={onOpenAuth}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-xs rounded-xl shadow-lg transition-all active:scale-95"
        >
          <LogIn className="w-4 h-4 fill-neutral-950" />
          <span>Mit Google anmelden</span>
        </button>
      </div>
    );
  }

  // Admin is authenticated! Render all cheats with VIP badge
  return (
    <div className="flex flex-col gap-2 p-3 bg-neutral-900/95 border border-amber-500/40 rounded-2xl shadow-2xl text-white">
      {/* VIP Admin Unlocked Banner */}
      <div className="flex items-center justify-between px-3 py-1 bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-amber-500/40 rounded-xl text-[11px] font-bold text-amber-300">
        <span className="flex items-center gap-1.5">
          <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>VIP Cheat-Admin Aktiv: <strong>{currentUser?.email}</strong></span>
        </span>
        <span className="text-[10px] text-amber-400 uppercase tracking-widest font-black">UNLOCKED</span>
      </div>

      {/* Active action banner */}
      {activeCheat && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-amber-500/20 border border-amber-400/40 rounded-xl text-xs font-semibold text-amber-300 animate-pulse">
          <span>
            {activeCheat === 'hammer' && '⚡ HAMMER-MODUS: Klicke auf eine 3D-Kachel, um sie zu zerstören!'}
            {activeCheat === 'spawn' && `➕ SPAWN-MODUS: Klicke auf ein freies 3D-Feld für die [${selectedSpawnValue}]-Kachel!`}
            {activeCheat === 'double' && '✨ VERDOPPELN: Klicke auf eine 3D-Kachel, um ihren Wert zu verdoppeln!'}
          </span>
          <button
            onClick={() => setActiveCheat(null)}
            className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-300 hover:text-white"
            title="Abbrechen"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Spawn number selector bar */}
      {showSpawnPicker && (
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-neutral-950/80 rounded-xl border border-neutral-700/60">
          <span className="text-[11px] text-neutral-400 font-medium px-1">Kachelwert wählen:</span>
          {SPAWN_VALUES.map((val) => (
            <button
              key={val}
              onClick={() => {
                setSelectedSpawnValue(val);
                setActiveCheat('spawn');
                setShowSpawnPicker(false);
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                selectedSpawnValue === val
                  ? 'bg-amber-500 text-neutral-950 shadow-md scale-105'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
              }`}
            >
              {val}
            </button>
          ))}
        </div>
      )}

      {/* Cheat Buttons Grid */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {/* Undo button */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
            canUndo
              ? 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-100 hover:scale-105 active:scale-95'
              : 'bg-neutral-900/50 border-neutral-800 text-neutral-600 cursor-not-allowed'
          }`}
          title="Letzten Zug rückgängig machen (Strg+Z)"
        >
          <Undo2 className="w-3.5 h-3.5 text-sky-400" />
          <span>Rückgängig</span>
        </button>

        {/* Hammer Cheat */}
        <button
          onClick={() => setActiveCheat(activeCheat === 'hammer' ? null : 'hammer')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
            activeCheat === 'hammer'
              ? 'bg-red-600 border-red-400 text-white shadow-lg shadow-red-600/30 ring-2 ring-red-400'
              : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-100 hover:scale-105 active:scale-95'
          }`}
          title="Zerstöre eine beliebige Kachel auf dem Spielfeld"
        >
          <Hammer className="w-3.5 h-3.5 text-red-400" />
          <span>Hammer</span>
        </button>

        {/* Spawn Cheat */}
        <button
          onClick={() => {
            setShowSpawnPicker(!showSpawnPicker);
            if (activeCheat !== 'spawn') setActiveCheat('spawn');
          }}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
            activeCheat === 'spawn'
              ? 'bg-amber-600 border-amber-400 text-white shadow-lg shadow-amber-600/30 ring-2 ring-amber-400'
              : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-100 hover:scale-105 active:scale-95'
          }`}
          title="Platziere eine gewünschte Zahl auf einem leeren Feld"
        >
          <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>Spawn [{selectedSpawnValue}]</span>
        </button>

        {/* Double Cheat */}
        <button
          onClick={() => setActiveCheat(activeCheat === 'double' ? null : 'double')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
            activeCheat === 'double'
              ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/30 ring-2 ring-purple-400'
              : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-100 hover:scale-105 active:scale-95'
          }`}
          title="Klicke eine Kachel, um ihren Wert zu verdoppeln"
        >
          <ArrowUpRight className="w-3.5 h-3.5 text-purple-400" />
          <span>2x Boost</span>
        </button>

        {/* Shuffle Cheat */}
        <button
          onClick={onShuffle}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-100 hover:scale-105 active:scale-95 transition-all"
          title="Mische alle Kacheln zufällig auf freie Positionen"
        >
          <Shuffle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Mischen</span>
        </button>

        {/* AI Solver Hint */}
        <button
          onClick={onHint}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
            hintDirection
              ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg shadow-cyan-600/30'
              : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-100 hover:scale-105 active:scale-95'
          }`}
          title="AI-Tipp: Berechne den besten nächsten Zug"
        >
          <Bot className="w-3.5 h-3.5 text-cyan-400" />
          <span>{hintDirection ? `Tipp: ${hintDirection.toUpperCase()}` : 'AI-Tipp'}</span>
        </button>

        {/* God Mode Toggle */}
        <button
          onClick={() => setGodMode(!godMode)}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
            godMode
              ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-neutral-800/80 hover:bg-neutral-700 border-neutral-700 text-neutral-400'
          }`}
          title="God-Mode: Unverwundbar bei Game Over"
        >
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>God-Mode: {godMode ? 'AN' : 'AUS'}</span>
        </button>
      </div>
    </div>
  );
};
