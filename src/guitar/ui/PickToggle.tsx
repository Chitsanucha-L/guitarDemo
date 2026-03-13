import { useTranslation } from "react-i18next";

interface PickToggleProps {
  isHoldingPick: boolean;
  onToggle: () => void;
}

export default function PickToggle({ isHoldingPick, onToggle }: PickToggleProps) {
  const { t } = useTranslation();

  return (
    <button
      onClick={onToggle}
      title={isHoldingPick ? t("pick.disableTitle") : t("pick.enableTitle")}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        isHoldingPick
          ? "bg-orange-500/90 text-white shadow-md shadow-orange-500/30"
          : "bg-gray-800/80 text-gray-400 hover:bg-gray-700/80 hover:text-gray-200"
      }`}
    >
      <span className="text-base">{isHoldingPick ? "🎸" : "🖱️"}</span>
      <span>{isHoldingPick ? t("pick.playMode") : t("pick.viewMode")}</span>
      <span className={`w-2 h-2 rounded-full ${isHoldingPick ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
    </button>
  );
}
