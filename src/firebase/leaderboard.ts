import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './config';
import { GridSize } from '../types';

export interface LeaderboardRecord {
  id: string;
  userId: string;
  displayName: string;
  photoURL?: string;
  score: number;
  highestTile: number;
  moves: number;
  gridSize: GridSize;
  createdAt: string;
}

export const ADMIN_EMAILS = [
  'l.mueller2@emagym.de',
  'leopoldremscheid@icloud.com',
];

export function isUserCheatAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return ADMIN_EMAILS.some((admin) => admin.toLowerCase() === normalized);
}

/**
 * Save or update player's high score for a specific grid size
 */
export async function submitLeaderboardScore(
  gridSize: GridSize,
  score: number,
  highestTile: number,
  moves: number
): Promise<void> {
  const user = auth.currentUser;
  if (!user) return; // not logged in

  const entryId = `${user.uid}_grid_${gridSize}`;
  const path = `leaderboard/${entryId}`;

  const record: LeaderboardRecord = {
    id: entryId,
    userId: user.uid,
    displayName: user.displayName || user.email?.split('@')[0] || 'Spieler',
    photoURL: user.photoURL || '',
    score,
    highestTile,
    moves,
    gridSize,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'leaderboard', entryId), record, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Subscribe to real-time top leaderboard scores for a given grid size
 */
export function subscribeToLeaderboard(
  gridSize: GridSize,
  callback: (records: LeaderboardRecord[]) => void
): () => void {
  const path = 'leaderboard';
  const q = query(
    collection(db, path),
    where('gridSize', '==', gridSize),
    orderBy('score', 'desc'),
    limit(25)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const records: LeaderboardRecord[] = [];
      snapshot.forEach((docSnap) => {
        records.push(docSnap.data() as LeaderboardRecord);
      });
      callback(records);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
    }
  );

  return unsubscribe;
}
