"use client";

import { useEffect, useRef } from "react";

export function TerrainCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0;
    let H = 0;
    let T = 0;
    let mx = 0;
    let sm = 0;
    let vis = true;
    let animId: number;

    const rs = () => {
      if (!cv) return;
      const r = cv.getBoundingClientRect();
      W = r.width;
      H = r.height;
      cv.width = W * dpr;
      cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    rs();
    window.addEventListener("resize", rs);

    const onPointerMove = (e: PointerEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
    };
    window.addEventListener("pointermove", onPointerMove);

    const observer = new IntersectionObserver((entries) => {
      vis = entries[0]?.isIntersecting ?? true;
    });
    observer.observe(cv);

    const render = () => {
      if (!W) rs();
      sm += (mx - sm) * 0.05;
      ctx.clearRect(0, 0, W, H);
      const N = 34;
      const M = 72;
      const hz = H * 0.1;

      for (let r = 0; r < N; r++) {
        const t = r / (N - 1);
        const ty = hz + Math.pow(t, 1.7) * (H - hz - 6);
        const sc = 0.25 + t * 1.05;
        const amp = H * 0.5 * (0.25 + t * 0.9);
        const p = r - T;
        let fx0 = 0;
        let fx1 = 0;

        ctx.beginPath();
        for (let c = 0; c < M; c++) {
          const u = c / (M - 1) - 0.5;
          const env = Math.exp(-Math.pow(u / 0.26, 2));
          const v = Math.abs(
            Math.sin(c * 0.33 + p * 0.55) * 0.5 +
              Math.sin(c * 0.81 - p * 0.9) * 0.3 +
              Math.sin(c * 1.9 + p * 1.7) * 0.2
          );
          const px = W / 2 + u * W * sc * 1.1 + sm * t * 70;
          const py = ty - env * v * amp * 0.55;

          if (c === 0) {
            fx0 = px;
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
          fx1 = px;
        }

        ctx.lineTo(fx1, H + 2);
        ctx.lineTo(fx0, H + 2);
        ctx.closePath();
        ctx.fillStyle = "#000";
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + t * 0.85})`;
        ctx.lineWidth = 0.6 + t * 1.1;
        ctx.stroke();
      }
    };

    const loop = () => {
      if (vis && !document.hidden) {
        T += 0.05;
        render();
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", rs);
      window.removeEventListener("pointermove", onPointerMove);
      observer.disconnect();
    };
  }, []);

  return <canvas id="tr" ref={canvasRef} aria-hidden="true" />;
}
