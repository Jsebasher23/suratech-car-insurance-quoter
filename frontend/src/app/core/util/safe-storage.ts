/** Web Storage wrapper that never throws (private mode, disabled storage, SSR). */
export function safeStorage(getStorage: () => Storage | undefined | null) {
  return {
    get(key: string): string | null {
      try {
        return getStorage()?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
    set(key: string, value: string): void {
      try {
        getStorage()?.setItem(key, value);
      } catch {
        /* quota or disabled storage: state stays in memory */
      }
    },
    remove(key: string): void {
      try {
        getStorage()?.removeItem(key);
      } catch {
        /* ignore */
      }
    },
  };
}
