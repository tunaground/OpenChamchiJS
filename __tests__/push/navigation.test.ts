import { handlePushNavigation } from "@/lib/push/navigation";

function deps(overrides: Partial<Parameters<typeof handlePushNavigation>[1]> = {}) {
  return {
    currentPath: "/index/tuna",
    hasDraft: () => false,
    confirm: jest.fn().mockReturnValue(true),
    navigate: jest.fn(),
    ...overrides,
  };
}

describe("handlePushNavigation", () => {
  it("navigates straight to the thread when nothing is being written", () => {
    const d = deps();
    handlePushNavigation("/trace/tuna/9976/recent", d);
    expect(d.navigate).toHaveBeenCalledWith("/trace/tuna/9976/recent");
    expect(d.confirm).not.toHaveBeenCalled();
  });

  it("asks first when a draft would be lost, and stays on no", () => {
    const d = deps({ hasDraft: () => true, confirm: jest.fn().mockReturnValue(false) });
    handlePushNavigation("/trace/tuna/9976/recent", d);
    expect(d.confirm).toHaveBeenCalled();
    expect(d.navigate).not.toHaveBeenCalled();
  });

  it("navigates after confirmation when there is a draft", () => {
    const d = deps({ hasDraft: () => true });
    handlePushNavigation("/trace/tuna/9976/recent", d);
    expect(d.navigate).toHaveBeenCalledWith("/trace/tuna/9976/recent");
  });

  it("does nothing when already on that thread, whatever the range", () => {
    const d = deps({ currentPath: "/trace/tuna/9976/120/130" });
    handlePushNavigation("/trace/tuna/9976/recent", d);
    expect(d.navigate).not.toHaveBeenCalled();
  });

  it("ignores URLs outside this site", () => {
    const d = deps();
    handlePushNavigation("https://evil.example/trace/x/1", d);
    expect(d.navigate).not.toHaveBeenCalled();
  });
});
