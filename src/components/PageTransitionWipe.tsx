"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

export function PageTransitionWipe() {
  const [isWiping, setIsWiping] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    // Intercept clicks on internal navigation links
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      // Check if it's an internal link (starts with / or relative, not an external or anchor #hash)
      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("//") &&
        !target.hasAttribute("download") &&
        target.target !== "_blank" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        // If clicking link to current exact path, do nothing
        if (href === pathname) return;

        e.preventDefault();

        // 1. Trigger white curtain wipe animation
        const wp = document.getElementById("wp");
        if (wp) {
          wp.classList.remove("go");
          // Force reflow
          void wp.offsetWidth;
          wp.classList.add("go");
        }
        setIsWiping(true);

        // 2. Midpoint of the curtain animation (420ms-430ms) is when screen is 100% white
        setTimeout(() => {
          startTransition(() => {
            router.push(href);
          });
        }, 430);

        // 3. Clear class after animation completes (950ms)
        setTimeout(() => {
          if (wp) {
            wp.classList.remove("go");
          }
          setIsWiping(false);
        }, 980);
      }
    };

    document.addEventListener("click", handleLinkClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleLinkClick, { capture: true });
    };
  }, [pathname, router]);

  return (
    <div id="wp" className={isWiping ? "go" : ""} aria-hidden="true">
      StratMarket
    </div>
  );
}
