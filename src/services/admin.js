import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function isAdmin(uid) {
  if (!db || !uid) return false;
  const snap = await getDoc(doc(db, 'admins', uid));
  return snap.exists() && snap.data()?.active !== false;
}
