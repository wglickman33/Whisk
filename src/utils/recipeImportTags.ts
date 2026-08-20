export function matchRecipeImportTags(
  allTags: { id: string; label: string }[],
  labels: string[] | undefined
): { matchedIds: string[]; pendingLabels: string[] } {
  const matchedIds: string[] = [];
  const pendingLabels: string[] = [];
  if (!labels?.length) return { matchedIds, pendingLabels };

  const byLabel = new Map(allTags.map((tag) => [tag.label.trim().toLowerCase(), tag.id]));
  const seenPending = new Set<string>();

  for (const raw of labels) {
    const label = raw.trim();
    if (!label) continue;
    const key = label.toLowerCase();
    const existingId = byLabel.get(key);
    if (existingId) {
      if (!matchedIds.includes(existingId)) matchedIds.push(existingId);
      continue;
    }
    if (seenPending.has(key)) continue;
    seenPending.add(key);
    pendingLabels.push(label);
  }

  return { matchedIds, pendingLabels };
}
