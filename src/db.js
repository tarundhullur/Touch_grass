const databaseName = 'touch-grass-field-notes';
const storeName = 'missions';
let databasePromise;

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function openDatabase() {
  if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB is unavailable'));
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(storeName, { keyPath: 'id' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return databasePromise;
}

async function putMission(mission) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    transaction.objectStore(storeName).put(mission);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function listMissions() {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(storeName, 'readonly').objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result.sort((left, right) => (right.completedAt ?? right.createdAt) - (left.completedAt ?? left.createdAt)));
    request.onerror = () => reject(request.error);
  });
}

export async function saveReadyMission(mission) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => {
      request.result.forEach((entry) => {
        if (entry.status === 'ready' && entry.id !== mission.id) store.put({ ...entry, status: 'archived' });
      });
      store.put({ ...mission, status: 'ready', createdAt: Date.now() });
    };
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function completeMission(id, details = {}) {
  const database = await openDatabase();
  const existing = await new Promise((resolve, reject) => {
    const request = database.transaction(storeName, 'readonly').objectStore(storeName).get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  if (!existing) throw new Error('Mission was not found in local storage');
  return putMission({ ...existing, ...details, status: 'completed', completedAt: Date.now() });
}

export function summarizeMissions(missions) {
  const completed = missions.filter((mission) => mission.status === 'completed');
  const dates = new Set(completed.map((mission) => localDateKey(new Date(mission.completedAt))));
  const cursor = new Date();
  if (!dates.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (dates.has(localDateKey(cursor))) { streak += 1; cursor.setDate(cursor.getDate() - 1); }
  return { completedCount: completed.length, placesNoted: completed.filter((mission) => mission.location).length, streak };
}