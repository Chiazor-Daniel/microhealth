import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  HelpCircle,
  X,
} from "lucide-react";
import {
  subscribe,
  getToasts,
  getDialog,
  dismissToast,
  closeDialog,
  type ToastKind,
} from "./store";

/* ------------------------------------------------------------------ */
/* Shared visual language — mirrors the patient design system so the   */
/* overlay reads as part of the product, not a bolted-on library.      */
/* ------------------------------------------------------------------ */

const TONE: Record<ToastKind, { icon: ReactNode; iconCls: string; accent: string }> = {
  success: { icon: <CheckCircle2 size={19} />, iconCls: "", accent: "#16A34A" },
  error: { icon: <XCircle size={19} />, iconCls: "mh-icon-rose", accent: "#E11D48" },
  warning: { icon: <AlertTriangle size={19} />, iconCls: "mh-icon-amber", accent: "#D97706" },
  info: { icon: <Info size={19} />, iconCls: "mh-icon-blue", accent: "#2563EB" },
};

const CARD: React.CSSProperties = {
  background: "linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 62%, #FBFDFC 100%)",
  border: "1px solid rgba(226, 236, 231, 0.9)",
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 6px rgba(16,24,40,0.06), 0 24px 48px -16px rgba(16,24,40,0.28)",
};

const OVERLAY_ROOT_ID = "mh-overlay-root";

/**
 * Mounted once at the app root. Renders toasts and the confirm dialog into a
 * portal so they sit above the app frame without inheriting its stacking.
 */
export function OverlayHost() {
  const [, force] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => subscribe(() => force((n) => n + 1)), []);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const toasts = getToasts();
  const dialog = getDialog();

  return createPortal(
    <>
      <ToastStack toasts={toasts} />
      {dialog && <ConfirmDialog dialog={dialog} />}
    </>,
    getOverlayRoot()
  );
}

function getOverlayRoot(): HTMLElement {
  let root = document.getElementById(OVERLAY_ROOT_ID);
  if (!root) {
    root = document.createElement("div");
    root.id = OVERLAY_ROOT_ID;
    document.body.appendChild(root);
  }
  return root;
}

/* ---------------------------- Toasts ---------------------------- */

function ToastStack({ toasts }: { toasts: ReturnType<typeof getToasts> }) {
  return (
    <div
      className="fixed z-[100] flex flex-col gap-2.5 pointer-events-none
                 top-[max(12px,env(safe-area-inset-top))] left-4 right-4
                 sm:left-auto sm:right-5 sm:w-[340px]"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <Toast key={t.id} item={t} />
      ))}
    </div>
  );
}

function Toast({ item }: { item: ReturnType<typeof getToasts>[number] }) {
  const tone = TONE[item.kind];
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<number | null>(null);
  const remaining = useRef(item.duration);
  const startedAt = useRef(Date.now());

  const clear = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  };

  const start = (ms: number) => {
    startedAt.current = Date.now();
    timer.current = window.setTimeout(() => {
      setLeaving(true);
      window.setTimeout(() => dismissToast(item.id), 180);
    }, ms);
  };

  useEffect(() => {
    start(remaining.current);
    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  // Hovering holds the toast open rather than letting it vanish mid-read.
  const pause = () => {
    clear();
    remaining.current = Math.max(600, remaining.current - (Date.now() - startedAt.current));
  };
  const resume = () => start(remaining.current);

  return (
    <div
      onMouseEnter={pause}
      onMouseLeave={resume}
      className="pointer-events-auto relative overflow-hidden flex items-start gap-3 p-3.5 pr-10"
      style={{
        ...CARD,
        borderRadius: 18,
        opacity: leaving ? 0 : 1,
        transform: leaving ? "translateY(-6px)" : "translateY(0)",
        transition: "opacity 0.18s ease, transform 0.18s ease",
      }}
      role="status"
    >
      <div className={`mh-icon ${tone.iconCls} w-9 h-9`}>{tone.icon}</div>

      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold leading-snug" style={{ color: "#0F172A" }}>
          {item.title}
        </p>
        {item.text && (
          <p className="text-[12.5px] leading-snug mt-0.5" style={{ color: "#64748B" }}>
            {item.text}
          </p>
        )}
      </div>

      <button
        onClick={() => dismissToast(item.id)}
        aria-label="Dismiss"
        className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center"
        style={{ color: "#94A3B8" }}
      >
        <X size={13} />
      </button>

      {/* Time remaining */}
      <span
        aria-hidden
        className="absolute left-0 bottom-0 h-[2px]"
        style={{
          background: tone.accent,
          opacity: 0.5,
          animation: `mh-toast-bar ${item.duration}ms linear forwards`,
        }}
      />
    </div>
  );
}

/* --------------------------- Dialog ---------------------------- */

function ConfirmDialog({ dialog }: { dialog: NonNullable<ReturnType<typeof getDialog>> }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const isDanger = dialog.kind === "danger";
  const tone = isDanger
    ? { icon: <AlertTriangle size={21} />, cls: "mh-icon-rose" }
    : dialog.kind === "warning"
      ? { icon: <AlertTriangle size={21} />, cls: "mh-icon-amber" }
      : { icon: <HelpCircle size={21} />, cls: "" };

  // Escape closes; focus moves into the dialog and is trapped there.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDialog(false);
        return;
      }
      if (e.key === "Tab" && cardRef.current) {
        const focusables = cardRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-5"
      style={{
        background: "rgba(15, 23, 42, 0.32)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        animation: "mh-fade-in 0.16s ease-out",
      }}
      onMouseDown={(e) => {
        // Only a click that starts on the scrim dismisses.
        if (e.target === e.currentTarget) closeDialog(false);
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mh-dialog-title"
    >
      <div
        ref={cardRef}
        className="w-full max-w-[360px] p-5"
        style={{
          ...CARD,
          borderRadius: 24,
          animation: "mh-dialog-in 0.2s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div className="flex items-start gap-3">
          <div className={`mh-icon ${tone.cls} w-11 h-11`}>{tone.icon}</div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p
              id="mh-dialog-title"
              className="text-[16px] font-semibold leading-snug"
              style={{ color: "#0F172A", letterSpacing: "-0.01em" }}
            >
              {dialog.title}
            </p>
            {dialog.text && (
              <p className="text-[13px] leading-relaxed mt-1.5" style={{ color: "#64748B" }}>
                {dialog.text}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2.5 mt-5">
          <button
            ref={cancelRef}
            onClick={() => closeDialog(false)}
            className="mh-btn-secondary flex-1 py-2.5 text-[13.5px] font-semibold"
          >
            {dialog.cancelText}
          </button>
          <button
            onClick={() => closeDialog(true)}
            className={isDanger ? "flex-1 py-2.5 text-[13.5px] font-semibold" : "mh-btn-primary flex-1 py-2.5 text-[13.5px] font-semibold"}
            style={
              isDanger
                ? {
                    background: "linear-gradient(180deg, #F05252 0%, #EF4444 55%, #DC2626 100%)",
                    border: "1px solid rgba(185,28,28,0.85)",
                    color: "#FFFFFF",
                    borderRadius: 999,
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.28), 0 6px 16px -4px rgba(185,28,28,0.42)",
                  }
                : undefined
            }
          >
            {dialog.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
