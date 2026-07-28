export type HashAlgorithm = "SHA-256" | "SHA-512";

export async function hashText(text: string, algorithm: HashAlgorithm): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buffer = await crypto.subtle.digest(algorithm, data);
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashFile(file: File, algorithm: HashAlgorithm): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest(algorithm, buffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
