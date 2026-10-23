import { usePushWatchStore } from "@/lib/store/pushWatch";

describe("usePushWatchStore.ensureLoaded", () => {
  it("fetches the list only once across calls", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [], limit: 3, pushEnabled: true }),
    }) as jest.Mock;
    await usePushWatchStore.getState().ensureLoaded();
    await usePushWatchStore.getState().ensureLoaded();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(usePushWatchStore.getState().limit).toBe(3);
  });
});
