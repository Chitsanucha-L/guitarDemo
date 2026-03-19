import { useTranslation } from "react-i18next";

const LANGS = ["en", "th"] as const;
const LABELS: Record<string, string> = { en: "EN", th: "TH" };

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="inline-flex w-fit rounded-md overflow-hidden border border-gray-500/50">
      {LANGS.map((lng) => {
        const active = i18n.language === lng;
        return (
          <button
            key={lng}
            onClick={() => i18n.changeLanguage(lng)}
            className={`px-2.5 py-1 text-sm font-semibold transition-colors duration-150 ${
              active
                ? "bg-white text-gray-900"
                : "bg-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            {LABELS[lng]}
          </button>
        );
      })}
    </div>
  );
}
