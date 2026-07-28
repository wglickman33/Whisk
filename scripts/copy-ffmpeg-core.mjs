import { cpSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = join(root, "node_modules/@ffmpeg/core/dist/esm");
const targetDir = join(root, "public/ffmpeg");

const files = ["ffmpeg-core.js", "ffmpeg-core.wasm"];

if (!existsSync(sourceDir)) {
  console.warn("[copy-ffmpeg-core] @ffmpeg/core not found — skip");
  process.exit(0);
}

mkdirSync(targetDir, { recursive: true });

for (const file of files) {
  cpSync(join(sourceDir, file), join(targetDir, file));
}

console.log("[copy-ffmpeg-core] copied FFmpeg core to public/ffmpeg/");
