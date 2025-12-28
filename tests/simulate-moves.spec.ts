import { test } from "@playwright/test";
import { getRandomPosition } from "./perf-utils";
import { SIMULATION_CONFIG } from "./constants";

test("Simulate Realistic Interaction Flow", async ({ page }) => {
  await page.goto("/");

  await page.evaluate(() => {
    const store = (window as any).useStore;
    store.getState().clearAll();
    store.setState({
      isPropertiesPanelOpen: false,
      isValidationPanelOpen: false,
    });
  });

  for (let i = 0; i < SIMULATION_CONFIG.SIMULATE_MOVES_INITIAL_NODES; i++) {
    const { day, time, route, isRoutine } = getRandomPosition();
    await page.evaluate(
      ({ d, t, r, isRoutine }) =>
        (window as any).useStore.getState().addNode(d, t, r, isRoutine),
      { d: day, t: time, r: route, isRoutine },
    );
  }

  let nodeIds = await page.evaluate(() =>
    (window as any).useStore.getState().nodes.map((n: any) => n.id),
  );

  for (let i = 0; i < 100; i++) {
    const s = nodeIds[Math.floor(Math.random() * nodeIds.length)];
    const t = nodeIds[Math.floor(Math.random() * nodeIds.length)];
    await page.evaluate(
      ({ s, t }) => (window as any).useStore.getState().connectNodes(s, t),
      { s, t },
    );
  }

  for (let i = 0; i < SIMULATION_CONFIG.SIMULATE_MOVES_TOTAL; i++) {
    const moveId = nodeIds[Math.floor(Math.random() * nodeIds.length)];
    const pos = getRandomPosition();

    await page.evaluate(
      ({ id, d, t, r, isRoutine }) =>
        (window as any).useStore
          .getState()
          .moveNode(id, d, t, r, 0, 0, isRoutine),
      {
        id: moveId,
        d: pos.day,
        t: pos.time,
        r: pos.route,
        isRoutine: pos.isRoutine,
      },
    );

    if (i % 10 === 0) {
      const s = nodeIds[Math.floor(Math.random() * nodeIds.length)];
      const t = nodeIds[Math.floor(Math.random() * nodeIds.length)];
      await page.evaluate(
        ({ s, t }) => (window as any).useStore.getState().connectNodes(s, t),
        { s, t },
      );
    }

    if (i % 20 === 0) {
      const newPos = getRandomPosition();
      await page.evaluate(
        ({ d, t, r, isRoutine }) =>
          (window as any).useStore.getState().addNode(d, t, r, isRoutine),
        {
          d: newPos.day,
          t: newPos.time,
          r: newPos.route,
          isRoutine: newPos.isRoutine,
        },
      );

      nodeIds = await page.evaluate(() =>
        (window as any).useStore.getState().nodes.map((n: any) => n.id),
      );
    }

    if (i % 50 === 0) {
      await page.waitForTimeout(10);
    }
  }

  await page.pause();
});
