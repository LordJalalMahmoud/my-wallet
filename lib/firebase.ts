import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { AppState, IncomeRecord, ExpenseRecord, LiabilityRecord, ReceivableRecord, FinancialGoal } from './types';

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Types
export interface FirebaseUserContext {
  user: User | null;
  loading: boolean;
}

// Subscribe to Auth state
export function subscribeToAuth(onUserChanged: (user: User | null) => void) {
  return onAuthStateChanged(auth, (user) => {
    onUserChanged(user);
  });
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function logoutUser() {
  return signOut(auth);
}

// Firestore Realtime Subscription for All Collections of a User
export function subscribeToUserData(
  userId: string,
  onData: (data: Partial<AppState>) => void
) {
  if (!userId) return () => {};

  const unsubscribers: Array<() => void> = [];

  // 1. User Settings
  const userDocRef = doc(db, 'users', userId);
  const unsubUser = onSnapshot(userDocRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      onData({
        currency: data.currency || 'ج.م',
        dailyTargetEarnings: typeof data.dailyTargetEarnings === 'number' ? data.dailyTargetEarnings : 350,
      });
    } else {
      // Initialize default user doc
      setDoc(userDocRef, {
        currency: 'ج.م',
        dailyTargetEarnings: 350,
        createdAt: new Date().toISOString(),
      }).catch(console.error);
    }
  });
  unsubscribers.push(unsubUser);

  // Helper for collection queries
  const setupCollectionSub = <T extends { id: string }>(
    colName: 'incomes' | 'expenses' | 'liabilities' | 'receivables' | 'goals',
    stateKey: keyof AppState
  ) => {
    const q = query(collection(db, colName), where('userId', '==', userId));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const items: T[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            ...d,
          } as unknown as T;
        });
        // Sort newest first
        items.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        onData({ [stateKey]: items });
      },
      (error) => {
        console.error(`Error in ${colName} subscription:`, error);
      }
    );
    unsubscribers.push(unsub);
  };

  setupCollectionSub<IncomeRecord>('incomes', 'incomes');
  setupCollectionSub<ExpenseRecord>('expenses', 'expenses');
  setupCollectionSub<LiabilityRecord>('liabilities', 'liabilities');
  setupCollectionSub<ReceivableRecord>('receivables', 'receivables');
  setupCollectionSub<FinancialGoal>('goals', 'goals');

  return () => {
    unsubscribers.forEach((u) => u());
  };
}

// Helper to recursively remove properties with undefined values (Firestore SDK rejects undefined)
function cleanUndefinedData<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefinedData) as unknown as T;
  }
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = typeof value === 'object' && value !== null ? cleanUndefinedData(value) : value;
    }
  }
  return cleaned;
}

// Firestore CRUD operations
export async function addFirestoreDoc(
  colName: 'incomes' | 'expenses' | 'liabilities' | 'receivables' | 'goals',
  userId: string,
  data: any
) {
  const docRef = doc(collection(db, colName));
  const newRecord = cleanUndefinedData({
    ...data,
    userId,
    createdAt: new Date().toISOString(),
  });
  await setDoc(docRef, newRecord);
  return docRef.id;
}

export async function updateFirestoreDoc(
  colName: 'incomes' | 'expenses' | 'liabilities' | 'receivables' | 'goals',
  docId: string,
  data: any
) {
  const docRef = doc(db, colName, docId);
  const cleanedData = cleanUndefinedData(data);
  await updateDoc(docRef, cleanedData);
}

export async function deleteFirestoreDoc(
  colName: 'incomes' | 'expenses' | 'liabilities' | 'receivables' | 'goals',
  docId: string
) {
  const docRef = doc(db, colName, docId);
  await deleteDoc(docRef);
}

export async function updateUserSettings(
  userId: string,
  settings: { currency?: string; dailyTargetEarnings?: number }
) {
  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, cleanUndefinedData(settings));
}

export async function clearAllUserData(userId: string) {
  if (!userId) return;
  const cols: Array<'incomes' | 'expenses' | 'liabilities' | 'receivables' | 'goals'> = [
    'incomes',
    'expenses',
    'liabilities',
    'receivables',
    'goals',
  ];

  for (const colName of cols) {
    const q = query(collection(db, colName), where('userId', '==', userId));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  }
}
