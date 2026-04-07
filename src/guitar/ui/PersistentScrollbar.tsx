import {
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
  type ReactNode,
} from "react";

interface PersistentScrollbarProps {
  children: ReactNode;
  /** Classes on the outer flex row (usually flex-1 min-h-0) */
  className?: string;
  /** Classes on the scrollable pane */
  scrollClassName?: string;
}

/**
 * Vertical scroll with a **non-overlay** rail so the thumb stays visible on iOS / macOS
 * (native scrollbars there auto-hide; CSS cannot force them on).
 */
export default function PersistentScrollbar({
  children,
  className = "",
  scrollClassName = "",
}: PersistentScrollbarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState({
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0,
  });

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setMetrics({
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    });
  }, []);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  const { scrollTop, scrollHeight, clientHeight } = metrics;
  const canScroll = scrollHeight > clientHeight + 2;
  const maxScroll = Math.max(1, scrollHeight - clientHeight);

  /* Track stretches to the same height as the scroll viewport (flex row). */
  const trackH = clientHeight;
  const thumbH = canScroll
    ? Math.max(36, (clientHeight / scrollHeight) * trackH)
    : 0;
  const movable = Math.max(1, trackH - thumbH);
  const thumbTop = canScroll ? (scrollTop / maxScroll) * movable : 0;

  const onThumbPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!canScroll) return;
      e.preventDefault();
      e.stopPropagation();
      const el = scrollRef.current;
      const track = trackRef.current;
      if (!el || !track) return;

      const startY = e.clientY;
      const startScroll = el.scrollTop;
      const th = Math.max(36, (el.clientHeight / el.scrollHeight) * track.clientHeight);
      const mov = Math.max(1, track.clientHeight - th);
      const maxS = el.scrollHeight - el.clientHeight;

      const move = (ev: PointerEvent) => {
        const dy = ev.clientY - startY;
        el.scrollTop = Math.min(
          maxS,
          Math.max(0, startScroll + (dy / mov) * maxS),
        );
        requestAnimationFrame(update);
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [canScroll, update],
  );

  const onTrackPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!canScroll) return;
      if ((e.target as HTMLElement).closest("[data-scrollbar-thumb]")) return;
      const el = scrollRef.current;
      const track = trackRef.current;
      if (!el || !track) return;
      const rect = track.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const th = Math.max(36, (el.clientHeight / el.scrollHeight) * track.clientHeight);
      const mov = Math.max(1, track.clientHeight - th);
      const maxS = el.scrollHeight - el.clientHeight;
      const targetTop = Math.max(0, Math.min(mov, y - th / 2));
      el.scrollTop = (targetTop / mov) * maxS;
      requestAnimationFrame(update);
    },
    [canScroll, update],
  );

  return (
    <div className={`flex min-h-0 overflow-hidden ${className}`}>
      <div
        ref={scrollRef}
        className={`min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain scrollbar-none ${scrollClassName}`}
        style={{ WebkitOverflowScrolling: "touch" }}
        onScroll={update}
      >
        {children}
      </div>
      {canScroll && (
        <div
          ref={trackRef}
          role="scrollbar"
          aria-orientation="vertical"
          aria-valuenow={Math.round(scrollTop)}
          aria-valuemin={0}
          aria-valuemax={Math.round(maxScroll)}
          className="relative w-[11px] shrink-0 self-stretch min-h-0 border-l border-gray-600/45 bg-gray-950/85 touch-none"
          onPointerDown={onTrackPointerDown}
        >
          <div
            data-scrollbar-thumb
            className="absolute left-0.5 right-0.5 rounded-full bg-gray-400/90 shadow-md pointer-events-auto touch-manipulation active:bg-gray-300"
            style={{
              top: thumbTop,
              height: thumbH,
              minHeight: 36,
            }}
            onPointerDown={onThumbPointerDown}
          />
        </div>
      )}
    </div>
  );
}
