import { Download, Upload, Moon, Sun, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { useStore } from "../../store/useStore";
import { ScenarioNode } from "../../types/schema";
import { cn } from "../../lib/utils";

export const Toolbar = () => {
  const nodes = useStore((state) => state.nodes);
  const importData = useStore((state) => state.importData);
  const validateAll = useStore((state) => state.validateAll);
  const darkMode = useStore((state) => state.darkMode);
  const toggleDarkMode = useStore((state) => state.toggleDarkMode);
  const clearAll = useStore((state) => state.clearAll);

  const handleExport = () => {
    validateAll();

    const cleanNodes = nodes.map((node) => {
      const { scenarioId, gridPosition, ...rest } = node;
      return rest;
    });

    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(cleanNodes, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "scenarios.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(
          event.target?.result as string,
        ) as ScenarioNode[];
        if (Array.isArray(json)) {
          importData(json);
        } else {
          alert("Invalid JSON format");
        }
      } catch (err) {
        alert("Error parsing JSON");
      }
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    if (
      window.confirm(
        "Are you sure you want to clear the entire canvas? This action cannot be undone.",
      )
    ) {
      clearAll();
    }
  };

  return (
    <div
      className={cn(
        "h-16 border-b-4 px-4 flex items-center justify-between z-20 relative font-mono transition-colors",
        darkMode
          ? "bg-slate-800 border-slate-600 text-white"
          : "bg-white border-black text-black",
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "px-3 py-1 font-bold text-xl shadow-[4px_4px_0px_0px_rgba(100,100,100,1)]",
            darkMode ? "bg-slate-600 text-white" : "bg-black text-white",
          )}
        >
          ICWRouteVisualizer
        </div>
        <div
          className={cn("h-8 w-1 mx-2", darkMode ? "bg-slate-500" : "bg-black")}
        />
        <div className="text-sm font-bold">
          NODES: {nodes.length.toString().padStart(3, "0")}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
          {darkMode ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>

        <div className="h-8 w-px bg-gray-300 mx-2" />

        <Button variant="destructive" size="sm" onClick={handleClear}>
          <Trash2 className="w-4 h-4 mr-2" />
          CLEAR_ALL
        </Button>

        <div className="relative">
          <input
            type="file"
            accept=".json"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleImport}
          />
          <Button variant="default" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            LOAD_DISK
          </Button>
        </div>

        <Button variant="default" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          SAVE_DISK
        </Button>
      </div>
    </div>
  );
};
