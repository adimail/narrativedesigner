import { test, expect } from "@playwright/test";
import { getRandomPosition, collectMetrics } from "./perf-utils";

test.describe("Full System Stress Test", () => {
  test("500 Nodes + Heavy Interaction", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => (window as any).useStore.getState().clearAll());

    const metrics: any[] = [];

    for (let i = 1; i <= 500; i++) {
      const { day, time, route } = getRandomPosition();
      await page.evaluate(
        ({ d, t, r }) => {
          (window as any).useStore.getState().addNode(d, t, r);
        },
        { d: day, t: time, r: route },
      );

      if (i % 100 === 0) {
        const m = await collectMetrics(page);
        metrics.push(m);
        await page.screenshot({ path: `./test-results/stress-node-${i}.png` });
      }
    }

    const nodeIds = await page.evaluate(() =>
      (window as any).useStore.getState().nodes.map((n: any) => n.id),
    );

    for (let i = 0; i < 200; i++) {
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
    expect(finalMetrics.nodeCount).toBe(500);
    expect(finalMetrics.memory).toBeLessThan(1500);
  });
});
