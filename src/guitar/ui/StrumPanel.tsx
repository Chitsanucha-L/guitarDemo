import { useState, useCallback, useMemo, useImperativeHandle, useEffect, forwardRef } from "react";
import { useTranslation } from "react-i18next";
import {
  useStrummingEngine,
  PRESET_PATTERNS,
  SUBDIVISIONS_PER_BAR,
  type Stroke,
  type StrumPattern,
} from "../hooks/useStrummingEngine";

export interface StrumPanelHandle {
  isPlaying: boolean;
  toggle: () => void;
}

interface StrumPanelProps {
  onStroke: (stroke: Stroke, subdivision: number) => void;
  onBarChange?: () => void;
  hidePlayButton?: boolean;
  onPlayingChange?: (playing: boolean) => void;
}

const BEAT_LABELS = [
  "1", "e", "&", "a",
  "2", "e", "&", "a",
  "3", "e", "&", "a",
  "4", "e", "&", "a",
];

const StrumPanel = forwardRef<StrumPanelHandle, StrumPanelProps>(function StrumPanel(
  { onStroke, onBarChange, hidePlayButton, onPlayingChange },
  ref,
) {
  const { t } = useTranslation();
  const [pattern, setPattern] = useState<StrumPattern>(PRESET_PATTERNS[0]);
  const [bpm, setBpm] = useState(PRESET_PATTERNS[0].recommendedBpm ?? 65);

  const handleStroke = useCallback(
    (stroke: Stroke, subdivision: number, _velocity: number) => onStroke(stroke, subdivision),
    [onStroke],
  );

  const { isPlaying, currentBeat, play, stop } = useStrummingEngine({
    pattern,
    bpm,
    onStroke: handleStroke,
    onBarChange,
  });

  useImperativeHandle(ref, () => ({
    isPlaying,
    toggle: () => (isPlaying ? stop() : play()),
  }), [isPlaying, play, stop]);

  useEffect(() => {
    onPlayingChange?.(isPlaying);
  }, [isPlaying, onPlayingChange]);

  const grid = useMemo(() => {
    return Array.from({ length: SUBDIVISIONS_PER_BAR }, (_, i) => {
      const step = pattern.steps.find(s => s.subdivision === i);
      return step ? { stroke: step.stroke } : null;
    });
  }, [pattern]);

  const patternSummary = useMemo(() => {
    const labels = ["1", "e", "&", "a", "2", "e", "&", "a", "3", "e", "&", "a", "4", "e", "&", "a"];
    return labels.map((label, i) => {
      const step = pattern.steps.find(s => s.subdivision === i);
      return {
        label,
        stroke: step ? (step.stroke === "down" ? "D" : "U") : null,
      };
    });
  }, [pattern]);

  return (
    <div className="space-y-3">
      {/* Pattern presets */}
      <div className="flex flex-wrap gap-1.5">
        {PRESET_PATTERNS.map(p => (
          <button
            key={p.id}
            disabled={isPlaying}
            title={p.recommendedBpm != null ? t("strum.recommended", { bpm: p.recommendedBpm }) : undefined}
            className={`px-3 py-1.5 text-sm font-bold rounded-md shadow-md transition-all duration-200 ${
              pattern.id === p.id
                ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white ring-2 ring-violet-300 scale-105"
                : "bg-gray-700/80 text-gray-300 hover:bg-gray-600"
            } ${isPlaying ? "opacity-60 cursor-not-allowed" : ""}`}
            onClick={() => {
              setPattern(p);
              if (p.recommendedBpm != null) setBpm(p.recommendedBpm);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Pattern summary — all 16 subdivisions */}
      <div className="flex items-center justify-center py-1">
        {patternSummary.map((slot, i) => (
          <div key={i} className="flex flex-col items-center flex-1 min-w-0">
            <span className={`text-sm font-bold leading-none ${
              slot.stroke
                ? slot.stroke === "D" ? "text-yellow-400" : "text-cyan-400"
                : "text-gray-700"
            }`}>
              {slot.stroke === "D" ? "↓" : slot.stroke === "U" ? "↑" : "·"}
            </span>
            <span className={`text-[10px] font-bold leading-tight ${
              slot.stroke ? "text-gray-300" : "text-gray-600"
            }`}>
              {slot.stroke ?? "–"}
            </span>
            <span className={`text-[9px] leading-tight ${
              slot.label.match(/\d/) ? "text-gray-400 font-bold" : "text-gray-600"
            }`}>
              {slot.label}
            </span>
          </div>
        ))}
      </div>

      {/* 16th-note subdivision grid */}
      <div className="flex items-end gap-[2px]">
        {grid.map((slot, i) => {
          const isActive = isPlaying && currentBeat === i;
          const isQuarter = i % 4 === 0;
          const isEighth = i % 2 === 0;

          if (!slot) {
            return (
              <div key={i} className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
                <div
                  className={`flex items-center justify-center w-full h-8 rounded ${
                    isActive
                      ? "bg-gray-600/80"
                      : isQuarter ? "bg-gray-800/60" : "bg-gray-800/25"
                  }`}
                >
                  <span className="text-gray-600 text-[8px]">·</span>
                </div>
                <span className={`text-[8px] leading-none ${
                  isQuarter ? "text-gray-400 font-bold"
                    : isEighth ? "text-gray-500"
                    : "text-gray-600"
                }`}>
                  {BEAT_LABELS[i]}
                </span>
              </div>
            );
          }

          const isDown = slot.stroke === "down";
          return (
            <div key={i} className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
              <div
                className={`flex flex-col items-center justify-center w-full h-8 rounded text-[9px] font-bold transition-all duration-75 ${
                  isActive
                    ? "bg-yellow-400 text-gray-900 scale-110 shadow-md shadow-yellow-400/40"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                <span className={`text-sm leading-none ${isDown ? "" : "rotate-180 inline-block"}`}>
                  ↓
                </span>
                <span className="text-[7px] leading-none">{isDown ? "D" : "U"}</span>
              </div>
              <span className={`text-[8px] leading-none ${
                isQuarter ? "text-gray-400 font-bold"
                  : isEighth ? "text-gray-500"
                  : "text-gray-600"
              }`}>
                {BEAT_LABELS[i]}
              </span>
            </div>
          );
        })}
      </div>

      {/* BPM slider */}
      <div className="space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider">
            {t("strum.bpm")}
          </span>
          <span className="text-violet-300 text-sm font-bold tabular-nums">
            {bpm}
            <span className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider ml-1">
              {t("strum.bpm")}
            </span>
          </span>
        </div>
        <div className="py-2">
          <input
            type="range"
            min={40}
            max={120}
            step={1}
            value={bpm}
            onChange={e => setBpm(Number(e.target.value))}
            className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-violet-300 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-violet-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-violet-300 [&::-moz-range-thumb]:cursor-grab"
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-500">
          <span>40</span>
          <span>80</span>
          <span>120</span>
        </div>
      </div>

      {/* Play / Stop — hidden when parent renders its own button */}
      {!hidePlayButton && (
        <button
          onClick={isPlaying ? stop : play}
          className={`w-full px-4 py-2 text-sm font-bold rounded-md shadow-md transition-all duration-200 ${
            isPlaying
              ? "bg-red-600 hover:bg-red-500 text-white"
              : "bg-green-600 hover:bg-green-500 text-white"
          }`}
        >
          {isPlaying ? `⏹ ${t("strum.stop")}` : `▶ ${t("strum.play")}`}
        </button>
      )}
    </div>
  );
});

export default StrumPanel;
