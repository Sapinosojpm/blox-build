'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface RotatingTextProps {
  words: string[];
  /** ms between rotations */
  interval?: number;
  className?: string;
}

export default function RotatingText({
  words,
  interval = 2400,
  className = '',
}: RotatingTextProps) {
  const [index, setIndex] = useState(0);
  // Measure widest word so the container never jumps
  const ghostRef = useRef<HTMLSpanElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    // After mount, find the widest word and lock container width
    if (ghostRef.current) {
      setContainerWidth(ghostRef.current.offsetWidth);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % words.length);
    }, interval);
    return () => clearInterval(id);
  }, [words.length, interval]);

  return (
    <>
      {/* Invisible ghost span to measure max width — renders widest word */}
      <span
        ref={ghostRef}
        aria-hidden
        className={`invisible absolute whitespace-nowrap ${className}`}
        style={{ pointerEvents: 'none' }}
      >
        {words.reduce((a, b) => (a.length >= b.length ? a : b))}
      </span>

      {/* Visible rotating container */}
      <span
        className={`relative inline-block align-baseline ${className}`}
        style={{
          width: containerWidth,
          // clip only vertically so the slide animation is contained
          overflow: 'hidden',
          // leave a little extra vertical padding so ascenders/descenders aren't cut
          paddingBottom: '0.05em',
          lineHeight: 'inherit',
          verticalAlign: 'bottom',
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={words[index]}
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            exit={{ y: '-110%', opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ display: 'block', whiteSpace: 'nowrap' }}
          >
            {words[index]}
          </motion.span>
        </AnimatePresence>
      </span>
    </>
  );
}
