import { generateTripcode, DEFAULT_TRIPCODE_SALT } from "@/lib/utils/tripcode";

describe("generateTripcode", () => {
  it("should return name unchanged when no # is present", async () => {
    const result = await generateTripcode("홍길동");
    expect(result).toBe("홍길동");
  });

  it("should generate tripcode when # is present", async () => {
    const result = await generateTripcode("홍길동#secret");
    expect(result).toMatch(/^홍길동◆.{10}$/);
  });

  it("should generate consistent tripcode for same input", async () => {
    const result1 = await generateTripcode("홍길동#secret");
    const result2 = await generateTripcode("홍길동#secret");
    expect(result1).toBe(result2);
  });

  it("should generate different tripcodes for different secrets", async () => {
    const result1 = await generateTripcode("홍길동#secret1");
    const result2 = await generateTripcode("홍길동#secret2");
    expect(result1).not.toBe(result2);
  });

  it("should handle multiple # in name", async () => {
    const result = await generateTripcode("홍길동#sec#ret");
    expect(result).toMatch(/^홍길동◆.{10}$/);
    // The secret should be "sec#ret"
  });

  it("should replace ◆ with <> to prevent spoofing", async () => {
    const result = await generateTripcode("홍길동◆fake");
    expect(result).toBe("홍길동<>fake");
  });

  it("should work with custom salt", async () => {
    const customSalt = "$2a$10$CustomSaltForTesting..";
    const result1 = await generateTripcode("홍길동#secret", DEFAULT_TRIPCODE_SALT);
    const result2 = await generateTripcode("홍길동#secret", customSalt);
    // Different salts should produce different tripcodes
    expect(result1).not.toBe(result2);
  });

  it("should handle empty display name", async () => {
    const result = await generateTripcode("#secret");
    expect(result).toMatch(/^◆.{10}$/);
  });

  it("should handle empty secret", async () => {
    const result = await generateTripcode("홍길동#");
    expect(result).toMatch(/^홍길동◆.{10}$/);
  });
});
