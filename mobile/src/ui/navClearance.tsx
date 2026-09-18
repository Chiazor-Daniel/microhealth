import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * How much room the floating nav is taking up.
 *
 * The nav is an elevated surface laid *over* the page rather than a row that
 * steals height from it — the content scrolls beneath it, which is the effect
 * the design wants. But that only works if the content also knows how tall the
 * thing on top of it is, or the last card sits underneath it forever.
 *
 * That height is not a constant. It grows with the device's bottom safe-area
 * inset (0 on an old Android phone, 34 on a notched iPhone), and the raised AI
 * control overhangs the bar by another fixed amount on top. A hardcoded number
 * is therefore wrong on most devices and worst on the ones with the least
 * room.
 *
 * So the nav measures itself once and publishes the result here, and every
 * screen pads against the real figure. The bar can stay visually floating and
 * translucent; the *layout* still accounts for it.
 */
interface NavClearance {
  /** Total height the content must leave clear at the bottom, in points. */
  height: number;
  /** Called by the nav with its measured footprint. */
  report: (height: number) => void;
}

const Ctx = createContext<NavClearance>({ height: 0, report: () => {} });

export function NavClearanceProvider({ children }: { children: ReactNode }) {
  const [height, setHeight] = useState(0);

  /* Only update on a real change: onLayout fires on every rotation and every
     nav re-render, and re-rendering every screen each time would be wasteful
     and would interrupt scroll position. */
  const report = useCallback((next: number) => {
    setHeight((current) => (Math.abs(current - next) < 0.5 ? current : next));
  }, []);

  const value = useMemo(() => ({ height, report }), [height, report]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNavClearance() {
  return useContext(Ctx);
}
