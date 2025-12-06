import { formatDateTime, formatDate, formatTime } from "@/lib/utils/date-formatter";

describe("date-formatter", () => {
  describe("formatDateTime", () => {
    it("formats Date object to YYYY-MM-DD HH:mm:ss", () => {
      const date = new Date(2024, 0, 15, 9, 5, 3); // Jan 15, 2024 09:05:03
      expect(formatDateTime(date)).toBe("2024-01-15 09:05:03");
    });

    it("formats ISO string to YYYY-MM-DD HH:mm:ss", () => {
      const date = new Date(2024, 11, 25, 23, 59, 59);
      expect(formatDateTime(date.toISOString())).toBe(formatDateTime(date));
    });

    it("pads single digit months and days", () => {
      const date = new Date(2024, 0, 1, 0, 0, 0); // Jan 1, 2024 00:00:00
      expect(formatDateTime(date)).toBe("2024-01-01 00:00:00");
    });

    it("handles midnight correctly", () => {
      const date = new Date(2024, 5, 15, 0, 0, 0);
      expect(formatDateTime(date)).toBe("2024-06-15 00:00:00");
    });

    it("handles end of day correctly", () => {
      const date = new Date(2024, 5, 15, 23, 59, 59);
      expect(formatDateTime(date)).toBe("2024-06-15 23:59:59");
    });
  });

  describe("formatDate", () => {
    it("formats Date object to YYYY-MM-DD", () => {
      const date = new Date(2024, 6, 4); // Jul 4, 2024
      expect(formatDate(date)).toBe("2024-07-04");
    });

    it("formats string date to YYYY-MM-DD", () => {
      const date = new Date(2024, 11, 31);
      expect(formatDate(date.toISOString())).toBe("2024-12-31");
    });

    it("pads single digit months", () => {
      const date = new Date(2024, 0, 15); // Jan 15, 2024
      expect(formatDate(date)).toBe("2024-01-15");
    });

    it("pads single digit days", () => {
      const date = new Date(2024, 10, 5); // Nov 5, 2024
      expect(formatDate(date)).toBe("2024-11-05");
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
