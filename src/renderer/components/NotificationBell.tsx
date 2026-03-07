import { useState, useEffect, useRef, useCallback } from 'react';
import { getNotifications, type AppNotification } from '../services/api';
import { useNavigate } from 'react-router-dom';

const TYPE_ICONS: Record<string, string> = {
  stale: '\u25C7',
  overdue: '!',
  health: '\u2661',
  blocked: '\u2298',
};

const DISMISSED_KEY = 'dismissed_notifications';

function getDismissedIds(): string[] {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDismissedIds(ids: string[]) {
  // Keep only last 100 dismissed IDs to prevent unbounded growth
  const trimmed = ids.slice(-100);
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(trimmed));
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>(getDismissedIds);
  const [open, setOpen] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
      setFetchError(false);
    } catch {
      setFetchError(true);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const visible = notifications.filter((n) => !dismissedIds.includes(n.id));
  const unreadCount = visible.length;

  function dismiss(id: string) {
    const next = [...dismissedIds, id];
    setDismissedIds(next);
    saveDismissedIds(next);
  }

  function dismissAll() {
    const next = [...dismissedIds, ...visible.map((n) => n.id)];
    setDismissedIds(next);
    saveDismissedIds(next);
    setOpen(false);
  }

  function handleNotificationClick(n: AppNotification) {
    if (n.projectId) {
      navigate(`/project/${n.projectId}`);
      setOpen(false);
    }
  }

  function priorityColor(priority?: string) {
    if (priority === 'high') return 'text-accent-red';
    if (priority === 'medium') return 'text-accent-yellow';
    return 'text-dark-muted';
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-md text-dark-muted hover:text-dark-text hover:bg-dark-hover transition-colors"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
        {fetchError ? (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-[18px] h-[18px] text-[10px] font-bold leading-none text-accent-yellow bg-accent-yellow/20 rounded-full" title="Failed to load notifications">
            !
          </span>
        ) : unreadCount > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none text-white bg-accent-red rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-lg border border-dark-border bg-dark-surface shadow-xl z-50">
          <div className="px-3 py-2 border-b border-dark-border">
            <span className="text-sm font-semibold text-dark-text">
              Notifications
            </span>
          </div>

          {visible.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-dark-muted">
              No notifications
            </div>
          ) : (
            <ul className="divide-y divide-dark-border">
              {visible.map((n) => (
                <li
                  key={n.id}
                  className="flex items-start gap-2 px-3 py-2 hover:bg-dark-hover transition-colors"
                >
                  <span
                    className={`mt-0.5 text-base font-bold shrink-0 ${priorityColor(n.priority)}`}
                    title={n.type}
                  >
                    {TYPE_ICONS[n.type] ?? '\u25CF'}
                  </span>

                  <div
                    className={`flex-1 min-w-0 ${n.projectId ? 'cursor-pointer' : ''}`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <p className="text-sm font-medium text-dark-text truncate">
                      {n.title}
                    </p>
                    <p className="text-xs text-dark-muted line-clamp-2">
                      {n.message}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dismiss(n.id);
                    }}
                    className="shrink-0 mt-0.5 p-0.5 rounded text-dark-muted hover:text-dark-text hover:bg-dark-hover transition-colors"
                    aria-label="Dismiss"
                    title="Dismiss"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {visible.length > 0 && (
            <div className="px-3 py-2 border-t border-dark-border">
              <button
                onClick={dismissAll}
                className="w-full text-xs text-center text-accent-blue hover:underline"
              >
                Dismiss All
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
