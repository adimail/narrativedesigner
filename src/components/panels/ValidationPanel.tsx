import { useStore } from "../../store/useStore";
import {
  AlertTriangle,
  XCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "../../lib/utils";

export const ValidationPanel = () => {
  const issues = useStore((state) => state.validationIssues);
  const selectNode = useStore((state) => state.selectNode);
  const isOpen = useStore((state) => state.isValidationPanelOpen);
  const toggleOpen = useStore((state) => state.toggleValidationPanel);

  return (
    <div
      className={cn(
        "absolute bottom-0 left-0 right-0 border-t-4 border-black bg-white flex flex-col transition-all font-mono z-40 shadow-[0px_-4px_0px_0px_rgba(0,0,0,0.1)]",
        isOpen ? "h-48" : "h-10",
      )}
    >
      <div
        className="px-4 h-10 border-b-4 border-black flex items-center justify-between bg-gray-100 cursor-pointer hover:bg-gray-200"
        onClick={toggleOpen}
      >
        <h3 className="font-bold text-sm text-black flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
          SYSTEM_LOG
        </h3>
        <div className="flex gap-4 text-xs font-bold">
          <span className="flex items-center gap-1 text-red-600">
            <XCircle className="w-4 h-4" />{" "}
            {issues.filter((i) => i.type === "error").length} ERR
          </span>
          <span className="flex items-center gap-1 text-yellow-600">
            <AlertTriangle className="w-4 h-4" />{" "}
            {issues.filter((i) => i.type === "warning").length} WARN
          </span>
        </div>
      </div>

      {isOpen && (
        <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-gray-50">
          {issues.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
              <CheckCircle className="w-8 h-8 mb-2 text-green-500" />
              SYSTEM_OPTIMAL
            </div>
          ) : (
            issues.map((issue, idx) => (
              <div
                key={idx}
                onClick={() => selectNode(issue.nodeId, false)}
                className={cn(
                  "flex items-center gap-2 p-2 border-2 border-black text-sm cursor-pointer hover:translate-x-1 transition-transform shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]",
                  issue.type === "error"
                    ? "text-red-700 bg-red-100"
                    : "text-yellow-700 bg-yellow-100",
                )}
              >
                {issue.type === "error" ? (
                  <XCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span className="font-bold">[{issue.type.toUpperCase()}]</span>
                <span>{issue.message}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
