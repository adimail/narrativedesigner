import { useStore } from "../../store/useStore";
import {
  AlertTriangle,
  XCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useEffect, useState } from "react";

export const ValidationPanel = () => {
  const issues = useStore((state) => state.validationIssues);
  const selectNode = useStore((state) => state.selectNode);
  const isOpen = useStore((state) => state.isValidationPanelOpen);
  const toggleOpen = useStore((state) => state.toggleValidationPanel);
  const darkMode = useStore((state) => state.darkMode);

  const [activeSprite, setActiveSprite] = useState<string | null>(null);
  const [isSpriteVisible, setIsSpriteVisible] = useState(false);
  const [spriteX, setSpriteX] = useState(0);

  useEffect(() => {
    let showTimeout: number;
    let hideTimeout: number;

    const scheduleNextSprite = () => {
      const delay = Math.floor(Math.random() * 5000) + 3000;

      showTimeout = setTimeout(() => {
        const sprite =
          Math.random() > 0.5
            ? "/scenariograph/NathanSpriteScaled.png"
            : "/scenariograph/RheaSpriteScaled.png";

        const randomX = Math.floor(Math.random() * 80) + 10;

        setSpriteX(randomX);
        setActiveSprite(sprite);
        setIsSpriteVisible(true);

        const duration = Math.floor(Math.random() * 2000) + 2000;

        hideTimeout = setTimeout(() => {
          setIsSpriteVisible(false);
          setTimeout(() => {
            setActiveSprite(null);
            scheduleNextSprite();
          }, 500);
        }, duration);
      }, delay);
    };

    scheduleNextSprite();

    return () => {
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
    };
  }, []);

  return (
    <div
      className={cn(
        "absolute bottom-0 left-0 right-0 border-t-4 flex flex-col transition-all font-mono z-40 shadow-[0px_-4px_0px_0px_rgba(0,0,0,0.1)]",
        isOpen ? "h-48" : "h-10",
        darkMode ? "bg-slate-800 border-slate-600" : "bg-white border-black",
      )}
    >
      {activeSprite && (
        <img
          src={activeSprite}
          alt="Character Sprite"
          className={cn(
            "absolute w-16 h-auto transition-all duration-500 ease-in-out pointer-events-none",
            isSpriteVisible
              ? "bottom-full opacity-100 translate-y-0"
              : "bottom-10 opacity-0 translate-y-10",
          )}
          style={{ left: `${spriteX}%`, zIndex: -1 }}
        />
      )}

      <div
        className={cn(
          "px-4 h-10 border-b-4 flex items-center justify-between cursor-pointer transition-colors relative z-10",
          darkMode
            ? "bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"
            : "bg-gray-100 border-black hover:bg-gray-200 text-black",
        )}
        onClick={toggleOpen}
      >
        <h3 className="font-bold text-sm flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
          SYSTEM_LOG
        </h3>
        <div className="flex gap-4 text-xs font-bold">
          <span
            className={cn(
              "flex items-center gap-1",
              darkMode ? "text-red-400" : "text-red-600",
            )}
          >
            <XCircle className="w-4 h-4" />
            {issues.filter((i) => i.type === "error").length} ERR
          </span>
          <span
            className={cn(
              "flex items-center gap-1",
              darkMode ? "text-yellow-400" : "text-yellow-600",
            )}
          >
            <AlertTriangle className="w-4 h-4" />
            {issues.filter((i) => i.type === "warning").length} WARN
          </span>
        </div>
      </div>

      {isOpen && (
        <div
          className={cn(
            "flex-1 overflow-y-auto p-2 space-y-1 relative z-10",
            darkMode ? "bg-slate-900" : "bg-gray-50",
          )}
        >
          {issues.length === 0 ? (
            <div
              className={cn(
                "flex flex-col items-center justify-center h-full text-sm",
                darkMode ? "text-slate-500" : "text-gray-400",
              )}
            >
              <CheckCircle className="w-8 h-8 mb-2 text-green-500" />
              SYSTEM_OPTIMAL
            </div>
          ) : (
            issues.map((issue, idx) => (
              <div
                key={idx}
                onClick={() => selectNode(issue.nodeId, false)}
                className={cn(
                  "flex items-center gap-2 p-2 border-2 text-sm cursor-pointer hover:translate-x-1 transition-transform shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]",
                  issue.type === "error"
                    ? darkMode
                      ? "text-red-200 bg-red-900/30 border-red-800"
                      : "text-red-700 bg-red-100 border-black"
                    : darkMode
                      ? "text-yellow-200 bg-yellow-900/30 border-yellow-800"
                      : "text-yellow-700 bg-yellow-100 border-black",
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
