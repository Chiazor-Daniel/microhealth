import { useEffect, useRef, useState } from "react";

/**
 * A string whose numbers travel to their new value instead of jumping.
 *
 * The app shows readings that update behind the patient — a wearable pushes a
 * new heart rate every few seconds — and a figure that snaps from 71 to 74
 * reads as a different number appearing, not the same number changing. Tweening
 * it is what makes the screen feel alive rather than repainted.
 *
 * Deliberately works on *strings*, not numbers, because most of what moves is
 * not a bare number: blood pressure is "119/77", a range is "60 – 100". Every
 * numeric run in the string is tweened and the text between them is preserved
 * exactly, so a caller passes whatever it already renders.
 *
 * Plain React with no platform APIs, so the web and native builds share it.
 */

const NUMBER = /\d+(?:\.\d+)?/g;

/** How many decimals a value was written with, so "36.5" stays "36.5". */
function decimalsOf(token: string) {
  const dot = token.indexOf(".");
  return dot === -1 ? 0 : token.length - dot - 1;
}

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * @param value    The string to display.
 * @param duration Milliseconds for the travel.
 */
export function useFluidText(value: string, duration = 650): string {
  const [display, setDisplay] = useState(value);

  /* What is on screen right now. A new value tweens from *this* rather than
     from the previous target, so a reading that changes again mid-flight
     continues smoothly instead of jumping backwards. */
  const shown = useRef(value);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const targets = value.match(NUMBER) ?? [];
    const previous = shown.current.match(NUMBER) ?? [];

    /* A different number of figures is a different kind of reading — "—" to
       "119/77", say. There is nothing sensible to interpolate, so snap. */
    if (targets.length === 0 || targets.length !== previous.length) {
      shown.current = value;
      setDisplay(value);
      return;
    }

    const from = previous.map(Number);
    const to = targets.map(Number);
    const parts = value.split(NUMBER);
    const started = performance.now();

    const step = () => {
      const t = Math.min(1, (performance.now() - started) / duration);
      const eased = easeOut(t);

      let out = parts[0];
      targets.forEach((token, i) => {
        out += (from[i] + (to[i] - from[i]) * eased).toFixed(decimalsOf(token));
        out += parts[i + 1] ?? "";
      });

      shown.current = out;
      setDisplay(out);
      if (t < 1) raf.current = requestAnimationFrame(step);
    };

    raf.current = requestAnimationFrame(step);

    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [value, duration]);

  return display;
}
