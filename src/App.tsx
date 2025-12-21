import { Toolbar } from "./components/panels/Toolbar";
import { Canvas } from "./components/canvas/Canvas";
import { PropertiesPanel } from "./components/panels/PropertiesPanel";
import { ValidationPanel } from "./components/panels/ValidationPanel";

function App() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-200 text-black font-mono">
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
