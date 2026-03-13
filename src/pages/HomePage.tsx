// src/pages/HomePage.tsx
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Guitar3D from "../guitar/Guitar3D";
import LanguageSwitcher from "../guitar/ui/LanguageSwitcher";

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-screen max-h-screen w-full h-full flex flex-col">
      <nav className="fixed top-0 left-0 w-full bg-gray-800 text-white px-3 py-2 sm:p-4 flex justify-between items-center shadow-md z-10">
        <h1 className="text-base sm:text-xl font-bold truncate mr-2">{t("nav.title")}</h1>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Link to="/" className="text-sm sm:text-base text-yellow-400">{t("nav.home")}</Link>
          <Link to="/game" className="text-sm sm:text-base hover:text-yellow-400">{t("nav.gameMode")}</Link>
          <LanguageSwitcher />
        </div>
      </nav>

      {/* ✅ Main Content */}
      <div className="flex-1 w-full h-full z-0">
        <Guitar3D />
      </div>
    </div>
  );
}
