import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { FiAlertTriangle, FiCheckCircle, FiInfo, FiX } from "react-icons/fi";

const NotificationContext = createContext(null);

const styles = {
  success: {
    icon: FiCheckCircle,
    accent: "text-emerald-600 bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  error: {
    icon: FiAlertTriangle,
    accent: "text-red-600 bg-red-500/10",
    border: "border-red-500/20",
  },
  info: {
    icon: FiInfo,
    accent: "text-blue-600 bg-blue-500/10",
    border: "border-blue-500/20",
  },
};

export function AppNotificationProvider({ children }) {
  const [items, setItems] = useState([]);

  const remove = useCallback((id) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const show = useCallback((type, title, message, options = {}) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const duration = options.duration ?? 3200;

    setItems((current) => [
      ...current,
      {
        id,
        type,
        title,
        message,
        duration,
      },
    ]);

    return id;
  }, []);

  const notify = useMemo(
    () => ({
      success: (title, message, options) =>
        show("success", title, message, options),
      error: (title, message, options) => show("error", title, message, options),
      info: (title, message, options) => show("info", title, message, options),
      remove,
    }),
    [remove, show]
  );

  return (
    <NotificationContext.Provider value={notify}>
      {children}

      <div className="fixed right-4 top-4 z-[9999] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-3">
        {items.map((item) => (
          <NotificationItem key={item.id} item={item} onRemove={remove} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotification must be used inside AppNotificationProvider."
    );
  }

  return context;
}

function NotificationItem({ item, onRemove }) {
  const variant = styles[item.type] || styles.info;
  const Icon = variant.icon;

  useEffect(() => {
    if (!item.duration) return undefined;

    const timer = window.setTimeout(() => {
      onRemove(item.id);
    }, item.duration);

    return () => window.clearTimeout(timer);
  }, [item.duration, item.id, onRemove]);

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-2xl border bg-white p-4 text-zinc-900 shadow-xl shadow-black/10 ring-1 ring-black/5 dark:bg-zinc-900 dark:text-white dark:ring-white/10 ${variant.border}`}
      role="status"
    >
      <div
        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${variant.accent}`}
      >
        <Icon className="text-xl" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-5">{item.title}</p>
        {item.message && (
          <p className="mt-1 text-sm leading-5 text-zinc-600 dark:text-zinc-300">
            {item.message}
          </p>
        )}
      </div>

      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onRemove(item.id)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
      >
        <FiX />
      </button>
    </div>
  );
}
