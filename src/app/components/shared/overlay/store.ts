/**
 * Tiny imperative overlay store.
 *
 * The app calls success()/error()/confirmAction() from anywhere — including
 * non-React code — so the modal can't rely on a provider's context value.
 * Instead callers push onto this store and a single <OverlayHost/> (mounted
 * once at the app root) subscribes and renders. Same ergonomics as
 * SweetAlert, but rendered with our own design language.
 */

export type ToastKind = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  kind: ToastKind;
  title: string;
  text?: string;
  duration: number;
}

export interface DialogRequest {
  id: string;
  kind: "question" | "warning" | "danger";
  title: string;
  text?: string;
  confirmText: string;
  cancelText: string;
  /** Resolves the awaiting caller. */
  resolve: (confirmed: boolean) => void;
}

type Listener = () => void;

let toasts: ToastItem[] = [];
let dialog: DialogRequest | null = null;
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l();
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getToasts() {
  return toasts;
}

export function getDialog() {
  return dialog;
}

let seq = 0;
function nextId() {
  seq += 1;
  return `ovl_${seq}_${performance.now().toFixed(0)}`;
}

export function pushToast(kind: ToastKind, title: string, text?: string, duration = 3200) {
  const item: ToastItem = { id: nextId(), kind, title, text, duration };
  toasts = [item, ...toasts].slice(0, 3);
  emit();
  return item.id;
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

/** Opens a confirm dialog and resolves when the user answers. */
export function openDialog(
  opts: Omit<DialogRequest, "id" | "resolve">
): Promise<boolean> {
  // Only one dialog at a time — resolve any pending one as cancelled.
  if (dialog) {
    dialog.resolve(false);
  }
  return new Promise<boolean>((resolve) => {
    dialog = { ...opts, id: nextId(), resolve };
    emit();
  });
}

export function closeDialog(confirmed: boolean) {
  if (!dialog) return;
  const d = dialog;
  dialog = null;
  emit();
  d.resolve(confirmed);
}
