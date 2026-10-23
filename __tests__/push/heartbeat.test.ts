import { sendLeftBeacon } from "@/lib/hooks/useThreadViewingHeartbeat";

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
