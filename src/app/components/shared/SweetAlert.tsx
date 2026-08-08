import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

export const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (el) => {
    el.addEventListener("mouseenter", Swal.stopTimer);
    el.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

export function success(title: string, text?: string) {
  toast.fire({
    icon: "success",
    title,
    text,
    background: "#ECFDF5",
    color: "#065F46",
  });
}

export function error(title: string, text?: string) {
  toast.fire({
    icon: "error",
    title,
    text,
    background: "#FEF2F2",
    color: "#991B1B",
  });
}

export function warning(title: string, text?: string) {
  toast.fire({
    icon: "warning",
    title,
    text,
    background: "#FFFBEB",
    color: "#92400E",
  });
}

export function info(title: string, text?: string) {
  toast.fire({
    icon: "info",
    title,
    text,
    background: "#EFF6FF",
    color: "#1D4ED8",
  });
}

export async function confirmAction(title: string, text: string, confirmText = "Yes, proceed", confirmColor = "#0F7D7A") {
  const res = await Swal.fire({
    title,
    text,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: confirmColor,
    cancelButtonColor: "#6B7280",
    confirmButtonText: confirmText,
    cancelButtonText: "Cancel",
    background: "#fff",
    color: "#111827",
    customClass: {
      popup: "rounded-2xl",
      confirmButton: "rounded-lg px-4 py-2 text-sm font-semibold",
      cancelButton: "rounded-lg px-4 py-2 text-sm font-semibold",
    },
  });
  return res.isConfirmed;
}

export async function confirmDelete(title = "Delete?", text = "You won't be able to revert this.") {
  const res = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#EF4444",
    cancelButtonColor: "#6B7280",
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
    background: "#fff",
    color: "#111827",
    customClass: {
      popup: "rounded-2xl",
      confirmButton: "rounded-lg px-4 py-2 text-sm font-semibold",
      cancelButton: "rounded-lg px-4 py-2 text-sm font-semibold",
    },
  });
  return res.isConfirmed;
}
