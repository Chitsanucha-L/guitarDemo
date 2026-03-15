import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

export type NavActiveLink = "home" | "game" | "songs";

interface NavbarProps {
  /** Navbar title (e.g. app name or page title). */
  title: string;
  /** Which nav link to highlight as current page. */
  activeLink?: NavActiveLink;
  /** "home" = lighter bar (Home page), "default" = dark with border (Game, Songs). */
  variant?: "home" | "default";
}

const linkClass = "text-sm sm:text-base transition-colors";
const activeClass = "text-yellow-400";
const inactiveClass = "hover:text-yellow-400";

export default function Navbar({
  title,
  activeLink,
  variant = "default",
}: NavbarProps) {
  const { t } = useTranslation();

  const navClassName =
    variant === "home"
      ? "fixed top-0 left-0 w-full bg-gray-800 text-white px-3 py-2 sm:p-4 flex justify-between items-center shadow-md z-10"
      : "fixed top-0 left-0 w-full bg-gray-900/95 backdrop-blur-md text-white px-3 py-2 sm:p-4 flex justify-between items-center shadow-lg z-10 border-b border-gray-700/50";

  return (
    <nav className={navClassName}>
      <h1 className="text-base sm:text-xl font-bold truncate mr-2">{title}</h1>
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <Link
          to="/"
          className={`${linkClass} ${activeLink === "home" ? activeClass : inactiveClass}`}
        >
          {t("nav.home")}
        </Link>
        <Link
          to="/game"
          className={`${linkClass} ${activeLink === "game" ? activeClass : inactiveClass}`}
        >
          {t("nav.gameMode")}
        </Link>
        <Link
          to="/songs"
          className={`${linkClass} ${activeLink === "songs" ? activeClass : inactiveClass}`}
        >
          {t("nav.songMode")}
        </Link>
        <LanguageSwitcher />
      </div>
    </nav>
  );
}
