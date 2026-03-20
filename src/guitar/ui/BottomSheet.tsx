import { useRef, useState, useCallback, useEffect, useLayoutEffect } from "react";

const SNAP_THRESHOLD = 0.08;
const MOVE_CLICK_THRESHOLD_PX = 18;

const HALF_FRACTION = 0.45;
const FULL_FRACTION = 0.92;

type SnapPoint = "peek" | "half" | "full";

interface BottomSheetProps {
  children: React.ReactNode;
  stickyHeader?: React.ReactNode;
  defaultSnap?: SnapPoint;
  snap?: SnapPoint;
  onSnapChange?: (snap: SnapPoint) => void;
  handle?: React.ReactNode;
  topOffsetPx?: number;
}

function useAvailableHeight(topOffsetPx: number) {
  const compute = useCallback(
    () =>
      Math.max(
        200,
        (typeof window !== "undefined" ? window.innerHeight : 800) - topOffsetPx,
      ),
    [topOffsetPx],
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

export default function BottomSheet({
  children,
  stickyHeader,
  defaultSnap = "half",
  snap: controlledSnap,
  onSnapChange,
  handle,
  topOffsetPx = 0,
}: BottomSheetProps) {
  const available = useAvailableHeight(topOffsetPx);

  const headerRef = useRef<HTMLDivElement>(null);
  const [headerPx, setHeaderPx] = useState(0);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const measure = () => {
      const h = el.getBoundingClientRect().height;
      if (h > 0) setHeaderPx(h);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const peekPx = Math.max(60, headerPx);
  const peekFrac = peekPx / available;
  const halfFrac = Math.max(peekFrac + 0.05, HALF_FRACTION);

  const snapFrac = useCallback(
    (s: SnapPoint): number => {
      switch (s) {
        case "peek":
          return peekFrac;
        case "half":
          return halfFrac;
        case "full":
          return FULL_FRACTION;
        default:
          return halfFrac;
      }
    },
    [peekFrac, halfFrac],
  );

  const nearestSnap = useCallback(
    (f: number): SnapPoint => {
      if (f <= peekFrac + SNAP_THRESHOLD) return "peek";
      if (f <= halfFrac + SNAP_THRESHOLD) return "half";
      return "full";
    },
    [peekFrac, halfFrac],
  );

  const [frac, setFrac] = useState(() => snapFrac(defaultSnap));
  const snapRef = useRef<SnapPoint>(defaultSnap);

  // When peekFrac changes (header measured), sync frac if at peek.
  useLayoutEffect(() => {
    if (snapRef.current === "peek") {
      setFrac(peekFrac);
    }
  }, [peekFrac]);

  // Respond to controlled snap changes from parent.
  const prevControlled = useRef(controlledSnap);
  useEffect(() => {
    if (controlledSnap && controlledSnap !== prevControlled.current) {
      setFrac(snapFrac(controlledSnap));
      snapRef.current = controlledSnap;
    }
    prevControlled.current = controlledSnap;
  }, [controlledSnap, snapFrac]);

  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startFrac = useRef(0);
  const movedRef = useRef(false);

  const commitSnap = useCallback(
    (snap: SnapPoint) => {
      snapRef.current = snap;
      setFrac(snapFrac(snap));
      onSnapChange?.(snap);
    },
    [onSnapChange, snapFrac],
  );

  const finishDrag = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (!movedRef.current) {
      const current = nearestSnap(frac);
      commitSnap(current === "peek" ? "half" : "peek");
      return;
    }
    commitSnap(nearestSnap(frac));
  }, [isDragging, frac, nearestSnap, commitSnap]);

  const finishDragRef = useRef(finishDrag);
  finishDragRef.current = finishDrag;

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
      const h = Math.max(
        peekFrac,
        Math.min(FULL_FRACTION, startFrac.current - dy / available),
      );
      setFrac(h);
    },
    [isDragging, available, peekFrac],
  );

  // Global pointerup: commit snap via ref so it always uses latest state.
  useEffect(() => {
    const up = () => finishDragRef.current();
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  const heightPx = Math.max(peekPx, Math.round(Math.min(FULL_FRACTION, frac) * available));

  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-40 flex flex-col rounded-t-2xl bg-gray-900/95 backdrop-blur-xl shadow-2xl border border-gray-700/30 border-b-0 transition-[height] duration-200 ease-out"
      style={{
        height: `${heightPx}px`,
        maxHeight: `calc(100dvh - ${topOffsetPx}px)`,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        transitionProperty: isDragging ? "none" : "height",
      }}
    >
      <div ref={headerRef} className="shrink-0">
        <div
          className="flex items-center justify-center pt-1.5 pb-1 touch-none cursor-grab active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => finishDragRef.current()}
          onPointerLeave={() => finishDragRef.current()}
        >
          {handle ?? (
            <div className="w-10 h-1 rounded-full bg-gray-500/60" aria-hidden />
          )}
        </div>
        {stickyHeader}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain min-h-0">
        {children}
      </div>
    </div>
  );
}
