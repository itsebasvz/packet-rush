"use client";
import { useEffect, useRef } from "react";

export function Fireworks({ eventId }: { eventId: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!canvas || !eventId || motion.matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let width = 0,
      height = 0,
      raf = 0,
      stopped = false;
    const colors = ["#FFB200", "#4F3DD9", "#7dcdf4", "#ACF0D1", "#ff83ae"];
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      born: number;
      life: number;
      color: string;
      size: number;
    }[] = [];
    const bursts = Array.from({ length: 7 }, (_, i) => ({
      x: [0.12, 0.88, 0.33, 0.72, 0.5, 0.18, 0.82][i],
      y: [0.26, 0.23, 0.18, 0.3, 0.13, 0.42, 0.4][i],
      at: i * 380,
      done: false,
    }));
    function size() {
      const scale = Math.min(window.devicePixelRatio || 1, 1.5);
      width = innerWidth;
      height = innerHeight;
      canvas!.width = width * scale;
      canvas!.height = height * scale;
      ctx!.setTransform(scale, 0, 0, scale, 0, 0);
    }
    size();
    const start = performance.now();
    let last = start;
    function stop() {
      stopped = true;
      cancelAnimationFrame(raf);
      ctx!.clearRect(0, 0, width, height);
    }
    function frame(now: number) {
      if (stopped) return;
      const elapsed = now - start;
      const dt = Math.min((now - last) / 1000, 0.04);
      last = now;
      ctx!.clearRect(0, 0, width, height);
      for (const burst of bursts) {
        const age = elapsed - burst.at;
        if (age >= 0 && age < 350) {
          const x = burst.x * width,
            y = height - (height - burst.y * height) * (age / 350);
          ctx!.globalAlpha = 0.65;
          ctx!.strokeStyle = colors[0];
          ctx!.lineWidth = 3;
          ctx!.beginPath();
          ctx!.moveTo(x, y + 18);
          ctx!.lineTo(x, y);
          ctx!.stroke();
        }
        if (age >= 350 && !burst.done) {
          burst.done = true;
          for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2;
            const velocity = 60 + Math.random() * 115;
            particles.push({
              x: burst.x * width,
              y: burst.y * height,
              vx: Math.cos(angle) * velocity,
              vy: Math.sin(angle) * velocity,
              born: elapsed,
              life: 1100 + Math.random() * 550,
              color: colors[i % colors.length],
              size: 2 + Math.random() * 2,
            });
          }
        }
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        const age = elapsed - p.born;
        if (age > p.life) {
          particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 70 * dt;
        ctx!.globalAlpha = Math.max(0, 1 - age / p.life);
        ctx!.fillStyle = p.color;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
      if (elapsed < 5000 && !document.hidden)
        raf = requestAnimationFrame(frame);
      else stop();
    }
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", size);
    motion.addEventListener("change", stop);
    return () => {
      stop();
      window.removeEventListener("resize", size);
      motion.removeEventListener("change", stop);
    };
  }, [eventId]);
  return <canvas ref={ref} className="fireworks-canvas" aria-hidden="true" />;
}
