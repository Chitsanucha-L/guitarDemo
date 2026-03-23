import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

interface MobileNavProps {
  chordName?: string | null;
  rightModeLabel?: string;
  rightModeActive?: boolean;
  onRightModeToggle?: () => void;
  /** "fixed" (default) pins to viewport top; "static" renders in normal flow. */
  position?: "fixed" | "static";
}

export default function MobileNav({
  chordName,
  rightModeLabel,
  rightModeActive,
  onRightModeToggle,
  position = "fixed",
}: MobileNavProps) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const resolvedRightLabel = useMemo(() => {
    return rightModeLabel ?? t("pick.playMode");
  }, [rightModeLabel, t]);

  const isToggle = typeof onRightModeToggle === "function";

  return (
    <>
      <nav
        data-mobile-nav="true"
        className={`${
          position === "fixed" ? "fixed top-0 left-0 right-0 z-60" : "relative z-10 shrink-0"
        } flex items-center justify-between px-3 py-1.5 bg-gray-900/80 backdrop-blur-md border-b border-gray-700/40`}
      >
        {/* Left: hamburger */}
        <button
          type="button"
          className="flex items-center justify-center rounded-xl text-gray-300 hover:bg-gray-700/80 active:scale-95 transition touch-manipulation"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Center: chord badge */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <div className="rounded-xl lg:rounded-2xl bg-gray-900/75 border border-gray-700/50 backdrop-blur-md px-2.5 py-1 shadow-lg">
            <span className="text-base font-bold text-white">
              {chordName ?? "—"}
            </span>
          </div>
        </div>

        {/* Right: mode indicator / toggle */}
        <div className="ml-auto">
          {isToggle ? (
            <button
              type="button"
              onClick={onRightModeToggle}
              className={`py-1.5 px-4 rounded-xl text-[12px] font-bold transition-all touch-manipulation flex items-center gap-2 ${
                rightModeActive
                  ? "bg-emerald-600 text-white ring-2 ring-emerald-400"
                  : "bg-gray-700/90 text-gray-300 hover:bg-gray-600"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  rightModeActive ? "bg-white" : "bg-gray-500"
                }`}
                aria-hidden
              />
              {resolvedRightLabel}
            </button>
          ) : (
            <div className="py-1.5 px-4 rounded-xl text-[12px] font-bold flex items-center bg-gray-700/50 text-gray-200 border border-gray-600/40">
              {resolvedRightLabel}
            </div>
          )}
        </div>
      </nav>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            aria-hidden
            onClick={() => setMenuOpen(false)}
          />
          <div
            className="fixed top-0 left-0 z-60 w-64 max-w-[85vw] h-full bg-gray-900 border-r border-gray-700 shadow-2xl rounded-r-2xl overflow-hidden flex flex-col"
            style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
          >
            <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                {t("nav.title")}
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-gray-300 hover:bg-gray-800/60 active:scale-95 transition touch-manipulation"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col p-2">
              <Link
                to="/"
                className="min-h-[44px] flex items-center px-4 rounded-xl text-[15px] text-gray-200 hover:bg-gray-700/80"
                onClick={() => setMenuOpen(false)}
              >
                {t("nav.home")}
              </Link>
              <Link
                to="/game"
                className="min-h-[44px] flex items-center px-4 rounded-xl text-[15px] text-gray-200 hover:bg-gray-700/80"
                onClick={() => setMenuOpen(false)}
              >
                {t("nav.gameMode")}
              </Link>
              <Link
                to="/songs"
                className="min-h-[44px] flex items-center px-4 rounded-xl text-[15px] text-gray-200 hover:bg-gray-700/80"
                onClick={() => setMenuOpen(false)}
              >
                {t("nav.songMode")}
              </Link>
            </div>
            <div className="mt-auto p-4 border-t border-gray-700">
              <span className="text-xs text-gray-500 block mb-2">{t("nav.title")}</span>
              <LanguageSwitcher />
            </div>
          </div>
        </>
      )}
    </>
  );
}
