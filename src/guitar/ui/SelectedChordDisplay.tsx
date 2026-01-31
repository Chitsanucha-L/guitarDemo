interface SelectedChordDisplayProps {
  selectedChordName: string | null;
}

export default function SelectedChordDisplay({ selectedChordName }: SelectedChordDisplayProps) {
  if (!selectedChordName) return null;

  return (
    <div className="z-10 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg shadow-xl pointer-events-auto w-fit">
      <div className="text-sm opacity-80">คอร์ดที่เลือก:</div>
      <div className="text-4xl font-bold">{selectedChordName}</div>
    </div>
  );
}
