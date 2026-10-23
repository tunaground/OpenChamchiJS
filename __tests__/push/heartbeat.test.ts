import { sendLeftBeacon, isActivelyViewing } from "@/lib/hooks/useThreadViewingHeartbeat";

describe("sendLeftBeacon", () => {
  it("sends a plain string body", () => {
    const sendBeacon = jest.fn().mockReturnValue(true);
    Object.assign(global, { navigator: { sendBeacon } });
    sendLeftBeacon("/api/push/viewing/1");
    expect(sendBeacon).toHaveBeenCalledWith("/api/push/viewing/1", JSON.stringify({ viewing: false }));
  });

  it("does not throw when sendBeacon throws", () => {
    Object.assign(global, {
      navigator: { sendBeacon: jest.fn(() => { throw new TypeError("blocked"); }) },
    });
    expect(() => sendLeftBeacon("/api/push/viewing/1")).not.toThrow();
  });
});

describe("isActivelyViewing", () => {
  const doc = (visibilityState: string, focused: boolean) =>
    ({ visibilityState, hasFocus: () => focused }) as unknown as Document;

  it("is true when the page is visible and focused", () => {
    expect(isActivelyViewing(doc("visible", true))).toBe(true);
  });

  it("is false when the page is visible but another app has focus", () => {
    expect(isActivelyViewing(doc("visible", false))).toBe(false);
  });

  it("is false when the page is hidden", () => {
    expect(isActivelyViewing(doc("hidden", true))).toBe(false);
  });
});
