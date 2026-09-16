/**
 * App-wide alerts and confirmations.
 *
 * Same function signatures the app already calls, but rendered by our own
 * themed <OverlayHost/> instead of SweetAlert2 — so the overlays match the
 * product's surfaces, type and buttons.
 */

import { pushToast, openDialog } from "./overlay/store";

export function success(title: string, text?: string) {
  pushToast("success", title, text);
}

export function error(title: string, text?: string) {
  pushToast("error", title, text);
}

export function warning(title: string, text?: string) {
  pushToast("warning", title, text);
}

export function info(title: string, text?: string) {
  pushToast("info", title, text);
}

/**
 * Ask the user to confirm. Resolves true when confirmed.
 * `confirmColor` is accepted for call-site compatibility and ignored —
 * the tone is chosen from the intent instead.
 */
export function confirmAction(
  title: string,
  text: string,
  confirmText = "Yes, proceed",
  _confirmColor?: string
): Promise<boolean> {
  return openDialog({
    kind: "question",
    title,
    text,
    confirmText,
    cancelText: "Cancel",
  });
}

export function confirmDelete(
  title = "Delete?",
  text = "You won't be able to revert this."
): Promise<boolean> {
  return openDialog({
    kind: "danger",
    title,
    text,
    confirmText: "Delete",
    cancelText: "Cancel",
  });
}

/** Non-destructive prompt for risky-but-reversible actions. */
export function confirmWarning(
  title: string,
  text: string,
  confirmText = "Continue"
): Promise<boolean> {
  return openDialog({
    kind: "warning",
    title,
    text,
    confirmText,
    cancelText: "Cancel",
  });
}

export { OverlayHost } from "./overlay/OverlayHost";
