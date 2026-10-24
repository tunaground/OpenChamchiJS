import { updateSettingsSchema } from "@/lib/schemas";

describe("updateSettingsSchema pushCooldownSeconds", () => {
  it.each([0, 60, 86400])("accepts %i", (value) => {
    expect(updateSettingsSchema.safeParse({ pushCooldownSeconds: value }).success).toBe(true);
  });

  it.each([-1, 86401, 1.5])("rejects %p", (value) => {
    expect(updateSettingsSchema.safeParse({ pushCooldownSeconds: value }).success).toBe(false);
  });
});
