type QueueItem = {
  id: string;
  endpoint: string;
  payload: any;
  createdAt: string;
};

const KEY = 'offlineQueue_v1';

function readQueue(): QueueItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(items: QueueItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export const offlineQueue = {
  enqueue(endpoint: string, payload: any) {
    const items = readQueue();
    items.push({ id: crypto.randomUUID?.() || String(Date.now()), endpoint, payload, createdAt: new Date().toISOString() });
    writeQueue(items);
  },
  peekAll(): QueueItem[] {
    return readQueue();
  },
  clear() {
    writeQueue([]);
  },
  remove(id: string) {
    writeQueue(readQueue().filter(i => i.id !== id));
  }
}; 