"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";

export function DockNav() {
  const pathname = usePathname();
  const dockRef = useRef<HTMLElement>(null);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dockRef.current) return;
    const links = dockRef.current.querySelectorAll<HTMLAnchorElement>("a.l");
    const mouseX = e.clientX;

    links.forEach((link) => {
      const rect = link.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const d = Math.abs(mouseX - center);
      const scaleVal = Math.exp((-d * d) / (2 * 55 * 55)).toFixed(3);
      link.style.setProperty("--g", scaleVal);
    });
  };

  const handlePointerLeave = () => {
    if (!dockRef.current) return;
    const links = dockRef.current.querySelectorAll<HTMLAnchorElement>("a.l");
    links.forEach((link) => {
      link.style.setProperty("--g", "0");
    });
  };

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav
      id="dock"
      ref={dockRef}
      aria-label="Main"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <Link
        href="/"
        className="l"
        data-t="Home"
        aria-label="Home"
        aria-current={isActive("/") ? "true" : undefined}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
        </svg>
      </Link>

      <Link
        href="/market"
        className="l"
        data-t="Marketplace"
        aria-label="Marketplace"
        aria-current={isActive("/market") ? "true" : undefined}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      </Link>

      <Link
        href="/research"
        className="l"
        data-t="Research"
        aria-label="Research"
        aria-current={isActive("/research") ? "true" : undefined}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="2.4" />
          <ellipse cx="12" cy="12" rx="10" ry="4" />
          <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
        </svg>
      </Link>

      <Link
        href="/how"
        className="l"
        data-t="How it works"
        aria-label="How it works"
        aria-current={isActive("/how") ? "true" : undefined}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="5" cy="19" r="2" />
          <circle cx="19" cy="5" r="2" />
          <path d="M7 19h6a4 4 0 0 0 0-8h-2a4 4 0 0 1 0-8h6" />
        </svg>
      </Link>

      <Link
        href="/pricing"
        className="l"
        data-t="Pricing"
        aria-label="Pricing"
        aria-current={isActive("/pricing") ? "true" : undefined}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 12l9-9h9v9l-9 9z" />
          <circle cx="16" cy="8" r="1.4" />
        </svg>
      </Link>
    </nav>
  );
}
