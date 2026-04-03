import { useEffect, useState } from "react";

/**
 * Matches Home / Guitar3D / Tailwind `lg:` — viewport below 1024px uses the compact
 * (mobile) chrome; at 1024px and up uses desktop chrome.
 *
 * We intentionally do **not** use max-height, pointer:coarse, or UA here: those made
 * short desktop windows (e.g. DevTools open, 1440×884) incorrectly show mobile UI.
 */
export default function useIsMobileLike() {
  const [isMobileLike, setIsMobileLike] = useState(() =>
    typeof window !== "undefined" && !window.matchMedia("(min-width: 1024px)").matches,
  );

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsMobileLike(!mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return isMobileLike;
}
