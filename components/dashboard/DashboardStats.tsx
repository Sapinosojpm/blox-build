'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useBuildStore } from '@/store/useBuildStore';
import { useBookingStore } from '@/store/useBookingStore';
import { Sparkles, Trophy, CalendarCheck, Image } from 'lucide-react';

export default function DashboardStats() {
  const { user } = useAuthStore();
  const { builds } = useBuildStore();
  const { bookings } = useBookingStore();

  const userBuilds = builds.filter((b) => b.user_id === user?.id);
  const totalUploads = userBuilds.length;

  const isPro = user?.subscription_tier === 'pro';

  // Stats calculation
  const activeBookings = bookings.filter(
    (b) => (b.builder_id === user?.id || b.client_id === user?.id) && b.status !== 'completed' && b.status !== 'declined'
  ).length;

  const completedCommissions = bookings.filter(
    (b) => b.builder_id === user?.id && b.status === 'completed'
  );
  
  const totalEarnings = completedCommissions.reduce((sum, b) => sum + b.price, 0);

  const getTierIcon = (tier?: string) => {
    const sizeClasses = "w-5 h-5 sm:w-6 sm:h-6 shrink-0";
    switch (tier) {
      case 'pro':
        return <Trophy className={`text-amber-400 ${sizeClasses}`} />;
      case 'elite':
        return <Sparkles className={`text-blox-cyan ${sizeClasses}`} />;
      default:
        return <Image className={`text-gray-400 ${sizeClasses}`} />;
    }
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Subscription Tier */}
      <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl glass-panel border border-white/5 flex items-center justify-between shadow-xl gap-2">
        <div className="min-w-0">
          <div className="text-[9px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5 truncate">
            Subscription Tier
          </div>
          <div className="text-xs sm:text-xl font-black text-white uppercase tracking-tight truncate">
            {user?.subscription_tier} Tier
          </div>
        </div>
        <div className="p-1.5 sm:p-3 bg-white/5 rounded-lg sm:rounded-xl border border-white/5 shrink-0 flex items-center justify-center">
          {getTierIcon(user?.subscription_tier)}
        </div>
      </div>

      {/* 2. Total Uploads */}
      <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl glass-panel border border-white/5 flex items-center justify-between shadow-xl gap-2">
        <div className="min-w-0">
          <div className="text-[9px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5 truncate">
            Total Uploads
          </div>
          <div className="text-sm sm:text-2xl font-black text-white truncate">
            {totalUploads} <span className="text-[9px] sm:text-xs text-gray-500 font-normal">/ {user?.subscription_tier === 'free' ? '5 max' : '∞'}</span>
          </div>
        </div>
        <div className="p-1.5 sm:p-3 bg-white/5 rounded-lg sm:rounded-xl border border-white/5 shrink-0 flex items-center justify-center">
          <Image className="text-blox-cyan w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
        </div>
      </div>

      {/* 3. Active Bookings */}
      <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl glass-panel border border-white/5 flex items-center justify-between shadow-xl gap-2">
        <div className="min-w-0">
          <div className="text-[9px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5 truncate">
            Active Bookings
          </div>
          <div className="text-sm sm:text-2xl font-black text-white truncate">
            {activeBookings}
          </div>
        </div>
        <div className="p-1.5 sm:p-3 bg-white/5 rounded-lg sm:rounded-xl border border-white/5 shrink-0 flex items-center justify-center">
          <CalendarCheck className="text-blox-red w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
        </div>
      </div>

      {/* 4. Earnings / Requests */}
      <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl glass-panel border border-white/5 flex items-center justify-between shadow-xl gap-2">
        <div className="min-w-0">
          <div className="text-[9px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5 truncate">
            {isPro ? 'Bloxburg Earnings' : 'Requests Submitted'}
          </div>
          <div className="text-xs sm:text-xl font-black text-white truncate">
            {isPro ? `${(totalEarnings / 1000).toFixed(0)}k Cash` : `${bookings.filter(b => b.client_id === user?.id).length} Sent`}
          </div>
        </div>
        <div className="p-1.5 sm:p-3 bg-white/5 rounded-lg sm:rounded-xl border border-white/5 shrink-0 flex items-center justify-center">
          <Trophy className="text-blox-amber w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
        </div>
      </div>
    </div>
  );
}
