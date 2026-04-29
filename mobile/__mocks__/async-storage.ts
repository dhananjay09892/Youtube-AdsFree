// In-memory mock of AsyncStorage for unit tests.
const store = new Map<string, string>();

const AsyncStorageMock = {
  getItem: async (key: string): Promise<string | null> => {
    return store.has(key) ? (store.get(key) as string) : null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    store.set(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    store.delete(key);
  },
  clear: async (): Promise<void> => {
    store.clear();
  },
};

export default AsyncStorageMock;
