// lib/updateBus.ts
type Listener = (iso: string | null) => void;

let lastISO: string | null = null;
const listeners = new Set<Listener>();

export function setLastUpdate(iso: string | null) {
  lastISO = iso;
  for (const fn of listeners) fn(lastISO);
}

export function getLastUpdate(): string | null {
  return lastISO;
}

export function onLastUpdate(fn: Listener) {
  listeners.add(fn);
  // ให้ค่าเริ่มต้นทันทีถ้ามี
  fn(lastISO);
  return () => listeners.delete(fn);
}
