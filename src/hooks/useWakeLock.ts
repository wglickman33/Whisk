import { useCallback, useEffect, useState } from "react";

type WakeLockSentinel = {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: "release", listener: () => void) => void;
  removeEventListener: (type: "release", listener: () => void) => void;
};

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinel>;
  };
};

/** Module-level holder so release always targets the live sentinel, even during unmount races. */
let heldSentinel: WakeLockSentinel | null = null;
const releaseListeners = new Set<() => void>();

function notifyReleaseListeners() {
  releaseListeners.forEach((listener) => listener());
}

export function isWakeLockSupported(): boolean {
  return typeof navigator !== "undefined" && "wakeLock" in navigator;
}

export function getHeldWakeLockSentinel(): WakeLockSentinel | null {
  return heldSentinel;
}

export async function releaseScreenWakeLock(): Promise<void> {
  const sentinel = heldSentinel;
  heldSentinel = null;
  if (!sentinel || sentinel.released) {
    notifyReleaseListeners();
    return;
  }
  try {
    await sentinel.release();
  } catch {
    /* already released or document inactive */
  }
  notifyReleaseListeners();
}

export async function requestScreenWakeLock(): Promise<boolean> {
  const nav = navigator as WakeLockNavigator;
  if (!nav.wakeLock) return false;

  await releaseScreenWakeLock();

  try {
    const sentinel = await nav.wakeLock.request("screen");
    heldSentinel = sentinel;
    sentinel.addEventListener("release", () => {
      if (heldSentinel === sentinel) heldSentinel = null;
      notifyReleaseListeners();
    });
    return true;
  } catch {
    heldSentinel = null;
    notifyReleaseListeners();
    return false;
  }
}

export function useWakeLock() {
  const [enabled, setEnabled] = useState(false);
  const [supported] = useState(isWakeLockSupported);

  const syncFromHeld = useCallback(() => {
    setEnabled(heldSentinel != null && !heldSentinel.released);
  }, []);

  const enable = useCallback(async () => {
    const acquired = await requestScreenWakeLock();
    setEnabled(acquired);
    return acquired;
  }, []);

  const disable = useCallback(async () => {
    await releaseScreenWakeLock();
    setEnabled(false);
  }, []);

  const toggle = useCallback(async () => {
    if (getHeldWakeLockSentinel()) {
      await disable();
      return false;
    }
    return enable();
  }, [disable, enable]);

  useEffect(() => {
    releaseListeners.add(syncFromHeld);
    return () => {
      releaseListeners.delete(syncFromHeld);
    };
  }, [syncFromHeld]);

  useEffect(() => {
    const onPageHide = () => {
      void releaseScreenWakeLock();
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, []);

  useEffect(() => {
    return () => {
      void releaseScreenWakeLock();
    };
  }, []);

  return {
    supported,
    enabled,
    enable,
    disable,
    toggle,
    release: disable,
  };
}
