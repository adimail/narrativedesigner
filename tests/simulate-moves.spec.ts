import { test } from "@playwright/test";
import { getRandomPosition } from "./perf-utils";

test("Simulate 500 Moves + 200 Connections", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() =>
    (window as any).useStore.getState().loadSampleData(),
  );

  for (let i = 0; i < 100; i++) {
    const { day, time, route } = getRandomPosition();
    await page.evaluate(
      ({ d, t, r }) => (window as any).useStore.getState().addNode(d, t, r),
      { d: day, t: time, r: route },
    );
  }

  const nodeIds = await page.evaluate(() =>
    (window as any).useStore.getState().nodes.map((n: any) => n.id),
  );

  for (let i = 0; i < 500; i++) {
    const id = nodeIds[Math.floor(Math.random() * nodeIds.length)];
    const { day, time, route } = getRandomPosition();

    await page.evaluate(
      ({ id, d, t, r }) => {
        (window as any).useStore.getState().moveNode(id, d, t, r, 0, 0);
      },
      { id, d: day, t: time, r: route },
    );

    if (i % 10 === 0) await page.waitForTimeout(20);
  }

  for (let i = 0; i < 200; i++) {
    const sourceId = nodeIds[Math.floor(Math.random() * nodeIds.length)];
    const targetId = nodeIds[Math.floor(Math.random() * nodeIds.length)];

    await page.evaluate(
      ({ s, t }) => {
        (window as any).useStore.getState().connectNodes(s, t);
      },
      { s: sourceId, t: targetId },
    );
  }
});
