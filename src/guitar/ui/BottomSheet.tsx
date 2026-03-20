import { useRef, useState, useCallback, useEffect } from "react";

const SNAP_THRESHOLD = 0.08;
const MOVE_CLICK_THRESHOLD_PX = 18;

// All snap points as fractions of *available* height (viewport − top − bottom).
const PEEK_MIN_PX = 50;
const PEEK_FRACTION = 0.1;
const HALF_FRACTION = 0.35;
const FULL_FRACTION = 0.92;

type SnapPoint = "peek" | "half" | "full";

interface BottomSheetProps {
  children: React.ReactNode;
  defaultSnap?: SnapPoint;
  onSnapChange?: (snap: SnapPoint) => void;
  handle?: React.ReactNode;
  /** Space reserved at the bottom (e.g. tab bar height, excluding safe area). */
  bottomOffsetPx?: number;
  /** Space reserved at the top (e.g. mobile nav height, including safe area). */
  topOffsetPx?: number;
}

function useAvailableHeight(topOffsetPx: number, bottomOffsetPx: number) {
  const compute = useCallback(
    () =>
      Math.max(
        200,
        (typeof window !== "undefined" ? window.innerHeight : 800) -
          topOffsetPx -
          bottomOffsetPx,
      ),
    [topOffsetPx, bottomOffsetPx],
  );

  const [height, setHeight] = useState(compute);

  useEffect(() => {
    const update = () => setHeight(compute());
    update();
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, [compute]);

  return height;
}

function peekFrac(available: number) {
  return Math.max(PEEK_FRACTION, PEEK_MIN_PX / available);
}

function snapFrac(snap: SnapPoint, available: number): number {
  switch (snap) {
    case "peek":
      return peekFrac(available);
    case "half":
      return HALF_FRACTION;
    case "full":
      return FULL_FRACTION;
    default:
      return HALF_FRACTION;
  }
}

function nearestSnap(f: number, available: number): SnapPoint {
  const peek = peekFrac(available);
  if (f <= peek + SNAP_THRESHOLD) return "peek";
  if (f <= HALF_FRACTION + SNAP_THRESHOLD) return "half";
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
  const available = useAvailableHeight(topOffsetPx, bottomOffsetPx);
  const [frac, setFrac] = useState(() => {
    const a =
      typeof window !== "undefined"
        ? Math.max(200, window.innerHeight - topOffsetPx - bottomOffsetPx)
        : 600;
    return snapFrac(defaultSnap, a);
  });
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startFrac = useRef(0);
  const movedRef = useRef(false);

  const commitSnap = useCallback(
    (snap: SnapPoint) => {
      setFrac(snapFrac(snap, available));
      onSnapChange?.(snap);
    },
    [onSnapChange, available],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      setIsDragging(true);
      movedRef.current = false;
      startY.current = e.clientY;
      startFrac.current = frac;
    },
    [frac],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const dy = e.clientY - startY.current;
      if (Math.abs(dy) > MOVE_CLICK_THRESHOLD_PX) movedRef.current = true;
      const minF = peekFrac(available);
      // Drag up (dy < 0) → open (increase height); drag down → close.
      const h = Math.max(
        minF,
        Math.min(FULL_FRACTION, startFrac.current - dy / available),
      );
      setFrac(h);
    },
    [isDragging, available],
  );

  const onPointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (!movedRef.current) {
      const current = nearestSnap(frac, available);
      commitSnap(current === "peek" ? "half" : "peek");
      return;
    }
    commitSnap(nearestSnap(frac, available));
  }, [isDragging, frac, available, commitSnap]);

  useEffect(() => {
    const up = () => setIsDragging(false);
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  const heightPx = Math.round(
    Math.max(peekFrac(available), Math.min(FULL_FRACTION, frac)) * available,
  );

  return (
    <div
      className="fixed left-0 right-0 z-40 flex flex-col rounded-t-3xl bg-gray-900/95 backdrop-blur-xl shadow-2xl border border-gray-700/30 border-b-0 transition-[height] duration-200 ease-out"
      style={{
        bottom: `${bottomOffsetPx}px`,
        height: `${heightPx}px`,
        maxHeight: `calc(100dvh - ${topOffsetPx}px - ${bottomOffsetPx}px)`,
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
