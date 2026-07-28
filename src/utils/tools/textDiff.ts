export type DiffLineType = "same" | "add" | "remove";

export interface DiffLine {
  type: DiffLineType;
  text: string;
}

export function diffLines(original: string, revised: string): DiffLine[] {
  const a = original.split(/\r?\n/);
  const b = revised.split(/\r?\n/);
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const stack: DiffLine[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      stack.push({ type: "same", text: a[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: "add", text: b[j - 1] });
      j--;
    } else {
      stack.push({ type: "remove", text: a[i - 1] });
      i--;
    }
  }

  return stack.reverse();
}

export function formatDiffText(lines: DiffLine[]): string {
  return lines
    .map((line) => {
      if (line.type === "same") return `  ${line.text}`;
      if (line.type === "add") return `+ ${line.text}`;
      return `- ${line.text}`;
    })
    .join("\n");
}

export function diffSummary(lines: DiffLine[]): { added: number; removed: number; unchanged: number } {
  return lines.reduce(
    (acc, line) => {
      if (line.type === "add") acc.added++;
      else if (line.type === "remove") acc.removed++;
      else acc.unchanged++;
      return acc;
    },
    { added: 0, removed: 0, unchanged: 0 }
  );
}
