import { useTranslation } from "react-i18next";
import type { CanvasWorldHeight } from "../GameCanvas";

interface CanvasViewControlButtonsProps {
  canvasView: CanvasWorldHeight;
  className?: string;
}

/** +/−/reset มุมมองคางคกิตาร์ — สไตล์เดียวกับ transport บน Song page */
export default function CanvasViewControlButtons({
  canvasView,
  className = "",
}: CanvasViewControlButtonsProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`flex items-center justify-end gap-1.5 lg:gap-2 ${className}`}
      role="group"
      aria-label={t("game.canvasViewControls")}
    >
      <button
        type="button"
        onClick={canvasView.bumpUp}
        disabled={canvasView.atMax}
        title={t("game.canvasZoomOut")}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-600/50
          bg-gray-800/80 text-sm font-bold text-gray-200 transition-colors duration-200
          hover:bg-gray-700 hover:text-white active:scale-95 disabled:opacity-30
          lg:h-10 lg:w-10 lg:text-lg touch-manipulation"
      >
        +
      </button>
      <button
        type="button"
        onClick={canvasView.bumpDown}
        disabled={canvasView.atMin}
        title={t("game.canvasZoomIn")}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-600/50
          bg-gray-800/80 text-sm font-bold text-gray-200 transition-colors duration-200
          hover:bg-gray-700 hover:text-white active:scale-95 disabled:opacity-30
          lg:h-10 lg:w-10 lg:text-lg touch-manipulation"
      >
        −
      </button>
      <button
        type="button"
        onClick={canvasView.resetHeight}
        title={t("game.canvasResetView")}
        className="flex h-8 min-w-[2.75rem] shrink-0 items-center justify-center rounded-full border-2 border-red-500/55
          bg-red-700 px-2 text-[9px] font-bold uppercase leading-none tracking-wide text-white shadow-md shadow-red-500/25
          transition-all duration-200 hover:bg-red-600 hover:border-red-600/70 hover:shadow-red-600/35
          active:scale-95 lg:h-10 lg:min-w-[3.25rem] lg:px-2.5 lg:text-[10px] touch-manipulation"
      >
        {t("game.canvasResetButton")}
      </button>
    </div>
  );
}
