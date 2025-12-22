import { useEffect, useState, useRef } from "react";

export const PerformanceOverlay = () => {
  const [fps, setFps] = useState(0);
  const [memory, setMemory] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    const updateMetrics = () => {
      frameCount.current++;
      const now = performance.now();
      const elapsed = now - lastTime.current;

      if (elapsed >= 1000) {
        setFps(Math.round((frameCount.current * 1000) / elapsed));
        frameCount.current = 0;
        lastTime.current = now;

        const mem = (performance as any).memory;
        if (mem) {
          setMemory(Math.round(mem.usedJSHeapSize / (1024 * 1024)));
        }
      }
      requestAnimationFrame(updateMetrics);
    };

    const handle = requestAnimationFrame(updateMetrics);
    return () => cancelAnimationFrame(handle);
  }, []);

  return (
    <div className="fixed top-20 left-4 z-[9999] bg-black/80 text-green-400 p-2 font-mono text-[10px] border border-green-500/50 pointer-events-none shadow-xl">
      <div className="flex justify-between gap-4">
        <span>FPS:</span>
        <span className="font-bold">{fps}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span>MEM:</span>
        <span className="font-bold">{memory}MB</span>
      </div>
      <div className="mt-1 h-1 w-full bg-gray-800">
        <div
          className="h-full bg-green-500 transition-all duration-300"
          style={{ width: `${Math.min((fps / 60) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
};
