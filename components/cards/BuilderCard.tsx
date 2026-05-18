'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Profile } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { Button } from '../ui/Button';
import { UserPlus, UserCheck, Star, Award, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface BuilderCardProps {
  builder: Profile;
  buildsCount?: number;
}

export default function BuilderCard({ builder, buildsCount = 3 }: BuilderCardProps) {
  const { user, followingIds, toggleFollow } = useAuthStore();
  const { addToast } = useUIStore();

  const isFollowing = followingIds.includes(builder.id);

  const [dbFollowerCount, setDbFollowerCount] = useState<number | null>(null);

  useEffect(() => {
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
        console.error('Failed to fetch follower count for builder:', builder.id, err);
      }
    };

    fetchFollowerCount();
  }, [builder.id, isFollowing]);

  // Base mock follower count if offline/demo
  const baseFollowerCount = builder.username === 'AestheticArchitect' 
    ? 154 
    : builder.username === 'CozyCottageCreator' 
    ? 98 
    : builder.username === 'BloxburgAdmin'
    ? 342
    : 12;

  const followerCount = dbFollowerCount !== null 
    ? dbFollowerCount 
    : (baseFollowerCount + (isFollowing ? 1 : 0));

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      addToast('Please login to follow creators', 'error');
      return;
    }
    if (user.id === builder.id) {
      addToast('You cannot follow yourself!', 'error');
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
        return <Award size={13} className="text-amber-400" />;
      case 'elite':
        return <Star size={13} className="text-blox-cyan" />;
      default:
        return <Shield size={13} className="text-gray-400" />;
    }
  };

  const getTierColors = (tier: string) => {
    switch (tier) {
      case 'pro':
        return 'from-amber-400/20 to-orange-500/10 border-amber-400/30 text-amber-300';
      case 'elite':
        return 'from-blox-cyan/20 to-blue-500/10 border-blox-cyan/30 text-blox-cyan';
      default:
        return 'from-white/5 to-white/0 border-white/5 text-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={`rounded-2xl border p-6 bg-gradient-to-br ${getTierColors(
        builder.subscription_tier
      )} glass-panel flex flex-col justify-between h-full`}
    >
      <div className="flex flex-col items-center text-center">
        {/* Avatar */}
        <Link href={`/builders/${builder.username}`} className="relative block">
          <img
            src={builder.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
            alt={builder.username}
            className="w-20 h-20 rounded-full border-2 border-white/10 object-cover shadow-xl group-hover:scale-105 transition-transform"
          />
          {builder.subscription_tier !== 'free' && (
            <span className="absolute bottom-0 right-0 p-1.5 rounded-full bg-blox-dark border border-white/10 shadow-lg">
              {getBadgeIcon(builder.subscription_tier)}
            </span>
          )}
        </Link>

        {/* Username */}
        <Link href={`/builders/${builder.username}`}>
          <h3 className="text-base font-bold text-white hover:text-blox-cyan transition-colors mt-3">
            @{builder.username}
          </h3>
        </Link>

        {/* Badge Banner */}
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white/5 border border-white/5 tracking-wider">
            {builder.subscription_tier} Builder
          </span>
        </div>

        {/* Bio */}
        <p className="text-xs text-gray-400 mt-3 line-clamp-3 leading-relaxed max-w-xs">
          {builder.bio || 'This builder has not written a bio yet.'}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-2.5">
        {/* Statistics info */}
        <div className="grid grid-cols-3 gap-1 border-y border-white/5 py-2.5 text-center text-xs font-semibold text-gray-400">
          <div>
            <div className="text-white font-bold">{buildsCount}</div>
            <div>Uploads</div>
          </div>
          <div>
            <div className="text-white font-bold">{followerCount}</div>
            <div>Followers</div>
          </div>
          <div>
            <div className="text-white font-bold">
              {builder.subscription_tier === 'pro' ? 'Yes' : 'No'}
            </div>
            <div>Bookable</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-2">
          <Link href={`/builders/${builder.username}`} className="flex-1">
            <Button variant="glass" size="sm" className="w-full text-xs">
              View Profile
            </Button>
          </Link>

          {user?.id !== builder.id && (
            <Button
              variant={isFollowing ? 'glass' : 'secondary'}
              size="sm"
              onClick={handleFollow}
              className="text-xs gap-1.5"
            >
              {isFollowing ? (
                <>
                  <UserCheck size={13} />
                  Following
                </>
              ) : (
                <>
                  <UserPlus size={13} />
                  Follow
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
