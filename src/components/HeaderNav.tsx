"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function HeaderNav() {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{ id: string; name: string; role: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Check user session
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.refresh();
  };

  return (
    <header id="nav" className={scrolled ? "s" : ""}>
      <Link href="/" className="logo">
        <svg
          className="mk"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="1.5" y="1.5" width="21" height="21" rx="6" stroke="#444" />
          <path d="M5 16 L10 10 L14 14 L19 7" pathLength="1" />
        </svg>
        StratMarket
      </Link>

      <span className="chip0">
        <i />
        Simulated markets · demo
      </span>

      <div className="r">
        {!loading && (
          <>
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Link href="/dashboard" className="pill g sm">
                  Dashboard
                </Link>
                {user.role === "ADMIN" && (
                  <Link href="/admin" className="pill g sm" style={{ borderColor: "var(--gold)" }}>
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="pill g sm"
                  style={{ color: "var(--mut)", border: "none", padding: "7px 10px" }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link href="/signin" className="pill g sm">
                Sign in
              </Link>
            )}
          </>
        )}
        <Link href="/market" className="pill sm">
          Explore strategies
        </Link>
      </div>
    </header>
  );
}
