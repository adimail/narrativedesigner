import { Page } from "@playwright/test";

export const getRandomPosition = () => {
  const day = Math.floor(Math.random() * 28);
  const time = Math.floor(Math.random() * 4);
  const routes = ["Common", "Alyssa", "Rhea", "Natalie", "OtherQuest"];
  const route = routes[Math.floor(Math.random() * routes.length)];
  return { day, time, route };
};

export const collectMetrics = async (page: Page) => {
  return await page.evaluate(() => {
    const performance = window.performance as any;
    return {
      memory: performance.memory
        ? performance.memory.usedJSHeapSize / (1024 * 1024)
        : 0,
      nodeCount: (window as any).useStore.getState().nodes.length,
      timestamp: Date.now(),
    };
  });
};
