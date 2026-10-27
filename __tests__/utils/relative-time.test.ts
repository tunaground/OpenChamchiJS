import { formatRelativeTime } from "@/lib/utils/relative-time";

describe("formatRelativeTime", () => {
  const now = new Date(2026, 9, 27, 15, 0, 0); // Oct 27, 2026 15:00

  it("says now for under a minute", () => {
    expect(formatRelativeTime(new Date(2026, 9, 27, 14, 59, 30), "ko", now)).toBe("지금");
  });

  it("counts minutes within the hour", () => {
    expect(formatRelativeTime(new Date(2026, 9, 27, 14, 57, 0), "ko", now)).toBe("3분 전");
  });

  it("counts hours earlier today", () => {
    expect(formatRelativeTime(new Date(2026, 9, 27, 10, 0, 0), "ko", now)).toBe("5시간 전");
  });

  it("shows yesterday with the time", () => {
    expect(formatRelativeTime(new Date(2026, 9, 26, 21, 44, 0), "ko", now)).toBe("어제 21:44");
  });

  it("shows month and day within the year", () => {
    expect(formatRelativeTime(new Date(2026, 9, 3, 9, 0, 0), "ko", now)).toBe("10월 3일");
  });

  it("includes the year for older dates", () => {
    expect(formatRelativeTime(new Date(2025, 1, 2, 9, 0, 0), "ko", now)).toBe("2025. 2. 2.");
  });

  it("accepts ISO strings and other locales", () => {
    const iso = new Date(2026, 9, 27, 14, 57, 0).toISOString();
    expect(formatRelativeTime(iso, "en", now)).toBe("3 minutes ago");
  });
});
