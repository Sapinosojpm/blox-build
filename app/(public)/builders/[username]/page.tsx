'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBuildStore } from '@/store/useBuildStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { Button } from '@/components/ui/Button';
import BuildCard from '@/components/cards/BuildCard';
import { UserPlus, UserCheck, Star, Award, Shield, CalendarCheck, MessageSquare, Landmark, Heart, Share2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function BuilderProfilePage() {
  const { username } = useParams();
  const router = useRouter();
  const { user, followingIds, toggleFollow, updateProfile } = useAuthStore();
  const { builds } = useBuildStore();
  const { addToast, setBookingModalOpen } = useUIStore();

  const [builder, setBuilder] = useState<any | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  // Find builder profile from any build uploads
  const builderBuilds = builds.filter((b) => b.profiles?.username.toLowerCase() === (username as string).toLowerCase());

  useEffect(() => {
    // 1. Check if user themselves matches
    if (user && user.username.toLowerCase() === (username as string).toLowerCase()) {
      setBuilder(user);
      setIsFetching(false);
      return;
    }

    // 2. Check in builds list
    if (builderBuilds.length > 0 && builderBuilds[0].profiles) {
      setBuilder(builderBuilds[0].profiles);
      setIsFetching(false);
      return;
    }

    // 3. Fallback mock builders
    const lowerUser = (username as string).toLowerCase();
    if (lowerUser === 'aestheticarchitect') {
      setBuilder({
        id: 'pro-uuid-2222',
        email: 'builder@pro.com',
        username: 'AestheticArchitect',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
        bio: 'Professional Bloxburg builder specializing in ultra-realistic modern mansions & mid-century suburban models. Open for commissions!',
        role: 'user',
        subscription_tier: 'pro',
        created_at: new Date().toISOString()
      });
      setIsFetching(false);
      return;
    } else if (lowerUser === 'cozycottagecreator') {
      setBuilder({
        id: 'elite-uuid-3333',
        email: 'elite@build.com',
        username: 'CozyCottageCreator',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
        bio: 'Linen and rustic build styles. Crafting the coziest spaces in Bloxburg.',
        role: 'user',
        subscription_tier: 'elite',
        created_at: new Date().toISOString()
      });
      setIsFetching(false);
      return;
    }

    // 4. Query Database directly by username
    const fetchBuilderProfile = async () => {
      try {
        const isConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (isConfigured) {
          const supabase = createClient();
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .ilike('username', username as string)
            .single();
          
          if (!error && data) {
            setBuilder(data);
            setIsFetching(false);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to query builder profile:', err);
      }
      setBuilder(null);
      setIsFetching(false);
    };

    fetchBuilderProfile();
  }, [username, user, builds, builderBuilds.length]);

  const [dbFollowerCount, setDbFollowerCount] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const isFollowing = builder ? followingIds.includes(builder.id) : false;

  const handleShare = async () => {
    try {
      const profileUrl = window.location.href;
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      addToast('Profile link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      addToast('Failed to copy link.', 'error');
    }
  };

  useEffect(() => {
    if (!builder) return;
    const isConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!isConfigured) return;

    const fetchFollowerCount = async () => {
      try {
        const supabase = createClient();
        const { count, error } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', builder.id);
        
        if (error) throw error;
        if (count !== null) {
          setDbFollowerCount(count);
        }
      } catch (err) {
        console.error('Failed to fetch follower count for profile:', builder.id, err);
      }
    };

    fetchFollowerCount();
  }, [builder?.id, isFollowing]);

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-4 border-blox-cyan border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest animate-pulse">
          Retrieving Builder Architectural Logs...
        </p>
      </div>
    );
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

  const isSelf = user?.id === builder.id;
  const isPro = builder.subscription_tier === 'pro';

  // Base mock follower count if offline/demo
  const baseFollowerCount = builder?.username === 'AestheticArchitect' 
    ? 154 
    : builder?.username === 'CozyCottageCreator' 
    ? 98 
    : builder?.username === 'bloxbuildadmin'
    ? 342
    : 12;

  const followerCount = dbFollowerCount !== null 
    ? dbFollowerCount 
    : (baseFollowerCount + (isFollowing ? 1 : 0));

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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-24 lg:pb-10 flex flex-col gap-10">
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
                <span className="text-white font-black">{followerCount}</span> Followers
              </div>
              <div>
                <span className="text-white font-black">
                  {isPro && builder.is_bookable !== false ? 'Yes' : 'No'}
                </span>{' '}
                Bookable
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="shrink-0 flex flex-col gap-2.5 w-full md:w-auto">
          <Button
            variant="glass"
            size="md"
            onClick={handleShare}
            className="gap-2 text-xs uppercase tracking-wider font-extrabold"
          >
            <Share2 size={16} />
            {copied ? 'Link Copied!' : 'Share Profile'}
          </Button>
          
          {isSelf && isPro && (
            <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between gap-3 min-w-[140px] shadow-lg animate-in slide-in-from-top-1 duration-300">
              <div className="text-left shrink-0">
                <span className="text-[8px] text-gray-500 font-extrabold uppercase block tracking-wider leading-none mb-0.5">Commissions</span>
                <span className={`text-[10px] font-black uppercase tracking-wider ${builder.is_bookable !== false ? 'text-emerald-400 animate-pulse' : 'text-gray-400'}`}>
                  {builder.is_bookable !== false ? 'Open' : 'Closed'}
                </span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const nextVal = builder.is_bookable === false;
                  setBuilder((prev: any) => ({ ...prev, is_bookable: nextVal }));
                  await updateProfile({ is_bookable: nextVal });
                  addToast(nextVal ? 'Commissions status set to OPEN.' : 'Commissions status set to CLOSED.', 'success');
                }}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer outline-none shrink-0 ${builder.is_bookable !== false ? 'bg-emerald-500' : 'bg-white/10'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-[#0b0e14] transition-transform ${builder.is_bookable !== false ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
          )}

          {!isSelf && (
            <>
              <Button
                variant={isFollowing ? 'glass' : 'secondary'}
                size="md"
                onClick={handleFollow}
                className="gap-2 text-xs uppercase tracking-wider font-extrabold w-full"
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

              {isPro && builder.is_bookable !== false && (
                <Button
                  variant="primary"
                  glow={true}
                  size="md"
                  onClick={() => setBookingModalOpen(true, builder.id)}
                  className="gap-2 text-xs uppercase tracking-wider font-extrabold w-full"
                >
                  <CalendarCheck size={16} />
                  Book Commission
                </Button>
              )}
            </>
          )}
        </div>
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

        {/* Right: Portfolio credentials panel */}
        {isPro && (
          <div className="flex flex-col gap-6">
            {/* General Creator info */}
            <div className="p-6 rounded-2xl glass-panel border border-white/5 flex flex-col gap-4 shadow-xl">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-3">
                Architect Portfolio Credentials
              </h3>
              
              <p className="text-xs text-gray-300 font-semibold leading-relaxed">
                {builder.is_bookable !== false
                  ? '🌟 All bookings are handled through in-game safe-payment checks. Make sure to have your plot ready!'
                  : '🔒 This builder has set their commissions status to closed. Booking requests are currently disabled.'}
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

      {/* Dynamic Mobile Floating Booking CTA Bar */}
      {isPro && builder.is_bookable !== false && !isSelf && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-[#0B0E14]/90 backdrop-blur-md border-t border-white/5 shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom duration-300">
          <div className="min-w-0 text-left">
            <div className="text-[10px] font-black text-blox-cyan uppercase tracking-wider mb-0.5">
              Book Commission
            </div>
            <div className="text-xs font-black text-white truncate">
              @{builder.username}
            </div>
          </div>
          <div className="shrink-0">
            {user ? (
              <Button
                variant="primary"
                glow={true}
                onClick={() => setBookingModalOpen(true, builder.id)}
                className="text-[10px] font-extrabold uppercase py-2.5 px-4 tracking-wider"
              >
                Hire Builder
              </Button>
            ) : (
              <Link href="/login">
                <Button variant="secondary" className="text-[10px] font-extrabold uppercase py-2.5 px-4 tracking-wider">
                  🔐 Login to Hire
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
