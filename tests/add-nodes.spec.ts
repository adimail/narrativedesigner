import { test, expect } from "@playwright/test";
import { getRandomPosition } from "./perf-utils";
import { SIMULATION_CONFIG } from "./constants";

test("Progressive Add Nodes", async ({ page }) => {
  await page.goto("/");

  await page.evaluate(() => {
    const store = (window as any).useStore;
    store.getState().clearAll();
    store.setState({
      isPropertiesPanelOpen: false,
      isValidationPanelOpen: false,
    });
  });

  for (let i = 1; i <= SIMULATION_CONFIG.ADD_NODES_TOTAL; i++) {
    const { day, time, route, isRoutine } = getRandomPosition();

    await page.evaluate(
      ({ d, t, r, isRoutine }) => {
        (window as any).useStore.getState().addNode(d, t, r, isRoutine);
      },
      { d: day, t: time, r: route, isRoutine },
    );

    if (i % SIMULATION_CONFIG.PROGRESS_CHECK_INTERVAL === 0) {
      await page.waitForTimeout(100);
      const count = await page.evaluate(
        () => (window as any).useStore.getState().nodes.length,
      );
      expect(count).toBe(i);
    }
  }

  await page.pause();
});
