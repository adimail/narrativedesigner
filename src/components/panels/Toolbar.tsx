import { Download, Upload } from "lucide-react";
import { Button } from "../ui/button";
import { useStore } from "../../store/useStore";
import { ScenarioNode } from "../../types/schema";

export const Toolbar = () => {
  const nodes = useStore((state) => state.nodes);
  const importData = useStore((state) => state.importData);
  const validateAll = useStore((state) => state.validateAll);

  const handleExport = () => {
    validateAll();
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(nodes, null, 2));
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

  return (
    <div className="h-16 border-b-4 border-black bg-white px-4 flex items-center justify-between z-20 relative font-mono">
      <div className="flex items-center gap-4">
        <div className="bg-black text-white px-3 py-1 font-bold text-xl shadow-[4px_4px_0px_0px_rgba(100,100,100,1)]">
          SCENARIO_GRAPH
        </div>
        <div className="h-8 w-1 bg-black mx-2" />
        <div className="text-sm font-bold">
          NODES: {nodes.length.toString().padStart(3, "0")}
        </div>
      </div>

      <div className="flex items-center gap-4">
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
