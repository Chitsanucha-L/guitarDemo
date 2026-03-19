import { useTranslation } from "react-i18next";

export type MobileBottomTab = "play" | "strum" | "progression" | "scale";

interface MobileBottomTabsProps {
  activeTab: MobileBottomTab;
  onTabChange: (tab: MobileBottomTab) => void;
}

const TAB_META: Array<{
  id: MobileBottomTab;
  icon: string;
  label: string;
}> = [
  { id: "play", icon: "🎸", label: "Play" },
  { id: "strum", icon: "🎵", label: "Strumming" },
  { id: "progression", icon: "🔄", label: "Progression" },
  { id: "scale", icon: "🎹", label: "Scale" },
];

export default function MobileBottomTabs({
  activeTab,
  onTabChange,
}: MobileBottomTabsProps) {
  const { t } = useTranslation();

  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-50 bg-gray-900/80 backdrop-blur-md border-t border-gray-700/40"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-stretch justify-around px-2 h-[56px] lg:h-[40px]">
        {TAB_META.map((tab) => {
          const isActive = tab.id === activeTab;
          const label =
            tab.id === "play"
              ? t("sections.play")
              : tab.id === "strum"
                ? t("sections.strumming")
                : tab.id === "progression"
                  ? t("sections.progression")
                  : t("sections.scale");

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 min-h-[44px] flex items-center justify-center gap-2 px-1.5 rounded-2xl transition-all touch-manipulation ${
                isActive
                  ? "bg-gradient-to-r from-yellow-400/20 to-amber-400/20"
                  : "bg-transparent hover:bg-white/5"
              }`}
            >
              <span className="text-[16px] leading-none" aria-hidden>
                {tab.icon}
              </span>
              <span
                className={`text-xs font-bold ${
                  isActive ? "text-yellow-200" : "text-gray-300"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

