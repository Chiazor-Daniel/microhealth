import { useLocation, useNavigate } from "react-router";
import { patientTheme } from "../theme";
import { BrandMark } from "./BrandMark";
import {
  HomeFilledIcon,
  HomeOutlineIcon,
  PulseIcon,
  HeartOutlineIcon,
  PersonFilledIcon,
  type GlyphProps,
} from "../icons";

/**
 * The AI slot carries no icon — its control is drawn as the brand mark above.
 *
 * Home and Profile are solid and Vitals and Care are outlined, which is the
 * register the design system fixes for each destination; only the colour
 * changes with selection.
 */
const NAV: {
  path: string;
  icon: ((p: GlyphProps) => React.ReactElement) | null;
  altIcon?: (p: GlyphProps) => React.ReactElement;
  label: string;
}[] = [
  { path: "/patient/home", icon: HomeFilledIcon, altIcon: HomeOutlineIcon, label: "Home" },
  { path: "/patient/vitals", icon: PulseIcon, label: "Vitals" },
  { path: "/patient/ai", icon: null, label: "AI" },
  { path: "/patient/care", icon: HeartOutlineIcon, label: "Care" },
  { path: "/patient/profile", icon: PersonFilledIcon, label: "Profile" },
];

/**
 * Floating navigation control.
 * The bar is an elevated surface the content scrolls beneath; the centre
 * AI destination rises out of it as a physical green control — the visual
 * centrepiece — while the other four stay quiet.
 *
 * Selection is carried by colour alone (green icon + green label), so the
 * bar never sprouts a background behind one destination and unbalances.
 */
export function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const active = location.pathname;

  const isActive = (path: string) => active === path || active.startsWith(path + "/");

  return (
    <nav
      className="mh-nav fixed bottom-0 left-0 right-0 z-50"
      style={{ paddingBottom: "max(4px, env(safe-area-inset-bottom))" }}
    >
      <div className="relative mx-auto" style={{ width: "min(430px, 100%)" }}>
        {/* ---- Raised AI control: rises out of the bar ---- */}
        <div
          className="absolute left-1/2 z-10"
          style={{ transform: "translateX(-50%)", top: -28 }}
        >
          <span className="mh-nav-ai-halo" aria-hidden />
          <button
            onClick={() => navigate("/patient/ai")}
            aria-label="AI"
            aria-current={isActive("/patient/ai") ? "page" : undefined}
            className="mh-icon-green mh-breathe relative flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-green-500/40"
            style={{ width: 54, height: 54, borderRadius: 999 }}
          >
            <BrandMark size={25} />
          </button>
        </div>

        {/* ---- The four quiet destinations + the AI slot ---- */}
        <div className="flex items-end justify-between px-2 pt-2.5 pb-1.5">
          {NAV.map(({ path, icon: Icon, altIcon: AltIcon, label }) => {
            const on = isActive(path);
            const isAI = label === "AI";
            const tint = on ? patientTheme.colors.primaryDark : patientTheme.colors.inkMuted;
            /* Home swaps to its outlined form only when it is not the current
               destination — the solid house is the resting state. */
            const Glyph = on || !AltIcon ? Icon : AltIcon;

            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                aria-label={label}
                aria-current={on ? "page" : undefined}
                className="flex-1 flex flex-col items-center justify-end gap-0.5 outline-none focus-visible:ring-2 focus-visible:ring-green-500/40 rounded-2xl"
                style={{ paddingTop: 6, paddingBottom: 4, color: tint }}
              >
                {isAI || !Glyph ? (
                  /* Spacer keeps the grid honest — the control itself floats above */
                  <span style={{ height: 30, display: "block" }} aria-hidden />
                ) : (
                  <span className="flex items-center justify-center" style={{ width: 42, height: 30 }}>
                    <Glyph size={22} />
                  </span>
                )}
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: on ? 700 : 500,
                    letterSpacing: "-0.01em",
                    color: tint,
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
