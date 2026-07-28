export interface Base64Result {
  ok: boolean;
  output?: string;
  error?: string;
}

export function encodeTextToBase64(text: string): Base64Result {
  if (!text) {
    return { ok: false, error: "Enter some text first." };
  }
  try {
    return { ok: true, output: btoa(unescape(encodeURIComponent(text))) };
  } catch {
    return { ok: false, error: "Could not encode this text." };
  }
}

export function decodeBase64ToText(input: string): Base64Result {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: "Paste a Base64 string first." };
  }
  try {
    const decoded = decodeURIComponent(escape(atob(trimmed)));
    return { ok: true, output: decoded };
  } catch {
    return { ok: false, error: "This does not look like valid Base64." };
  }
}

export async function fileToBase64(file: File): Promise<Base64Result> {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunk = 8192;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return { ok: true, output: btoa(binary) };
  } catch {
    return { ok: false, error: "Could not read this file." };
  }
}

export function base64ToBlob(base64: string, mimeType: string): Base64Result {
  const trimmed = base64.trim();
  if (!trimmed) {
    return { ok: false, error: "Paste a Base64 string first." };
  }
  try {
    const binary = atob(trimmed);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: mimeType });
    return { ok: true, output: URL.createObjectURL(blob) };
  } catch {
    return { ok: false, error: "This does not look like valid Base64." };
  }
}
