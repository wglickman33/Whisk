import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import workerUrl from "@ffmpeg/ffmpeg/worker?worker&url";

let instance: FFmpeg | null = null;
let loading: Promise<FFmpeg> | null = null;

/** Self-hosted from public/ffmpeg/ (copied on postinstall from @ffmpeg/core). */
const FFMPEG_CORE_BASE = `${import.meta.env.BASE_URL}ffmpeg`;

export async function getFFmpeg(
  onProgress?: (progress: number) => void
): Promise<FFmpeg> {
  if (instance) return instance;
  if (loading) return loading;

  loading = (async () => {
    const ffmpeg = new FFmpeg();

    if (onProgress) {
      ffmpeg.on("progress", ({ progress }) => onProgress(progress));
    }

    await ffmpeg.load({
      classWorkerURL: new URL(workerUrl, import.meta.url).toString(),
      coreURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
    });

    instance = ffmpeg;
    return ffmpeg;
  })();

  return loading;
}

export { fetchFile };
