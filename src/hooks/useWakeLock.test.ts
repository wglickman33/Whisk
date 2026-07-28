import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  isWakeLockSupported,
  useWakeLock,
  releaseScreenWakeLock,
  requestScreenWakeLock,
  getHeldWakeLockSentinel,
} from "./useWakeLock";

describe("isWakeLockSupported", () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, "wakeLock");
  });

  it("returns true when wakeLock API exists", () => {
    Object.defineProperty(navigator, "wakeLock", {
      configurable: true,
      value: { request: vi.fn() },
    });
    expect(isWakeLockSupported()).toBe(true);
  });

  it("returns false when wakeLock API is missing", () => {
    Reflect.deleteProperty(navigator, "wakeLock");
    expect(isWakeLockSupported()).toBe(false);
  });
});

describe("screen wake lock helpers", () => {
  let releaseMock: ReturnType<typeof vi.fn>;
  let requestMock: ReturnType<typeof vi.fn>;
  let sentinel: {
    released: boolean;
    release: ReturnType<typeof vi.fn>;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    await releaseScreenWakeLock();
    releaseMock = vi.fn().mockImplementation(async () => {
      sentinel.released = true;
    });
    sentinel = {
      released: false,
      release: releaseMock,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    requestMock = vi.fn().mockResolvedValue(sentinel);
    Object.defineProperty(navigator, "wakeLock", {
      configurable: true,
      value: { request: requestMock },
    });
  });

  afterEach(async () => {
    await releaseScreenWakeLock();
    Reflect.deleteProperty(navigator, "wakeLock");
    vi.restoreAllMocks();
  });

  it("requests and holds a screen wake lock", async () => {
    const acquired = await requestScreenWakeLock();
    expect(acquired).toBe(true);
    expect(requestMock).toHaveBeenCalledWith("screen");
    expect(getHeldWakeLockSentinel()).toBe(sentinel);
  });

  it("releases the held wake lock", async () => {
    await requestScreenWakeLock();
    await releaseScreenWakeLock();
    expect(releaseMock).toHaveBeenCalled();
    expect(getHeldWakeLockSentinel()).toBeNull();
  });

  it("does not re-acquire after release when tab becomes visible", async () => {
    await requestScreenWakeLock();
    await releaseScreenWakeLock();
    requestMock.mockClear();

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });

    document.dispatchEvent(new Event("visibilitychange"));
    expect(requestMock).not.toHaveBeenCalled();
  });
});

describe("useWakeLock", () => {
  let releaseMock: ReturnType<typeof vi.fn>;
  let requestMock: ReturnType<typeof vi.fn>;
  let sentinel: {
    released: boolean;
    release: ReturnType<typeof vi.fn>;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    await releaseScreenWakeLock();
    releaseMock = vi.fn().mockImplementation(async () => {
      sentinel.released = true;
    });
    sentinel = {
      released: false,
      release: releaseMock,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    requestMock = vi.fn().mockResolvedValue(sentinel);
    Object.defineProperty(navigator, "wakeLock", {
      configurable: true,
      value: { request: requestMock },
    });
  });

  afterEach(async () => {
    await releaseScreenWakeLock();
    Reflect.deleteProperty(navigator, "wakeLock");
    vi.restoreAllMocks();
  });

  it("acquires lock when enabled", async () => {
    const { result } = renderHook(() => useWakeLock());

    await act(async () => {
      await result.current.enable();
    });

    expect(requestMock).toHaveBeenCalledWith("screen");
    expect(result.current.enabled).toBe(true);
  });

  it("releases lock when disabled", async () => {
    const { result } = renderHook(() => useWakeLock());

    await act(async () => {
      await result.current.enable();
    });

    await act(async () => {
      await result.current.disable();
    });

    expect(releaseMock).toHaveBeenCalled();
    expect(result.current.enabled).toBe(false);
    expect(getHeldWakeLockSentinel()).toBeNull();
  });

  it("toggles on and off", async () => {
    const { result } = renderHook(() => useWakeLock());

    await act(async () => {
      await result.current.toggle();
    });
    expect(result.current.enabled).toBe(true);

    await act(async () => {
      await result.current.toggle();
    });
    expect(result.current.enabled).toBe(false);
    expect(releaseMock).toHaveBeenCalled();
  });

  it("releases on unmount", async () => {
    const { result, unmount } = renderHook(() => useWakeLock());

    await act(async () => {
      await result.current.enable();
    });

    unmount();
    await waitFor(() => expect(releaseMock).toHaveBeenCalled());
    expect(getHeldWakeLockSentinel()).toBeNull();
  });

  it("releases on pagehide", async () => {
    const { result } = renderHook(() => useWakeLock());

    await act(async () => {
      await result.current.enable();
    });

    await act(async () => {
      window.dispatchEvent(new Event("pagehide"));
    });

    await waitFor(() => expect(releaseMock).toHaveBeenCalled());
    expect(getHeldWakeLockSentinel()).toBeNull();
  });

  it("reports unsupported when API is missing", async () => {
    Reflect.deleteProperty(navigator, "wakeLock");
    const { result } = renderHook(() => useWakeLock());

    expect(result.current.supported).toBe(false);

    await act(async () => {
      await result.current.enable();
    });

    expect(result.current.enabled).toBe(false);
  });
});
