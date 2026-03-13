import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../guitar/ui/LanguageSwitcher";
import { SONGS, getSongChordNames } from "../guitar/data/songs";

export default function SongListPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full bg-gray-900/95 backdrop-blur-md text-white px-3 py-2 sm:p-4 flex justify-between items-center shadow-lg z-10 border-b border-gray-700/50">
        <h1 className="text-base sm:text-xl font-bold truncate mr-2">{t("nav.title")}</h1>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Link to="/" className="text-sm sm:text-base hover:text-yellow-400 transition-colors">{t("nav.home")}</Link>
          <Link to="/game" className="text-sm sm:text-base hover:text-yellow-400 transition-colors">{t("nav.gameMode")}</Link>
          <Link to="/songs" className="text-sm sm:text-base text-yellow-400">{t("nav.songMode")}</Link>
          <LanguageSwitcher />
        </div>
      </nav>

      {/* Content */}
      <div className="pt-16 sm:pt-20 px-4 sm:px-8 pb-8 max-w-4xl mx-auto w-full">
        <div className="text-center mb-8 sm:mb-12 mt-4 sm:mt-5">
          <h2 className="text-3xl sm:text-5xl font-bold text-yellow-400 mb-2">{t("song.title")}</h2>
          <p className="text-gray-400 text-sm sm:text-base">{t("song.subtitle")}</p>
        </div>

        <div className="grid gap-4 sm:gap-6">
          {SONGS.map((song) => {
            const chordNames = getSongChordNames(song);
            return (
              <Link
                key={song.id}
                to={`/songs/${song.id}`}
                className="group block bg-gray-900/80 border border-gray-700/50 rounded-2xl p-5 sm:p-6 hover:border-yellow-500/50 hover:bg-gray-800/80 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-yellow-400 transition-colors truncate">
                      {song.title}
                    </h3>
                    <p className="text-gray-400 text-sm mt-0.5">{song.artist}</p>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {chordNames.map((c) => (
                        <span
                          key={c}
                          className="inline-block bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg px-2.5 py-0.5 text-sm font-semibold"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="inline-block bg-green-600/20 text-green-400 border border-green-500/30 rounded-lg px-3 py-0.5 text-xs font-bold uppercase">
                      {t("song.beginner")}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {song.tempo} BPM &middot; {t("song.key")} {song.key}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {song.chords.length} {t("song.changes")}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
