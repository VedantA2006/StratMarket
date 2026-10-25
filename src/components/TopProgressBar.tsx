"use client";

import { useEffect, useState } from "react";

export function TopProgressBar() {
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      setScale(Math.min(1, Math.max(0, scrollY / docHeight)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      id="prog"
      style={{ transform: `scaleX(${scale})` }}
      aria-hidden="true"
    />
  );
}
