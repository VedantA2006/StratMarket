"use client";

import { useState, useEffect, useRef } from "react";
import { StrategySeedItem } from "@/lib/db/seed-data";
import { StrategyDetailModal } from "./StrategyDetailModal";

interface IndexPreviewProps {
  initialStrategies: StrategySeedItem[];
}

export function IndexPreview({ initialStrategies }: IndexPreviewProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<StrategySeedItem | null>(null);
  const [hoveredStrategy, setHoveredStrategy] = useState<StrategySeedItem | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const previewRef = useRef<HTMLDivElement>(null);

  const previewList = initialStrategies.slice(0, 6);

  useEffect(() => {
    let animId: number;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    const handlePointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    window.addEventListener("pointermove", handlePointerMove);

    const loop = () => {
      currentX += (targetX - currentX) * 0.16;
      currentY += (targetY - currentY) * 0.16;
      setPos({ x: currentX + 24, y: currentY - 80 });
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  const pth = (a: number[], w: number, h: number, mn: number, mx: number, p = 6) => {
    return a
      .map(
        (v, i) =>
          (i ? "L" : "M") +
          (p + (i * (w - 2 * p)) / (a.length - 1)).toFixed(1) +
          "," +
          (h - p - ((v - mn) / (mx - mn)) * (h - 2 * p)).toFixed(1)
      )
      .join("");
  };

  return (
    <>
      <div id="ix">
        {previewList.map((s) => {
          const isPython = s.implementationType === "PYTHON";
          return (
            <a
              key={s.id}
              href={`/strategies/${s.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ir"
              onPointerOver={() => setHoveredStrategy(s)}
              onPointerLeave={() => setHoveredStrategy(null)}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <span className="n">{s.id}</span>
              <span className={isPython ? "badge-mini-py" : "badge-mini-pn"}>
                {isPython ? "Python" : "Pine"}
              </span>
              <span className="t">{s.name}</span>
              <span className="m">
                {s.instrument} · {s.timeframe}
              </span>
              <span className="a">↗</span>
            </a>
          );
        })}
      </div>

      {/* Floating Hover Preview Card */}
      <div
        id="pv"
        ref={previewRef}
        className={hoveredStrategy ? "on" : ""}
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px)`,
        }}
        aria-hidden="true"
      >
        {hoveredStrategy && (
          <>
            <svg viewBox="0 0 220 90">
              <path
                d={pth(
                  hoveredStrategy.equitySeries.slice(0, 60),
                  220,
                  90,
                  Math.min(...hoveredStrategy.equitySeries.slice(0, 60)),
                  Math.max(...hoveredStrategy.equitySeries.slice(0, 60)),
                  6
                )}
                fill="none"
                stroke="#fff"
                strokeWidth="2"
              />
            </svg>
            <div className="mm">
              <div>
                Return*<b>{hoveredStrategy.metrics.netReturn}%</b>
              </div>
              <div>
                Max DD*<b>{hoveredStrategy.metrics.maxDrawdown}%</b>
              </div>
              <div>
                PF*<b>{hoveredStrategy.metrics.profitFactor}</b>
              </div>
            </div>
            <span className="note">*Illustrative</span>
          </>
        )}
      </div>

      {selectedStrategy && (
        <StrategyDetailModal
          strategy={selectedStrategy}
          onClose={() => setSelectedStrategy(null)}
        />
      )}
    </>
  );
}
