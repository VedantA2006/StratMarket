"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [e1, setE1] = useState("");
  const [e2, setE2] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [globalOk, setGlobalOk] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setE1("");
    setE2("");
    setGlobalError("");
    setGlobalOk("");

    let valid = true;
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setE1("Enter a valid email address.");
      valid = false;
    }
    if (password.length < 8) {
      setE2("Use at least 8 characters.");
      valid = false;
    }
    if (isRegister && !name.trim()) {
      setGlobalError("Please provide your full name.");
      valid = false;
    }

    if (!valid) return;

    setLoading(true);
    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
    const body = isRegister ? { name, email, password } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setGlobalError(data.error || "Authentication failed.");
        setLoading(false);
        return;
      }

      setGlobalOk(
        isRegister
          ? "Account registered successfully! Redirecting to dashboard..."
          : "Signed in successfully! Redirecting..."
      );

      setTimeout(() => {
        if (data.user?.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
        router.refresh();
      }, 700);
    } catch {
      setGlobalError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const fillQuickDemo = (demoRole: "CUSTOMER" | "ADMIN") => {
    setIsRegister(false);
    if (demoRole === "ADMIN") {
      setEmail("admin@elvariscapital.in");
      setPassword("Elvaris2026!");
    } else {
      setEmail("trader@elvariscapital.in");
      setPassword("Elvaris2026!");
    }
    setE1("");
    setE2("");
    setGlobalError("");
  };

  return (
    <div className="page" id="p-signin">
      <section className="b">
        <div className="wrap" style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "44px" }}>
            {isRegister ? "Create an account" : "Sign in"}
          </h2>
          <p className="lede" style={{ margin: "12px auto 28px" }}>
            {isRegister
              ? "Register to start 7-day strategy trials and configure email signal alerts."
              : "Sign in with your verified credentials or select a pre-configured demo account below."}
          </p>

          <form className="form" onSubmit={handleSubmit} noValidate style={{ textAlign: "left" }}>
            {isRegister && (
              <label>
                Full Name
                <input
                  type="text"
                  placeholder="e.g. Alex Vance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </label>
            )}

            <label>
              Email
              <input
                id="em"
                type="email"
                placeholder="name@elvariscapital.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <span className="err" id="e1">
                {e1}
              </span>
            </label>

            <label>
              Password
              <input
                id="pw"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isRegister ? "new-password" : "current-password"}
              />
              <span className="err" id="e2">
                {e2}
              </span>
            </label>

            {globalError && <div className="err">{globalError}</div>}
            {globalOk && <div className="ok">{globalOk}</div>}

            <button className="pill" type="submit" disabled={loading} style={{ width: "100%" }}>
              {loading
                ? "Processing..."
                : isRegister
                ? "Create Account"
                : "Sign In"}
            </button>

            <div style={{ textAlign: "center", marginTop: "12px", fontSize: "14px" }}>
              {isRegister ? (
                <span>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(false);
                      setGlobalError("");
                    }}
                    style={{ background: "none", border: "none", color: "var(--tx)", textDecoration: "underline" }}
                  >
                    Sign in
                  </button>
                </span>
              ) : (
                <span>
                  Need an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(true);
                      setGlobalError("");
                    }}
                    style={{ background: "none", border: "none", color: "var(--tx)", textDecoration: "underline" }}
                  >
                    Create account
                  </button>
                </span>
              )}
            </div>

            {/* Quick Demo Credentials */}
            <div
              style={{
                marginTop: "20px",
                padding: "16px",
                border: "1px dashed var(--line)",
                borderRadius: "12px",
                background: "var(--bg2)",
              }}
            >
              <span className="note" style={{ display: "block", marginBottom: "8px" }}>
                Pre-seeded evaluation accounts:
              </span>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="chip"
                  onClick={() => fillQuickDemo("CUSTOMER")}
                >
                  Trader Demo
                </button>
                <button
                  type="button"
                  className="chip"
                  onClick={() => fillQuickDemo("ADMIN")}
                >
                  Admin Demo
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
