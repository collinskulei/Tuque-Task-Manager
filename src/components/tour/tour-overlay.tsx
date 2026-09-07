"use client";

import { useTour } from "./tour-context";
import { Button } from "@/components/ui/button";

const PAD = 8;
const TOOLTIP_W = 320;

function TourCard({
  title,
  body,
  stepIndex,
  total,
  onNext,
  onPrev,
  onStop,
}: {
  title: string;
  body: string;
  stepIndex: number;
  total: number;
  onNext: () => void;
  onPrev: () => void;
  onStop: () => void;
}) {
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === total - 1;

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: i === stepIndex ? "var(--accent)" : "var(--border)" }}
            />
          ))}
        </div>
        <button
          onClick={onStop}
          aria-label="Close tour"
          className="text-xs text-foreground-subtle hover:text-foreground"
        >
          Skip ✕
        </button>
      </div>
      <h3 className="mb-1.5 text-[15px] font-semibold tracking-tight">{title}</h3>
      <p className="mb-4 text-sm leading-relaxed text-foreground-muted">{body}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-foreground-subtle">
          {stepIndex + 1} / {total}
        </span>
        <div className="flex gap-2">
          {!isFirst && (
            <Button size="sm" variant="secondary" onClick={onPrev}>
              Back
            </Button>
          )}
          <Button size="sm" onClick={onNext}>
            {isLast ? "Finish" : "Next"}
          </Button>
        </div>
      </div>
    </>
  );
}

export function TourOverlay() {
  const { active, stepIndex, steps, rect, locating, next, prev, stop } = useTour();

  // This component only ever renders content once `active` is true, which only
  // happens in response to a user click, so we're always fully client-side by
  // then and can read `window` directly during render with no hydration risk.
  if (!active) return null;
  const step = steps[stepIndex];
  if (!step) return null;

  if (!rect) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
        role="dialog"
        aria-modal="true"
        aria-label={step.title}
      >
        <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-6 shadow-lg">
          {locating ? (
            <p className="text-sm text-foreground-muted">Taking you there…</p>
          ) : (
            <TourCard
              title={step.title}
              body={step.body}
              stepIndex={stepIndex}
              total={steps.length}
              onNext={next}
              onPrev={prev}
              onStop={stop}
            />
          )}
        </div>
      </div>
    );
  }

  const spot = {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };

  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const spaceBelow = vh - (spot.top + spot.height);
  const placeBelow = spaceBelow > 200 || spaceBelow > spot.top;
  const tooltipTop = placeBelow ? spot.top + spot.height + 14 : undefined;
  const tooltipBottom = !placeBelow ? vh - spot.top + 14 : undefined;
  const tooltipLeft = Math.min(Math.max(16, spot.left), vw - TOOLTIP_W - 16);

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[100]">
        <div className="absolute bg-black/55" style={{ top: 0, left: 0, right: 0, height: Math.max(0, spot.top) }} />
        <div className="absolute bg-black/55" style={{ top: spot.top + spot.height, left: 0, right: 0, bottom: 0 }} />
        <div className="absolute bg-black/55" style={{ top: spot.top, height: spot.height, left: 0, width: Math.max(0, spot.left) }} />
        <div className="absolute bg-black/55" style={{ top: spot.top, height: spot.height, left: spot.left + spot.width, right: 0 }} />
        <div
          className="absolute rounded-lg ring-2 ring-accent transition-all duration-200"
          style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
        />
      </div>
      <div
        className="fixed z-[101] rounded-lg border border-border bg-surface p-5 shadow-lg transition-all duration-200"
        style={{ top: tooltipTop, bottom: tooltipBottom, left: tooltipLeft, width: TOOLTIP_W }}
        role="dialog"
        aria-modal="true"
        aria-label={step.title}
      >
        <TourCard
          title={step.title}
          body={step.body}
          stepIndex={stepIndex}
          total={steps.length}
          onNext={next}
          onPrev={prev}
          onStop={stop}
        />
      </div>
    </>
  );
}
