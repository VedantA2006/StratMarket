"use client";

import { useEffect, useRef } from "react";

export function SpotlightCursor() {
  const curRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cur = curRef.current;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let animId: number;

    const handlePointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      // Update ambient radial spot
      document.documentElement.style.setProperty("--mx", `${e.clientX}px`);
      document.documentElement.style.setProperty("--my", `${e.clientY}px`);

      // Card-level spotlight glow
      const target = e.target as HTMLElement | null;
      if (target) {
        const card = target.closest<HTMLElement>(".fc, .card, .plan, .st, .tile, .ch");
        if (card) {
          const rect = card.getBoundingClientRect();
          card.style.setProperty("--cx", `${e.clientX - rect.left}px`);
          card.style.setProperty("--cy", `${e.clientY - rect.top}px`);
        }

        // Magnetic pill micro-interaction
        const pill = target.closest<HTMLElement>(".pill");
        if (pill) {
          const rect = pill.getBoundingClientRect();
          const offsetX = (e.clientX - rect.left - rect.width / 2) * 0.16;
          const offsetY = (e.clientY - rect.top - rect.height / 2) * 0.22;
          pill.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        }
      }
    };

    const handlePointerOver = (e: PointerEvent) => {
      if (!cur) return;
      const target = e.target as HTMLElement | null;
      const isInteractive = target?.closest("a, button, input, select, .card, .fc, .ir, summary");
      cur.classList.toggle("h", Boolean(isInteractive));
    };

    const handlePointerOut = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      const pill = target?.closest<HTMLElement>(".pill");
      if (pill) {
        pill.style.transform = "";
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerover", handlePointerOver, { passive: true });
    window.addEventListener("pointerout", handlePointerOut, { passive: true });

    const loop = () => {
      currentX += (targetX - currentX) * 0.22;
      currentY += (targetY - currentY) * 0.22;
      if (cur) {
        cur.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerover", handlePointerOver);
      window.removeEventListener("pointerout", handlePointerOut);
    };
  }, []);

  return <div id="cur" ref={curRef} aria-hidden="true" />;
}
