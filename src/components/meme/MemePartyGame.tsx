import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { User } from 'firebase/auth';
import {
  Sparkles,
  Users,
  Trophy,
  Play,
  Copy,
  Check,
  Bot,
  Flame,
  ArrowRight,
  RotateCcw,
  PlusCircle,
  Lightbulb,
  Clock,
  LogOut,
  Shuffle,
  Award,
  Crown,
  Type,
  ThumbsUp,
  ThumbsDown,
  Star,
  Settings,
  Shield,
  Volume2,
  VolumeX,
  Dice5,
  Share2,
  HelpCircle,
  X,
} from 'lucide-react';
import {
  MemeJudgingResult,
  MemePartyMode,
  MemePlayer,
  MemeRoomState,
  MemeSubmission,
  MemeTemplate,
  MemeTextStyle,
} from '../../types';
import {
  addBotToRoom,
  awardMemeBuddy,
  BUILTIN_TEMPLATES,
  createMemeRoom,
  evaluateMemesWithAi,
  fetchAiMemeTemplates,
  generateBotSubmissions,
  joinMemeRoom,
  POPULAR_THEMES,
  submitMeme,
  subscribeToMemeRoom,
  updateMemeRoom,
  voteOnMeme,
} from '../../firebase/memeParty';
import { MemeCard } from './MemeCard';
import { sound } from '../../audio/synth';

interface MemePartyGameProps {
  currentUser: User | null;
  onBackTo2048: () => void;
  onOpenAuth: () => void;
}

const AVATAR_OPTIONS = [
  '🕶️', '🗿', '🤖', '👑', '🤡', '🐱', '🐕', '🐵',
  '🐸', '🤠', '👽', '🍕', '🚀', '🔥', '🤓', '💀'
];

const RANDOM_NAMES = [
  'MemeKaiser', 'DogeLord', 'GigaChad', 'PixelProfi', 'CringeMeister',
  'TrollFace99', 'SchulSchläfer', 'MemeQueen', 'CaptainAbsurd', 'NoScopeNoob'
];

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number;
}

export const MemePartyGame: React.FC<MemePartyGameProps> = ({
  currentUser,
  onBackTo2048,
  onOpenAuth,
}) => {
  // Player Local Profile
  const [playerName, setPlayerName] = useState(() => {
    return currentUser?.displayName?.split(' ')[0] || localStorage.getItem('meme_player_name') || 'MemePlayer';
  });
  const [playerAvatar, setPlayerAvatar] = useState(() => {
    return localStorage.getItem('meme_player_avatar') || '🕶️';
  });

  const guestIdRef = useRef<string>(`player_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
  const playerId = currentUser?.uid || guestIdRef.current;

  // Navigation / Room State
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<MemeRoomState | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.isMuted());

  // Lobby Creation Options (1:1 makeitmeme.com settings)
  const [createMode, setCreateMode] = useState<MemePartyMode>('normal');
  const [createTheme, setCreateTheme] = useState(POPULAR_THEMES[0]);
  const [createRounds, setCreateRounds] = useState(3);
  const [createCaptionTime, setCreateCaptionTime] = useState(60);
  const [createFamilyFriendly, setCreateFamilyFriendly] = useState(false);

  // Captioning State
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');
  const [textStyle, setTextStyle] = useState<MemeTextStyle>('impact');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<MemeTemplate[]>(BUILTIN_TEMPLATES);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [captionTimeLeft, setCaptionTimeLeft] = useState(60);

  // Judging / Sequential Presentation State
  const [presentationIndex, setPresentationIndex] = useState(0);
  const [hasGivenBuddy, setHasGivenBuddy] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  // Save profile to localStorage
  useEffect(() => {
    localStorage.setItem('meme_player_name', playerName);
    localStorage.setItem('meme_player_avatar', playerAvatar);
  }, [playerName, playerAvatar]);

  // Dice random profile
  const handleRandomizeProfile = () => {
    const randomName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
    setPlayerName(randomName);
    setPlayerAvatar(randomAvatar);
    sound.playClick();
  };

  // Subscribe to real-time room updates
  useEffect(() => {
    if (!activeRoomId) {
      setRoom(null);
      return;
    }

    const unsubscribe = subscribeToMemeRoom(activeRoomId, (updatedRoom) => {
      setRoom(updatedRoom);
      if (!updatedRoom) {
        setErrorMessage('Der Raum wurde geschlossen oder existiert nicht mehr.');
        setActiveRoomId(null);
      }
    });

    return () => unsubscribe();
  }, [activeRoomId]);

  // Round / Status change effects
  useEffect(() => {
    if (room?.status === 'submitting') {
      setTopText('');
      setBottomText('');
      setHasSubmitted(false);
      setHasGivenBuddy(false);
      setPresentationIndex(0);
      setCaptionTimeLeft(room.captionTime || 60);
    } else if (room?.status === 'results' && room.judgingResults?.rankings?.[0]?.winner) {
      sound.playChaChing();
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.55 },
        colors: ['#22c55e', '#eab308', '#06b6d4', '#ec4899', '#a855f7'],
      });
    }
  }, [room?.status, room?.round]);

  // Countdown timer during submission
  useEffect(() => {
    if (room?.status !== 'submitting') return;

    const interval = setInterval(() => {
      setCaptionTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!hasSubmitted && (topText.trim() || bottomText.trim())) {
            handleSubmitCaption();
          }
          sound.playBuzzer();
          return 0;
        }
        if (prev <= 6) {
          sound.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [room?.status, hasSubmitted, topText, bottomText]);

  // Host: Create Room
  const handleExecuteCreateRoom = async (withBots = false) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const newRoomId = await createMemeRoom(
        { id: playerId, name: playerName, avatar: playerAvatar },
        createTheme,
        createRounds,
        createMode,
        createCaptionTime,
        createFamilyFriendly
      );

      if (newRoomId) {
        setActiveRoomId(newRoomId);
        setIsCreateModalOpen(false);
        sound.playMove();

        if (withBots) {
          // Add 2 witty AI bot meme competitors
          await addBotToRoom(newRoomId);
          await addBotToRoom(newRoomId);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Fehler beim Erstellen der Lobby.');
    } finally {
      setIsLoading(false);
    }
  };

  // Join Existing Room
  const handleJoinRoom = async () => {
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await joinMemeRoom(code, { id: playerId, name: playerName, avatar: playerAvatar });
      setActiveRoomId(code);
      sound.playClick();
    } catch (err: any) {
      setErrorMessage(err.message || 'Konnte Lobby nicht betreten.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add Bot
  const handleAddBot = async () => {
    if (!activeRoomId) return;
    try {
      await addBotToRoom(activeRoomId);
      sound.playSuperlike();
    } catch (err: any) {
      console.warn('Bot error:', err);
    }
  };

  // Host: Start Match
  const handleStartMatch = async () => {
    if (!activeRoomId || !room) return;
    const templateToUse = availableTemplates[selectedTemplateIndex] || BUILTIN_TEMPLATES[0];

    try {
      await updateMemeRoom(activeRoomId, {
        status: 'submitting',
        currentTemplate: templateToUse,
        submissions: {},
        votes: {},
        memeBuddies: {},
        currentMemeIndex: 0,
        judgingResults: null,
      });

      // Bots automatically generate submissions
      generateBotSubmissions(activeRoomId, room.players, templateToUse);
      sound.playChaChing();
    } catch (err: any) {
      setErrorMessage(err.message || 'Konnte Spiel nicht starten.');
    }
  };

  // Player: Submit Caption
  const handleSubmitCaption = async () => {
    if (!activeRoomId || !room || !room.currentTemplate) return;
    if (!topText.trim() && !bottomText.trim()) return;

    const submission: MemeSubmission = {
      playerId,
      playerName,
      playerAvatar,
      topText: topText.trim(),
      bottomText: bottomText.trim(),
      textStyle,
      templateId: room.currentTemplate.id,
      submittedAt: new Date().toISOString(),
    };

    try {
      await submitMeme(activeRoomId, submission);
      setHasSubmitted(true);
      sound.playChaChing();
    } catch (err: any) {
      setErrorMessage(err.message || 'Fehler beim Absenden.');
    }
  };

  // Trigger Judging
  const handleTriggerJudging = async () => {
    if (!activeRoomId || !room || !room.currentTemplate) return;

    try {
      sound.playBuzzer();
      await updateMemeRoom(activeRoomId, { status: 'judging' });

      const submissionsList = Object.values(room.submissions);
      const results = await evaluateMemesWithAi(room.currentTemplate, submissionsList, room.theme);

      // Score calculation
      const updatedPlayers = { ...room.players };
      results.rankings.forEach((r) => {
        if (updatedPlayers[r.playerId]) {
          updatedPlayers[r.playerId].score += r.score;
        }
      });

      await updateMemeRoom(activeRoomId, {
        status: 'results',
        judgingResults: results,
        players: updatedPlayers,
        currentMemeIndex: 0,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Fehler beim Bewerten.');
    }
  };

  // Voting action
  const handleVote = async (targetPlayerId: string, type: 'up' | 'down' | 'super') => {
    if (!activeRoomId || !room) return;
    try {
      if (type === 'up') sound.playVote(true);
      else if (type === 'down') sound.playVote(false);
      else if (type === 'super') sound.playSuperlike();

      await voteOnMeme(activeRoomId, playerId, targetPlayerId, type);
    } catch (err) {
      console.warn('Vote error:', err);
    }
  };

  // Meme Buddy Award
  const handleAwardMemeBuddy = async (targetPlayerId: string) => {
    if (!activeRoomId || !room || hasGivenBuddy) return;
    try {
      sound.playSuperlike();
      await awardMemeBuddy(activeRoomId, playerId, targetPlayerId);
      setHasGivenBuddy(true);
    } catch (err) {
      console.warn('Buddy error:', err);
    }
  };

  // Spawn reaction emoji
  const handleSpawnReaction = (emoji: string) => {
    const newReaction: FloatingReaction = {
      id: `${Date.now()}_${Math.random()}`,
      emoji,
      x: 10 + Math.random() * 80,
    };
    setFloatingReactions((prev) => [...prev.slice(-15), newReaction]);
    sound.playClick();

    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 2000);
  };

  // Next Round / End
  const handleNextRound = async () => {
    if (!activeRoomId || !room) return;
    const isGameOver = room.round >= room.maxRounds;

    if (isGameOver) {
      await updateMemeRoom(activeRoomId, { status: 'ended' });
      sound.playChaChing();
    } else {
      const nextTemplate = BUILTIN_TEMPLATES[room.round % BUILTIN_TEMPLATES.length];
      await updateMemeRoom(activeRoomId, {
        status: 'submitting',
        round: room.round + 1,
        currentTemplate: nextTemplate,
        submissions: {},
        votes: {},
        memeBuddies: {},
        currentMemeIndex: 0,
        judgingResults: null,
      });
      generateBotSubmissions(activeRoomId, room.players, nextTemplate);
      sound.playMove();
    }
  };

  // Copy code helper
  const handleCopyCode = () => {
    if (!room?.id) return;
    navigator.clipboard.writeText(room.id);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    sound.playClick();
  };

  const isHost = room?.hostId === playerId;
  const submissionsArray = room ? Object.values(room.submissions) : [];
  const currentPresentedSubmission = submissionsArray[presentationIndex] || submissionsArray[0];

  return (
    <div className="relative w-screen h-screen overflow-y-auto bg-[#13112c] text-white font-sans flex flex-col select-none">
      {/* Floating Emoji Reactions Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-10 text-4xl animate-bounce"
            style={{
              left: `${r.x}%`,
              animation: 'floatUp 2s ease-out forwards',
              filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.6))',
            }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Make It Meme Official Header Bar */}
      <header className="relative z-30 flex items-center justify-between px-4 sm:px-8 py-3 bg-[#1e1b40]/90 backdrop-blur-md border-b border-[#37336b] shadow-lg">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setActiveRoomId(null)}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <span className="text-2xl filter drop-shadow">🤪</span>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-black tracking-tight leading-none text-[#ffcc00] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                MAKE IT MEME
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#00f0ff] leading-tight">
                Die Meme-Party online
              </span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Switch to 2048 3D Deluxe */}
          <button
            onClick={onBackTo2048}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#282455] hover:bg-[#342f6d] border border-[#484289] text-xs font-bold text-neutral-200 transition-all shadow-sm"
          >
            <span>🎲 2048 3D</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setIsMuted(sound.toggleMute())}
            className="p-2 rounded-xl bg-[#282455] hover:bg-[#342f6d] border border-[#484289] text-neutral-300"
            title="Ton an/aus"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* User Profile Chip */}
          {currentUser ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#282455] border border-[#484289] text-xs">
              <span className="text-base">{playerAvatar}</span>
              <span className="font-extrabold text-amber-300 max-w-[100px] truncate">{playerName}</span>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] font-extrabold text-xs text-white shadow-md shadow-indigo-600/30"
            >
              <span>Anmelden</span>
            </button>
          )}

          {/* Exit Room */}
          {room && (
            <button
              onClick={() => setActiveRoomId(null)}
              className="p-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/40 text-rose-400"
              title="Raum verlassen"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col items-center justify-center">
        {errorMessage && (
          <div className="w-full max-w-md p-3 mb-4 rounded-2xl bg-rose-950/90 border border-rose-500/60 text-rose-200 text-xs text-center font-bold shadow-lg animate-pulse">
            {errorMessage}
          </div>
        )}

        {/* ========================================================= */}
        {/* 1:1 START SCREEN (makeitmeme.com/de/play) */}
        {/* ========================================================= */}
        {!room && (
          <div className="w-full max-w-2xl flex flex-col items-center">
            {/* Player Character Box (1:1 makeitmeme) */}
            <div className="w-full p-5 mb-6 rounded-3xl bg-[#1e1b40] border-2 border-[#37336b] shadow-2xl flex flex-col sm:flex-row items-center gap-5">
              {/* Avatar Selector */}
              <div className="relative flex flex-col items-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 border-4 border-[#ffcc00] flex items-center justify-center text-4xl shadow-xl shadow-purple-600/30">
                  {playerAvatar}
                </div>
                <button
                  onClick={handleRandomizeProfile}
                  className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-[#ffcc00] text-black shadow-md hover:scale-110 active:scale-95 transition-all"
                  title="Zufälliger Avatar & Name"
                >
                  <Dice5 className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Name & Avatar Chips */}
              <div className="flex-1 w-full flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400">
                    Dein Spielername
                  </label>
                  <span className="text-[10px] text-neutral-400">Klicke zum Auswählen:</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value.slice(0, 18))}
                    placeholder="Spielername..."
                    className="flex-1 px-4 py-2.5 bg-[#13112c] border-2 border-[#37336b] rounded-xl text-white font-black text-sm focus:outline-none focus:border-[#ffcc00] transition-colors"
                  />
                  <button
                    onClick={handleRandomizeProfile}
                    className="px-3 py-2.5 bg-[#282455] hover:bg-[#342f6d] border border-[#484289] rounded-xl text-xs font-bold text-neutral-200"
                  >
                    🎲 Würfeln
                  </button>
                </div>

                {/* Quick Avatar Strip */}
                <div className="flex gap-1.5 overflow-x-auto p-1 bg-[#13112c]/80 rounded-xl border border-[#2a2653]">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      key={av}
                      onClick={() => setPlayerAvatar(av)}
                      className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all ${
                        playerAvatar === av ? 'bg-[#ffcc00] text-black scale-105 shadow-md' : 'hover:bg-[#282455]'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Three Big Make It Meme Play Buttons */}
            <div className="w-full flex flex-col gap-3.5 mb-8">
              {/* Button 1: Schnelles Spiel (Quick Play) */}
              <button
                onClick={() => handleExecuteCreateRoom(true)}
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-lg sm:text-xl uppercase tracking-wider shadow-xl shadow-emerald-600/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 border-b-4 border-emerald-700"
              >
                <Play className="w-6 h-6 fill-white" />
                <span>Schnelles Spiel (Sofort Loslegen)</span>
              </button>

              {/* Button 2: Lobby erstellen (Create Private Lobby) */}
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#4f46e5] hover:to-[#7c3aed] text-white font-black text-base sm:text-lg uppercase tracking-wider shadow-xl shadow-indigo-600/30 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 border-b-4 border-indigo-900"
              >
                <PlusCircle className="w-5 h-5 stroke-[2.5]" />
                <span>Lobby Erstellen (Mit Freunden)</span>
              </button>

              {/* Button 3: Lobby beitreten (Join with Code) */}
              <div className="w-full p-4 rounded-2xl bg-[#1e1b40] border-2 border-[#37336b] flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 w-full">
                  <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">
                    Raum-Code eingeben:
                  </label>
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="z. B. MEME-8421"
                    className="w-full px-4 py-2.5 bg-[#13112c] border-2 border-[#37336b] rounded-xl font-mono font-black text-base text-[#ffcc00] text-center focus:outline-none focus:border-[#00f0ff]"
                  />
                </div>
                <button
                  onClick={handleJoinRoom}
                  disabled={isLoading || !joinCodeInput.trim()}
                  className="w-full sm:w-auto sm:self-end px-6 py-2.5 rounded-xl bg-[#00f0ff] hover:bg-[#00d4e3] disabled:opacity-50 text-neutral-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all"
                >
                  Beitreten 🎮
                </button>
              </div>
            </div>

            {/* Informational Rules Cards (1:1 makeitmeme.com) */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-[#1e1b40]/80 border border-[#37336b] text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center text-xl mb-2">
                  ✍️
                </div>
                <h4 className="text-xs font-black uppercase text-white mb-1">1. Meme beschriften</h4>
                <p className="text-[11px] text-neutral-400">
                  Denk dir die lustigste Bildunterschrift für die Vorlage aus.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#1e1b40]/80 border border-[#37336b] text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl mb-2">
                  ⭐
                </div>
                <h4 className="text-xs font-black uppercase text-white mb-1">2. Meme Buddy</h4>
                <p className="text-[11px] text-neutral-400">
                  Bewerte mit Upvote/Meh und vergib deinen wertvollen Meme Buddy Stern!
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#1e1b40]/80 border border-[#37336b] text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl mb-2">
                  🏆
                </div>
                <h4 className="text-xs font-black uppercase text-white mb-1">3. Punkte sammeln</h4>
                <p className="text-[11px] text-neutral-400">
                  Sammle bis zu 1000 Punkte pro Runde und werde der Meme-König!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* CREATE LOBBY MODAL (1:1 Settings from makeitmeme) */}
        {/* ========================================================= */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-3xl bg-[#1e1b40] border-2 border-[#37336b] p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-[#37336b]">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚙️</span>
                  <h3 className="text-lg font-black text-white">Lobby Einstellungen</h3>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 rounded-lg bg-[#282455] hover:bg-[#342f6d] text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Game Mode Selector */}
              <div>
                <label className="text-xs font-black uppercase text-neutral-400 block mb-2">
                  Spielmodus
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'normal', name: '🎮 Normal', desc: 'Zufällige Memes für jeden' },
                    { id: 'same_meme', name: '👯 Same Meme', desc: 'Exakt dasselbe Meme' },
                    { id: 'relaxed', name: '🧘 Relaxed', desc: 'Ohne Punkte & Zeitdruck' },
                    { id: 'topics', name: '💡 Themen', desc: 'Feste Themenrunden' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setCreateMode(m.id as MemePartyMode)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        createMode === m.id
                          ? 'bg-[#6366f1]/30 border-[#ffcc00] ring-2 ring-[#ffcc00]/40'
                          : 'bg-[#13112c] border-[#37336b] hover:border-neutral-500'
                      }`}
                    >
                      <div className="text-xs font-black text-white">{m.name}</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme (if topics mode) */}
              <div>
                <label className="text-xs font-black uppercase text-neutral-400 block mb-1">
                  Meme-Thema
                </label>
                <select
                  value={createTheme}
                  onChange={(e) => setCreateTheme(e.target.value)}
                  className="w-full px-3 py-2 bg-[#13112c] border border-[#37336b] rounded-xl text-white font-bold text-xs"
                >
                  {POPULAR_THEMES.map((th) => (
                    <option key={th} value={th}>
                      {th}
                    </option>
                  ))}
                </select>
              </div>

              {/* Caption Time & Rounds */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase text-neutral-400 block mb-1">
                    Zeit (Sekunden)
                  </label>
                  <div className="flex gap-1.5">
                    {[45, 60, 90, 120].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => setCreateCaptionTime(sec)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-black ${
                          createCaptionTime === sec
                            ? 'bg-[#ffcc00] text-black shadow'
                            : 'bg-[#13112c] border border-[#37336b] text-neutral-300'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-neutral-400 block mb-1">
                    Runden
                  </label>
                  <div className="flex gap-1.5">
                    {[3, 5, 8].map((rnd) => (
                      <button
                        key={rnd}
                        onClick={() => setCreateRounds(rnd)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-black ${
                          createRounds === rnd
                            ? 'bg-[#ffcc00] text-black shadow'
                            : 'bg-[#13112c] border border-[#37336b] text-neutral-300'
                        }`}
                      >
                        {rnd}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Family Friendly Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#13112c] border border-[#37336b]">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-neutral-200">Familienfreundlicher Modus</span>
                </div>
                <input
                  type="checkbox"
                  checked={createFamilyFriendly}
                  onChange={(e) => setCreateFamilyFriendly(e.target.checked)}
                  className="w-4 h-4 accent-[#ffcc00] rounded cursor-pointer"
                />
              </div>

              {/* Create Action */}
              <button
                onClick={() => handleExecuteCreateRoom(false)}
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#22c55e] to-emerald-600 hover:from-[#16a34a] hover:to-emerald-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-600/30 active:scale-95 transition-all mt-2"
              >
                {isLoading ? 'Erstelle Lobby...' : 'Lobby Jetzt Erstellen 🚀'}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* LOBBY SCREEN (makeitmeme.com/de/play Lobby) */}
        {/* ========================================================= */}
        {room && room.status === 'lobby' && (
          <div className="w-full max-w-3xl flex flex-col gap-5">
            {/* Room Code Card */}
            <div className="p-5 rounded-3xl bg-[#1e1b40] border-2 border-[#37336b] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase text-[#00f0ff] tracking-widest block">
                  Private Spiel-Lobby
                </span>
                <h2 className="text-xl font-black text-white">Thema: {room.theme}</h2>
                <span className="text-xs text-neutral-400">
                  Modus: <strong>{room.partyMode || 'normal'}</strong> · {room.maxRounds} Runden · {room.captionTime || 60}s Zeit
                </span>
              </div>

              {/* Code Chip */}
              <div className="flex items-center gap-2 px-4 py-2 bg-[#13112c] border-2 border-[#ffcc00] rounded-2xl shadow-inner">
                <span className="text-xs text-neutral-400 font-bold uppercase">Code:</span>
                <span className="font-mono font-black text-xl text-[#ffcc00] tracking-wider">{room.id}</span>
                <button
                  onClick={handleCopyCode}
                  className="p-1.5 rounded-lg bg-[#282455] hover:bg-[#342f6d] text-white transition-colors"
                  title="Code kopieren"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Players in Lobby */}
            <div className="p-5 rounded-3xl bg-[#1e1b40] border-2 border-[#37336b] shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#ffcc00]" />
                  <span>Spieler im Raum ({Object.keys(room.players).length})</span>
                </h3>

                {isHost && (
                  <button
                    onClick={handleAddBot}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#282455] hover:bg-[#342f6d] border border-[#484289] rounded-xl text-xs font-bold text-neutral-200"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-[#00f0ff]" />
                    <span>+ KI-Bot hinzufügen</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.values(room.players).map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-[#13112c] border border-[#37336b] rounded-2xl flex items-center gap-2.5 shadow-md"
                  >
                    <span className="text-3xl">{p.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-black text-xs truncate text-white">{p.name}</span>
                        {p.isHost && <Crown className="w-3 h-3 text-[#ffcc00] fill-[#ffcc00] shrink-0" />}
                      </div>
                      <span className="text-[10px] text-neutral-400">
                        {p.isBot ? 'KI-Spieler' : p.id === playerId ? 'Du' : 'Bereit'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Start Game Action */}
            <div className="p-4 rounded-2xl bg-[#1e1b40] border border-[#37336b] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-neutral-400">
                {isHost ? 'Alle Spieler versammelt? Starte die Runde!' : 'Warte auf Spielstart durch den Host...'}
              </span>

              {isHost ? (
                <button
                  onClick={handleStartMatch}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#22c55e] to-emerald-600 hover:from-[#16a34a] hover:to-emerald-500 text-white font-black text-base uppercase tracking-wider shadow-lg shadow-emerald-600/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>Spiel Starten!</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 text-xs font-bold text-[#ffcc00] animate-pulse">
                  <Clock className="w-4 h-4" />
                  <span>Warte auf Host...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PHASE 1: CAPTIONING (makeitmeme.com Meme erstellen) */}
        {/* ========================================================= */}
        {room && room.status === 'submitting' && room.currentTemplate && (
          <div className="w-full max-w-4xl flex flex-col gap-4">
            {/* Animated Countdown Bar */}
            <div className="p-4 rounded-3xl bg-[#1e1b40] border-2 border-[#37336b] flex flex-col gap-2 shadow-xl">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-[#ffcc00] uppercase tracking-wider">
                  Runde {room.round} von {room.maxRounds}
                </span>
                <div className="flex items-center gap-2 font-black text-sm">
                  <Clock className="w-4 h-4 text-[#00f0ff]" />
                  <span className={captionTimeLeft <= 10 ? 'text-rose-400 animate-pulse font-black text-base' : 'text-white'}>
                    {captionTimeLeft}s verbleibend
                  </span>
                </div>
                <span className="text-neutral-400 font-bold">
                  {Object.keys(room.submissions).length} / {Object.keys(room.players).length} fertig
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 rounded-full bg-[#13112c] overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${
                    captionTimeLeft <= 10 ? 'bg-rose-500 animate-pulse' : 'bg-[#22c55e]'
                  }`}
                  style={{ width: `${(captionTimeLeft / (room.captionTime || 60)) * 100}%` }}
                />
              </div>
            </div>

            {/* Split Screen: Meme Canvas & Text Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {/* Meme Preview */}
              <div className="flex flex-col gap-2">
                <MemeCard
                  template={room.currentTemplate}
                  topText={topText}
                  bottomText={bottomText}
                  textStyle={textStyle}
                  playerName={playerName}
                  playerAvatar={playerAvatar}
                  className="shadow-2xl border-2 border-[#37336b]"
                />
              </div>

              {/* Editor Controls */}
              <div className="p-5 rounded-3xl bg-[#1e1b40] border-2 border-[#37336b] flex flex-col gap-3.5 shadow-xl">
                {/* Font Style Bar (Impact vs Modern vs Subtitle) */}
                <div>
                  <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">
                    Schrift-Stil:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'impact', label: '🔤 Impact' },
                      { id: 'modern', label: '📰 Modern' },
                      { id: 'subtitle', label: '💬 Untertitel' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => {
                          setTextStyle(st.id as MemeTextStyle);
                          sound.playClick();
                        }}
                        className={`py-1.5 rounded-xl text-xs font-black transition-all ${
                          textStyle === st.id
                            ? 'bg-[#ffcc00] text-black shadow-md'
                            : 'bg-[#13112c] text-neutral-400 hover:text-white'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Top Text */}
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1">
                    Text 1 (Oben)
                  </label>
                  <input
                    type="text"
                    value={topText}
                    disabled={hasSubmitted}
                    onChange={(e) => setTopText(e.target.value)}
                    placeholder="Text eingeben..."
                    className="w-full px-4 py-2.5 bg-[#13112c] border-2 border-[#37336b] rounded-xl text-white font-black text-sm focus:outline-none focus:border-[#ffcc00] disabled:opacity-50"
                  />
                </div>

                {/* Bottom Text */}
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1">
                    Text 2 (Unten)
                  </label>
                  <input
                    type="text"
                    value={bottomText}
                    disabled={hasSubmitted}
                    onChange={(e) => setBottomText(e.target.value)}
                    placeholder="Pointe eingeben..."
                    className="w-full px-4 py-2.5 bg-[#13112c] border-2 border-[#37336b] rounded-xl text-white font-black text-sm focus:outline-none focus:border-[#ffcc00] disabled:opacity-50"
                  />
                </div>

                {/* Example Quick-Fill */}
                {room.currentTemplate.example_top_text && (
                  <button
                    onClick={() => {
                      if (room.currentTemplate?.example_top_text) setTopText(room.currentTemplate.example_top_text);
                      if (room.currentTemplate?.example_bottom_text) setBottomText(room.currentTemplate.example_bottom_text);
                      sound.playClick();
                    }}
                    className="text-left text-[11px] text-[#00f0ff] hover:underline font-bold"
                  >
                    💡 Beispiel-Idee übernehmen: "{room.currentTemplate.example_top_text}"
                  </button>
                )}

                {/* Submit Button */}
                {!hasSubmitted ? (
                  <button
                    onClick={handleSubmitCaption}
                    disabled={!topText.trim() && !bottomText.trim()}
                    className="w-full py-3.5 rounded-2xl bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-50 text-white font-black text-base uppercase tracking-wider shadow-lg shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    <Check className="w-5 h-5 stroke-[3]" />
                    <span>FERTIG!</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold text-center">
                    ✓ Dein Meme wurde eingereicht!
                  </div>
                )}

                {/* Host Force Judging */}
                {isHost && (
                  <button
                    onClick={handleTriggerJudging}
                    className="text-xs text-neutral-400 hover:text-white underline text-center mt-1"
                  >
                    Vorzeitig zur Abstimmung übergehen →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PHASE 2: VOTING & REVEAL (1:1 makeitmeme.com Show) */}
        {/* ========================================================= */}
        {room && room.status === 'results' && room.judgingResults && (
          <div className="w-full max-w-4xl flex flex-col gap-4">
            {/* Top Bar with Meme Buddy Reminder */}
            <div className="p-3 px-5 rounded-2xl bg-[#1e1b40] border border-[#37336b] flex items-center justify-between text-xs shadow-md">
              <div className="flex items-center gap-2">
                <span className="text-xl">⭐</span>
                <span className="font-extrabold text-[#ffcc00]">MEME BUDDY:</span>
                <span className="text-neutral-300 hidden sm:inline">
                  Vergib 1x pro Runde deinen Stern an das lustigste Meme (+100 Pkt & 50% Bonus für dich)!
                </span>
              </div>
              <span className="font-black text-white">
                Meme {presentationIndex + 1} von {submissionsArray.length}
              </span>
            </div>

            {/* Central Stage: The Current Meme Being Judged */}
            {currentPresentedSubmission && (
              <div className="max-w-xl mx-auto w-full flex flex-col gap-3">
                <MemeCard
                  template={room.currentTemplate!}
                  topText={currentPresentedSubmission.topText}
                  bottomText={currentPresentedSubmission.bottomText}
                  textStyle={currentPresentedSubmission.textStyle || 'impact'}
                  playerName={currentPresentedSubmission.playerName}
                  playerAvatar={currentPresentedSubmission.playerAvatar}
                  votes={room.votes?.[currentPresentedSubmission.playerId]}
                  currentUserId={playerId}
                  className="shadow-2xl border-4 border-[#37336b]"
                />

                {/* Interactive Make It Meme Voting Bar (Upvote / Meh / Downvote / Meme Buddy) */}
                <div className="p-3.5 rounded-2xl bg-[#1e1b40] border-2 border-[#37336b] flex items-center justify-around shadow-xl">
                  {/* Upvote Button */}
                  <button
                    onClick={() => handleVote(currentPresentedSubmission.playerId, 'up')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all active:scale-90 ${
                      room.votes?.[currentPresentedSubmission.playerId]?.upvotes?.includes(playerId)
                        ? 'bg-[#22c55e] text-white shadow-lg shadow-emerald-600/50 scale-105'
                        : 'bg-[#13112c] text-emerald-400 hover:bg-[#282455]'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4 fill-current" />
                    <span>Upvote ({room.votes?.[currentPresentedSubmission.playerId]?.upvotes?.length || 0})</span>
                  </button>

                  {/* Meme Buddy Golden Star */}
                  <button
                    onClick={() => handleAwardMemeBuddy(currentPresentedSubmission.playerId)}
                    disabled={hasGivenBuddy}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all active:scale-90 ${
                      room.memeBuddies?.[playerId] === currentPresentedSubmission.playerId
                        ? 'bg-[#ffcc00] text-black shadow-xl shadow-amber-500/50 scale-110 animate-pulse'
                        : hasGivenBuddy
                        ? 'bg-[#13112c]/50 text-neutral-500 opacity-60'
                        : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black hover:scale-105 shadow-md'
                    }`}
                  >
                    <Star className="w-4 h-4 fill-current" />
                    <span>Meme Buddy ⭐</span>
                  </button>

                  {/* Downvote Button */}
                  <button
                    onClick={() => handleVote(currentPresentedSubmission.playerId, 'down')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all active:scale-90 ${
                      room.votes?.[currentPresentedSubmission.playerId]?.downvotes?.includes(playerId)
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/50 scale-105'
                        : 'bg-[#13112c] text-rose-400 hover:bg-[#282455]'
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4 fill-current" />
                    <span>Meh / Down</span>
                  </button>
                </div>

                {/* Floating Emoji Reaction Bar (1:1 makeitmeme) */}
                <div className="flex items-center justify-center gap-2 py-1">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 mr-2">Reagieren:</span>
                  {['😂', '💀', '🔥', '💩', '🤡', '👏'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleSpawnReaction(emoji)}
                      className="text-2xl p-1.5 rounded-xl bg-[#1e1b40] hover:bg-[#282455] hover:scale-125 active:scale-90 transition-all shadow"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Presentation Navigation Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setPresentationIndex((prev) => Math.max(0, prev - 1))}
                    disabled={presentationIndex === 0}
                    className="px-4 py-2 rounded-xl bg-[#282455] disabled:opacity-30 text-xs font-bold"
                  >
                    ← Vorheriges Meme
                  </button>

                  {presentationIndex < submissionsArray.length - 1 ? (
                    <button
                      onClick={() => setPresentationIndex((prev) => prev + 1)}
                      className="px-5 py-2 rounded-xl bg-[#00f0ff] text-black font-black text-xs uppercase"
                    >
                      Nächstes Meme →
                    </button>
                  ) : isHost ? (
                    <button
                      onClick={handleNextRound}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 text-black font-black text-xs uppercase shadow-lg shadow-pink-500/30"
                    >
                      {room.round >= room.maxRounds ? 'Finale Siegerehrung 🏆' : 'Nächste Runde Starten →'}
                    </button>
                  ) : (
                    <span className="text-xs text-amber-400 font-bold">Warte auf Host...</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* PHASE 3: FINAL PODIUM (1:1 makeitmeme Podium) */}
        {/* ========================================================= */}
        {room && room.status === 'ended' && (
          <div className="w-full max-w-2xl flex flex-col items-center text-center p-6 sm:p-8 rounded-3xl bg-[#1e1b40] border-2 border-[#ffcc00] shadow-2xl">
            <div className="w-20 h-20 rounded-3xl bg-[#ffcc00] flex items-center justify-center text-5xl mb-4 shadow-xl shadow-amber-500/40 animate-bounce">
              👑
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-2">
              Siegerehrung!
            </h2>
            <p className="text-xs text-neutral-400 mb-6">
              Die Party ist vorbei! Hier ist die finale Bestenliste:
            </p>

            {/* Standings List */}
            <div className="w-full flex flex-col gap-2.5 mb-8">
              {Object.values(room.players)
                .sort((a, b) => b.score - a.score)
                .map((p, idx) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border-2 ${
                      idx === 0
                        ? 'bg-[#ffcc00]/20 border-[#ffcc00] ring-4 ring-[#ffcc00]/20'
                        : idx === 1
                        ? 'bg-neutral-800/80 border-neutral-400'
                        : idx === 2
                        ? 'bg-amber-950/40 border-amber-700'
                        : 'bg-[#13112c] border-[#37336b]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${
                          idx === 0
                            ? 'bg-[#ffcc00] text-black shadow-md'
                            : idx === 1
                            ? 'bg-neutral-300 text-black'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-[#282455] text-neutral-400'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <span className="text-2xl">{p.avatar}</span>
                      <span className="font-black text-sm text-white">{p.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-[#ffcc00] tabular-nums">{p.score} Pkt.</span>
                      {idx === 0 && <Trophy className="w-5 h-5 text-[#ffcc00] fill-[#ffcc00]" />}
                    </div>
                  </div>
                ))}
            </div>

            {/* Restart Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              {isHost && (
                <button
                  onClick={() =>
                    updateMemeRoom(room.id, {
                      status: 'lobby',
                      round: 1,
                      submissions: {},
                      votes: {},
                      memeBuddies: {},
                      judgingResults: null,
                    })
                  }
                  className="w-full flex-1 py-3.5 rounded-2xl bg-[#22c55e] hover:bg-[#16a34a] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all"
                >
                  Nochmal Spielen 🔄
                </button>
              )}

              <button
                onClick={() => setActiveRoomId(null)}
                className="w-full flex-1 py-3.5 rounded-2xl bg-[#282455] hover:bg-[#342f6d] border border-[#484289] text-white font-black text-xs uppercase tracking-wider transition-all"
              >
                Hauptmenü 🏠
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
