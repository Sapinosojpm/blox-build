'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBuildStore } from '@/store/useBuildStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { Button } from '@/components/ui/Button';
import BuildCard from '@/components/cards/BuildCard';
import BookingForm from '@/components/forms/BookingForm';
import { UserPlus, UserCheck, Star, Award, Shield, CalendarCheck, MessageSquare, Landmark, Heart } from 'lucide-react';

export default function BuilderProfilePage() {
  const { username } = useParams();
  const router = useRouter();
  const { user, followingIds, toggleFollow } = useAuthStore();
  const { builds } = useBuildStore();
  const { addToast } = useUIStore();

  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Find builder profile from any build uploads, or fall back to checking mock/logged-in accounts
  const builderBuilds = builds.filter((b) => b.profiles?.username.toLowerCase() === (username as string).toLowerCase());
  
  // Extract profile from builds
  let builder = builderBuilds?.[0]?.profiles;

  // If user is viewing their own profile, ALWAYS use the fresh logged-in user object for live edits!
  if (user && user.username.toLowerCase() === (username as string).toLowerCase()) {
    builder = user;
  }

  if (!builder) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center flex flex-col items-center gap-4">
        <Landmark size={40} className="text-blox-red" />
        <h1 className="text-xl font-bold text-white uppercase tracking-wider">Builder Not Found</h1>
        <p className="text-xs text-gray-500 font-semibold leading-relaxed">
          The builder username @{username} could not be located in our architectural logs.
        </p>
        <Button variant="secondary" onClick={() => router.push('/')}>
          Back to Home
        </Button>
      </div>
    );
  }

  const isFollowing = followingIds.includes(builder.id);
  const isSelf = user?.id === builder.id;
  const isPro = builder.subscription_tier === 'pro';

  const handleFollow = async () => {
    if (!user) {
      addToast('Please login to follow creators', 'error');
      return;
    }
    await toggleFollow(builder.id);
    addToast(
      isFollowing ? `Unfollowed @${builder.username}` : `Following @${builder.username}`,
      'success'
    );
  };

  const getBadgeIcon = (tier: string) => {
    switch (tier) {
      case 'pro':
        return <Award size={14} className="text-amber-400" />;
      case 'elite':
        return <Star size={14} className="text-blox-cyan animate-pulse" />;
      default:
        return <Shield size={14} className="text-gray-500" />;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10">
      {/* 1. Header Hero Card */}
      <div className="p-8 rounded-3xl glass-panel border border-white/5 relative overflow-hidden flex flex-col md:flex-row justify-between items-center md:items-start gap-8 shadow-2xl">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blox-cyan/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          <img
            src={builder.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${builder.username}`}
            alt={builder.username}
            className="w-24 h-24 rounded-full border-2 border-white/10 object-cover shadow-2xl shrink-0"
          />

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                @{builder.username}
              </h1>
              
              <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white/5 border border-white/5 text-gray-300">
                {getBadgeIcon(builder.subscription_tier)}
                {builder.subscription_tier} Builder
              </span>
            </div>

            <p className="text-xs sm:text-sm text-gray-400 font-semibold max-w-xl leading-relaxed">
              {builder.bio || 'This builder has not configured a custom biography portfolio yet.'}
            </p>

            <div className="flex items-center justify-center md:justify-start gap-6 text-xs text-gray-500 font-bold uppercase tracking-wider mt-2 border-t border-white/5 pt-3">
              <div>
                <span className="text-white font-black">{builderBuilds.length}</span> Uploads
              </div>
              <div>
                <span className="text-white font-black">
                  {isPro ? 'Yes' : 'No'}
                </span>{' '}
                Bookable
              </div>
            </div>
          </div>
        </div>

        {/* Action button */}
        {!isSelf && (
          <div className="shrink-0 flex flex-col gap-2.5 w-full md:w-auto">
            <Button
              variant={isFollowing ? 'glass' : 'secondary'}
              size="md"
              onClick={handleFollow}
              className="gap-2 text-xs uppercase tracking-wider font-extrabold"
            >
              {isFollowing ? (
                <>
                  <UserCheck size={16} />
                  Following
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Follow Builder
                </>
              )}
            </Button>

            {isPro && !isBookingOpen && (
              <Button
                variant="primary"
                glow={true}
                size="md"
                onClick={() => setIsBookingOpen(true)}
                className="gap-2 text-xs uppercase tracking-wider font-extrabold"
              >
                <CalendarCheck size={16} />
                Book Commission
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 2. Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Creations catalog */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <h2 className="text-lg font-black text-white uppercase tracking-wider border-b border-white/5 pb-3">
            Creations Catalog ({builderBuilds.length})
          </h2>

          {builderBuilds.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {builderBuilds.map((build) => (
                <BuildCard key={build.id} build={build} />
              ))}
            </div>
          ) : (
            <div className="p-16 text-center bg-white/5 border border-white/5 rounded-3xl text-sm text-gray-500 font-bold">
              📷 This builder has not published any custom designs yet.
            </div>
          )}
        </div>

        {/* Right: Booking Modal Box */}
        {isPro && (
          <div className="flex flex-col gap-6">
            {isBookingOpen && (
              <div className="p-6 rounded-2xl glass-panel-glow border border-blox-cyan/20 flex flex-col gap-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h3 className="text-sm font-black text-blox-cyan uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarCheck size={16} />
                    Hire Builder Form
                  </h3>
                  <button
                    onClick={() => setIsBookingOpen(false)}
                    className="text-[10px] text-gray-500 hover:text-blox-red font-bold uppercase cursor-pointer"
                  >
                    Close
                  </button>
                </div>
                
                {user ? (
                  <BookingForm builderId={builder.id} />
                ) : (
                  <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-center text-xs text-gray-400 font-semibold">
                    🔐 Please login or register to book a custom commission project.
                  </div>
                )}
              </div>
            )}

            {/* General Creator info */}
            <div className="p-6 rounded-2xl glass-panel border border-white/5 flex flex-col gap-4 shadow-xl">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-3">
                Architect Portfolio Credentials
              </h3>
              
              <p className="text-xs text-gray-300 font-semibold leading-relaxed">
                🌟 All bookings are handled through in-game safe-payment checks. Make sure to have your plot ready!
              </p>

              <div className="flex flex-col gap-2 mt-2 text-xs font-semibold text-gray-400">
                <div className="flex justify-between">
                  <span>Builder Status</span>
                  <span className="text-blox-cyan font-bold">Certified Builder</span>
                </div>
                <div className="flex justify-between">
                  <span>Joined Date</span>
                  <span>{new Date(builder.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Role Permissions</span>
                  <span className="capitalize">{builder.role} Access</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
