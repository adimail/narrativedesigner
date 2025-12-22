import { test, expect } from "@playwright/test";
import { getRandomPosition } from "./perf-utils";

test("Progressive Add 500 Nodes", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => (window as any).useStore.getState().clearAll());

  for (let i = 1; i <= 500; i++) {
    const { day, time, route } = getRandomPosition();

    await page.evaluate(
      ({ d, t, r }) => {
        (window as any).useStore.getState().addNode(d, t, r);
      },
      { d: day, t: time, r: route },
    );

    if (i % 50 === 0) {
      await page.waitForTimeout(100);
      const count = await page.evaluate(
        () => (window as any).useStore.getState().nodes.length,
      );
      expect(count).toBe(i);
    }
  }
});
