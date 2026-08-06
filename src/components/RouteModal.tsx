import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

export default function RouteModal({
  children, maxWidth = 1100,
}: { children: React.ReactNode; maxWidth?: number }) {
  const navigate = useNavigate();
  const close = () => navigate(-1);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div
      onClick={close}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "32px 16px", overflowY: "auto", zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth, background: "#f1f5f9", borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)", position: "relative",
          maxHeight: "calc(100vh - 64px)", overflowY: "auto",
        }}
      >
        <button
          onClick={close}
          aria-label="Close"
          style={{
            position: "absolute", top: 14, right: 14, width: 34, height: 34, borderRadius: "50%",
            border: "none", background: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 2,
          }}
        >
          <X size={16} color="#334155" />
        </button>
        {children}
      </div>
    </div>
  );
}
