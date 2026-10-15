import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  deleteDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from './config';
import {
  MemeJudgingResult,
  MemePlayer,
  MemeRoomState,
  MemeSubmission,
  MemeTemplate,
} from '../types';

export const POPULAR_THEMES = [
  'Schule, Noten & Lehrer',
  'Gaming & Rage-Quits',
  'Absurder Alltag & Peinliche Momente',
  'Tech, Handys & KI-Wahnsinn',
  'Freunde, Partys & Gruppenchat',
  'Eltern & Boomer-Momente',
];

export const BOT_NAMES = [
  { name: 'MemeGott_420', avatar: '🤖' },
  { name: 'GigaChad_Leopold', avatar: '🗿' },
  { name: 'DogeMaster', avatar: '🐕' },
  { name: 'NPC_Kevin', avatar: '🤡' },
  { name: 'Schulbäcker_Alex', avatar: '🥐' },
  { name: 'ProGamer_Lisa', avatar: '🎮' },
];

export const BOT_CAPTIONS: Record<string, { top: string; bottom: string }[]> = {
  default: [
    { top: 'Wenn der Lehrer sagt: "Der Test wird super einfach"', bottom: 'Aufgabe 1: Berechne den Sinn des Lebens ohne Taschenrechner' },
    { top: 'Ich um 3 Uhr nachts:', bottom: 'Warum schmeckt Wasser nachts wie ein 5-Sterne Menü?' },
    { top: 'Mein Gehirn während der Klassenarbeit:', bottom: 'Tung, tung, sahn... Saaaaahn!' },
    { top: 'Wenn dein Teammate sagt: "Vertrau mir, ich pushe"', bottom: '0 Kills, 12 Tode, Spiel deinstalliert.' },
    { top: 'Wenn der Wecker um 6:00 Uhr klingelt:', bottom: 'Noch 5 Minuten schlafen = Zeitreise um 3 Stunden.' },
    { top: 'Wie ich tue als hätte ich Hausaufgaben gemacht:', bottom: 'Schau hochkonzentriert auf mein leeres Blatt.' },
  ],
};

export const BUILTIN_TEMPLATES: MemeTemplate[] = [
  {
    id: 'tpl_drake',
    title: 'Drake Rejection vs Approval',
    scenario_description: 'Drake wendet sich im orangen Parka angewidert ab (oben), und nickt im nächsten Bild lächelnd und zustimmend mit dem Fingerzeig (unten).',
    visual_style: 'comic',
    vibe: 'relatable',
    suggested_angles: ['Etwas Schlechtes ablehnen, etwas Schlechtes aber Bequemes bevorzugen', 'Gesunde Gewohnheiten vs dumme Ideen'],
    caption_prompts: ['Hausaufgaben um 16 Uhr vs Hausaufgaben um 02:45 Uhr', 'Lernen vs 8 Stunden TikTok'],
    example_top_text: 'Rechtzeitig schlafen gehen',
    example_bottom_text: 'Um 3 Uhr morgens 2048 zocken',
    templatePresetId: 'drake',
  },
  {
    id: 'tpl_distracted',
    title: 'Ablenkender Freund (Distracted Boyfriend)',
    scenario_description: 'Ein Typ dreht sich beim Spaziergang verliebt nach einem anderen Mädchen um, während seine Freundin ihn fassungslos und wütend anstarrt.',
    visual_style: 'photo',
    vibe: 'chaotic',
    suggested_angles: ['Neue Versuchung vs alte Pflichten', 'Verlockung vs Realität'],
    caption_prompts: ['Mein Gehirn, Neues Hobby, Wichtige Prüfung morgen'],
    example_top_text: 'Ich, der eigentlich Mathe lernen muss',
    example_bottom_text: 'Ein 45-minütiges Video über Ameisenkriege',
    templatePresetId: 'distracted_bf',
  },
  {
    id: 'tpl_two_buttons',
    title: 'Zwei Rote Knöpfe (Panik-Wahl)',
    scenario_description: 'Ein schwitzender Mann / Superheld muss zwischen zwei fatalen roten Knöpfen wählen und wischt sich verzweifelt den Schweiß von der Stirn.',
    visual_style: 'comic',
    vibe: 'pain',
    suggested_angles: ['Unmögliche Dilemmata', 'Zwei gleich peinliche Optionen'],
    caption_prompts: ['Hausaufgabe vergessen gestehen vs sagen "Habe ich zuhause vergessen"'],
    example_top_text: 'Option A: Zocken / Option B: Schlafen',
    example_bottom_text: 'Ich wähle Option C: Bis 4 Uhr wach liegen und bereuen',
    templatePresetId: 'two_buttons',
  },
  {
    id: 'tpl_buff_doge',
    title: 'Buff Doge vs. Kleiner Cheems',
    scenario_description: 'Links ein gigantischer muskulöser Shiba Inu Krieger (früher), rechts ein kleiner weinender jammernder Hund (heute).',
    visual_style: 'comic',
    vibe: 'sarcastic',
    suggested_angles: ['Frühere Generation vs heutige Wehleidigkeit', 'Wie ich mich ankündige vs wie ich abliefere'],
    caption_prompts: ['Schüler vor 50 Jahren vs ich bei 3 Grad Kälte'],
    example_top_text: 'Ich beim Planen meiner Zukunft um Mitternacht',
    example_bottom_text: 'Ich am nächsten Morgen beim Versuch aufzustehen',
    templatePresetId: 'buff_doge',
  },
  {
    id: 'tpl_brain_galaxy',
    title: 'Expanding Brain (Galaxy Hirn)',
    scenario_description: 'Stufenweise Erleuchtung: Normales kleines Gehirn, leuchtendes Gehirn, kosmisches Universum-Gehirn, bis hin zur göttlichen Erleuchtung.',
    visual_style: '3d',
    vibe: '200iq',
    suggested_angles: ['Zunehmend absurde Lebensentscheidungen als Geniestreich verkaufen'],
    caption_prompts: ['Klassenarbeit schreiben -> Spicken -> Lehrer bestechen -> Schulleiter werden'],
    example_top_text: '5 Minuten vor der Stunde Hausaufgaben kopieren',
    example_bottom_text: 'Behaupten, der Hund hat das iPad gefressen',
    templatePresetId: 'expanding_brain',
  },
  {
    id: 'tpl_cat_table',
    title: 'Schreiende Frau vs. Verwirrte Katze am Tisch',
    scenario_description: 'Links schreit eine Frau hysterisch und zeigt mit dem Finger, rechts sitzt eine weiße Katze am Esstisch vor einem Teller Salat mit extrem verwirrtem Blick.',
    visual_style: 'photo',
    vibe: 'chaotic',
    suggested_angles: ['Unberechtigte Vorwürfe vs völlige Ahnungslosigkeit'],
    caption_prompts: ['Lehrer: Warum sprichst du? / Ich der gerade gähnt'],
    example_top_text: 'Lehrerin: Ihr hattet zwei ganze Wochen Zeit!',
    example_bottom_text: 'Ich, der die Aufgabe vor 10 Minuten erfahren hat:',
    templatePresetId: 'cat_table',
  },
  {
    id: 'tpl_disaster_girl',
    title: 'Disaster Girl (Smirk vor Brandhaus)',
    scenario_description: 'Ein kleines Mädchen schaut mit einem diabolischen Grinsen direkt in die Kamera, während im Hintergrund ein Haus lichterloh in Flammen steht.',
    visual_style: 'photo',
    vibe: 'chaotic',
    suggested_angles: ['Schadensfreude', 'Unschuldig wirken während das Chaos tobt'],
    caption_prompts: ['Wenn der Lehrer krank ist und der Test ausfällt'],
    example_top_text: 'Ich, nachdem ich den Gruppenchat mit einer Frage gesprengt habe',
    example_bottom_text: 'Der Gruppenchat 3 Minuten später:',
    templatePresetId: 'disaster_girl',
  },
  {
    id: 'tpl_roll_safe',
    title: 'Roll Safe (Smart Guy tippt sich an die Stirn)',
    scenario_description: 'Ein kluger Mann mit Lederjacke grinst und tippt sich mit dem Zeigefinger an die Schläfe: Unschlagbare Logik!',
    visual_style: 'photo',
    vibe: '200iq',
    suggested_angles: ['Dumme Lebensweisheiten als Geniestreich verpacken'],
    caption_prompts: ['Keine Fehler machen wenn man nichts tut'],
    example_top_text: 'Du kannst keine schlechten Noten schreiben',
    example_bottom_text: 'Wenn du einfach gar nicht erst zur Schule gehst',
    templatePresetId: 'roll_safe',
  },
  {
    id: 'tpl_grus_plan',
    title: 'Gru\'s 4-Stufen Masterplan',
    scenario_description: 'Gru präsentiert stolz Stufe 1, 2 und 3 seines Plans, doch bei Stufe 4 dreht er sich schockiert um und starrt mit offenem Mund auf das desaströse Ergebnis.',
    visual_style: 'comic',
    vibe: 'pain',
    suggested_angles: ['Plan ging nach hinten los', 'Unerwartete Konsequenzen'],
    caption_prompts: ['Spicken vorbereiten -> Erwischt werden'],
    example_top_text: 'Ich plane den perfekten Streich',
    example_bottom_text: 'Ich kriege Klassenbucheintrag und Hausarrest',
    templatePresetId: 'grus_plan',
  },
  {
    id: 'tpl_trade_offer',
    title: 'Trade Offer (Handelsangebot)',
    scenario_description: 'Ein eleganter Herr im Anzug hebt die Hände und macht ein unschlagbares Angebot: "I receive ... / You receive ..."',
    visual_style: 'photo',
    vibe: 'sarcastic',
    suggested_angles: ['Absurd unausgeglichene Deals', 'Verhandlungen im Alltag'],
    caption_prompts: ['Katze vs Besitzer', 'Geschwister-Tausch'],
    example_top_text: 'HANDELSANGEBOT: Ich erhalte deine Schokolade',
    example_bottom_text: 'Du erhältst: Nichts, aber ich verpetze dich nicht',
    templatePresetId: 'trade_offer',
  },
  {
    id: 'tpl_anakin_padme',
    title: 'Anakin & Padme ("Für das Gute, oder?")',
    scenario_description: 'Anakin blickt finster und entschlossen, Padme lächelt erst hoffnungsvoll und fragt dann verunsichert und besorgt noch einmal nach.',
    visual_style: 'photo',
    vibe: 'pain',
    suggested_angles: ['Fehlinterpretation', 'Unangenehmes Schweigen'],
    caption_prompts: ['Lehrer teilt Arbeitsblatt aus', 'Kumpel plant Aktion'],
    example_top_text: 'Wir lernen jetzt wirklich für die Prüfung, oder?',
    example_bottom_text: 'Oder???',
    templatePresetId: 'anakin_padme',
  },
  {
    id: 'tpl_this_is_fine',
    title: 'This Is Fine (Hund im Flammenmeer)',
    scenario_description: 'Ein Hund mit kleinem Hut sitzt friedlich am Küchentisch und nippt an seinem Kaffee, während der ganze Raum lichterloh brennt.',
    visual_style: 'comic',
    vibe: 'relatable',
    suggested_angles: ['Verdrängung von Problemen', 'Panik hinter gelassener Fassade'],
    caption_prompts: ['3 Tage vor Abgabe', '5 ungelesene E-Mails vom Chef'],
    example_top_text: 'Mein Leben brennt an allen Ecken und Enden',
    example_bottom_text: 'This is fine. Noch ein Kaffee.',
    templatePresetId: 'this_is_fine',
  },
  {
    id: 'tpl_harold',
    title: 'Hide the Pain Harold (Gequältes Lächeln)',
    scenario_description: 'Der ältere Herr Harold sitzt mit einer Tasse Kaffee vor dem Laptop und lächelt krampfhaft, während seine Augen pure existenzielle Verzweiflung ausstrahlen.',
    visual_style: 'photo',
    vibe: 'pain',
    suggested_angles: ['Gute Miene zum bösen Spiel', 'Innere Leere überspielen'],
    caption_prompts: ['Wenn Verwandte fragen was du nach der Schule machst'],
    example_top_text: 'Wenn der Lehrer dich drannimmt und du "Sehr interessante Frage" sagst',
    example_bottom_text: 'Weil du null Ahnung hast wovon er redet',
    templatePresetId: 'harold',
  },
  {
    id: 'tpl_gigachad',
    title: 'GigaChad (Der ultimative Ehrenmann)',
    scenario_description: 'Ein extrem markanter Mann in dramatischem Schwarz-Weiß mit perfekter Kinnpartie und stoischer Ruhe.',
    visual_style: 'photo',
    vibe: '200iq',
    suggested_angles: ['Souveränität', 'Recht haben ohne zu diskutieren'],
    caption_prompts: ['Der Typ der ohne Lernen eine 1 schreibt'],
    example_top_text: 'Ja, ich spiele 2048 im 8K-Modus.',
    example_bottom_text: 'Woher wusstest du das?',
    templatePresetId: 'gigachad',
  },
  {
    id: 'tpl_clown_makeup',
    title: 'Clown Make-up (Stufe 1 bis 4)',
    scenario_description: 'Ein Mann verwandelt sich Schritt für Schritt in einen Clown: Gesicht weiß malen, rote Nase aufsetzen, bunte Perücke, volles Kostüm.',
    visual_style: 'comic',
    vibe: 'sarcastic',
    suggested_angles: ['Sich selbst belügen und am Ende wie ein Idiot dastehen'],
    caption_prompts: ['"Ich fange um 17 Uhr an zu lernen"'],
    example_top_text: '"Ich mache nur eine Folge auf Netflix"',
    example_bottom_text: '5 Stunden später:',
    templatePresetId: 'clown_makeup',
  },
  {
    id: 'tpl_bernie_asking',
    title: 'Bernie Sanders ("I am once again asking...")',
    scenario_description: 'Bernie Sanders steht in dicker Winterjacke und Handschuhen frierend im Schnee und bittet höflich aber bestimmt um Unterstützung.',
    visual_style: 'photo',
    vibe: 'relatable',
    suggested_angles: ['Wiederholtes Betteln', 'Schulden eintreiben'],
    caption_prompts: ['Hotspot schnorren', 'Kaugummi in der Pause'],
    example_top_text: 'Ich frage noch einmal in aller Bescheidenheit:',
    example_bottom_text: 'Hast du dein Ladekabel dabei?',
    templatePresetId: 'bernie_asking',
  },
  {
    id: 'tpl_panik_kalm',
    title: 'Meme Man: Panik / Kalm / Panik',
    scenario_description: 'Dreigeteiltes Bild mit Meme Man: 1. Panik mit rotem Alarmlicht, 2. Erleichterung (Kalm), 3. Plötzliche noch viel schlimmere Erkenntnis (PANIK!).',
    visual_style: '3d',
    vibe: 'chaotic',
    suggested_angles: ['Falsche Entwarnung', 'Plötzlicher Schock'],
    caption_prompts: ['Test vergessen -> Test verschoben -> Morgen doppelter Test'],
    example_top_text: 'Test heute? PANIK. Lehrer krank? Kalm.',
    example_bottom_text: 'Vertretungslehrer ist der strengste der Schule: PANIK!',
    templatePresetId: 'panik_kalm',
  },
  {
    id: 'tpl_monkey_puppet',
    title: 'Monkey Puppet (Peinlich berührt weggucken)',
    scenario_description: 'Eine Stoffaffen-Puppe starrt erst erschrocken nach vorne, und dreht dann langsam peinlich berührt und ertappt den Kopf zur Seite.',
    visual_style: 'photo',
    vibe: 'relatable',
    suggested_angles: ['Sich unauffällig machen wenn der Lehrer jemanden sucht', 'Schuldige Stille'],
    caption_prompts: ['"Wer hat das Fenster kaputtgemacht?"'],
    example_top_text: 'Lehrer: "Wer möchte freiwillig sein Referat halten?"',
    example_bottom_text: 'Ich im selben Augenblick:',
    templatePresetId: 'monkey_puppet',
  },
  {
    id: 'tpl_always_has_been',
    title: 'Always Has Been (Astronauten im All)',
    scenario_description: 'Zwei Astronauten schweben im Orbit und blicken auf die Erde. Einer erkennt geschockt die Wahrheit, während der andere mit gezogener Pistole hinter ihm steht.',
    visual_style: 'comic',
    vibe: '200iq',
    suggested_angles: ['Verschwörungen', 'Überraschende Erkenntnisse'],
    caption_prompts: ['Warte, alles war nur 2048?'],
    example_top_text: 'Warte, die Ferien sind schon wieder vorbei?!',
    example_bottom_text: 'Always has been. 🔫👨‍🚀',
    templatePresetId: 'always_has_been',
  },
  {
    id: 'tpl_stonks',
    title: 'Stonks (Börsen-Meister)',
    scenario_description: 'Meme Man mit ernstem Gesicht im feinen Business-Anzug steht vor einer futuristischen Börsen-Kurve, die steil nach oben schießt.',
    visual_style: '3d',
    vibe: '200iq',
    suggested_angles: ['Fragwürdige Finanz- oder Taktikentscheidungen als Profit feiern'],
    caption_prompts: ['50 Cent auf dem Boden gefunden'],
    example_top_text: 'Ein 2€ Brötchen kaufen und 10 Cent Rabatt bekommen',
    example_bottom_text: 'STONKS 📈',
    templatePresetId: 'stonks',
  },
  {
    id: 'tpl_spiderman_pointing',
    title: 'Spider-Man zeigt auf Spider-Man',
    scenario_description: 'Zwei absolut identische Spider-Men in Spandex-Kostümen stehen sich hinter einem Polizeiauto gegenüber und zeigen wütend mit dem Finger aufeinander.',
    visual_style: 'comic',
    vibe: 'chaotic',
    suggested_angles: ['Doppelgänger', 'Heuchelei', 'Gegenseitige Schuldzuweisung'],
    caption_prompts: ['Zwei Leute die denselben Spickzettel nutzen'],
    example_top_text: 'Wenn zwei Leute im Test exakt dieselben falschen Antworten haben',
    example_bottom_text: 'Lehrer: "Wer hat von wem abgeschrieben?"',
    templatePresetId: 'spiderman_pointing',
  },
  {
    id: 'tpl_arthur_fist',
    title: 'Arthur\'s Fist (Geballte Faust vor Wut)',
    scenario_description: 'Nahaufnahme von Arthurs Hand im gelben Pullover, die sich vor unterdrückter, kochender Wut zu einer zitternden Faust ballt.',
    visual_style: 'comic',
    vibe: 'pain',
    suggested_angles: ['Wutausbrüche im Alltag', 'Pure Frustration'],
    caption_prompts: ['Wenn das WLAN 2 Sekunden vor dem Sieg abbricht'],
    example_top_text: 'Wenn du den 2048er Stein aus Versehen in die falsche Ecke schiebst',
    example_bottom_text: 'Innere Zerstörungswut:',
    templatePresetId: 'arthur_fist',
  },
];

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MEME-${code}`;
}

/**
 * Create a new multiplayer Meme Party Room
 */
export async function createMemeRoom(
  host: { id: string; name: string; avatar: string },
  theme: string = POPULAR_THEMES[0],
  maxRounds: number = 3,
  partyMode: import('../types').MemePartyMode = 'normal',
  captionTime: number = 60,
  familyFriendly: boolean = false
): Promise<string> {
  const roomId = generateRoomCode();
  const path = `meme_rooms/${roomId}`;

  const initialRoom: MemeRoomState = {
    id: roomId,
    hostId: host.id,
    hostName: host.name,
    partyMode,
    status: 'lobby',
    theme,
    round: 1,
    maxRounds,
    captionTime,
    familyFriendly,
    currentMemeIndex: 0,
    currentTemplate: BUILTIN_TEMPLATES[0],
    players: {
      [host.id]: {
        id: host.id,
        name: host.name,
        avatar: host.avatar,
        score: 0,
        isHost: true,
        isReady: true,
      },
    },
    submissions: {},
    votes: {},
    memeBuddies: {},
    judgingResults: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'meme_rooms', roomId), initialRoom);
    return roomId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Join an existing Meme Room
 */
export async function joinMemeRoom(
  roomId: string,
  player: { id: string; name: string; avatar: string }
): Promise<void> {
  const path = `meme_rooms/${roomId}`;
  try {
    const snap = await getDoc(doc(db, 'meme_rooms', roomId));
    if (!snap.exists()) {
      throw new Error(`Raum ${roomId} wurde nicht gefunden.`);
    }

    const roomData = snap.data() as MemeRoomState;
    const updatedPlayers = {
      ...roomData.players,
      [player.id]: {
        id: player.id,
        name: player.name,
        avatar: player.avatar,
        score: roomData.players[player.id]?.score || 0,
        isHost: roomData.hostId === player.id,
        isReady: true,
      },
    };

    await updateDoc(doc(db, 'meme_rooms', roomId), {
      players: updatedPlayers,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Add a hilarious AI bot to the room (solo play or quick party filler)
 */
export async function addBotToRoom(roomId: string): Promise<void> {
  const path = `meme_rooms/${roomId}`;
  try {
    const snap = await getDoc(doc(db, 'meme_rooms', roomId));
    if (!snap.exists()) return;
    const room = snap.data() as MemeRoomState;

    const existingBotCount = Object.values(room.players).filter((p) => p.isBot).length;
    const botProfile = BOT_NAMES[existingBotCount % BOT_NAMES.length];
    const botId = `bot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newBot: MemePlayer = {
      id: botId,
      name: botProfile.name,
      avatar: botProfile.avatar,
      score: 0,
      isHost: false,
      isReady: true,
      isBot: true,
    };

    await updateDoc(doc(db, 'meme_rooms', roomId), {
      [`players.${botId}`]: newBot,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Subscribe to real-time updates for a Meme Party Room
 */
export function subscribeToMemeRoom(
  roomId: string,
  callback: (room: MemeRoomState | null) => void
): () => void {
  const path = `meme_rooms/${roomId}`;
  const unsubscribe = onSnapshot(
    doc(db, 'meme_rooms', roomId),
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as MemeRoomState);
      } else {
        callback(null);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
    }
  );

  return unsubscribe;
}

/**
 * Update general room properties
 */
export async function updateMemeRoom(
  roomId: string,
  partial: Partial<MemeRoomState>
): Promise<void> {
  const path = `meme_rooms/${roomId}`;
  try {
    await updateDoc(doc(db, 'meme_rooms', roomId), {
      ...partial,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Submit a player's meme for the current round
 */
export async function submitMeme(
  roomId: string,
  submission: MemeSubmission
): Promise<void> {
  const path = `meme_rooms/${roomId}`;
  try {
    await updateDoc(doc(db, 'meme_rooms', roomId), {
      [`submissions.${submission.playerId}`]: submission,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Generate bot submissions automatically when submitting round starts
 */
export async function generateBotSubmissions(
  roomId: string,
  players: Record<string, MemePlayer>,
  template: MemeTemplate
): Promise<void> {
  const path = `meme_rooms/${roomId}`;
  const bots = Object.values(players).filter((p) => p.isBot);
  if (bots.length === 0) return;

  const botUpdates: Record<string, MemeSubmission> = {};
  const captionList = BOT_CAPTIONS.default;

  bots.forEach((bot, index) => {
    const caption = captionList[(index + Math.floor(Math.random() * captionList.length)) % captionList.length];
    botUpdates[`submissions.${bot.id}`] = {
      playerId: bot.id,
      playerName: bot.name,
      playerAvatar: bot.avatar,
      topText: caption.top,
      bottomText: caption.bottom,
      templateId: template.id,
      submittedAt: new Date().toISOString(),
    };
  });

  try {
    await updateDoc(doc(db, 'meme_rooms', roomId), {
      ...botUpdates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Bot submission error:', err);
  }
}

/**
 * Call MEME-MASTER AI backend to generate new original templates
 */
export async function fetchAiMemeTemplates(theme: string, count: number = 3): Promise<MemeTemplate[]> {
  try {
    const response = await fetch('/api/meme-master', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input_mode: 'TEMPLATE_GENERATOR',
        theme,
        count,
        language: 'de',
        age_rating: 'teen',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (data.status === 'success' && Array.isArray(data.templates) && data.templates.length > 0) {
      return data.templates;
    }
    return BUILTIN_TEMPLATES;
  } catch (err) {
    console.warn('Failed to fetch AI templates, using built-ins:', err);
    return BUILTIN_TEMPLATES;
  }
}

/**
 * Call MEME-MASTER AI backend to judge and roast player submissions
 */
export async function evaluateMemesWithAi(
  template: MemeTemplate,
  submissions: MemeSubmission[],
  theme: string
): Promise<MemeJudgingResult> {
  try {
    const response = await fetch('/api/meme-master', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input_mode: 'MEME_JUDGE',
        template: {
          title: template.title,
          scenario_description: template.scenario_description,
          vibe: template.vibe,
        },
        submissions: submissions.map((s) => ({
          playerId: s.playerId,
          playerName: s.playerName,
          topText: s.topText,
          bottomText: s.bottomText,
          caption: `${s.topText} — ${s.bottomText}`,
        })),
        theme,
        language: 'de',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (data.status === 'success' && Array.isArray(data.rankings)) {
      return data as MemeJudgingResult;
    }
  } catch (err) {
    console.warn('AI evaluation failed, using fallback judging:', err);
  }

  // Fallback heuristic scoring if AI offline
  const sorted = [...submissions].sort(() => Math.random() - 0.5);
  const fallbackRankings = sorted.map((s, idx) => ({
    playerId: s.playerId,
    playerName: s.playerName,
    rank: idx + 1,
    score: Math.max(60, 100 - idx * 12 + Math.floor(Math.random() * 10)),
    humor_rating: Math.max(6, 10 - idx),
    creativity: Math.max(6, 9 - idx),
    relatability: Math.max(6, 10 - idx),
    award_title: idx === 0 ? '🏆 Meme-Kaiser der Runde' : idx === 1 ? '🥈 Ehrenmann des Humors' : '🤡 Feuchter Furz Award',
    commentary: idx === 0
      ? `Stark abgeliefert! Der Gag saß wie eine Eins. Absolutes Big-Brain-Meme!`
      : `Solider Versuch mit hohem Cringe-Faktor, aber das Internet verzeiht nichts.`,
    winner: idx === 0,
  }));

  return {
    rankings: fallbackRankings,
    game_director_summary: `Runde beendet! ${sorted[0]?.playerName || 'Ein Spieler'} hat das Humor-Monopol an sich gerissen. Weiter so!`,
  };
}

/**
 * Player votes on another player's meme during judging or review phase
 * Upvote (+100 Pkt), Downvote (-50 Pkt), Superlike (+300 Pkt)
 */
export async function voteOnMeme(
  roomId: string,
  voterId: string,
  targetPlayerId: string,
  voteType: 'up' | 'down' | 'super'
): Promise<void> {
  const path = `meme_rooms/${roomId}`;
  try {
    const snap = await getDoc(doc(db, 'meme_rooms', roomId));
    if (!snap.exists()) return;
    const room = snap.data() as MemeRoomState;

    const currentVotes = room.votes || {};
    const targetVotes = currentVotes[targetPlayerId] || { upvotes: [], downvotes: [], superlikes: [] };

    // Clear existing votes from this voter on this target
    let up = (targetVotes.upvotes || []).filter((id) => id !== voterId);
    let down = (targetVotes.downvotes || []).filter((id) => id !== voterId);
    let superlike = (targetVotes.superlikes || []).filter((id) => id !== voterId);

    if (voteType === 'up') {
      up.push(voterId);
    } else if (voteType === 'down') {
      down.push(voterId);
    } else if (voteType === 'super') {
      superlike.push(voterId);
    }

    const updatedVotes = {
      ...currentVotes,
      [targetPlayerId]: {
        upvotes: up,
        downvotes: down,
        superlikes: superlike,
      },
    };

    await updateDoc(doc(db, 'meme_rooms', roomId), {
      votes: updatedVotes,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Award the single "Meme Buddy" of the round to a specific player
 */
export async function awardMemeBuddy(
  roomId: string,
  voterId: string,
  targetPlayerId: string
): Promise<void> {
  const path = `meme_rooms/${roomId}`;
  try {
    const snap = await getDoc(doc(db, 'meme_rooms', roomId));
    if (!snap.exists()) return;
    const room = snap.data() as MemeRoomState;

    const currentBuddies = room.memeBuddies || {};
    const updatedBuddies = {
      ...currentBuddies,
      [voterId]: targetPlayerId,
    };

    // Also register superlike vote
    await voteOnMeme(roomId, voterId, targetPlayerId, 'super');

    await updateDoc(doc(db, 'meme_rooms', roomId), {
      memeBuddies: updatedBuddies,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
