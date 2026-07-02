import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc, onSnapshot, setDoc, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

export const handleFirestoreError = (error: any, operation: FirestoreErrorInfo['operationType'], path: string | null) => {
  if (error?.message?.includes('permission') || error?.code === 'permission-denied') {
    const user = auth.currentUser;
    const errorInfo: FirestoreErrorInfo = {
      error: error.message,
      operationType: operation,
      path,
      authInfo: {
        userId: user?.uid || 'anonymous',
        email: user?.email || 'none',
        emailVerified: user?.emailVerified || false,
        isAnonymous: !user,
        providerInfo: user?.providerData.map(p => ({
          providerId: p.providerId,
          displayName: p.displayName || '',
          email: p.email || ''
        })) || []
      }
    };
    throw new Error(JSON.stringify(errorInfo));
  }
  throw error;
};

export { onAuthStateChanged, onSnapshot };
export type { User };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    console.warn("Firestore offline persistence failed to enable:", err.code);
  });
}

export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export const ADMIN_EMAIL = 'melonaedu391@gmail.com';

export const isUserAdmin = (user: User | null) => {
  if (!user?.email) return false;
  return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
};

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

// Song Management
export const getSongs = () => {
  const songsRef = collection(db, 'songs');
  return query(songsRef, orderBy('addedAt', 'desc'));
};

// Helper for generic file upload
const uploadFileToStorage = async (path: string, file: File, onProgress?: (p: number) => void): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => {
          console.error(`Upload error at ${path}:`, error);
          if (error.code === 'storage/unauthorized') {
            reject(new Error('የመጫን ፈቃድ የሎትም (Permission Denied)። እባክዎ እንደ አስተዳዳሪ መግባትዎን ያረጋግጡ።'));
          } else if (error.code === 'storage/quota-exceeded') {
            reject(new Error('የStorage ቦታ አልቋል (Quota Exceeded)።'));
          } else {
            reject(new Error(`መጫን አልተቻለም፦ ${error.message}`));
          }
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (err: any) {
            reject(new Error('የፋይሉን ሊንክ ማግኘት አልተቻለም (URL Error)።'));
          }
        }
      );
    } catch (err: any) {
      reject(err);
    }
  });
};

export const uploadAudio = async (file: File, onProgress?: (p: number) => void) => {
  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  return uploadFileToStorage(`songs/${fileName}`, file, onProgress);
};

export const addSongData = async (songData: any) => {
  try {
    const songsRef = collection(db, 'songs');
    return await addDoc(songsRef, songData);
  } catch (error) {
    handleFirestoreError(error, 'create', 'songs');
  }
};

export const updateSongData = async (id: string, data: any) => {
  try {
    const songRef = doc(db, 'songs', id);
    return await updateDoc(songRef, data);
  } catch (error) {
    handleFirestoreError(error, 'update', `songs/${id}`);
  }
};

export const deleteSongData = async (id: string) => {
  try {
    const songRef = doc(db, 'songs', id);
    return await deleteDoc(songRef);
  } catch (error) {
    handleFirestoreError(error, 'delete', `songs/${id}`);
  }
};

// Branding Management
export const getBranding = () => doc(db, 'settings', 'branding');

export const updateBranding = async (data: any) => {
  try {
    const brandingRef = doc(db, 'settings', 'branding');
    return await setDoc(brandingRef, data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, 'update', 'settings/branding');
  }
};

export const uploadLogo = async (file: File, onProgress?: (p: number) => void) => {
  const fileName = `logo-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  return uploadFileToStorage(`branding/${fileName}`, file, onProgress);
};
