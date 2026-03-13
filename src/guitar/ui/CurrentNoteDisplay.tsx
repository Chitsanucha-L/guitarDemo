import { useTranslation } from "react-i18next";

interface CurrentNoteDisplayProps {
  currentNote: string;
  chordName?: string | null;
}

export default function CurrentNoteDisplay({ currentNote, chordName }: CurrentNoteDisplayProps) {
  const { t } = useTranslation();

  if (!currentNote && !chordName) return null;

  return (
    <div className="space-y-2">
      {chordName && (
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg px-4 py-2.5 text-center shadow-lg border border-gray-700/50">
          <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
            {t("nowPlaying.title")}
          </div>
          <div className="text-xl font-bold text-white mt-0.5">{chordName}</div>
        </div>
      )}
      {currentNote && (
        <div className="bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg text-center">
          <div className="text-[10px] opacity-70 uppercase tracking-wider">{t("nowPlaying.note")}</div>
          <div className="text-2xl font-bold">{currentNote}</div>
        </div>
      )}
    </div>
  );
}
