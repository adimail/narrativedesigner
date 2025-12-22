import { Download, Upload, Moon, Sun, Trash2, Save } from "lucide-react";
import { Button } from "../ui/button";
import { useStore } from "../../store/useStore";
import { ScenarioNodeSchema } from "../../types/schema";
import { cn } from "../../lib/utils";
import { DAYS, TIMES } from "../../lib/constants";
import { downloadJson } from "../../lib/file-system";
import { z } from "zod";

export const Toolbar = () => {
  const nodes = useStore((state) => state.nodes);
  const loadProject = useStore((state) => state.loadProject);
  const validateAll = useStore((state) => state.validateAll);
  const darkMode = useStore((state) => state.darkMode);
  const toggleDarkMode = useStore((state) => state.toggleDarkMode);
  const clearAll = useStore((state) => state.clearAll);

  const handleSaveProject = () => {
    downloadJson(nodes, "project.json");
  };

  const handleLoadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const result = z.array(ScenarioNodeSchema).safeParse(json);

        if (result.success) {
          loadProject(result.data);
        } else {
          const errors = result.error.errors
            .map((err) => `${err.path.join(".")}: ${err.message}`)
            .slice(0, 3)
            .join("\n");
          alert(
            `Invalid Project Data:\n${errors}${result.error.errors.length > 3 ? "\n..." : ""}`,
          );
        }
      } catch (err) {
        alert("Error parsing JSON file");
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleExportGame = () => {
    validateAll();

    const exportData = nodes.map((node) => ({
      ScenarioInfo: {
        CurrentScenario: node.scenarioId,
        NextScenarios: node.nextScenarios,
        PreviousScenarios: node.previousScenarios,
      },
      LoadInfo: {
        Immediately: node.loadInfo.immediately,
        AfterScenario: node.loadInfo.afterScenario ?? "None",
        AtDay: DAYS[node.loadInfo.atDay],
        AtTime: TIMES[node.loadInfo.atTime],
      },
      EndInfo: {
        Immediately: node.endInfo.immediately,
        AfterScenario: node.endInfo.afterScenario ?? "None",
        AtDay: DAYS[node.endInfo.atDay],
        AtTime: TIMES[node.endInfo.atTime],
      },
    }));

    downloadJson(exportData, "scenarios_export.json");
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

        <Button variant="default" size="sm" onClick={handleSaveProject}>
          <Save className="w-4 h-4 mr-2" />
          SAVE
        </Button>

        <div className="relative">
          <input
            type="file"
            accept=".json"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleLoadProject}
          />
          <Button variant="default" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            LOAD
          </Button>
        </div>

        <Button variant="default" size="sm" onClick={handleExportGame}>
          <Download className="w-4 h-4 mr-2" />
          EXPORT
        </Button>

        <Button variant="destructive" size="sm" onClick={handleClear}>
          <Trash2 className="w-4 h-4 mr-2" />
          CLEAR
        </Button>
      </div>
    </div>
  );
};
