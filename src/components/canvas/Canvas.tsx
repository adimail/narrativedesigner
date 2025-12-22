import React, { useRef, useState, useEffect, useMemo } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useStore } from "../../store/useStore";
import { GridBackground } from "./GridBackground";
import { ConnectionLayer } from "./ConnectionLayer";
import { ScenarioNode } from "./ScenarioNode";
import {
  getGridPositionFromCoordinates,
  getColumnLayout,
  getRowLayout,
} from "../../lib/utils";
import { GRID_CONFIG } from "../../lib/constants";
import { Button } from "../ui/button";
import { Play, Plus } from "lucide-react";
import { cn } from "../../lib/utils";
import { Day, Time, RouteEnum } from "../../types/schema";

export const Canvas = () => {
  const nodes = useStore((state) => state.nodes);
  const routes = useStore((state) => state.routes);
  const moveNode = useStore((state) => state.moveNode);
  const selectNode = useStore((state) => state.selectNode);
  const clearSelection = useStore((state) => state.clearSelection);
  const connectNodes = useStore((state) => state.connectNodes);
  const addNode = useStore((state) => state.addNode);
  const createBranch = useStore((state) => state.createBranch);
  const setScale = useStore((state) => state.setScale);
  const setViewport = useStore((state) => state.setViewport);
  const setDraggingId = useStore((state) => state.setDraggingId);
  const draggingId = useStore((state) => state.draggingId);
  const loadSampleData = useStore((state) => state.loadSampleData);
  const darkMode = useStore((state) => state.darkMode);
  const validateAll = useStore((state) => state.validateAll);

  const layoutMap = useMemo(
    () => getColumnLayout(nodes, routes),
    [nodes, routes],
  );
  const rowLayoutMap = useMemo(
    () => getRowLayout(nodes, routes),
    [nodes, routes],
  );

  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(
    null,
  );
  const [tempLine, setTempLine] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const [branchDropTarget, setBranchDropTarget] = useState<{
    day: Day;
    time: Time;
    route: RouteEnum;
    y: number;
    x: number;
    width: number;
  } | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      )
        return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        const state = useStore.getState();
        if (state.selectedNodeIds.length > 0) {
          const idsToDelete = [...state.selectedNodeIds];
          idsToDelete.forEach((id) => state.deleteNode(id));
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, []);

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (e.button === 0) {
      selectNode(id, e.ctrlKey);
      setDraggingId(id);
      (useStore as any).temporal.getState().pause();
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.shiftKey && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const scale = useStore.getState().scale;
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;
      const { day, time, route } = getGridPositionFromCoordinates(
        x,
        y,
        layoutMap,
        rowLayoutMap,
        routes,
      );
      addNode(day, time, route);
      return;
    }
    if (e.target === e.currentTarget) clearSelection();
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
        rowLayoutMap,
        routes,
      );
      const rowData = rowLayoutMap.rows[route];
      const colKey = `${day}-${time}`;
      const colData = layoutMap.columns[colKey];
      const nodesInCellCount = nodes.filter(
        (n) =>
          n.gridPosition.day === day &&
          n.gridPosition.time === time &&
          n.gridPosition.route === route,
      ).length;
      let targetBranch = 0;
      if (rowData) {
        const relativeY = y - rowData.startY;
        targetBranch = Math.floor(relativeY / GRID_CONFIG.branchHeight);
        if (targetBranch < 0) targetBranch = 0;
      }
      if (
        nodesInCellCount > 1 &&
        rowData &&
        colData &&
        y > rowData.startY + rowData.height - GRID_CONFIG.branchDropZoneHeight
      ) {
        setBranchDropTarget({
          day,
          time,
          route,
          y: rowData.startY + rowData.height,
          x: colData.startX,
          width: colData.width,
        });
      } else {
        setBranchDropTarget(null);
        if (rowData && targetBranch > rowData.maxBranch)
          targetBranch = rowData.maxBranch;
      }
      let targetIndex = 0;
      if (colData) {
        const relativeX = x - colData.startX;
        const slotWidth = GRID_CONFIG.nodeWidth + GRID_CONFIG.nodeGap;
        targetIndex = Math.floor(relativeX / slotWidth);
        if (targetIndex < 0) targetIndex = 0;
      }
      moveNode(draggingId, day, time, route, targetIndex, targetBranch);
    }
  };

  const handleMouseUp = () => {
    if (draggingId) {
      (useStore as any).temporal.getState().resume();

      if (branchDropTarget) {
        const newBranchIndex = createBranch(branchDropTarget.route);
        moveNode(
          draggingId,
          branchDropTarget.day,
          branchDropTarget.time,
          branchDropTarget.route,
          0,
          newBranchIndex,
        );
      }
      const finalNodes = useStore.getState().nodes;
      useStore.setState({ nodes: [...finalNodes] });
      validateAll();
    }
    setDraggingId(null);
    setConnectingSourceId(null);
    setTempLine(null);
    setBranchDropTarget(null);
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

  const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();

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
              Shift+Click on the grid to add a node, or load sample data to see
              how it works.
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
        onTransformed={(ref) => {
          setScale(ref.state.scale);
          if (wrapperRef.current) {
            const { positionX, positionY, scale } = ref.state;
            const { clientWidth, clientHeight } =
              wrapperRef.current.parentElement!;
            setViewport(
              -positionX / scale,
              -positionY / scale,
              clientWidth / scale,
              clientHeight / scale,
            );
          }
        }}
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
            style={{
              width: layoutMap.totalWidth,
              height: rowLayoutMap.totalHeight,
            }}
            onClick={handleCanvasClick}
            onContextMenu={handleContextMenu}
          >
            <GridBackground layoutMap={layoutMap} rowLayoutMap={rowLayoutMap} />
            <ConnectionLayer
              layoutMap={layoutMap}
              rowLayoutMap={rowLayoutMap}
            />
            <div className="absolute left-0 top-0 z-20 h-full w-full pointer-events-none">
              {nodes.map((node) => (
                <ScenarioNode
                  key={node.id}
                  node={node}
                  isConnecting={!!connectingSourceId}
                  onMouseDown={handleMouseDown}
                  onConnectStart={handleConnectStart}
                  onConnectEnd={handleConnectEnd}
                  layoutMap={layoutMap}
                  rowLayoutMap={rowLayoutMap}
                />
              ))}
            </div>
            {branchDropTarget && (
              <div
                className="absolute z-40 flex items-center justify-center pointer-events-none animate-pulse"
                style={{
                  left: branchDropTarget.x,
                  top: branchDropTarget.y - GRID_CONFIG.branchDropZoneHeight,
                  width: branchDropTarget.width,
                  height: GRID_CONFIG.branchDropZoneHeight,
                  backgroundColor: "rgba(255, 255, 255, 0.5)",
                  border: "2px dashed rgba(0, 0, 0, 0.5)",
                }}
              >
                <div className="bg-black text-white px-3 py-1 rounded-full font-bold text-xs flex items-center gap-2 shadow-lg">
                  <Plus className="w-4 h-4" />
                  CREATE NEW BRANCH
                </div>
              </div>
            )}
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
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
};
