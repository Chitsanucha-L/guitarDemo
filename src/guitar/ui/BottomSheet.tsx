import { useRef, useState, useCallback, useEffect } from "react";

// Keep the sheet away from the top nav so the handle is always draggable/clickable.
// We'll also cap "full" height dynamically based on reserved top/bottom UI.
const PEEK_HEIGHT = 57; // px
const HALF_HEIGHT = 0.28; // vh fraction (initial ~35%)
const FULL_HEIGHT_FRACTION_CAP = 0.75; // vh fraction cap
const SNAP_THRESHOLD = 0.08;
const MOVE_CLICK_THRESHOLD_PX = 18;

type SnapPoint = "peek" | "half" | "full";

interface BottomSheetProps {
  children: React.ReactNode;
  /** Initial snap point */
  defaultSnap?: SnapPoint;
  /** Called when user drags to a new snap point */
  onSnapChange?: (snap: SnapPoint) => void;
  /** Optional handle (e.g. drag pill) - if not provided, default pill is shown */
  handle?: React.ReactNode;
  /** Reserve UI space at the bottom (e.g. tab bar + fixed CTA). */
  bottomOffsetPx?: number;
  /** Reserve UI space at the top (e.g. top navbar) to prevent overlap. */
  topOffsetPx?: number;
}

function snapToPercent(snap: SnapPoint): number {
  if (typeof window === "undefined") return HALF_HEIGHT;
  switch (snap) {
    case "peek":
      return PEEK_HEIGHT / window.innerHeight;
    case "half":
      return HALF_HEIGHT;
    case "full":
      return FULL_HEIGHT_FRACTION_CAP;
    default:
      return HALF_HEIGHT;
  }
}

function percentToSnap(p: number): SnapPoint {
  const peek = snapToPercent("peek");
  const half = snapToPercent("half");
  if (p <= peek + SNAP_THRESHOLD) return "peek";
  if (p <= half + SNAP_THRESHOLD) return "half";
  return "full";
}

export default function BottomSheet({
  children,
  defaultSnap = "half",
  onSnapChange,
  handle,
  bottomOffsetPx = 0,
  topOffsetPx = 0,
}: BottomSheetProps) {
  const [heightPercent, setHeightPercent] = useState(() => snapToPercent(defaultSnap));
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startPercent = useRef(0);
  const movedRef = useRef(false);

  const commitSnap = useCallback(
    (snap: SnapPoint) => {
      setHeightPercent(snapToPercent(snap));
      onSnapChange?.(snap);
    },
    [onSnapChange],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      setIsDragging(true);
      movedRef.current = false;
      startY.current = e.clientY;
      startPercent.current = heightPercent;
    },
    [heightPercent],
  );

  const computeMaxHeightFraction = useCallback(() => {
    if (typeof window === "undefined") return FULL_HEIGHT_FRACTION_CAP;
    // Height available for the sheet body.
    const availablePx = window.innerHeight - topOffsetPx - bottomOffsetPx;
    const fraction = availablePx / window.innerHeight;
    return Math.max(0.25, Math.min(FULL_HEIGHT_FRACTION_CAP, fraction));
  }, [topOffsetPx, bottomOffsetPx]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || typeof window === "undefined") return;
      const dy = e.clientY - startY.current;
      if (Math.abs(dy) > MOVE_CLICK_THRESHOLD_PX) movedRef.current = true;
      const maxH = computeMaxHeightFraction();
      const minH = PEEK_HEIGHT / window.innerHeight;
      const h = Math.max(minH, Math.min(maxH, startPercent.current + dy / window.innerHeight));
      setHeightPercent(h);
    },
    [isDragging, computeMaxHeightFraction],
  );

  const onPointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    // If the user just tapped the handle (no meaningful drag),
    // toggle between "half" and "peek" so it feels like open/close.
    if (!movedRef.current) {
      const currentSnap = percentToSnap(heightPercent);
      const nextSnap: SnapPoint = currentSnap === "peek" ? "half" : "peek";
      commitSnap(nextSnap);
      return;
    }

    commitSnap(percentToSnap(heightPercent));
  }, [isDragging, heightPercent, commitSnap]);

  useEffect(() => {
    const onPointerUpGlobal = () => setIsDragging(false);
    window.addEventListener("pointerup", onPointerUpGlobal);
    return () => window.removeEventListener("pointerup", onPointerUpGlobal);
  }, []);

  const heightPct = (() => {
    const maxH = computeMaxHeightFraction();
    return Math.max(snapToPercent("peek"), Math.min(maxH, heightPercent)) * 100;
  })();

  return (
    <div
      className="fixed left-0 right-0 z-40 flex flex-col rounded-t-3xl bg-gray-900/95 backdrop-blur-xl shadow-2xl border border-gray-700/30 border-b-0 transition-[height] duration-200 ease-out"
      style={{
        bottom: `calc(${bottomOffsetPx}px + env(safe-area-inset-bottom, 0px))`,
        height: `${heightPct}vh`,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        transitionProperty: isDragging ? "none" : "height",
      }}
    >
      <div
        className="flex shrink-0 items-center justify-center py-2 touch-none cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {handle ?? (
          <div className="w-12 h-1 rounded-full bg-gray-500/80" aria-hidden />
        )}
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain min-h-0">
        {children}
      </div>
    </div>
  );
}
