import { useEffect } from "react";
import { Toolbar } from "./components/panels/Toolbar";
import { Canvas } from "./components/canvas/Canvas";
import { PropertiesPanel } from "./components/panels/PropertiesPanel";
import { ValidationPanel } from "./components/panels/ValidationPanel";
import { useStore } from "./store/useStore";
import { cn } from "./lib/utils";

function App() {
  const darkMode = useStore((state) => state.darkMode);

  useEffect(() => {
    const handleUndoRedo = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      )
        return;

      const isZ = e.key.toLowerCase() === "z";
      const isY = e.key.toLowerCase() === "y";
      const modifier = e.ctrlKey || e.metaKey;

      if (modifier && isZ) {
        e.preventDefault();
        if (e.shiftKey) {
          (useStore as any).temporal.getState().redo();
        } else {
          (useStore as any).temporal.getState().undo();
        }
      } else if (modifier && isY) {
        e.preventDefault();
        (useStore as any).temporal.getState().redo();
      }
    };

    window.addEventListener("keydown", handleUndoRedo);
    return () => window.removeEventListener("keydown", handleUndoRedo);
  }, []);

  return (
    <div
      className={cn(
        "flex flex-col h-screen w-screen overflow-hidden font-mono transition-colors",
        darkMode ? "bg-slate-900 text-white" : "bg-gray-200 text-black",
      )}
    >
      <Toolbar />
      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 relative overflow-hidden">
          <Canvas />
          <ValidationPanel />
        </div>
        <PropertiesPanel />
      </div>
    </div>
  );
}

export default App;
