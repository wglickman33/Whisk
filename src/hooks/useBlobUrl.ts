import { useState, useEffect, useCallback, useRef } from "react";

export function useBlobUrl(initial: string | null = null) {
  const [url, setUrlState] = useState<string | null>(initial);
  const urlRef = useRef<string | null>(initial);

  const revoke = useCallback((target: string | null) => {
    if (target) URL.revokeObjectURL(target);
  }, []);

  const setUrl = useCallback(
    (next: string | null) => {
      if (urlRef.current && urlRef.current !== next) {
        revoke(urlRef.current);
      }
      urlRef.current = next;
      setUrlState(next);
    },
    [revoke]
  );

  const clear = useCallback(() => setUrl(null), [setUrl]);

  useEffect(() => {
    return () => revoke(urlRef.current);
  }, [revoke]);

  return { url, setUrl, clear };
}
