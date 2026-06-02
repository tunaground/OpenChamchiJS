import { DEFAULT_ROBOTS_TXT } from "@/lib/constants/robots";

const getMock = jest.fn();

jest.mock("@/lib/services/global-settings", () => ({
  globalSettingsService: {
    get: () => getMock(),
  },
}));

import { GET } from "@/app/robots.txt/route";

function makeSettings(robotsTxt: string | null) {
  return { robotsTxt };
}

describe("GET /robots.txt", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it("returns the stored robotsTxt when it has content", async () => {
    const stored = "User-agent: Googlebot\nDisallow: /private/\n";
    getMock.mockResolvedValue(makeSettings(stored));

    const res = await GET();

    expect(res.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    expect(await res.text()).toBe(stored);
  });

  it("falls back to the default when robotsTxt is null", async () => {
    getMock.mockResolvedValue(makeSettings(null));

    const res = await GET();

    expect(await res.text()).toBe(DEFAULT_ROBOTS_TXT);
  });

  it("falls back to the default when robotsTxt is empty or whitespace-only", async () => {
    getMock.mockResolvedValue(makeSettings("   \n  "));

    const res = await GET();

    expect(await res.text()).toBe(DEFAULT_ROBOTS_TXT);
  });
});
