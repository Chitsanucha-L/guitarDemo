import type { ChordData, Note } from "../data/types";
import { fingerColors } from "../data/constants";

interface ChordDiagramProps {
  chordName: string;
  chordData: ChordData;
  compact?: boolean;
}

const STRING_ORDER: Note[] = ["E6", "A", "D", "G", "B", "e1"];
const STRING_LABELS = ["E", "A", "D", "G", "B", "e"];

const S = 1.35;
const SX = 18 * S;
const GAP = 15 * S;
const FRET_H = 16 * S;
const TOP = 24;
const NUT_Y = TOP;
const DOT_R = 6.5;
const BARRE_H = 10;

function sx(i: number) { return SX + i * GAP; }

export default function ChordDiagram({ chordName, chordData, compact = false }: ChordDiagramProps) {
  const frets = STRING_ORDER.map(s => chordData.notes[s]?.fret ?? -1);
  const playableFrets = frets.filter(f => f > 0);
  const minFret = playableFrets.length > 0 ? Math.min(...playableFrets) : 0;
  const maxFret = playableFrets.length > 0 ? Math.max(...playableFrets) : 0;

  const visibleFrets = 5;
  const startFret = maxFret <= visibleFrets ? 1 : minFret;

  const gridBottom = NUT_Y + visibleFrets * FRET_H;
  const svgW = SX + 5 * GAP + SX;
  const svgH = gridBottom + 20;

  const barre = chordData._barre;
  let barreFromIdx = -1;
  let barreToIdx = -1;
  let barreFret = -1;
  if (barre) {
    barreFromIdx = STRING_ORDER.indexOf(barre.fromString);
    barreToIdx = STRING_ORDER.indexOf(barre.toString);
    barreFret = barre.fret;
    if (barreFromIdx > barreToIdx) {
      [barreFromIdx, barreToIdx] = [barreToIdx, barreFromIdx];
    }
  }

  return (
    <div className={`bg-gray-900/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700/50 ${compact ? "px-2 py-2 w-full" : "px-3 py-3 w-56"}`}>
      <div className={`text-center ${compact ? "mb-0.5" : "mb-1.5"}`}>
        <div className={`${compact ? "text-xs" : "text-sm"} font-bold text-white`}>{chordName}</div>
      </div>

      <div
        className={`relative mx-auto ${compact ? "w-full overflow-hidden" : ""}`}
        style={compact ? { width: "100%" } : { width: svgW }}
      >
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full block">
          {/* Fret numbers per string */}
          {frets.map((f, i) => (
            <text key={`num-${i}`}
              x={sx(i)} y="7"
              fontSize="10" fill="#9ca3af" fontFamily="monospace" fontWeight="bold"
              textAnchor="middle" dominantBaseline="middle"
            >{f < 0 ? "x" : String(f)}</text>
          ))}

          {/* Fret position indicator */}
          {startFret > 1 && (
            <text x="1" y={NUT_Y + FRET_H * 0.5} fontSize="11" fill="#9ca3af" fontWeight="bold">{startFret}fr</text>
          )}

          {/* Muted / Open indicators */}
          {frets.map((f, i) => {
            const x = sx(i);
            if (f < 0) {
              return (
                <text key={`top-${i}`} x={x} y={NUT_Y - 5}
                  fontSize="10" fill="#6b7280"
                  textAnchor="middle" dominantBaseline="middle">x</text>
              );
            }
            if (f === 0) {
              return (
                <circle key={`top-${i}`} cx={x} cy={NUT_Y - 5} r="3.5"
                  fill="none" stroke="#d1d5db" strokeWidth="1.2"
                />
              );
            }
            return null;
          })}

          {/* Nut or top line */}
          <line x1={sx(0)} y1={NUT_Y} x2={sx(5)} y2={NUT_Y}
            stroke={startFret <= 1 ? "#d1d5db" : "#4b5563"}
            strokeWidth={startFret <= 1 ? 3 : 1}
          />

          {/* Fret lines */}
          {Array.from({ length: visibleFrets }, (_, i) => (
            <line key={`fret-${i}`}
              x1={sx(0)} y1={NUT_Y + (i + 1) * FRET_H}
              x2={sx(5)} y2={NUT_Y + (i + 1) * FRET_H}
              stroke="#4b5563" strokeWidth="1"
            />
          ))}

          {/* String lines */}
          {STRING_ORDER.map((_, i) => (
            <line key={`str-${i}`}
              x1={sx(i)} y1={NUT_Y}
              x2={sx(i)} y2={gridBottom}
              stroke="#6b7280" strokeWidth="1"
            />
          ))}

          {/* Barre bar */}
          {barre && barreFromIdx >= 0 && barreToIdx >= 0 && (() => {
            const relativeFret = barreFret - startFret;
            if (relativeFret < 0 || relativeFret >= visibleFrets) return null;
            const x1 = sx(barreFromIdx);
            const x2 = sx(barreToIdx);
            const y = NUT_Y + relativeFret * FRET_H + FRET_H / 2;
            return (
              <rect
                x={x1 - 5} y={y - BARRE_H / 2}
                width={x2 - x1 + 10} height={BARRE_H}
                rx="5" ry="5"
                fill={fingerColors[barre.finger]}
                opacity="0.85"
              />
            );
          })()}

          {/* Finger dots */}
          {frets.map((f, i) => {
            if (f <= 0) return null;
            const relativeFret = f - startFret;
            if (relativeFret < 0 || relativeFret >= visibleFrets) return null;

            if (barre && f === barreFret && i >= barreFromIdx && i <= barreToIdx) return null;

            const x = sx(i);
            const y = NUT_Y + relativeFret * FRET_H + FRET_H / 2;
            const noteKey = STRING_ORDER[i];
            const finger = chordData.notes[noteKey]?.finger;
            const color = finger ? fingerColors[finger] : "#9ca3af";

            return (
              <circle key={`dot-${i}`} cx={x} cy={y} r={DOT_R} fill={color} />
            );
          })}

          {/* String labels */}
          {STRING_LABELS.map((label, i) => (
            <text key={`label-${i}`}
              x={sx(i)} y={gridBottom + 12}
              fontSize="9" fill="#9ca3af" fontFamily="monospace" fontWeight="bold"
              textAnchor="middle" dominantBaseline="hanging"
            >{label}</text>
          ))}
        </svg>
      </div>
    </div>
  );
}
