import React from 'react';
import { Sparkles, Trophy, Award, Flame, ThumbsUp, ThumbsDown, Star, Heart } from 'lucide-react';
import { MemeTemplate, MemeTextStyle, MemeVoteRecord } from '../../types';

interface MemeCardProps {
  template: MemeTemplate;
  topText: string;
  bottomText: string;
  textStyle?: MemeTextStyle;
  playerName?: string;
  playerAvatar?: string;
  score?: number;
  rank?: number;
  awardTitle?: string;
  commentary?: string;
  isWinner?: boolean;
  votes?: MemeVoteRecord;
  currentUserId?: string;
  onVote?: (type: 'up' | 'down' | 'super') => void;
  className?: string;
}

export const MemeCard: React.FC<MemeCardProps> = ({
  template,
  topText,
  bottomText,
  textStyle = 'impact',
  playerName,
  playerAvatar,
  score,
  rank,
  awardTitle,
  commentary,
  isWinner,
  votes,
  currentUserId,
  onVote,
  className = '',
}) => {
  const upvoteCount = votes?.upvotes?.length || 0;
  const downvoteCount = votes?.downvotes?.length || 0;
  const superlikeCount = votes?.superlikes?.length || 0;

  const hasUpvoted = currentUserId ? votes?.upvotes?.includes(currentUserId) : false;
  const hasDownvoted = currentUserId ? votes?.downvotes?.includes(currentUserId) : false;
  const hasSuperliked = currentUserId ? votes?.superlikes?.includes(currentUserId) : false;

  // Text Styling Helpers
  const renderImpactText = (text: string, isTop: boolean) => {
    if (!text) return null;
    return (
      <div
        className={`relative z-20 text-center font-black uppercase tracking-wider text-white select-none px-2 py-1 leading-tight ${
          isTop ? 'pt-2' : 'pb-2'
        }`}
        style={{
          fontFamily: 'Impact, "Arial Black", sans-serif',
          fontSize: 'clamp(14px, 3.5vw, 22px)',
          textShadow:
            '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 2px 0 #000, 0 -2px 0 #000, 2px 0 0 #000, -2px 0 0 #000, 0 3px 6px rgba(0,0,0,0.9)',
        }}
      >
        {text}
      </div>
    );
  };

  const renderSubtitleText = (text: string) => {
    if (!text) return null;
    return (
      <div className="relative z-20 mx-auto my-1 max-w-[90%] px-3 py-1 bg-black/75 backdrop-blur-sm rounded-lg border border-yellow-500/30 text-center font-bold text-yellow-300 text-xs sm:text-sm drop-shadow-md">
        {text}
      </div>
    );
  };

  // Render Visual Graphic for All 22 Make It Meme Templates
  const renderTemplateGraphic = () => {
    const preset = template.templatePresetId || 'distracted_bf';

    switch (preset) {
      // 1. Drake Rejection vs Approval
      case 'drake':
        return (
          <div className="grid grid-rows-2 h-full w-full bg-neutral-900 border-2 border-neutral-800">
            <div className="relative flex items-center bg-gradient-to-r from-amber-700/40 via-amber-900/60 to-neutral-950 p-2.5 border-b-2 border-neutral-800">
              <div className="w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-700 border-2 border-amber-300 flex flex-col items-center justify-center text-3xl shadow-lg mr-3">
                🙅‍♂️
              </div>
              <div className="flex-1 font-black text-amber-200 text-xs sm:text-sm tracking-wide drop-shadow-md">
                {topText || template.example_top_text || 'Option A'}
              </div>
            </div>
            <div className="relative flex items-center bg-gradient-to-r from-emerald-700/40 via-emerald-900/60 to-neutral-950 p-2.5">
              <div className="w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 border-2 border-emerald-300 flex flex-col items-center justify-center text-3xl shadow-lg mr-3">
                👉😎
              </div>
              <div className="flex-1 font-black text-emerald-200 text-xs sm:text-sm tracking-wide drop-shadow-md">
                {bottomText || template.example_bottom_text || 'Option B (Das einzig Wahre)'}
              </div>
            </div>
          </div>
        );

      // 2. Distracted Boyfriend
      case 'distracted_bf':
        return (
          <div className="relative h-full w-full bg-gradient-to-b from-sky-950 via-neutral-900 to-neutral-950 p-2 flex flex-col justify-between overflow-hidden">
            {textStyle === 'impact' && renderImpactText(topText || template.title, true)}
            <div className="flex items-end justify-around my-auto px-2">
              <div className="flex flex-col items-center">
                <span className="text-4xl animate-bounce">🙎‍♀️💢</span>
                <span className="text-[10px] font-black text-rose-400 bg-black/60 px-2 py-0.5 rounded-full mt-1">Freundin</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-4xl">🚶‍♂️😍</span>
                <span className="text-[10px] font-black text-blue-400 bg-black/60 px-2 py-0.5 rounded-full mt-1">Typ dreht sich um</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-4xl">💃✨</span>
                <span className="text-[10px] font-black text-amber-400 bg-black/60 px-2 py-0.5 rounded-full mt-1">Neues Mädchen</span>
              </div>
            </div>
            {textStyle === 'impact' && renderImpactText(bottomText || template.example_bottom_text || '', false)}
          </div>
        );

      // 3. Two Buttons
      case 'two_buttons':
        return (
          <div className="relative h-full w-full bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 p-2 flex flex-col justify-between">
            {textStyle === 'impact' && renderImpactText(topText || 'Unmögliche Entscheidung', true)}
            <div className="flex items-center justify-around my-auto">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-red-600 border-4 border-red-300 shadow-lg shadow-red-600/50 flex items-center justify-center animate-pulse">
                  🔴
                </div>
                <span className="text-[10px] font-black text-red-300 mt-1">Knopf A</span>
              </div>
              <div className="text-4xl animate-bounce">😰💦</div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-red-600 border-4 border-red-300 shadow-lg shadow-red-600/50 flex items-center justify-center animate-pulse">
                  🔴
                </div>
                <span className="text-[10px] font-black text-red-300 mt-1">Knopf B</span>
              </div>
            </div>
            {textStyle === 'impact' && renderImpactText(bottomText || 'Panikschweiß', false)}
          </div>
        );

      // 4. Buff Doge vs Cheems
      case 'buff_doge':
        return (
          <div className="relative h-full w-full bg-gradient-to-r from-amber-950/80 via-neutral-950 to-amber-950/80 p-2 flex flex-col justify-between">
            {textStyle === 'impact' && renderImpactText(topText || 'Vorher vs Nachher', true)}
            <div className="grid grid-cols-2 gap-2 my-auto items-center">
              <div className="flex flex-col items-center bg-amber-500/10 border-2 border-amber-500/40 p-2 rounded-2xl text-center">
                <span className="text-4xl">🐕💪</span>
                <span className="text-[10px] font-black text-amber-300 uppercase mt-1">Giga Buff Doge</span>
              </div>
              <div className="flex flex-col items-center bg-neutral-900/80 border-2 border-neutral-700 p-2 rounded-2xl text-center">
                <span className="text-3xl">🥺🐶</span>
                <span className="text-[10px] font-black text-neutral-400 uppercase mt-1">Weinender Cheems</span>
              </div>
            </div>
            {textStyle === 'impact' && renderImpactText(bottomText || '', false)}
          </div>
        );

      // 5. Expanding Brain
      case 'expanding_brain':
        return (
          <div className="relative h-full w-full bg-gradient-to-b from-indigo-950 via-purple-950 to-neutral-950 p-2 flex flex-col justify-between">
            {textStyle === 'impact' && renderImpactText(topText || 'Stufe 1', true)}
            <div className="flex items-center justify-around my-auto">
              <span className="text-2xl opacity-60">🧠</span>
              <span className="text-3xl text-cyan-400">💡🧠</span>
              <span className="text-4xl text-purple-300 animate-spin">🌌✨</span>
              <span className="text-4xl text-amber-300 animate-pulse">☀️👑</span>
            </div>
            {textStyle === 'impact' && renderImpactText(bottomText || 'Galaxy Brain 200 IQ', false)}
          </div>
        );

      // 6. Woman Yelling at Cat
      case 'cat_table':
        return (
          <div className="relative h-full w-full bg-neutral-900 p-2 flex flex-col justify-between">
            {textStyle === 'impact' && renderImpactText(topText || 'Hysterie', true)}
            <div className="grid grid-cols-2 gap-2 my-auto items-center">
              <div className="flex flex-col items-center bg-red-950/40 border border-red-500/40 p-2 rounded-2xl text-center">
                <span className="text-3xl">😾👉</span>
                <span className="text-[10px] font-black text-rose-300 uppercase mt-1">Schreit hysterisch</span>
              </div>
              <div className="flex flex-col items-center bg-neutral-800 border border-neutral-700 p-2 rounded-2xl text-center">
                <span className="text-3xl">🐱🥗</span>
                <span className="text-[10px] font-black text-neutral-300 uppercase mt-1">Verwirrte Katze am Tisch</span>
              </div>
            </div>
            {textStyle === 'impact' && renderImpactText(bottomText || 'Was wollt ihr von mir?', false)}
          </div>
        );

      // 7. Disaster Girl
      case 'disaster_girl':
        return (
          <div className="relative h-full w-full bg-gradient-to-br from-amber-600/30 via-red-900/60 to-neutral-950 p-2 flex flex-col justify-between overflow-hidden">
            {textStyle === 'impact' && renderImpactText(topText || 'Alles brennt', true)}
            <div className="flex items-center justify-around my-auto">
              <div className="flex flex-col items-center text-center">
                <span className="text-4xl">🚒🏠🔥</span>
                <span className="text-[9px] font-bold text-red-300 bg-black/60 px-2 py-0.5 rounded-full mt-1">Haus in Flammen</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-5xl animate-pulse">😏👧</span>
                <span className="text-[10px] font-black text-amber-300 bg-black/70 px-2 py-0.5 rounded-full mt-1">Diabolisches Grinsen</span>
              </div>
            </div>
            {textStyle === 'impact' && renderImpactText(bottomText || '', false)}
          </div>
        );

      // 8. Roll Safe (Smart Guy)
      case 'roll_safe':
        return (
          <div className="relative h-full w-full bg-gradient-to-br from-blue-950 via-neutral-900 to-neutral-950 p-2 flex flex-col justify-between">
            {textStyle === 'impact' && renderImpactText(topText || 'Unschlagbare Logik', true)}
            <div className="flex flex-col items-center justify-center my-auto">
              <span className="text-5xl">👈😏🧠</span>
              <span className="text-xs font-black text-cyan-300 bg-neutral-900/80 px-3 py-1 rounded-full border border-cyan-500/40 mt-2">
                Tippt sich an die Stirn
              </span>
            </div>
            {textStyle === 'impact' && renderImpactText(bottomText || '200 IQ Move', false)}
          </div>
        );

      // 9. Gru's Plan
      case 'grus_plan':
        return (
          <div className="grid grid-cols-2 grid-rows-2 h-full w-full bg-neutral-900 border-2 border-neutral-800 gap-1 p-1">
            <div className="flex flex-col items-center justify-center bg-neutral-800/80 rounded-xl p-1 text-center">
              <span className="text-2xl">📋😃</span>
              <span className="text-[9px] font-bold text-neutral-300">Stufe 1: Der Plan</span>
            </div>
            <div className="flex flex-col items-center justify-center bg-neutral-800/80 rounded-xl p-1 text-center">
              <span className="text-2xl">📋😎</span>
              <span className="text-[9px] font-bold text-neutral-300">Stufe 2: Durchführung</span>
            </div>
            <div className="flex flex-col items-center justify-center bg-amber-950/40 border border-amber-500/30 rounded-xl p-1 text-center">
              <span className="text-2xl">📋😏</span>
              <span className="text-[9px] font-bold text-amber-300">Stufe 3: Erfolg</span>
            </div>
            <div className="flex flex-col items-center justify-center bg-rose-950/60 border-2 border-rose-500 rounded-xl p-1 text-center animate-pulse">
              <span className="text-3xl">😱📋</span>
              <span className="text-[9px] font-black text-rose-300">Stufe 4: SCHOCK!</span>
            </div>
          </div>
        );

      // 10. Trade Offer
      case 'trade_offer':
        return (
          <div className="relative h-full w-full bg-gradient-to-br from-emerald-950 via-neutral-900 to-neutral-950 p-2 flex flex-col justify-between">
            <div className="text-center font-black text-emerald-400 text-xs sm:text-sm uppercase tracking-widest bg-emerald-950/80 py-1 rounded-lg border border-emerald-500/40">
              🤝 TRADE OFFER 🤝
            </div>
            <div className="grid grid-cols-2 gap-2 my-auto">
              <div className="flex flex-col items-center bg-neutral-900/90 p-2 rounded-xl border border-neutral-700 text-center">
                <span className="text-[10px] font-bold text-amber-400 uppercase">I receive:</span>
                <span className="text-xs font-black text-white mt-1">{topText || 'Alles was du hast'}</span>
              </div>
              <div className="flex flex-col items-center bg-neutral-900/90 p-2 rounded-xl border border-neutral-700 text-center">
                <span className="text-[10px] font-bold text-cyan-400 uppercase">You receive:</span>
                <span className="text-xs font-black text-white mt-1">{bottomText || 'Gar nichts'}</span>
              </div>
            </div>
            <div className="text-center text-3xl">💼🤵</div>
          </div>
        );

      // 11. Anakin & Padme
      case 'anakin_padme':
        return (
          <div className="grid grid-cols-2 h-full w-full bg-neutral-950 border-2 border-neutral-800">
            <div className="flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 to-red-950/60 p-2 text-center border-r border-neutral-800">
              <span className="text-4xl">😠⚔️</span>
              <span className="text-[10px] font-black text-red-400 uppercase mt-1">Anakin (finsterer Blick)</span>
            </div>
            <div className="flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 to-sky-950/60 p-2 text-center">
              <span className="text-4xl animate-pulse">😟🌸</span>
              <span className="text-[10px] font-black text-sky-300 uppercase mt-1">Padme ("...oder?")</span>
            </div>
          </div>
        );

      // 12. This Is Fine
      case 'this_is_fine':
        return (
          <div className="relative h-full w-full bg-gradient-to-t from-orange-600 via-amber-700 to-neutral-950 p-2 flex flex-col justify-between overflow-hidden">
            {textStyle === 'impact' && renderImpactText(topText || 'Chaos pur', true)}
            <div className="flex flex-col items-center justify-center my-auto">
              <div className="text-5xl animate-bounce">☕🐶🎩</div>
              <div className="text-4xl my-1">🔥🔥🔥🔥🔥</div>
              <span className="text-xs font-black text-amber-200 bg-neutral-950/80 px-3 py-1 rounded-full border border-amber-500/40">
                This is fine.
              </span>
            </div>
            {textStyle === 'impact' && renderImpactText(bottomText || 'Alles bestens', false)}
          </div>
        );

      // 13. Hide the Pain Harold
      case 'harold':
        return (
          <div className="relative h-full w-full bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 p-2 flex flex-col justify-between">
            {textStyle === 'impact' && renderImpactText(topText || 'Wenn alles wehtut', true)}
            <div className="flex flex-col items-center justify-center my-auto">
              <span className="text-5xl">😬☕💻</span>
              <span className="text-xs font-black text-amber-300 bg-neutral-900/90 px-3 py-1 rounded-full border border-amber-500/40 mt-2">
                Harold lächelt durch die Qual
              </span>
            </div>
            {textStyle === 'impact' && renderImpactText(bottomText || 'Innere Leere intensiviert sich', false)}
          </div>
        );

      // 14. Gigachad
      case 'gigachad':
        return (
          <div className="relative h-full w-full bg-gradient-to-b from-neutral-800 via-neutral-950 to-black p-2 flex flex-col justify-between border-2 border-neutral-700">
            {textStyle === 'impact' && renderImpactText(topText || 'Durchschnittlicher Genießer', true)}
            <div className="flex flex-col items-center justify-center my-auto">
              <span className="text-6xl filter grayscale contrast-150 drop-shadow-2xl">🗿👑</span>
              <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest mt-2 bg-neutral-900/90 px-3 py-0.5 rounded-full border border-amber-500/40">
                GIGACHAD
              </span>
            </div>
            {textStyle === 'impact' && renderImpactText(bottomText || 'Woher wusstest du das?', false)}
          </div>
        );

      // 15. Clown Makeup
      case 'clown_makeup':
        return (
          <div className="grid grid-cols-4 h-full w-full bg-neutral-950 border-2 border-neutral-800 p-1 gap-1 items-center">
            <div className="flex flex-col items-center justify-center bg-neutral-900 p-1 rounded-xl text-center h-full">
              <span className="text-2xl">😐</span>
              <span className="text-[8px] font-bold text-neutral-400 mt-1">Stufe 1</span>
            </div>
            <div className="flex flex-col items-center justify-center bg-neutral-900 p-1 rounded-xl text-center h-full">
              <span className="text-2xl">🤍😐</span>
              <span className="text-[8px] font-bold text-neutral-300 mt-1">Stufe 2</span>
            </div>
            <div className="flex flex-col items-center justify-center bg-neutral-900 p-1 rounded-xl text-center h-full">
              <span className="text-2xl">🔴🤡</span>
              <span className="text-[8px] font-bold text-rose-300 mt-1">Stufe 3</span>
            </div>
            <div className="flex flex-col items-center justify-center bg-rose-950/60 border border-rose-500/50 p-1 rounded-xl text-center h-full">
              <span className="text-3xl animate-bounce">🎪🤡</span>
              <span className="text-[8px] font-black text-amber-300 mt-1">Vollclown</span>
            </div>
          </div>
        );

      // 16. Bernie Sanders Asking
      case 'bernie_asking':
        return (
          <div className="relative h-full w-full bg-gradient-to-b from-sky-950 via-neutral-900 to-neutral-950 p-2 flex flex-col justify-between">
            {textStyle === 'impact' && renderImpactText(topText || 'Ich frage noch einmal:', true)}
            <div className="flex flex-col items-center justify-center my-auto">
              <span className="text-5xl">🧤❄️👴</span>
              <span className="text-[10px] font-bold text-sky-300 bg-sky-950/80 px-3 py-1 rounded-full border border-sky-500/30 mt-2">
                "I am once again asking for your support"
              </span>
            </div>
            {textStyle === 'impact' && renderImpactText(bottomText || '', false)}
          </div>
        );

      // 17. Panik / Kalm / Panik
      case 'panik_kalm':
        return (
          <div className="grid grid-rows-3 h-full w-full border-2 border-neutral-800">
            <div className="flex items-center justify-between px-3 bg-rose-900/50 border-b border-neutral-800">
              <span className="text-xl">😱🚨</span>
              <span className="text-xs font-black text-rose-300 uppercase tracking-widest">PANIK</span>
            </div>
            <div className="flex items-center justify-between px-3 bg-sky-900/50 border-b border-neutral-800">
              <span className="text-xl">😌🌱</span>
              <span className="text-xs font-black text-sky-300 uppercase tracking-widest">KALM</span>
            </div>
            <div className="flex items-center justify-between px-3 bg-red-600/70 animate-pulse">
              <span className="text-2xl">🤯💥</span>
              <span className="text-xs font-black text-white uppercase tracking-widest">ULTRA-PANIK!</span>
            </div>
          </div>
        );

      // 18. Monkey Puppet
      case 'monkey_puppet':
        return (
          <div className="grid grid-cols-2 h-full w-full bg-neutral-950 border-2 border-neutral-800">
            <div className="flex flex-col items-center justify-center bg-neutral-900 p-2 border-r border-neutral-800">
              <span className="text-4xl">🐒😳</span>
              <span className="text-[10px] font-bold text-neutral-400 mt-1">Starrt geradeaus</span>
            </div>
            <div className="flex flex-col items-center justify-center bg-neutral-900 p-2">
              <span className="text-4xl animate-pulse">🐒👀</span>
              <span className="text-[10px] font-black text-amber-400 mt-1">Schaut peinlich weg</span>
            </div>
          </div>
        );

      // 19. Always Has Been
      case 'always_has_been':
        return (
          <div className="relative h-full w-full bg-gradient-to-b from-black via-indigo-950 to-neutral-950 p-2 flex flex-col justify-between">
            {textStyle === 'impact' && renderImpactText(topText || 'Warte, es ist alles...', true)}
            <div className="flex items-center justify-around my-auto">
              <span className="text-4xl">🌍✨</span>
              <span className="text-3xl">👨‍🚀</span>
              <span className="text-3xl">🔫👨‍🚀</span>
            </div>
            {textStyle === 'impact' && renderImpactText(bottomText || 'Always has been.', false)}
          </div>
        );

      // 20. Stonks
      case 'stonks':
        return (
          <div className="relative h-full w-full bg-gradient-to-br from-blue-950 via-neutral-900 to-neutral-950 p-2 flex flex-col justify-between overflow-hidden">
            {textStyle === 'impact' && renderImpactText(topText || 'Finanzgenie', true)}
            <div className="flex items-center justify-center gap-3 my-auto">
              <span className="text-5xl">📈💰</span>
              <span className="text-4xl">👨‍💼✨</span>
            </div>
            {textStyle === 'impact' && renderImpactText(bottomText || 'STONKS', false)}
          </div>
        );

      // 21. Spider-Man Pointing
      case 'spiderman_pointing':
        return (
          <div className="relative h-full w-full bg-gradient-to-r from-red-950/70 via-neutral-900 to-blue-950/70 p-2 flex flex-col justify-between">
            {textStyle === 'impact' && renderImpactText(topText || 'Doppelgänger', true)}
            <div className="flex items-center justify-around my-auto">
              <span className="text-4xl">🕷️👉</span>
              <span className="text-2xl opacity-60">🚓</span>
              <span className="text-4xl">👈🕷️</span>
            </div>
            {textStyle === 'impact' && renderImpactText(bottomText || 'Gegenseitige Beschuldigung', false)}
          </div>
        );

      // 22. Arthur's Fist
      case 'arthur_fist':
        return (
          <div className="relative h-full w-full bg-gradient-to-br from-yellow-700/40 via-neutral-900 to-neutral-950 p-2 flex flex-col justify-between">
            {textStyle === 'impact' && renderImpactText(topText || 'Innere Wut kocht', true)}
            <div className="flex flex-col items-center justify-center my-auto">
              <div className="w-16 h-16 rounded-2xl bg-amber-500 border-4 border-amber-300 flex items-center justify-center text-4xl shadow-xl shadow-amber-500/40 animate-pulse">
                ✊⚡
              </div>
              <span className="text-[11px] font-black text-amber-300 uppercase mt-2">Geballte Faust</span>
            </div>
            {textStyle === 'impact' && renderImpactText(bottomText || 'Purer Zorn', false)}
          </div>
        );

      default:
        return (
          <div className="relative h-full w-full bg-neutral-900 p-3 flex flex-col justify-between">
            {textStyle === 'impact' && renderImpactText(topText || template.title, true)}
            <div className="my-auto text-center p-2 rounded-xl bg-neutral-950/70 border border-neutral-800">
              <span className="text-4xl">🎭✨</span>
              <p className="text-xs text-neutral-300 italic mt-1">{template.scenario_description}</p>
            </div>
            {textStyle === 'impact' && renderImpactText(bottomText || '', false)}
          </div>
        );
    }
  };

  return (
    <div
      className={`relative flex flex-col rounded-3xl overflow-hidden bg-neutral-950 border-2 transition-all duration-300 shadow-2xl ${
        isWinner
          ? 'border-amber-400 ring-4 ring-amber-500/40 shadow-amber-500/30 scale-[1.02]'
          : 'border-neutral-800 hover:border-neutral-700'
      } ${className}`}
    >
      {/* Header Badge: Player Name & Round Info */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border-b border-neutral-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-lg">{playerAvatar || '🕶️'}</span>
          <span className="font-extrabold text-white truncate max-w-[130px]">{playerName || 'Anonym'}</span>
        </div>

        {rank && (
          <div className="flex items-center gap-1.5">
            {rank === 1 && <Trophy className="w-4 h-4 text-amber-400 fill-amber-400 animate-bounce" />}
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                rank === 1
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-neutral-950 shadow-md shadow-amber-500/40'
                  : rank === 2
                  ? 'bg-neutral-300 text-neutral-950'
                  : rank === 3
                  ? 'bg-amber-800 text-white'
                  : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              Rang #{rank}
            </span>
          </div>
        )}
      </div>

      {/* Modern Header Banner Caption (Make It Meme Modern Style) */}
      {textStyle === 'modern' && (topText || bottomText) && (
        <div className="px-3.5 py-2.5 bg-neutral-100 text-neutral-950 border-b-2 border-neutral-300 font-black text-xs sm:text-sm tracking-tight leading-snug">
          {topText && <div>{topText}</div>}
          {bottomText && <div className="text-neutral-700 font-extrabold text-[11px] mt-0.5">{bottomText}</div>}
        </div>
      )}

      {/* Main Meme Art Aspect Box */}
      <div className="relative w-full aspect-[4/3] bg-neutral-950 overflow-hidden flex flex-col justify-between">
        {renderTemplateGraphic()}

        {/* Subtitle style text overlay */}
        {textStyle === 'subtitle' && (
          <div className="absolute bottom-2 inset-x-0 flex flex-col items-center">
            {renderSubtitleText(topText)}
            {renderSubtitleText(bottomText)}
          </div>
        )}

        {/* Winner Badge Overlay */}
        {isWinner && (
          <div className="absolute top-2.5 right-2.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-neutral-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-amber-500/40 animate-pulse z-30">
            <Sparkles className="w-3.5 h-3.5 fill-neutral-950" />
            <span>RUNDEN-GEWINNER</span>
          </div>
        )}
      </div>

      {/* Make It Meme Interactive Voting Bar */}
      {onVote && (
        <div className="flex items-center justify-around px-3 py-2 bg-neutral-900 border-t border-neutral-800">
          <button
            onClick={() => onVote('up')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs transition-all active:scale-90 ${
              hasUpvoted
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/40 scale-105'
                : 'bg-neutral-800 text-emerald-400 hover:bg-neutral-700'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5 fill-current" />
            <span>{upvoteCount > 0 ? upvoteCount : 'Vote'}</span>
          </button>

          <button
            onClick={() => onVote('super')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all active:scale-90 ${
              hasSuperliked
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950 shadow-lg shadow-amber-500/50 scale-110 animate-pulse'
                : 'bg-neutral-800 text-amber-400 hover:bg-neutral-700'
            }`}
          >
            <Star className="w-4 h-4 fill-current" />
            <span>{superlikeCount > 0 ? `+${superlikeCount}` : 'Super-Meme'}</span>
          </button>

          <button
            onClick={() => onVote('down')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs transition-all active:scale-90 ${
              hasDownvoted
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40 scale-105'
                : 'bg-neutral-800 text-rose-400 hover:bg-neutral-700'
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5 fill-current" />
            <span>{downvoteCount > 0 ? downvoteCount : 'Meh'}</span>
          </button>
        </div>
      )}

      {/* Footer / Scoring & MEME-MASTER Roast Critique */}
      {(score !== undefined || awardTitle || commentary) && (
        <div className="p-3 bg-neutral-900/95 border-t border-neutral-800 flex flex-col gap-1.5">
          {awardTitle && (
            <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-400 uppercase tracking-wide">
              <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{awardTitle}</span>
            </div>
          )}

          {score !== undefined && (
            <div className="flex items-center justify-between text-xs font-bold text-neutral-300">
              <span className="text-[10px] text-neutral-400 uppercase">MEME-MASTER Score</span>
              <span className="text-sm font-black text-cyan-400 tabular-nums">{score} / 100 Pkt.</span>
            </div>
          )}

          {commentary && (
            <div className="mt-1 p-2 rounded-xl bg-neutral-950/90 border border-neutral-800 text-[11px] text-neutral-300 italic leading-snug">
              <strong className="text-amber-400 not-italic block mb-0.5">MEME-MASTER Urteil:</strong>
              "{commentary}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
