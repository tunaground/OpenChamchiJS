import { formatDateTime, formatDate, formatTime } from "@/lib/utils/date-formatter";

describe("date-formatter", () => {
  describe("formatDateTime", () => {
    it("formats Date object with Korean day name by default", () => {
      const date = new Date(2024, 0, 15, 9, 5, 3); // Jan 15, 2024 09:05:03 (Monday)
      expect(formatDateTime(date)).toBe("2024-01-15 (월) 09:05:03");
    });

    it("formats ISO string to date time with day name", () => {
      const date = new Date(2024, 11, 25, 23, 59, 59);
      expect(formatDateTime(date.toISOString())).toBe(formatDateTime(date));
    });

    it("pads single digit months and days", () => {
      const date = new Date(2024, 0, 1, 0, 0, 0); // Jan 1, 2024 00:00:00 (Monday)
      expect(formatDateTime(date)).toBe("2024-01-01 (월) 00:00:00");
    });

    it("handles midnight correctly", () => {
      const date = new Date(2024, 5, 15, 0, 0, 0); // Jun 15, 2024 (Saturday)
      expect(formatDateTime(date)).toBe("2024-06-15 (토) 00:00:00");
    });

    it("handles end of day correctly", () => {
      const date = new Date(2024, 5, 15, 23, 59, 59); // Jun 15, 2024 (Saturday)
      expect(formatDateTime(date)).toBe("2024-06-15 (토) 23:59:59");
    });

    it("formats with English day name", () => {
      const date = new Date(2024, 0, 15, 9, 5, 3); // Monday
      expect(formatDateTime(date, "en")).toBe("2024-01-15 (Mon) 09:05:03");
    });

    it("formats with Japanese day name", () => {
      const date = new Date(2024, 0, 15, 9, 5, 3); // Monday
      expect(formatDateTime(date, "ja")).toBe("2024-01-15 (月) 09:05:03");
    });

    it("falls back to Korean for unknown locale", () => {
      const date = new Date(2024, 0, 15, 9, 5, 3); // Monday
      expect(formatDateTime(date, "fr")).toBe("2024-01-15 (월) 09:05:03");
    });
  });

  describe("formatDate", () => {
    it("formats Date object with Korean day name by default", () => {
      const date = new Date(2024, 6, 4); // Jul 4, 2024 (Thursday)
      expect(formatDate(date)).toBe("2024-07-04 (목)");
    });

    it("formats string date with day name", () => {
      const date = new Date(2024, 11, 31); // Dec 31, 2024 (Tuesday)
      expect(formatDate(date.toISOString())).toBe(formatDate(date));
    });

    it("pads single digit months", () => {
      const date = new Date(2024, 0, 15); // Jan 15, 2024 (Monday)
      expect(formatDate(date)).toBe("2024-01-15 (월)");
    });

    it("pads single digit days", () => {
      const date = new Date(2024, 10, 5); // Nov 5, 2024 (Tuesday)
      expect(formatDate(date)).toBe("2024-11-05 (화)");
    });

    it("formats with English day name", () => {
      const date = new Date(2024, 6, 4); // Thursday
      expect(formatDate(date, "en")).toBe("2024-07-04 (Thu)");
    });

    it("formats with Japanese day name", () => {
      const date = new Date(2024, 6, 4); // Thursday
      expect(formatDate(date, "ja")).toBe("2024-07-04 (木)");
    });
  });

  describe("formatTime", () => {
    it("formats Date object to HH:mm:ss", () => {
      const date = new Date(2024, 0, 1, 14, 30, 45);
      expect(formatTime(date)).toBe("14:30:45");
    });

    it("formats string date to HH:mm:ss", () => {
      const date = new Date(2024, 0, 1, 8, 5, 3);
      expect(formatTime(date.toISOString())).toBe(formatTime(date));
    });

    it("pads single digit hours", () => {
      const date = new Date(2024, 0, 1, 5, 30, 45);
      expect(formatTime(date)).toBe("05:30:45");
    });

    it("pads single digit minutes", () => {
      const date = new Date(2024, 0, 1, 14, 5, 45);
      expect(formatTime(date)).toBe("14:05:45");
    });

    it("pads single digit seconds", () => {
      const date = new Date(2024, 0, 1, 14, 30, 5);
      expect(formatTime(date)).toBe("14:30:05");
    });

    it("handles midnight", () => {
      const date = new Date(2024, 0, 1, 0, 0, 0);
      expect(formatTime(date)).toBe("00:00:00");
    });
  });
});
