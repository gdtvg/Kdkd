import React, { useEffect, useState } from 'react';
import { Trophy, X, Medal, UserCheck, LogIn, LogOut, ShieldCheck, Crown } from 'lucide-react';
import { User, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { GridSize } from '../types';
import {
  isUserCheatAdmin,
  LeaderboardRecord,
  subscribeToLeaderboard,
} from '../firebase/leaderboard';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  currentGridSize: GridSize;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentGridSize,
}) => {
  const [selectedGrid, setSelectedGrid] = useState<GridSize>(currentGridSize);
  const [records, setRecords] = useState<LeaderboardRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedGrid(currentGridSize);
  }, [currentGridSize]);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const unsubscribe = subscribeToLeaderboard(selectedGrid, (data) => {
      setRecords(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, selectedGrid]);

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Login error:', err);
      setAuthError('Google-Login fehlgeschlagen. Bitte Pop-up zulassen.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (!isOpen) return null;

  const isAdmin = isUserCheatAdmin(currentUser?.email);

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto bg-neutral-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-3xl p-5 sm:p-7 max-w-xl w-full shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Weltweites Leaderboard</h3>
              <p className="text-xs text-neutral-400 font-medium">Beste Highscores & Kacheln</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Auth Banner */}
        <div className="my-3 p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 flex flex-wrap items-center justify-between gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2.5">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                  className="w-8 h-8 rounded-full border border-amber-500/50"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-amber-400">
                  {currentUser.displayName?.[0] || 'U'}
                </div>
              )}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-[200px]">
                    {currentUser.displayName || currentUser.email}
                  </span>
                  {isAdmin && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-gradient-to-r from-amber-500 to-red-500 text-neutral-950">
                      <Crown className="w-2.5 h-2.5 fill-neutral-950" /> VIP ADMIN
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-neutral-400">{currentUser.email}</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-neutral-300 font-medium">
              Melde dich mit Google an, um deinen Highscore weltweit zu verewigen.
            </div>
          )}

          {currentUser ? (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Abmelden</span>
            </button>
          ) : (
            <button
              onClick={handleSignIn}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5 fill-neutral-950" />
              <span>Mit Google anmelden</span>
            </button>
          )}
        </div>

        {authError && (
          <div className="mb-2 text-xs text-red-400 bg-red-950/40 border border-red-800/60 p-2 rounded-xl">
            {authError}
          </div>
        )}

        {/* Grid Selector Tabs */}
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {([3, 4, 5, 6] as GridSize[]).map((sz) => (
            <button
              key={sz}
              onClick={() => setSelectedGrid(sz)}
              className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                selectedGrid === sz
                  ? 'bg-amber-500 border-amber-400 text-neutral-950 shadow'
                  : 'bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {sz}x{sz} Rangliste
            </button>
          ))}
        </div>

        {/* Rankings List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {loading ? (
            <div className="py-12 text-center text-xs text-neutral-500 font-medium">
              Lade Bestenliste...
            </div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400 flex flex-col items-center gap-2">
              <Trophy className="w-8 h-8 text-neutral-600" />
              <span>Noch keine Einträge für {selectedGrid}x{selectedGrid}. Sei der Erste!</span>
            </div>
          ) : (
            records.map((rec, idx) => {
              const isCurrentUser = currentUser?.uid === rec.userId;
              return (
                <div
                  key={rec.id}
                  className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                    isCurrentUser
                      ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/30'
                      : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Badge */}
                    <div className="w-7 h-7 flex items-center justify-center font-black text-sm">
                      {idx === 0 ? (
                        <span className="text-yellow-400 text-base">🥇</span>
                      ) : idx === 1 ? (
                        <span className="text-slate-300 text-base">🥈</span>
                      ) : idx === 2 ? (
                        <span className="text-amber-600 text-base">🥉</span>
                      ) : (
                        <span className="text-neutral-500 text-xs font-bold">#{idx + 1}</span>
                      )}
                    </div>

                    {/* Avatar & Name */}
                    {rec.photoURL ? (
                      <img
                        src={rec.photoURL}
                        alt=""
                        className="w-7 h-7 rounded-full border border-neutral-700"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-300">
                        {rec.displayName?.[0] || 'P'}
                      </div>
                    )}

                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        {rec.displayName}
                        {isCurrentUser && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500 text-neutral-950 font-black">
                            DU
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        Kachel: <span className="text-amber-400 font-bold">[{rec.highestTile}]</span> · {rec.moves} Züge
                      </span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <span className="text-sm sm:text-base font-black text-amber-400 tabular-nums">
                      {rec.score.toLocaleString()}
                    </span>
                    <div className="text-[9px] text-neutral-500">Punkte</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
