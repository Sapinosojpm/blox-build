'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useBuildStore } from '@/store/useBuildStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useBookingStore } from '@/store/useBookingStore';
import { Button } from '@/components/ui/Button';
import BuildCard from '@/components/cards/BuildCard';
import BuilderCard from '@/components/cards/BuilderCard';
import { ArrowRight, Compass, ShieldAlert, Sparkles, Trophy, Award, Landmark } from 'lucide-react';
import { Profile } from '@/types';
import { createClient } from '@/lib/supabase/client';

const CATEGORY_ITEMS = [
  { name: 'Modern Mansion', icon: Trophy, count: '142 builds', desc: 'Ultra luxury modern living plots with infinity pools.' },
  { name: 'Suburban Family Home', icon: Landmark, count: '94 builds', desc: 'Mid-century family models with garages & gardens.' },
  { name: 'Cozy Cottage', icon: Sparkles, count: '67 builds', desc: 'Warm Linen & aesthetic forest cabin styles.' },
  { name: 'Cafe / Restaurant', icon: Award, iconColor: 'text-amber-400', count: '48 builds', desc: 'Detailed business builds open for servers roleplay.' },
];

export default function HomePage() {
  const { builds } = useBuildStore();
  const { bookings } = useBookingStore();

  const [activeUsersCount, setActiveUsersCount] = useState(3);

  // Hero spotlight trail
  const TRAIL_MAX = 28;
  const heroRef = useRef<HTMLElement>(null);
  const trailRef = useRef<{ x: number; y: number }[]>([]);
  const rafRef = useRef<number | null>(null);
  const [trailSnap, setTrailSnap] = useState<{ x: number; y: number }[]>([]);

  const handleHeroMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    trailRef.current = [{ x, y }, ...trailRef.current].slice(0, TRAIL_MAX);
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        setTrailSnap([...trailRef.current]);
        rafRef.current = null;
      });
    }
  }, []);

  const handleHeroMouseLeave = useCallback(() => {
    trailRef.current = [];
    setTrailSnap([]);
  }, []);

  // Build CSS multi-layer mask from trail positions (union of all circles)
  const spotMask = trailSnap.length > 0
    ? trailSnap
        .map((p, i) => {
          const size = Math.max(80, 300 - i * 8);
          const a = +(Math.max(0, 1 - i / TRAIL_MAX) ** 0.5).toFixed(3);
          return `radial-gradient(circle ${size}px at ${p.x}px ${p.y}px, rgba(0,0,0,${a}) 0%, rgba(0,0,0,${+(a * 0.4).toFixed(3)}) 50%, transparent 80%)`;
        })
        .join(', ')
    : undefined;
  const spotMaskComposite = trailSnap.length > 1
    ? trailSnap.map(() => 'add').join(', ')
    : undefined;

  useEffect(() => {
    const fetchUsersCount = async () => {
      try {
        const supabase = createClient();
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        if (count !== null) {
          setActiveUsersCount(count);
        }
      } catch (err) {
        console.error('Error fetching live users count:', err);
      }
    };
    fetchUsersCount();
  }, []);

  // Featured builds: show latest 3
  const featuredBuilds = builds.slice(0, 3);

  // Trending builders: extract unique profiles from builds list
  const trendingBuilders = Array.from(
    new Map<string, Profile>(
      builds
        .filter((b) => !!b.profiles)
        .map((b) => [b.profiles!.id, b.profiles!] as [string, Profile])
    ).values()
  ).slice(0, 3);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* 1. Hero Section */}
      <section
        ref={heroRef}
        className="relative overflow-hidden min-h-[92vh] flex items-center"
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
      >

        {/* ── Cinematic background ── */}
        <div className="absolute inset-0 z-0">

          {/* ── MOBILE / TABLET: full colored image ── */}
          <img
            src="/img/hero.png"
            alt="Bloxburg night scene"
            className="absolute inset-0 w-full h-full object-cover object-center lg:hidden"
          />

          {/* ── DESKTOP: black grid + cursor trail reveal ── */}
          {/* Pure black base */}
          <div className="absolute inset-0 bg-black hidden lg:block" />
          {/* CSS grid pattern */}
          <div
            className="absolute inset-0 hidden lg:block"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px),
                linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
              `,
              backgroundSize: '80px 80px, 80px 80px, 20px 20px, 20px 20px',
            }}
          />
          {/* Subtle radial glow at center so grid isn't flat */}
          <div
            className="absolute inset-0 hidden lg:block"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,200,255,0.04) 0%, transparent 70%)',
            }}
          />
          {/* Colored image — only revealed at cursor trail via CSS mask (desktop) */}
          {spotMask && (
            <img
              src="/img/hero.png"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover object-center hidden lg:block"
              style={{
                maskImage: spotMask,
                WebkitMaskImage: spotMask,
                maskComposite: spotMaskComposite,
                WebkitMaskComposite: 'source-over',
              }}
            />
          )}

          {/* Dark vignette on edges so text stays readable — both breakpoints */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
        </div>

        {/* ── Floating particles / sparkle dots ── */}
        <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
          {[...Array(18)].map((_, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-blox-cyan/60 animate-pulse"
              style={{
                width: `${2 + (i % 3)}px`,
                height: `${2 + (i % 3)}px`,
                top: `${10 + (i * 5) % 80}%`,
                left: `${5 + (i * 7) % 90}%`,
                animationDelay: `${(i * 0.4) % 3}s`,
                animationDuration: `${2 + (i % 3)}s`,
                opacity: 0.4 + (i % 4) * 0.15,
              }}
            />
          ))}
        </div>

        {/* ── Content ── */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full py-28 md:py-36">
          <div className="text-center max-w-3xl mx-auto flex flex-col items-center">

            {/* Tagline Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full glass-panel border-blox-cyan/30 text-[10px] sm:text-xs text-blox-cyan font-bold uppercase tracking-widest mb-6"
            >
              <Sparkles size={13} className="animate-pulse" />
              Roblox Bloxburg Build Hub &amp; Commission Market
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-7xl font-black tracking-tight text-white leading-[1.05] uppercase drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]"
            >
              Discover &amp; HIRE the <br />
              <span className="text-gradient-cyan drop-shadow-[0_0_32px_rgba(0,210,255,0.4)]">
                Elite Builders
              </span>{' '}
              of Bloxburg
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.22 }}
              className="mt-6 text-sm sm:text-base text-gray-300 max-w-2xl leading-relaxed font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
            >
              Explore a premium repository of gorgeous modern mansions, cozy linen cottages, and
              roleplay cities. Direct commission booking built specifically for elite Roblox architects.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.34 }}
              className="mt-10 flex flex-wrap gap-4 justify-center"
            >
              <Link href="/explore">
                <Button variant="primary" size="lg" glow={true} className="gap-2 text-sm uppercase tracking-wider font-extrabold shadow-lg shadow-blox-red/20">
                  Explore Build Catalog
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="glass" size="lg" className="text-sm uppercase tracking-wider font-extrabold border-white/20 hover:bg-white/10 backdrop-blur-md">
                  Become a Creator
                </Button>
              </Link>
            </motion.div>

            {/* Stats bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.46 }}
              className="mt-12 flex flex-wrap justify-center items-center gap-6 sm:gap-10 p-5 rounded-2xl border border-white/10 bg-[#080b10]/60 backdrop-blur-xl shadow-2xl max-w-2xl w-full"
            >
              {/* Registered Builders */}
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <div className="text-left">
                  <span className="block text-xs font-black text-white uppercase tracking-wider">
                    {activeUsersCount} Registered
                  </span>
                  <span className="block text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                    Active Builders
                  </span>
                </div>
              </div>

              <div className="hidden sm:block h-6 w-px bg-white/10" />

              {/* Dream Plots */}
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-blox-cyan/10 rounded-lg border border-blox-cyan/20">
                  <Compass className="text-blox-cyan" size={13} />
                </div>
                <div className="text-left">
                  <span className="block text-xs font-black text-white uppercase tracking-wider">
                    {builds.length} Cataloged
                  </span>
                  <span className="block text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                    Dream Plots
                  </span>
                </div>
              </div>

              <div className="hidden sm:block h-6 w-px bg-white/10" />

              {/* Commissions */}
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-blox-amber/10 rounded-lg border border-blox-amber/20">
                  <Trophy className="text-blox-amber" size={13} />
                </div>
                <div className="text-left">
                  <span className="block text-xs font-black text-white uppercase tracking-wider">
                    {bookings.length} Transacted
                  </span>
                  <span className="block text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                    Arranged Jobs
                  </span>
                </div>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Bottom fade into the rest of the page */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#080b10] to-transparent z-10 pointer-events-none" />
      </section>

      {/* 2. Categories Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 mb-10 text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider">
            Browse By Build Style Categories
          </h2>
          <p className="text-xs text-gray-500 font-bold uppercase">
            Filter through specialized Bloxburg architectural designs
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {CATEGORY_ITEMS.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <motion.div
                key={cat.name}
                variants={item}
                className="p-5 rounded-2xl glass-panel border border-white/5 hover:border-blox-cyan/20 hover:bg-blox-gray/30 transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 w-fit mb-4 group-hover:bg-blox-cyan/10 transition-colors">
                    <Icon size={20} className="text-blox-cyan" />
                  </div>
                  <h3 className="text-sm font-black text-white group-hover:text-blox-cyan transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed font-semibold mt-2">
                    {cat.desc}
                  </p>
                </div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-4">
                  {cat.count}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* 3. Featured Builds */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div className="flex flex-col gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider">
              Featured Creations
            </h2>
            <p className="text-xs text-gray-500 font-bold uppercase">
              Highly detailed constructions handpicked by community architects
            </p>
          </div>
          <Link href="/explore" className="hidden sm:flex items-center gap-1 text-xs font-bold text-blox-cyan hover:text-white transition-colors">
            View All Builds
            <ArrowRight size={14} />
          </Link>
        </div>

        {featuredBuilds.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredBuilds.map((build) => (
              <BuildCard key={build.id} build={build} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white/5 border border-white/5 rounded-2xl font-semibold text-xs text-gray-500">
            No featured builds loaded.
          </div>
        )}
      </section>

      {/* 4. Trending Creators */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div className="flex flex-col gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider">
              Trending Bloxburg Builders
            </h2>
            <p className="text-xs text-gray-500 font-bold uppercase">
              Pro & Elite builders ready to construct your next dream plot
            </p>
          </div>
        </div>

        {trendingBuilders.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingBuilders.map((builder) => (
              <BuilderCard key={builder?.id} builder={builder!} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white/5 border border-white/5 rounded-2xl font-semibold text-xs text-gray-500">
            No builders loaded.
          </div>
        )}
      </section>

      {/* 5. Subscription Upsell Banner */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="p-8 sm:p-12 rounded-3xl glass-panel-glow border border-blox-cyan/20 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
          {/* Overlay glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blox-cyan/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex-1 flex flex-col gap-4 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 w-fit text-[9px] font-black text-blox-cyan uppercase tracking-widest mx-auto md:mx-0">
              <Sparkles size={10} />
              Unlock Premium Privileges
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-white uppercase tracking-wide">
              Showcase Your Designs & Receive Commissions
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 font-medium leading-relaxed max-w-xl">
              Subscribe to our Elite or Pro plan to lift upload limits, earn custom badges, rank higher in exploration results, and unlock the commission booking dashboard to monetize your building skills!
            </p>
          </div>

          <div className="shrink-0 flex flex-col gap-3 w-full md:w-auto">
            <Link href="/pricing" className="w-full">
              <Button variant="secondary" size="lg" glow={true} className="w-full text-xs uppercase tracking-wider font-extrabold">
                View Subscription Plans
              </Button>
            </Link>
            <Link href="/explore" className="w-full">
              <Button variant="glass" size="lg" className="w-full text-xs uppercase tracking-wider font-extrabold">
                Browse Explore Page
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
