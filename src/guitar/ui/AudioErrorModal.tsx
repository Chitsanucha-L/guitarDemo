import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { subscribeAudioError, type AudioErrorState } from "../audioError";

/**
 * Full-screen modal shown when the guitar audio cannot play:
 *  - preload failed (one or more samples never loaded)
 *  - playback failed (user pressed a string but the sample was missing)
 *
 * Primary action reloads the page; the user can also dismiss to keep using
 * whatever partial functionality they have.
 */
export default function AudioErrorModal() {
  const { t } = useTranslation();
  const [errorState, setErrorState] = useState<AudioErrorState>({ hasError: false, reason: null });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    return subscribeAudioError((s) => {
      setErrorState(s);
      // A newly-reported error should always re-open the modal, even if the
      // user dismissed an earlier one.
      if (s.hasError) setDismissed(false);
    });
  }, []);

  if (!errorState.hasError || dismissed) return null;

  const messageKey =
    errorState.reason === "preload"
      ? "audioError.preloadMessage"
      : "audioError.playbackMessage";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="audio-error-title"
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div className="bg-gray-900/95 backdrop-blur-md p-5 lg:p-6 rounded-2xl shadow-2xl border border-red-500/40 text-center max-w-xs lg:max-w-sm w-full">
        <div className="text-3xl lg:text-4xl mb-2 lg:mb-3">🔇</div>
        <h3
          id="audio-error-title"
          className="text-sm lg:text-lg font-bold text-white mb-1.5 lg:mb-2"
        >
          {t("audioError.title")}
        </h3>
        <p className="text-gray-300 text-[11px] lg:text-[13px] mb-4 lg:mb-5 leading-relaxed whitespace-pre-line">
          {t(messageKey)}
        </p>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs lg:text-sm px-4 lg:px-5 py-2 rounded-lg transition-all duration-200"
            autoFocus
          >
            {t("audioError.reload")}
          </button>
        </div>
      </div>
    </div>
  );
}
