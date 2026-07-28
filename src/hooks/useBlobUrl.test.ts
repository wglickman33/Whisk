import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBlobUrl } from "./useBlobUrl";

describe("useBlobUrl", () => {
  beforeEach(() => {
    vi.spyOn(URL, "createObjectURL").mockImplementation(() => "blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("revokes on replace", () => {
    const { result } = renderHook(() => useBlobUrl("blob:first"));
    act(() => result.current.setUrl("blob:second"));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:first");
  });

  it("revokes on unmount", () => {
    const { result, unmount } = renderHook(() => useBlobUrl("blob:test"));
    act(() => result.current.setUrl("blob:test"));
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");
  });
});
