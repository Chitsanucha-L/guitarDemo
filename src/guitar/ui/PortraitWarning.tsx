import { useTranslation } from "react-i18next";

export default function PortraitWarning() {
  const { t } = useTranslation();

  return (
    <div className="portrait-overlay fixed inset-0 z-[9999] bg-[#1a1a1a] flex-col items-center justify-center text-center p-8">
      <div className="text-6xl mb-6 animate-bounce">📱</div>
      <div className="text-5xl mb-4 rotate-90 inline-block">↻</div>
      <h2 className="text-white text-xl font-bold mb-3">{t("portrait.title")}</h2>
      <p className="text-gray-400 text-sm max-w-xs">{t("portrait.message")}</p>
    </div>
  );
}
