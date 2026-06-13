'use client';

import { useEffect, useRef, ReactNode } from 'react';
import gsap from 'gsap';

export default function GridBackground({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Set initial CSS variables
    container.style.setProperty('--mouse-x', '-999px');
    container.style.setProperty('--mouse-y', '-999px');
    container.style.setProperty('--mouse-opacity', '0');

    // Smooth interpolations using gsap.quickTo
    const xTo = gsap.quickTo(container, '--mouse-x', {
      duration: 0.8,
      ease: 'power3.out',
      unit: 'px',
    });
    const yTo = gsap.quickTo(container, '--mouse-y', {
      duration: 0.8,
      ease: 'power3.out',
      unit: 'px',
    });
    const opacityTo = gsap.quickTo(container, '--mouse-opacity', {
      duration: 0.4,
      ease: 'power2.out',
    });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      xTo(x);
      yTo(y);
    };

    const handleMouseEnter = () => {
      opacityTo(1);
    };

    const handleMouseLeave = () => {
      opacityTo(0);
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full bg-[#0B0E14] overflow-hidden flex flex-col justify-center"
    >
      {/* 1. Base Static Faint Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.015) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.015) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* 2. Soft Ambient Radial Glow Behind Grid */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          backgroundImage: `radial-gradient(
            circle 300px at var(--mouse-x, -999px) var(--mouse-y, -999px),
            rgba(0, 180, 216, 0.03) 0%,
            rgba(239, 71, 111, 0.01) 50%,
            transparent 100%
          )`,
          opacity: 'var(--mouse-opacity, 0)',
        }}
      />

      {/* 3. Illuminated Theme Cyan Grid Lines */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 180, 216, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 180, 216, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: `radial-gradient(
            circle 180px at var(--mouse-x, -999px) var(--mouse-y, -999px),
            black 0%,
            transparent 100%
          )`,
          WebkitMaskImage: `radial-gradient(
            circle 180px at var(--mouse-x, -999px) var(--mouse-y, -999px),
            black 0%,
            transparent 100%
          )`,
          opacity: 'var(--mouse-opacity, 0)',
        }}
      />

      {/* 4. Fine Blueprint Blueprint Lines for extra architectural feel */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.01) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.01) 1px, transparent 1px)
          `,
          backgroundSize: '12px 12px',
        }}
      />

      {/* Children content (form cards, logo etc.) */}
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}
