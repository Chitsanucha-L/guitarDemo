import { useTranslation } from "react-i18next";

interface GlobalLoadingScreenProps {
  modelProgress: number;
  modelActive: boolean;
  audioReady: boolean;
  audioProgress: number;
}

export default function GlobalLoadingScreen({
  modelProgress,
  modelActive,
  audioReady,
  audioProgress,
}: GlobalLoadingScreenProps) {
  const { t } = useTranslation();
  const loading = modelActive || !audioReady;
  const combinedProgress = modelActive
    ? modelProgress * 0.5
    : 50 + audioProgress * 0.5;

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#1a1a1a]">
      <div className="flex flex-col items-center gap-6">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-gray-700" />
          <div
            className="absolute inset-0 rounded-full border-4 border-t-yellow-400 animate-spin"
          />
        </div>
        <div className="text-center">
          <p className="text-white text-lg font-semibold">{t("loading.title")}</p>
          <p className="text-gray-400 text-sm mt-1">{Math.round(combinedProgress)}%</p>
        </div>
        <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${combinedProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
