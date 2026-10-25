"use client";

import Link from "next/link";
import { useEffect } from "react";

interface Props {
  title?: string;
  message: string;
  onClose: () => void;
}

export function DemoPreviewModal({ title = "Prototype preview", message, onClose }: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="ov on"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains("ov")) onClose();
      }}
    >
      <div className="modal">
        <button className="x" aria-label="Close" onClick={onClose}>
          ×
        </button>
        <h2>{title}</h2>
        <p className="note" style={{ fontSize: "15px", margin: "16px 0 24px" }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Link href="/market" className="pill" onClick={onClose}>
            Browse strategies
          </Link>
          <button className="pill g" onClick={onClose}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
