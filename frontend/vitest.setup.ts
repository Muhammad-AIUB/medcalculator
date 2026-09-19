/**
 * Gives the Node test environment a working localStorage.
 *
 * ui.store persists through zustand's `createJSONStorage(() => localStorage)`.
 * Whether that global exists depends on the Node version, not on anything this
 * project controls: on Node 20 it is undefined, so persist quietly disabled
 * itself and the history tests passed while exercising none of the persistence;
 * on Node 25 a global appears that has no setItem, and every one of those tests
 * died with "storage.setItem is not a function". Capacitor 8 needs Node >= 22,
 * so the runtime moved and the difference started to matter.
 *
 * A small in-memory Storage pins the behaviour to one thing on every version,
 * and the store is now actually written through rather than skipped.
 */
class MemoryStorage implements Storage {
  private map = new Map<string, string>()

  get length(): number {
    return this.map.size
  }

  clear(): void {
    this.map.clear()
  }

  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) as string) : null
  }

  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null
  }

  removeItem(key: string): void {
    this.map.delete(key)
  }

  setItem(key: string, value: string): void {
    this.map.set(key, String(value))
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  value: new MemoryStorage(),
  configurable: true,
  writable: true,
})
