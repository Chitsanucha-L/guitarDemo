interface ChordBadgeProps {
  chordName: string | null;
}

export default function ChordBadge({ chordName }: ChordBadgeProps) {
  if (!chordName) return null;

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 z-30 rounded-2xl bg-gray-900/90 backdrop-blur-md px-4 py-2 shadow-lg border border-gray-700/50"
      style={{
        top: "calc(3.5rem + env(safe-area-inset-top, 0px))",
      }}
    >
      <span className="text-sm font-bold text-white">{chordName}</span>
    </div>
  );
}
