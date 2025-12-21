import React, { useRef, useState, useMemo } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useStore } from "../../store/useStore";
import { GridBackground } from "./GridBackground";
import { ConnectionLayer } from "./ConnectionLayer";
import { ScenarioNode } from "./ScenarioNode";
import {
  getGridPositionFromCoordinates,
  getRouteLayout,
} from "../../lib/utils";
import { GRID_CONFIG, DAYS, ROUTES } from "../../lib/constants";
import { Button } from "../ui/button";
import { Play } from "lucide-react";
import { cn } from "../../lib/utils";

export const Canvas = () => {
  const nodes = useStore((state) => state.nodes);
  const moveNode = useStore((state) => state.moveNode);
  const selectNode = useStore((state) => state.selectNode);
  const clearSelection = useStore((state) => state.clearSelection);
  const connectNodes = useStore((state) => state.connectNodes);
  const addNode = useStore((state) => state.addNode);
  const setScale = useStore((state) => state.setScale);
  const loadSampleData = useStore((state) => state.loadSampleData);
  const darkMode = useStore((state) => state.darkMode);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(
    null,
  );
  const [tempLine, setTempLine] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);

  const layoutMap = useMemo(() => getRouteLayout(nodes), [nodes]);

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (e.button === 0) {
      selectNode(id, e.ctrlKey);
      setDraggingId(id);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      clearSelection();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (connectingSourceId && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const scale = useStore.getState().scale;

      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      setTempLine((prev) => (prev ? { ...prev, x2: x, y2: y } : null));
    }

    if (draggingId && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const scale = useStore.getState().scale;

      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      const { day, time, route } = getGridPositionFromCoordinates(
        x,
        y,
        layoutMap,
      );
      moveNode(draggingId, day, time, route);
    }
  };

  const handleMouseUp = () => {
    setDraggingId(null);
    setConnectingSourceId(null);
    setTempLine(null);
  };

  const handleConnectStart = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const rect = wrapperRef.current!.getBoundingClientRect();
    const scale = useStore.getState().scale;
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    setConnectingSourceId(id);
    setTempLine({ x1: x, y1: y, x2: x, y2: y });
  };

  const handleConnectEnd = (e: React.MouseEvent, targetId: string) => {
    if (connectingSourceId && connectingSourceId !== targetId) {
      connectNodes(connectingSourceId, targetId);
    }
    setConnectingSourceId(null);
    setTempLine(null);
    setDraggingId(null);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const scale = useStore.getState().scale;
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;
      const { day, time, route } = getGridPositionFromCoordinates(
        x,
        y,
        layoutMap,
      );
      addNode(day, time, route);
    }
  };

  const totalWidth =
    GRID_CONFIG.sidebarWidth + DAYS.length * 4 * GRID_CONFIG.colWidth;
  const totalHeight = layoutMap.totalHeight;

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden transition-colors",
        darkMode ? "bg-slate-900" : "bg-gray-200",
      )}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      {nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm">
          <div
            className={cn(
              "pointer-events-auto max-w-md border p-8 text-center shadow-2xl backdrop-blur-sm",
              darkMode
                ? "bg-slate-800/90 border-slate-600 text-white"
                : "bg-white/90 border-slate-200 text-slate-800",
            )}
          >
            <h2 className="mb-2 text-2xl font-bold">ScenarioGraph</h2>
            <p
              className={cn(
                "mb-6",
                darkMode ? "text-slate-300" : "text-slate-600",
              )}
            >
              Start by right-clicking on the grid to add a node, or load sample
              data to see how it works.
            </p>
            <Button onClick={loadSampleData} size="default" className="w-full">
              <Play className="mr-2 h-4 w-4 py-6 text-black" />
              Load Sample Data
            </Button>
          </div>
        </div>
      )}

      <TransformWrapper
        minScale={0.1}
        maxScale={4}
        limitToBounds={false}
        centerOnInit={false}
        initialPositionX={0}
        initialPositionY={0}
        onTransformed={(ref) => setScale(ref.state.scale)}
        panning={{ disabled: !!draggingId || !!connectingSourceId }}
      >
        <TransformComponent
          wrapperClass="w-full h-full"
          wrapperStyle={{ width: "100%", height: "100%" }}
        >
          <div
            ref={wrapperRef}
            className={cn(
              "relative shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] transition-all duration-300 ease-in-out",
              darkMode ? "bg-slate-900" : "bg-white",
            )}
            style={{ width: totalWidth, height: totalHeight }}
            onClick={handleCanvasClick}
            onContextMenu={handleContextMenu}
          >
            <GridBackground />
            <ConnectionLayer />

            {tempLine && (
              <svg className="pointer-events-none absolute left-0 top-0 z-50 h-full w-full">
                <line
                  x1={tempLine.x1}
                  y1={tempLine.y1}
                  x2={tempLine.x2}
                  y2={tempLine.y2}
                  stroke={darkMode ? "#ffffff" : "#000000"}
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              </svg>
            )}

            <div className="absolute left-0 top-0 z-10 h-full w-full">
              {nodes.map((node) => (
                <ScenarioNode
                  key={node.id}
                  node={node}
                  onMouseDown={handleMouseDown}
                  onConnectStart={handleConnectStart}
                  onConnectEnd={handleConnectEnd}
                />
              ))}
            </div>
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
};
