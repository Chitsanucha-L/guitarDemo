interface CurrentNoteDisplayProps {
  currentNote: string;
}

export default function CurrentNoteDisplay({ currentNote }: CurrentNoteDisplayProps) {
  if (!currentNote) return null;

  return (
    <div className="absolute top-5 right-5 z-10 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg shadow-xl pointer-events-auto">
      <div className="text-sm opacity-80">กำลังเล่น:</div>
      <div className="text-3xl font-bold">{currentNote}</div>
    </div>
  );
}
