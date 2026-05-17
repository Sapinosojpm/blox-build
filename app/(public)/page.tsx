'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useBuildStore } from '@/store/useBuildStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import BuildCard from '@/components/cards/BuildCard';
import BuilderCard from '@/components/cards/BuilderCard';
import { ArrowRight, Compass, ShieldAlert, Sparkles, Trophy, Award, Landmark } from 'lucide-react';
import { Profile } from '@/types';

const CATEGORY_ITEMS = [
  { name: 'Modern Mansion', icon: Trophy, count: '142 builds', desc: 'Ultra luxury modern living plots with infinity pools.' },
  { name: 'Suburban Family Home', icon: Landmark, count: '94 builds', desc: 'Mid-century family models with garages & gardens.' },
  { name: 'Cozy Cottage', icon: Sparkles, count: '67 builds', desc: 'Warm Linen & aesthetic forest cabin styles.' },
  { name: 'Cafe / Restaurant', icon: Award, iconColor: 'text-amber-400', count: '48 builds', desc: 'Detailed business builds open for servers roleplay.' },
];

export default function HomePage() {
  const { builds } = useBuildStore();
  
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
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blox-cyan/10 via-[#0B0E14] to-[#0B0E14]">
        {/* Glow Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blox-red/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-blox-cyan/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto flex flex-col items-center">
            {/* Tagline Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full glass-panel border-blox-cyan/30 text-[10px] sm:text-xs text-blox-cyan font-bold uppercase tracking-widest mb-6"
            >
              <Sparkles size={13} className="animate-pulse" />
              Roblox Bloxburg Build Hub & Commission Market
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight uppercase"
            >
              Discover & HIRE the <br />
              <span className="text-gradient-cyan">Elite Builders</span> of Bloxburg
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-sm sm:text-base text-gray-400 max-w-2xl leading-relaxed font-medium"
            >
              Explore a premium repository of gorgeous modern mansions, cozy linen cottages, and roleplay cities. Direct commission booking built specifically for elite Roblox architects.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 flex flex-wrap gap-4 justify-center"
            >
              <Link href="/explore">
                <Button variant="primary" size="lg" glow={true} className="gap-2 text-sm uppercase tracking-wider font-extrabold">
                  Explore Build Catalog
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="glass" size="lg" className="text-sm uppercase tracking-wider font-extrabold border-white/10 hover:bg-white/5">
                  Become a Creator
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
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
