"use client";
import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      try {
        await fetch("/api/notifications", { method: "PATCH", credentials: "include" });
        setUnreadCount(0);
      } catch (err) {
        console.error("Failed to mark notifications read:", err);
      }
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <button onClick={handleToggle} className="nav-icon-btn" style={{ position: "relative" }}>
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              background: "#ef4444",
              color: "#ffffff",
              fontSize: "0.65rem",
              fontWeight: 700,
              borderRadius: "999px",
              minWidth: "16px",
              height: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
              border: "2px solid #ffffff",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            background: "#ffffff",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            width: "320px",
            maxHeight: "400px",
            overflowY: "auto",
            zIndex: 100,
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--border)",
              fontWeight: 700,
              fontSize: "0.9rem",
              color: "#1e293b",
            }}
          >
            Notifications
          </div>

          {loading && (
            <div style={{ padding: "20px 16px", textAlign: "center", color: "#94a3b8", fontSize: "0.85rem" }}>
              Loading...
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div style={{ padding: "20px 16px", textAlign: "center", color: "#94a3b8", fontSize: "0.85rem" }}>
              No new notifications
            </div>
          )}

          {!loading &&
            notifications.map((n) => (
              <div
                key={n._id}
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #f1f5f9",
                  background: n.isRead ? "#ffffff" : "#f8faff",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#1e293b" }}>{n.title}</div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>{n.message}</div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}