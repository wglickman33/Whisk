export function generateUuids(count: number): string[] {
  const n = Math.min(Math.max(Math.floor(count), 1), 100);
  return Array.from({ length: n }, () => crypto.randomUUID());
}
