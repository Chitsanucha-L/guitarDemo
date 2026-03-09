interface PickToggleProps {
  isHoldingPick: boolean;
  onToggle: () => void;
}

export default function PickToggle({ isHoldingPick, onToggle }: PickToggleProps) {
  return (
    <button
      onClick={onToggle}
      title={isHoldingPick ? "Click to disable play mode" : "Enable play mode to click strings"}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        isHoldingPick
          ? "bg-orange-500/90 text-white shadow-md shadow-orange-500/30"
          : "bg-gray-800/80 text-gray-400 hover:bg-gray-700/80 hover:text-gray-200"
      }`}
    >
      <span className="text-base">{isHoldingPick ? "🎸" : "🖱️"}</span>
      <span>{isHoldingPick ? "Play Mode" : "View Mode"}</span>
      <span className={`w-2 h-2 rounded-full ${isHoldingPick ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
    </button>
  );
}
