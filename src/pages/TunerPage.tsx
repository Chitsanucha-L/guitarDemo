import { useTranslation } from "react-i18next";
import Navbar from "../guitar/ui/Navbar";
import { useGuitarTuner, type GuitarString } from "../guitar/hooks/useGuitarTuner";
import { useReferenceTone } from "../guitar/hooks/useReferenceTone";

const CENTS_IN_TUNE = 5;
const METER_RANGE = 50; // ±50 cents full scale

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function TuningMeter({ cents }: { cents: number }) {
  const pct = clamp((cents / METER_RANGE) * 50 + 50, 0, 100);
  const inTune = Math.abs(cents) <= CENTS_IN_TUNE;
  const flat = cents < -CENTS_IN_TUNE;
  const sharp = cents > CENTS_IN_TUNE;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Labels */}
      <div className="flex justify-between text-xs sm:text-sm font-medium mb-2 px-1">
        <span className={flat ? "text-red-400" : "text-gray-500"}>FLAT</span>
        <span className={inTune ? "text-green-400 font-bold" : "text-gray-500"}>IN TUNE</span>
        <span className={sharp ? "text-red-400" : "text-gray-500"}>SHARP</span>
      </div>

      {/* Track */}
      <div className="relative h-3 sm:h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
        {/* Center zone highlight */}
        <div className="absolute inset-y-0 left-[40%] right-[40%] bg-green-900/40" />

        {/* Center tick */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-px w-0.5 bg-gray-600" />

        {/* Indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-100"
          style={{ left: `${pct}%` }}
        >
          <div
            className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 shadow-lg ${
              inTune
                ? "bg-green-400 border-green-300 shadow-green-500/40"
                : "bg-red-400 border-red-300 shadow-red-500/40"
            }`}
          />
        </div>
      </div>

      {/* Cents readout */}
      <div className="text-center mt-2">
        <span className={`text-sm font-mono ${inTune ? "text-green-400" : "text-gray-400"}`}>
          {cents > 0 ? "+" : ""}{cents} cents
        </span>
      </div>
    </div>
  );
}

function StringButton({
  gs,
  isTarget,
  isDetected,
  onClick,
}: {
  gs: GuitarString;
  isTarget: boolean;
  isDetected: boolean;
  onClick: () => void;
}) {
  const label = gs.name.replace(/\d/, "");

  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center w-12 h-14 sm:w-14 sm:h-16 rounded-xl border-2 font-bold transition-all duration-200 ${
        isTarget
          ? "border-yellow-500 bg-yellow-500/20 text-yellow-400 scale-110 shadow-lg shadow-yellow-500/20"
          : isDetected
            ? "border-green-500/50 bg-green-500/10 text-green-400"
            : "border-gray-600 bg-gray-800/60 text-gray-300 hover:border-gray-500 hover:bg-gray-700/40"
      }`}
    >
      <span className="text-lg sm:text-xl leading-none">{label}</span>
      <span className="text-[9px] sm:text-[10px] text-gray-500">{gs.frequency} Hz</span>
      {isTarget && (
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full" />
      )}
    </button>
  );
}

export default function TunerPage() {
  const { t } = useTranslation();
  const tuner = useGuitarTuner();
  const refTone = useReferenceTone();

  const activeTarget = tuner.targetString;
  const displayCents = tuner.centsFromTarget;
  const inTune = tuner.frequency !== null && Math.abs(displayCents) <= CENTS_IN_TUNE;

  const handleStringClick = (gs: GuitarString) => {
    tuner.setTargetString(activeTarget?.name === gs.name ? null : gs);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar title={t("nav.title")} activeLink="tuner" />

      <div className="pt-16 sm:pt-20 px-4 sm:px-8 pb-8 max-w-2xl mx-auto flex flex-col items-center gap-6 sm:gap-8">

        {/* Title */}
        <div className="text-center mt-4 sm:mt-5">
          <h1 className="text-2xl sm:text-4xl font-black text-white">
            {t("tuner.title")}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{t("tuner.subtitle")}</p>
        </div>

        {/* ระดับเสียงเข้า + แจ้งเตือนเมื่อเสียงเบา */}
        {tuner.isListening && (
          <div className="w-full max-w-md mx-auto flex flex-col items-center gap-2">
            <div className="w-full flex items-center gap-2">
              <span className="text-[10px] sm:text-xs text-gray-500 uppercase shrink-0">
                {t("tuner.inputLevel")}
              </span>
              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                <div
                  className={`h-full rounded-full transition-all duration-75 ${
                    tuner.isTooQuiet ? "bg-amber-500/80" : "bg-green-500/80"
                  }`}
                  style={{
                    width: `${Math.min(100, (tuner.inputLevel / 0.05) * 100)}%`,
                  }}
                />
              </div>
            </div>
            {tuner.isTooQuiet && (
              <p className="text-amber-400/95 text-xs sm:text-sm text-center px-3">
                {t("tuner.tooQuiet")}
              </p>
            )}
          </div>
        )}

        {/* Mic toggle */}
        <button
          onClick={tuner.isListening ? tuner.stop : tuner.start}
          className={`group relative px-8 sm:px-10 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 ${
            tuner.isListening
              ? "bg-red-500/20 border-2 border-red-500/60 text-red-400 hover:bg-red-500/30"
              : "bg-green-500/20 border-2 border-green-500/60 text-green-400 hover:bg-green-500/30"
          }`}
        >
          <span className="flex items-center gap-2">
            {tuner.isListening ? (
              <>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
                {t("tuner.stopListening")}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
                {t("tuner.startListening")}
              </>
            )}
          </span>
        </button>

        {/* Note display */}
        <div className="w-full">
          <div className="relative bg-gray-900/80 backdrop-blur-md rounded-3xl border-2 border-gray-700/50 px-6 sm:px-10 py-6 sm:py-8">
            {tuner.isListening && tuner.frequency !== null ? (
              <>
                {/* Glow behind note */}
                <div
                  className={`absolute inset-0 rounded-3xl blur-2xl transition-colors duration-300 ${
                    inTune ? "bg-green-500/10" : "bg-gray-500/5"
                  }`}
                />
                <div className="relative flex flex-col items-center gap-3">
                  <div
                    className={`text-6xl sm:text-8xl font-black tabular-nums transition-colors duration-200 ${
                      inTune ? "text-green-400" : "text-white"
                    }`}
                  >
                    {tuner.note}
                  </div>
                  <div className="text-lg sm:text-xl text-gray-400 font-mono">
                    {tuner.frequency} <span className="text-gray-600">Hz</span>
                  </div>
                  {activeTarget && (
                    <div className="text-xs text-gray-500">
                      {t("tuner.targetLabel")}: {activeTarget.name} (
                      {tuner.guitarStrings.find((s) => s.name === activeTarget.name)?.frequency?.toFixed(2) ?? activeTarget.frequency}{" "}
                      Hz)
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 py-4">
                <div className="text-5xl sm:text-7xl font-black text-gray-700">—</div>
                <div className="text-gray-600 text-sm">
                  {tuner.isListening ? t("tuner.waitingForSignal") : t("tuner.tapToStart")}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tuning meter */}
        {tuner.isListening && tuner.frequency !== null && (
          <TuningMeter cents={displayCents} />
        )}

        {/* String selector */}
        <div className="w-full">
          <h3 className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider mb-3 text-center">
            {t("tuner.selectString")}
          </h3>
          <div className="flex justify-center gap-2 sm:gap-3">
            {tuner.guitarStrings.map((gs) => (
              <StringButton
                key={gs.name}
                gs={gs}
                isTarget={activeTarget?.name === gs.name}
                isDetected={tuner.closestString?.name === gs.name && tuner.frequency !== null}
                onClick={() => handleStringClick(gs)}
              />
            ))}
          </div>
        </div>

        {/* Reference tones */}
        <div className="w-full">
          <h3 className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider mb-3 text-center">
            {t("tuner.referenceTones")}
          </h3>
          <div className="flex justify-center gap-2 sm:gap-3">
            {tuner.guitarStrings.map((gs) => (
              <button
                key={gs.name}
                onClick={() => refTone.play(gs.frequency)}
                className="flex items-center justify-center w-12 h-10 sm:w-14 sm:h-11 rounded-lg border border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:border-blue-400/60 transition-all text-sm sm:text-base font-semibold"
              >
                <svg className="w-3.5 h-3.5 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
                {gs.name.replace(/\d/, "")}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
