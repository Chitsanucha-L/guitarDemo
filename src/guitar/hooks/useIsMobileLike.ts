import { useEffect, useState } from "react";

/**
 * Decide "mobile-like" UI based on viewport constraints that better match
 * landscape phones than width-only Tailwind breakpoints.
 *
 * We treat the viewport as mobile-like when:
 * - height is relatively small (e.g. landscape phone), OR
 * - pointer is coarse (touch), OR
 * - width is not too large.
 */
export default function useIsMobileLike() {
  const [isMobileLike, setIsMobileLike] = useState(false);

  useEffect(() => {
    const ua =
      typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
    const isProbablyMobileUa =
      /iPhone|iPad|iPod|Android|Mobile|Windows Phone/i.test(ua);

    const mqlHeight = window.matchMedia("(max-height: 900px)");
    const mqlCoarse = window.matchMedia("(pointer: coarse)");
    const mqlWidth = window.matchMedia("(max-width: 1150px)");
    const mqlDeviceWidth = window.matchMedia("(max-device-width: 1024px)");
    const mqlOrientationLandscape = window.matchMedia("(orientation: landscape)");
    const mqlShortLandscape = window.matchMedia(
      "(orientation: landscape) and (max-height: 700px)",
    );

    const update = () => {
      // Prefer "mobile-like" decisions even if viewport is large (e.g. desktop browser
      // simulating a handheld in landscape).
      const next =
        isProbablyMobileUa ||
        mqlCoarse.matches ||
        mqlDeviceWidth.matches ||
        mqlShortLandscape.matches ||
        mqlHeight.matches ||
        mqlOrientationLandscape.matches && mqlWidth.matches;

      setIsMobileLike(Boolean(next));
    };

    update();

    mqlHeight.addEventListener("change", update);
    mqlCoarse.addEventListener("change", update);
    mqlWidth.addEventListener("change", update);
    mqlDeviceWidth.addEventListener("change", update);
    mqlOrientationLandscape.addEventListener("change", update);
    mqlShortLandscape.addEventListener("change", update);

    return () => {
      mqlHeight.removeEventListener("change", update);
      mqlCoarse.removeEventListener("change", update);
      mqlWidth.removeEventListener("change", update);
      mqlDeviceWidth.removeEventListener("change", update);
      mqlOrientationLandscape.removeEventListener("change", update);
      mqlShortLandscape.removeEventListener("change", update);
    };
  }, []);

  return isMobileLike;
}

