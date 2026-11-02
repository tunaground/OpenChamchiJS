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

describe("usePushWatchStore new-response marks", () => {
  const item = (threadId: number, hasNew = false) => ({
    id: `w${threadId}`,
    threadId,
    boardId: "free",
    title: "t",
    threadDeleted: false,
    enabled: true,
    hasNew,
  });

  it("setHasNew changes only the given thread", () => {
    usePushWatchStore.setState({ items: [item(1), item(2)] });
    usePushWatchStore.getState().setHasNew(2, true);
    expect(usePushWatchStore.getState().items.map((i) => i.hasNew)).toEqual([false, true]);
  });

  it("setHasNew ignores threads not watched", () => {
    const items = [item(1)];
    usePushWatchStore.setState({ items });
    usePushWatchStore.getState().setHasNew(9, true);
    expect(usePushWatchStore.getState().items).toBe(items);
  });

  it("refreshIfStale reloads only after the given age", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [item(1, true)], limit: 3, pushEnabled: true }),
    }) as jest.Mock;

    usePushWatchStore.setState({ loaded: true, loadedAt: Date.now() });
    await usePushWatchStore.getState().refreshIfStale(60_000);
    expect(global.fetch).not.toHaveBeenCalled();

    usePushWatchStore.setState({ loadedAt: Date.now() - 61_000 });
    await usePushWatchStore.getState().refreshIfStale(60_000);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(usePushWatchStore.getState().items[0].hasNew).toBe(true);
  });

  it("refreshIfStale does nothing before the first load", async () => {
    global.fetch = jest.fn() as jest.Mock;
    usePushWatchStore.setState({ loaded: false, loadedAt: 0 });
    await usePushWatchStore.getState().refreshIfStale(0);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
