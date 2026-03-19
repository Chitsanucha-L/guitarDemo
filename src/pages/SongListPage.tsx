import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "../guitar/ui/Navbar";
import MobileNav from "../guitar/ui/MobileNav";
import { SONGS, getSongChordNames } from "../guitar/data/songs";
import useIsMobileLike from "../guitar/hooks/useIsMobileLike";

export default function SongListPage() {
  const { t } = useTranslation();
  const isMobileLike = useIsMobileLike();

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {isMobileLike ? (
        <MobileNav rightModeLabel={t("nav.songMode")} />
      ) : (
        <Navbar title={t("nav.title")} activeLink="songs" />
      )}

      {/* Content */}
      <div
        className="px-4 lg:px-8 pb-8 max-w-4xl mx-auto w-full"
        style={{ paddingTop: isMobileLike ? "3.5rem" : "3.75rem" }}
      >
        <div className="text-center mb-6 lg:mb-10 mt-4 lg:mt-5">
          <h2 className="text-2xl lg:text-4xl font-bold text-yellow-400 mb-2">{t("song.title")}</h2>
          <p className="text-gray-400 text-sm lg:text-base">{t("song.subtitle")}</p>
        </div>

        <div className="grid gap-4 lg:gap-6">
          {SONGS.map((song) => {
            const chordNames = getSongChordNames(song);
            return (
              <Link
                key={song.id}
                to={`/songs/${song.id}`}
                className="group block bg-gray-900/80 border border-gray-700/50 rounded-2xl p-4 lg:p-5 hover:border-yellow-500/50 hover:bg-gray-800/80 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl lg:text-2xl font-bold text-white group-hover:text-yellow-400 transition-colors truncate">
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
