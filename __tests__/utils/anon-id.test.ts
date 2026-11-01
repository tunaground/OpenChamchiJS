import { createUuid } from "@/lib/utils/anon-id";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("createUuid", () => {
  it("returns a v4 UUID when randomUUID exists", () => {
    expect(createUuid()).toMatch(UUID_V4);
  });

  it("falls back to getRandomValues outside secure contexts", () => {
    const original = crypto.randomUUID;
    Object.defineProperty(crypto, "randomUUID", { value: undefined, configurable: true });
    try {
      const ids = new Set(Array.from({ length: 50 }, () => createUuid()));
      ids.forEach((id) => expect(id).toMatch(UUID_V4));
      expect(ids.size).toBe(50);
    } finally {
      Object.defineProperty(crypto, "randomUUID", { value: original, configurable: true });
    }
  });
});
