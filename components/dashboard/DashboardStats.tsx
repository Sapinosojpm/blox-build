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
    switch (tier) {
      case 'pro':
        return <Trophy className="text-amber-400" size={24} />;
      case 'elite':
        return <Sparkles className="text-blox-cyan" size={24} />;
      default:
        return <Image className="text-gray-400" size={24} />;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Subscription Tier */}
      <div className="p-5 rounded-2xl glass-panel border border-white/5 flex items-center justify-between shadow-xl">
        <div>
          <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
            Subscription Tier
          </div>
          <div className="text-xl font-black text-white uppercase tracking-tight">
            {user?.subscription_tier} TIER
          </div>
        </div>
        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
          {getTierIcon(user?.subscription_tier)}
        </div>
      </div>

      {/* 2. Total Uploads */}
      <div className="p-5 rounded-2xl glass-panel border border-white/5 flex items-center justify-between shadow-xl">
        <div>
          <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
            Total Uploads
          </div>
          <div className="text-2xl font-black text-white">
            {totalUploads} <span className="text-xs text-gray-500">/ {user?.subscription_tier === 'free' ? '5 max' : '∞'}</span>
          </div>
        </div>
        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
          <Image className="text-blox-cyan" size={24} />
        </div>
      </div>

      {/* 3. Active Bookings */}
      <div className="p-5 rounded-2xl glass-panel border border-white/5 flex items-center justify-between shadow-xl">
        <div>
          <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
            Active Bookings
          </div>
          <div className="text-2xl font-black text-white">
            {activeBookings}
          </div>
        </div>
        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
          <CalendarCheck className="text-blox-red" size={24} />
        </div>
      </div>

      {/* 4. Earnings / Requests */}
      <div className="p-5 rounded-2xl glass-panel border border-white/5 flex items-center justify-between shadow-xl">
        <div>
          <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
            {isPro ? 'Bloxburg Earnings' : 'Requests Submitted'}
          </div>
          <div className="text-xl font-black text-white">
            {isPro ? `${(totalEarnings / 1000).toFixed(0)}k Cash` : `${bookings.filter(b => b.client_id === user?.id).length} Sent`}
          </div>
        </div>
        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
          <Trophy className="text-blox-amber" size={24} />
        </div>
      </div>
    </div>
  );
}
