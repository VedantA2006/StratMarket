"use client";

import { useEffect, useState, useRef } from "react";

interface StatItem {
  target: number;
  label: string;
}

const STATS: StatItem[] = [
  { target: 14, label: "strategies in the catalogue" },
  { target: 10, label: "Python strategies" },
  { target: 4, label: "Pine Script strategies" },
  { target: 7, label: "day demo trial" },
];

export function AnimatedStats() {
  const [counts, setCounts] = useState<number[]>([0, 0, 0, 0]);
  const containerRef = useRef<HTMLDivElement>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !animatedRef.current) {
          animatedRef.current = true;
          const startTime = performance.now();
          const duration = 1400;

          const step = (now: number) => {
            const progress = Math.min(1, (now - startTime) / duration);
            const ease = 1 - Math.pow(1 - progress, 4);

            setCounts(STATS.map((s) => Math.round(s.target * ease)));

            if (progress < 1) {
              requestAnimationFrame(step);
            }
          };

          requestAnimationFrame(step);
        }
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="wrap" ref={containerRef}>
      <div className="stats">
        {STATS.map((s, i) => (
          <div key={i}>
            <b>{counts[i]}</b>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
