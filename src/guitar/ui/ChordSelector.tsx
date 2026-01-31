import { majorChords, minorChords } from "../data/chords";

interface ChordSelectorProps {
  selectedChordName: string | null;
  onSelect: (chord: string) => void;
  onClear: () => void;
}

export default function ChordSelector({ selectedChordName, onSelect, onClear }: ChordSelectorProps) {
  return (
    <div className="mt-4 space-y-3">
      {/* แถวที่ 1: Major Chords */}
      <div className="flex gap-2">
        <span className="text-white text-sm font-medium self-center mr-2">Major:</span>
        {majorChords.map(chord => {
          const isActive = selectedChordName === chord;
          return (
            <button
              key={chord}
              className={`px-4 py-2 text-white text-[18px] font-semibold rounded-md shadow-md transition-all duration-200 ${isActive
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 ring-4 ring-blue-300 scale-110"
                  : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                }`}
              onClick={() => onSelect(chord)}
            >
              {chord}
            </button>
          );
        })}
      </div>

      {/* แถวที่ 2: Minor Chords */}
      <div className="flex gap-2">
        <span className="text-white text-sm font-medium self-center mr-2">Minor:</span>
        {minorChords.map(chord => {
          const isActive = selectedChordName === chord;
          return (
            <button
              key={chord}
              className={`px-4 py-2 text-white text-[18px] font-semibold rounded-md shadow-md transition-all duration-200 ${isActive
                  ? "bg-gradient-to-r from-purple-600 to-purple-700 ring-4 ring-purple-300 scale-110"
                  : "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                }`}
              onClick={() => onSelect(chord)}
            >
              {chord}
            </button>
          );
        })}
      </div>

      {/* แถวที่ 3: ปุ่มควบคุม */}
      <div className="flex gap-2">
        <button
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-[16px] font-semibold rounded-md shadow-md transition"
          onClick={() => alert("เพิ่มคอร์ดใหม่")}
        >
          + More
        </button>
        <button
          className="px-4 py-2 bg-red-600 text-white text-[16px] font-medium rounded-md hover:bg-red-500 transition"
          onClick={onClear}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
