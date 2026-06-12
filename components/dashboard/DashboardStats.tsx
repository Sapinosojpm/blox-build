'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useBuildStore } from '@/store/useBuildStore';
import { useBookingStore } from '@/store/useBookingStore';
import { Sparkles, Trophy, CalendarCheck, Image, Award, ShieldAlert, Shield } from 'lucide-react';

export default function DashboardStats() {
  const { user } = useAuthStore();
  const { builds } = useBuildStore();
  const { bookings } = useBookingStore();

  const userBuilds = builds.filter((b) => b.user_id === user?.id);
  const totalUploads = userBuilds.length;

  const isPro = user?.subscription_tier === 'pro';
  const isElite = user?.subscription_tier === 'elite';
  const isFree = user?.subscription_tier === 'free';

  // Stats calculation
  const activeBookings = bookings.filter(
    (b) => (b.builder_id === user?.id || b.client_id === user?.id) && b.status !== 'completed' && b.status !== 'declined'
  ).length;

  const completedCommissions = bookings.filter(
    (b) => b.builder_id === user?.id && b.status === 'completed'
  );
  
  const totalEarnings = completedCommissions.reduce((sum, b) => sum + b.price, 0);

  const getTierIcon = (tier?: string) => {
    switch (tier) {
      case 'pro':
        return <Trophy className="w-5 h-5 text-amber-400" />;
      case 'elite':
        return <Sparkles className="w-5 h-5 text-blox-cyan" />;
      default:
        return <Shield className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTierGlowColor = (tier?: string) => {
    switch (tier) {
      case 'pro':
        return 'shadow-amber-500/10 border-amber-500/20';
      case 'elite':
        return 'shadow-blox-cyan/10 border-blox-cyan/20';
      default:
        return 'shadow-white/5 border-white/5';
    }
  };

  // Upload progress calculations
  const uploadLimit = isFree ? 5 : 999; // 999 stands for infinity
  const uploadPercent = Math.min((totalUploads / 5) * 100, 100);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {/* 1. Subscription Tier Card */}
      <div className={`p-5 rounded-2xl bg-gradient-to-br from-[#161C26]/90 to-[#0B0E14]/90 border glass-panel relative overflow-hidden flex flex-col justify-between shadow-xl group hover:-translate-y-1 transition-all duration-300 ${getTierGlowColor(user?.subscription_tier)}`}>
        {/* Glow effect */}
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 pointer-events-none transition-opacity duration-300 group-hover:opacity-20 ${
          isPro ? 'bg-amber-400' : isElite ? 'bg-blox-cyan' : 'bg-white'
        }`} />
        
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest block mb-1">
              Membership
            </span>
            <h4 className="text-lg font-black text-white uppercase tracking-wide truncate">
              {user?.subscription_tier} Builder
            </h4>
            <p className="text-[10px] text-gray-400 font-semibold mt-1">
              {isPro ? 'Ultimate developer access' : isElite ? 'Enhanced portfolio mode' : 'Standard builder limits'}
            </p>
          </div>
          <div className={`p-2.5 rounded-xl border shrink-0 flex items-center justify-center ${
            isPro ? 'bg-amber-400/10 border-amber-400/20' : isElite ? 'bg-blox-cyan/10 border-blox-cyan/20' : 'bg-white/5 border-white/10'
          }`}>
            {getTierIcon(user?.subscription_tier)}
          </div>
        </div>
      </div>

      {/* 2. Total Uploads Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#161C26]/90 to-[#0B0E14]/90 border border-white/5 glass-panel relative overflow-hidden flex flex-col justify-between shadow-xl group hover:border-blox-cyan/20 hover:-translate-y-1 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 pointer-events-none transition-opacity duration-300 group-hover:opacity-20 bg-blox-cyan" />
        
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest block mb-1">
                Creations Catalog
              </span>
              <h4 className="text-xl font-black text-white tracking-wide">
                {totalUploads} <span className="text-xs text-gray-500 font-normal">/ {isFree ? '5 slots' : '∞'}</span>
              </h4>
            </div>
            <div className="p-2.5 rounded-xl bg-blox-cyan/10 border border-blox-cyan/20 shrink-0 flex items-center justify-center">
              <Image className="w-5 h-5 text-blox-cyan" />
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-[8px] font-extrabold uppercase tracking-wider text-gray-500 mb-1">
              <span>Slot Occupancy</span>
              <span>{isFree ? `${Math.round(uploadPercent)}%` : 'Unlimited'}</span>
            </div>
            {isFree ? (
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    uploadPercent >= 100 ? 'bg-blox-red' : uploadPercent >= 60 ? 'bg-amber-400' : 'bg-blox-cyan'
                  }`}
                  style={{ width: `${uploadPercent}%` }}
                />
              </div>
            ) : (
              <div className="w-full h-1.5 bg-blox-cyan/10 rounded-full overflow-hidden border border-blox-cyan/10 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blox-cyan to-blue-500 animate-pulse w-full h-full rounded-full" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Active Bookings Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#161C26]/90 to-[#0B0E14]/90 border border-white/5 glass-panel relative overflow-hidden flex flex-col justify-between shadow-xl group hover:border-blox-red/20 hover:-translate-y-1 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 pointer-events-none transition-opacity duration-300 group-hover:opacity-20 bg-blox-red" />
        
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest block mb-1">
              Active Projects
            </span>
            <h4 className="text-xl font-black text-white tracking-wide">
              {activeBookings} <span className="text-xs text-gray-500 font-normal">Active</span>
            </h4>
            <p className="text-[10px] text-gray-400 font-semibold mt-1">
              {isPro ? 'Offers awaiting construction' : 'Your hired build statuses'}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-blox-red/10 border border-blox-red/20 shrink-0 flex items-center justify-center">
            <CalendarCheck className="w-5 h-5 text-blox-red" />
          </div>
        </div>
      </div>

      {/* 4. Earnings / Requests Submitted Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#161C26]/90 to-[#0B0E14]/90 border border-white/5 glass-panel relative overflow-hidden flex flex-col justify-between shadow-xl group hover:border-emerald-500/20 hover:-translate-y-1 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 pointer-events-none transition-opacity duration-300 group-hover:opacity-20 bg-emerald-500" />
        
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest block mb-1">
              {isPro ? 'Bloxburg Earnings' : 'Hiring Submissions'}
            </span>
            <h4 className="text-lg font-black text-white tracking-wide uppercase">
              {isPro ? `${(totalEarnings / 1000).toFixed(0)}k Cash` : `${bookings.filter(b => b.client_id === user?.id).length} Hires`}
            </h4>
            <p className="text-[10px] text-gray-400 font-semibold mt-1">
              {isPro ? 'Accumulated contract payouts' : 'Requests sent to contractors'}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shrink-0 flex items-center justify-center">
            {isPro ? (
              <Trophy className="w-5 h-5 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
