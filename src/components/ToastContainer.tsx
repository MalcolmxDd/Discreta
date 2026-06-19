import { useToast } from "../context/ToastContext";

const icons: Record<string, string> = {
  success: "✓",
  error: "✕",
  info: "●",
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.exiting ? "toast-exit" : ""}`}>
          <span className={`toast-icon ${toast.type}`}>{icons[toast.type]}</span>
          <span className="toast-message">{toast.message}</span>
          <button
            className="toast-close"
            onClick={() => removeToast(toast.id)}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
