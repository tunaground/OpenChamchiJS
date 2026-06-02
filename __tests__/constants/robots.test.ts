import { DEFAULT_ROBOTS_TXT } from "@/lib/constants/robots";

describe("DEFAULT_ROBOTS_TXT", () => {
  it("includes the core disallow rules", () => {
    expect(DEFAULT_ROBOTS_TXT).toContain("User-agent: *");
    expect(DEFAULT_ROBOTS_TXT).toContain("Disallow: /api/");
    expect(DEFAULT_ROBOTS_TXT).toContain("Disallow: /admin/");
  });

  it("is a non-empty string ending with a newline", () => {
    expect(DEFAULT_ROBOTS_TXT.length).toBeGreaterThan(0);
    expect(DEFAULT_ROBOTS_TXT.endsWith("\n")).toBe(true);
  });
});
