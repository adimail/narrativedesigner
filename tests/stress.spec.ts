import { test, expect } from "@playwright/test";
import { getRandomPosition, collectMetrics } from "./perf-utils";
import { SIMULATION_CONFIG } from "./constants";

test.describe("Full System Stress Test", () => {
  test("Heavy Interaction Simulation", async ({ page }) => {
    await page.goto("/");

    await page.evaluate(() => {
      const store = (window as any).useStore;
      store.getState().clearAll();
      store.setState({
        isPropertiesPanelOpen: false,
        isValidationPanelOpen: false,
      });
    });

    const metrics: any[] = [];

    for (let i = 1; i <= SIMULATION_CONFIG.STRESS_TEST_NODES; i++) {
      const { day, time, route } = getRandomPosition();
      await page.evaluate(
        ({ d, t, r }) => {
          (window as any).useStore.getState().addNode(d, t, r);
        },
        { d: day, t: time, r: route },
      );

      if (i % SIMULATION_CONFIG.STRESS_SCREENSHOT_INTERVAL === 0) {
        const m = await collectMetrics(page);
        metrics.push(m);

        await page.waitForLoadState("networkidle");
        await page.screenshot({
          path: `./test-results/stress-node-${i}.png`,
          fullPage: false,
          animations: "disabled",
          scale: "device",
        });
      }
    }

    const nodeIds = await page.evaluate(() =>
      (window as any).useStore.getState().nodes.map((n: any) => n.id),
    );

    for (let i = 0; i < SIMULATION_CONFIG.STRESS_TEST_INTERACTIONS; i++) {
      const id = nodeIds[Math.floor(Math.random() * nodeIds.length)];
      const { day, time, route } = getRandomPosition();

      await page.evaluate(
        ({ id, d, t, r }) => {
          (window as any).useStore.getState().moveNode(id, d, t, r, 0, 0);
        },
        { id, d: day, t: time, r: route },
      );

      if (i % 50 === 0) await page.waitForTimeout(50);
    }

    const finalMetrics = await collectMetrics(page);
    expect(finalMetrics.nodeCount).toBe(SIMULATION_CONFIG.STRESS_TEST_NODES);
    expect(finalMetrics.memory).toBeLessThan(1500);

    await page.screenshot({
      path: `./test-results/final-state.png`,
      animations: "disabled",
      scale: "device",
    });

    await page.pause();
  });
});
