import React, { useEffect, useRef, useState } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Hash,
  Crown,
  Sparkles,
  LogIn,
  BookOpen,
} from 'lucide-react';
import { User, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { ChatMessage, sendChatMessage, subscribeToChatChannel } from '../firebase/chat';

interface CommunityChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onOpenHomework: () => void;
}

const CHANNELS = [
  { id: 'general', label: 'Allgemein', icon: Hash, desc: 'Lobby & Spielspaß' },
  { id: 'tipps-tricks', label: '2048 Tipps', icon: Sparkles, desc: 'Taktiken & Rekorde' },
  { id: 'hausaufgaben', label: 'Hausaufgaben', icon: BookOpen, desc: 'Schule & Gemini Hilfen' },
];

export const CommunityChatModal: React.FC<CommunityChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenHomework,
}) => {
  const [activeChannel, setActiveChannel] = useState('general');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = subscribeToChatChannel(activeChannel, (incoming) => {
      setMessages(incoming);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    });

    return () => unsubscribe();
  }, [isOpen, activeChannel]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || sending) return;

    if (!currentUser) {
      setErrorMsg('Bitte melde dich mit Google an, um Nachrichten zu senden.');
      return;
    }

    setSending(true);
    setErrorMsg(null);
    try {
      await sendChatMessage(activeChannel, inputText);
      setInputText('');
    } catch (err: any) {
      console.error('Send error:', err);
      setErrorMsg(err.message || 'Fehler beim Senden der Nachricht.');
    } finally {
      setSending(false);
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Sign in error:', err);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto bg-neutral-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-3xl max-w-2xl w-full h-[88vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>Community Chat</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                  LIVE
                </span>
              </h3>
              <p className="text-xs text-neutral-400 font-medium">Tausche dich mit anderen Spielern aus</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenHomework}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs shadow-md transition-all active:scale-95"
              title="Kostenlosen Gemini Hausaufgaben-Helfer öffnen"
            >
              <BookOpen className="w-3.5 h-3.5 fill-neutral-950" />
              <span>Gemini Schulhelfer</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Channel Selector Pills */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-neutral-800 bg-neutral-950/60 overflow-x-auto">
          {CHANNELS.map((ch) => {
            const Icon = ch.icon;
            const isActive = activeChannel === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500 text-neutral-950 shadow-md'
                    : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700 border border-neutral-700/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{ch.label}</span>
              </button>
            );
          })}
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500">
              <MessageSquare className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-xs font-medium">Noch keine Nachrichten in diesem Raum.</p>
              <p className="text-[11px] text-neutral-600">Schreibe als Erster etwas!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = currentUser?.uid === msg.userId;
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 max-w-[85%] ${
                    isMe ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  {/* Avatar */}
                  {msg.photoURL ? (
                    <img
                      src={msg.photoURL}
                      alt=""
                      className="w-7 h-7 rounded-full border border-neutral-700 shrink-0 mt-0.5"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0 mt-0.5">
                      {msg.displayName?.[0] || 'U'}
                    </div>
                  )}

                  {/* Bubble */}
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1.5 mb-1 text-[11px]">
                      <span className="font-bold text-neutral-300">{msg.displayName}</span>
                      {msg.isAdmin && (
                        <span className="flex items-center gap-0.5 px-1 py-0.2 rounded text-[8px] font-black bg-gradient-to-r from-amber-500 to-red-500 text-neutral-950">
                          <Crown className="w-2.5 h-2.5 fill-neutral-950" /> VIP
                        </span>
                      )}
                      <span className="text-[10px] text-neutral-500">{formatTime(msg.createdAt)}</span>
                    </div>

                    <div
                      className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words shadow-sm ${
                        isMe
                          ? 'bg-amber-500 text-neutral-950 font-medium rounded-tr-none'
                          : 'bg-neutral-800 text-neutral-100 rounded-tl-none border border-neutral-700/60'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar or Auth Prompt */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-950/80">
          {errorMsg && (
            <div className="mb-2 text-[11px] text-red-400 bg-red-950/40 border border-red-800/60 px-3 py-1.5 rounded-xl">
              {errorMsg}
            </div>
          )}

          {currentUser ? (
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Nachricht an #${activeChannel}...`}
                maxLength={1000}
                className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className={`p-2.5 rounded-xl font-bold transition-all ${
                  inputText.trim() && !sending
                    ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md active:scale-95'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-neutral-900 border border-neutral-800">
              <span className="text-xs text-neutral-400 font-medium">
                Melde dich mit Google an, um im Live-Chat mitzuschreiben.
              </span>
              <button
                onClick={handleSignIn}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow transition-all active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5 fill-neutral-950" />
                <span>Anmelden</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
