import {
  collection,
  doc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './config';
import { isUserCheatAdmin } from './leaderboard';

export interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  photoURL?: string;
  text: string;
  channel: string;
  createdAt: string;
  isAdmin?: boolean;
}

/**
 * Send a message to a specific room/channel
 */
export async function sendChatMessage(channel: string, text: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Du musst angemeldet sein, um im Chat zu schreiben.');
  }

  const trimmed = text.trim();
  if (!trimmed) return;

  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const path = `chat_messages/${messageId}`;

  const message: ChatMessage = {
    id: messageId,
    userId: user.uid,
    displayName: user.displayName || user.email?.split('@')[0] || 'Spieler',
    photoURL: user.photoURL || '',
    text: trimmed.slice(0, 1000),
    channel,
    createdAt: new Date().toISOString(),
    isAdmin: isUserCheatAdmin(user.email),
  };

  try {
    await setDoc(doc(db, 'chat_messages', messageId), message);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

/**
 * Real-time subscription to messages in a specific channel
 */
export function subscribeToChatChannel(
  channel: string,
  callback: (messages: ChatMessage[]) => void
): () => void {
  const path = 'chat_messages';
  const q = query(
    collection(db, path),
    where('channel', '==', channel),
    orderBy('createdAt', 'asc'),
    limit(80)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        messages.push(docSnap.data() as ChatMessage);
      });
      callback(messages);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
    }
  );

  return unsubscribe;
}
