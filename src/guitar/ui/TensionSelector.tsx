import type { TensionType } from "../data/types";
import { chordTensions } from "../data/chordTensions";

interface TensionSelectorProps {
  selectedChordName: string | null;
  selectedTensions: TensionType[];
  onToggle: (tension: TensionType) => void;
}

export default function TensionSelector({ selectedChordName, selectedTensions, onToggle }: TensionSelectorProps) {
  if (!selectedChordName || !chordTensions[selectedChordName]) {
    return null;
  }

  return (
    <>
      <div className="z-10 text-white text-sm font-medium pointer-events-none mb-1.5">
        Tension:
      </div>
      <div className="z-10 flex gap-3 pointer-events-auto">
        {Object.keys(chordTensions[selectedChordName]).map((tension) => {
          const tensionType = tension as TensionType;
          const isActive = selectedTensions.includes(tensionType);
          
          return (
            <button
              key={tension}
              className={`px-2 py-1 text-sm font-bold rounded-md shadow-md transition-all duration-300 border-2 ${
                isActive
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-300 scale-105 shadow-green-500/50"
                  : "bg-gray-700 text-gray-400 border-gray-600 hover:bg-gray-600 hover:border-gray-500"
              }`}
              onClick={() => onToggle(tensionType)}
            >
              <span className="flex items-center gap-1">
                {isActive && <span className="text-sm">✅</span>}
                {!isActive && <span className="text-sm opacity-50">⬜</span>}
                {tension}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
