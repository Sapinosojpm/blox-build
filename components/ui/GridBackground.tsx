'use client';

import { useEffect, useRef, ReactNode } from 'react';
import gsap from 'gsap';

export default function GridBackground({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999, active: false });
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d')!;
    const CELL = 36; // grid cell size (smaller = denser)
    const RIPPLE_RADIUS = 160; // how far mouse affects grid
    const RIPPLE_STRENGTH = 14; // max displacement in px
    const GLOW_RADIUS = 300; // ambient glow radius

    let width = 0;
    let height = 0;

    const resize = () => {
      width = container.offsetWidth;
      height = container.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    };

    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
      gsap.to(mouseRef.current, {
        x: -9999,
        y: -9999,
        duration: 0.8,
        ease: 'power2.out',
      });
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const active = mouseRef.current.active;

      // — Ambient glow behind grid —
      if (active) {
        const grd = ctx.createRadialGradient(mx, my, 0, mx, my, GLOW_RADIUS);
        grd.addColorStop(0, 'rgba(0, 200, 255, 0.18)');
        grd.addColorStop(0.4, 'rgba(100, 60, 255, 0.07)');
        grd.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, width, height);
      }

      // — Compute grid cols/rows —
      const cols = Math.ceil(width / CELL) + 2;
      const rows = Math.ceil(height / CELL) + 2;

      // Helper: get displaced position of a grid point
      const displaced = (col: number, row: number) => {
        const gx = col * CELL;
        const gy = row * CELL;
        if (!active) return { x: gx, y: gy, d: Infinity };
        const dx = gx - mx;
        const dy = gy - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < RIPPLE_RADIUS && dist > 0) {
          const factor = (1 - dist / RIPPLE_RADIUS);
          const ease = factor * factor;
          const push = ease * RIPPLE_STRENGTH;
          return {
            x: gx + (dx / dist) * push,
            y: gy + (dy / dist) * push,
            d: dist,
          };
        }
        return { x: gx, y: gy, d: dist };
      };

      // — Draw horizontal grid lines —
      for (let row = 0; row <= rows; row++) {
        ctx.beginPath();
        let started = false;
        for (let col = 0; col <= cols; col++) {
          const p = displaced(col, row);
          const nearMouse = active && p.d < RIPPLE_RADIUS;

          if (!started) {
            ctx.moveTo(p.x, p.y);
            started = true;
          } else {
            ctx.lineTo(p.x, p.y);
          }

          if (nearMouse && started && col < cols) {
            // brightness based on closeness
            const intensity = Math.max(0, 1 - p.d / RIPPLE_RADIUS);
            const alpha = 0.08 + intensity * 0.55;
            const cyan = Math.round(180 + intensity * 75);
            ctx.strokeStyle = `rgba(0, ${cyan}, 255, ${alpha})`;
            ctx.lineWidth = 0.5 + intensity * 1.0;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
          }
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.055)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // — Draw vertical grid lines —
      for (let col = 0; col <= cols; col++) {
        ctx.beginPath();
        let started = false;
        for (let row = 0; row <= rows; row++) {
          const p = displaced(col, row);
          const nearMouse = active && p.d < RIPPLE_RADIUS;

          if (!started) {
            ctx.moveTo(p.x, p.y);
            started = true;
          } else {
            ctx.lineTo(p.x, p.y);
          }

          if (nearMouse && started && row < rows) {
            const intensity = Math.max(0, 1 - p.d / RIPPLE_RADIUS);
            const alpha = 0.08 + intensity * 0.55;
            const cyan = Math.round(180 + intensity * 75);
            ctx.strokeStyle = `rgba(0, ${cyan}, 255, ${alpha})`;
            ctx.lineWidth = 0.5 + intensity * 1.0;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
          }
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.055)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // — Bright dot on grid intersection nearest mouse —
      if (active) {
        const nearCol = Math.round(mx / CELL);
        const nearRow = Math.round(my / CELL);
        for (let dc = -3; dc <= 3; dc++) {
          for (let dr = -3; dr <= 3; dr++) {
            const p = displaced(nearCol + dc, nearRow + dr);
            if (p.d < RIPPLE_RADIUS * 0.85) {
              const intensity = Math.max(0, 1 - p.d / (RIPPLE_RADIUS * 0.85));
              ctx.beginPath();
              ctx.arc(p.x, p.y, 1.2 + intensity * 1.8, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(0, 220, 255, ${intensity * 0.9})`;
              ctx.fill();
            }
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full bg-[#080b10] overflow-hidden flex flex-col justify-center"
    >
      {/* Canvas interactive grid */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />

      {/* Static deep ambient glow blobs */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(0,180,255,0.6) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-[-10%] right-[15%] w-[400px] h-[400px] rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, rgba(120,60,255,0.5) 0%, transparent 70%)', filter: 'blur(90px)' }} />
      </div>

      {/* Children content */}
      <div className="relative w-full" style={{ zIndex: 10 }}>
        {children}
      </div>
    </div>
  );
}
