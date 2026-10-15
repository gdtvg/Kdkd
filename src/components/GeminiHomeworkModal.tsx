import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Sparkles,
  Send,
  Copy,
  Check,
  Share2,
  Lightbulb,
  GraduationCap,
  Calculator,
  Languages,
  Atom,
  Binary,
} from 'lucide-react';
import { sendChatMessage } from '../firebase/chat';

interface GeminiHomeworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: () => void;
}

const SUBJECTS = [
  { id: 'Mathematik', icon: Calculator, example: 'Wie löse ich quadratische Gleichungen mit der pq-Formel? Bitte Schritt für Schritt.' },
  { id: 'Physik', icon: Atom, example: 'Erkläre mir das Ohmsche Gesetz und wie man Spannung und Stromstärke berechnet.' },
  { id: 'Deutsch', icon: GraduationCap, example: 'Kannst du diesen Text korrigieren und mir die Kommaregeln erklären?' },
  { id: 'Englisch', icon: Languages, example: 'Was ist der Unterschied zwischen Simple Past und Present Perfect mit Beispielen?' },
  { id: 'Informatik', icon: Binary, example: 'Wie funktioniert eine for-Schleife und der 2048-Verschmelzungsalgorithmus?' },
  { id: 'Biologie', icon: Sparkles, example: 'Erkläre mir einfach die Schritte der Mitose und Zellteilung.' },
];

export const GeminiHomeworkModal: React.FC<GeminiHomeworkModalProps> = ({
  isOpen,
  onClose,
  onOpenChat,
}) => {
  const [selectedSubject, setSelectedSubject] = useState('Mathematik');
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setErrorMsg(null);
    setAnswer(null);
    setShared(false);

    try {
      const res = await fetch('/api/gemini/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          subject: selectedSubject,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Serverfehler bei Gemini');
      }

      setAnswer(data.answer);
    } catch (err: any) {
      console.error('Homework assistant error:', err);
      setErrorMsg(err.message || 'Verbindung zu Gemini fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!answer) return;
    navigator.clipboard.writeText(answer).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShareToChat = async () => {
    if (!answer) return;
    try {
      const summary = `📚 [${selectedSubject} Hausaufgabe]\nFrage: ${prompt}\n\nAntwort:\n${answer.slice(0, 750)}...`;
      await sendChatMessage('hausaufgaben', summary);
      setShared(true);
      setTimeout(() => setShared(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Bitte melde dich mit Google an, um im Chat zu teilen.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto bg-neutral-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-3xl max-w-2xl w-full h-[88vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-red-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>Gemini Schul- & Hausaufgabenhelfer</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                  Kostenlos
                </span>
              </h3>
              <p className="text-xs text-neutral-400 font-medium">
                Schritt-für-Schritt Erklärungen & Nachhilfe für alle Schulfächer
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subjects Selector */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-neutral-800 bg-neutral-950/60 overflow-x-auto">
          {SUBJECTS.map((sub) => {
            const Icon = sub.icon;
            const isSelected = selectedSubject === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => {
                  setSelectedSubject(sub.id);
                  setPrompt(sub.example);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-neutral-950 shadow-md scale-105'
                    : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700 border border-neutral-700/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sub.id}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-neutral-400 font-medium">
              <span className="flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Deine Aufgabe oder Frage in {selectedSubject}:
              </span>
              <button
                type="button"
                onClick={() => {
                  const subObj = SUBJECTS.find((s) => s.id === selectedSubject);
                  if (subObj) setPrompt(subObj.example);
                }}
                className="text-[11px] text-amber-400 hover:underline"
              >
                Beispiel einfügen
              </button>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Schreibe deine Schulaufgabe, Gleichung oder Frage hier rein..."
              rows={3}
              className="w-full bg-neutral-950/80 border border-neutral-700 rounded-2xl p-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 resize-none"
            />

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-neutral-500">
                Tipp: Je genauer die Frage (z.B. "mit Rechenweg"), desto besser die Erklärung.
              </span>

              <button
                type="submit"
                disabled={!prompt.trim() || loading}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all active:scale-95 ${
                  prompt.trim() && !loading
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 shadow-amber-500/30'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Gemini rechnet & erklärt...' : 'Lösung & Erklärung generieren'}</span>
              </button>
            </div>
          </form>

          {errorMsg && (
            <div className="text-xs text-red-400 bg-red-950/40 border border-red-800/60 p-3 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Answer Box */}
          {answer && (
            <div className="bg-neutral-950/90 border border-amber-500/30 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4" /> Erklärung & Lösung von Gemini ({selectedSubject})
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[11px] font-semibold transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Kopiert!' : 'Kopieren'}</span>
                  </button>

                  <button
                    onClick={handleShareToChat}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-semibold transition-all shadow"
                    title="Im Hausaufgaben-Chat teilen"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{shared ? 'Geteilt! ✓' : 'Im Chat teilen'}</span>
                  </button>
                </div>
              </div>

              <div className="text-xs leading-relaxed text-neutral-200 whitespace-pre-wrap font-sans selection:bg-amber-500 selection:text-neutral-950">
                {answer}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
