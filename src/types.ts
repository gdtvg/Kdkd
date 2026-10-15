export type GridSize = 3 | 4 | 5 | 6;

export type GameMode = 'classic' | 'endless' | 'time_attack';

export type VisualTheme = 'cyberpunk' | 'classic' | 'midnight' | 'frost';

export type CameraPreset = 'iso' | 'topdown' | 'cinematic';

export interface TileData {
  id: string;
  value: number;
  row: number;
  col: number;
  prevRow?: number;
  prevCol?: number;
  isNew?: boolean;
  justMerged?: boolean;
}

export interface BoardState {
  gridSize: GridSize;
  tiles: TileData[];
  score: number;
  bestScore: number;
  moves: number;
  gameOver: boolean;
  won: boolean;
  hasWonAcknowledged: boolean;
  timeRemaining?: number; // for time_attack mode
}

export type MoveDirection = 'up' | 'down' | 'left' | 'right';

export type CheatAction = 'hammer' | 'spawn' | 'double' | 'shuffle' | 'undo' | 'hint' | 'god_mode';

export interface ThemeColors {
  name: VisualTheme;
  label: string;
  background: number;
  bgCss: string;
  boardBase: number;
  boardRim: number;
  cellSlot: number;
  ambientLight: number;
  keyLight: number;
  tilePalette: Record<number, { bg: string; text: string; emissive?: string; metalness?: number; roughness?: number }>;
}

// ========================
// MEME-MASTER Party Game Types
// ========================

export type AppMode = '2048' | 'meme_party';

export interface MemeTemplate {
  id: string;
  title: string;
  scenario_description: string;
  visual_style?: string;
  vibe?: string;
  suggested_angles?: string[];
  caption_prompts?: string[];
  example_top_text?: string;
  example_bottom_text?: string;
  templatePresetId?: string; // e.g. 'drake', 'distracted_bf', 'two_buttons', 'buff_doge', 'expanding_brain', etc.
}

export type MemeTextStyle = 'impact' | 'modern' | 'subtitle';

export interface MemeSubmission {
  playerId: string;
  playerName: string;
  playerAvatar?: string;
  topText: string;
  bottomText: string;
  textStyle?: MemeTextStyle;
  templateId?: string;
  submittedAt: string;
}

export interface MemeRanking {
  playerId: string;
  playerName: string;
  rank: number;
  score: number;
  humor_rating?: number;
  creativity?: number;
  relatability?: number;
  award_title: string;
  commentary: string;
  winner: boolean;
}

export interface MemeJudgingResult {
  rankings: MemeRanking[];
  game_director_summary: string;
}

export interface MemePlayer {
  id: string;
  name: string;
  avatar: string;
  score: number;
  isHost: boolean;
  isReady: boolean;
  isBot?: boolean;
}

export type MemePartyMode = 'normal' | 'same_meme' | 'relaxed' | 'topics';
export type MemeGameStatus = 'lobby' | 'submitting' | 'judging' | 'results' | 'ended';

export interface MemeVoteRecord {
  upvotes: string[]; // playerIds who upvoted
  downvotes: string[]; // playerIds who downvoted
  superlikes: string[]; // playerIds who superliked / meme buddies
}

export interface MemeRoomState {
  id: string;
  hostId: string;
  hostName: string;
  partyMode?: MemePartyMode;
  status: MemeGameStatus;
  theme: string;
  round: number;
  maxRounds: number;
  captionTime?: number; // in seconds (e.g. 60, 90, 120)
  familyFriendly?: boolean;
  currentTemplate: MemeTemplate | null;
  players: Record<string, MemePlayer>;
  submissions: Record<string, MemeSubmission>;
  votes?: Record<string, MemeVoteRecord>; // keyed by target playerId
  memeBuddies?: Record<string, string>; // voterId -> targetPlayerId
  currentMemeIndex?: number; // index of meme being presented in judging round
  judgingResults: MemeJudgingResult | null;
  roundTimeRemaining?: number;
  createdAt: string;
  updatedAt: string;
}
