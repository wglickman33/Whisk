export interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  lines: number;
  sentences: number;
  paragraphs: number;
}

export function countText(input: string): TextStats {
  const characters = input.length;
  const charactersNoSpaces = input.replace(/\s/g, "").length;
  const trimmed = input.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const lines = input.length === 0 ? 0 : input.split(/\r?\n/).length;
  const sentences =
    trimmed.length === 0
      ? 0
      : (trimmed.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? []).filter((s) => s.trim()).length;
  const paragraphs =
    trimmed.length === 0 ? 0 : trimmed.split(/\n\s*\n/).filter((p) => p.trim()).length;

  return { characters, charactersNoSpaces, words, lines, sentences, paragraphs };
}
