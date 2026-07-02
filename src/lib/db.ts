import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'MezmurHubDB';
const STORE_NAME = 'songs';
const DB_VERSION = 1;

export interface Song {
  id: string;
  title: string;
  artist: string;
  category: 'mezmur' | 'kidasie' | 'zema';
  duration: string;
  blob: Blob;
  type: string;
  isFavorite: boolean;
  isFeatured: boolean;
  lyrics?: string;
  addedAt: number;
}

let dbPromise: Promise<IDBPDatabase>;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

export const saveSong = async (song: Song) => {
  const db = await initDB();
  return db.put(STORE_NAME, song);
};

export const getAllSongs = async (): Promise<Song[]> => {
  const db = await initDB();
  return db.getAll(STORE_NAME);
};

export const toggleFavorite = async (id: string) => {
  const db = await initDB();
  const song = await db.get(STORE_NAME, id);
  if (song) {
    song.isFavorite = !song.isFavorite;
    await db.put(STORE_NAME, song);
  }
  return song;
};

export const updateSong = async (song: Song) => {
  const db = await initDB();
  return db.put(STORE_NAME, song);
};

export const deleteSong = async (id: string) => {
  const db = await initDB();
  return db.delete(STORE_NAME, id);
};
