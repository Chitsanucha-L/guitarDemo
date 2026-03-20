import { useTranslation } from "react-i18next";

export type MobileBottomTab = "play" | "strum" | "progression" | "scale";

interface MobileBottomTabsProps {
  activeTab: MobileBottomTab | null;
  onTabChange: (tab: MobileBottomTab) => void;
}

const TAB_META: Array<{
  id: MobileBottomTab;
  icon: string;
}> = [
  { id: "play", icon: "🎸" },
  { id: "strum", icon: "🎵" },
  { id: "progression", icon: "🔄" },
  { id: "scale", icon: "🎹" },
];

export default function MobileBottomTabs({
  activeTab,
  onTabChange,
}: MobileBottomTabsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-stretch justify-around px-1.5 pb-1.5 border-b border-gray-700/30">
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
            className={`flex-1 flex items-center justify-center gap-1.5 px-1.5 py-3 rounded-xl transition-all touch-manipulation ${
              isActive
                ? "bg-gradient-to-r from-yellow-400/20 to-amber-400/20"
                : "bg-transparent hover:bg-white/5 active:bg-white/10"
            }`}
          >
            <span className="text-[15px] leading-none" aria-hidden>
              {tab.icon}
            </span>
            <span
              className={`text-xs font-bold ${
                isActive ? "text-yellow-200" : "text-gray-400"
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
