'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useBuildStore } from '@/store/useBuildStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { Button } from '@/components/ui/Button';
import { 
  Search, SlidersHorizontal, Award, Star, Shield, 
  CalendarCheck, UserPlus, UserCheck, Hammer, Sparkles,
  Users, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Profile } from '@/types';
import { createClient } from '@/lib/supabase/client';

// Simple contractor card component
function ContractorCard({ 
  contractor, 
  buildsCount = 0, 
  user, 
  isFollowing, 
  onFollow, 
  onHire 
}: { 
  contractor: Profile; 
  buildsCount: number; 
  user: any; 
  isFollowing: boolean; 
  onFollow: () => void; 
  onHire: () => void; 
}) {
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
          .eq('following_id', contractor.id);
        
        if (!error && count !== null) {
          setDbFollowerCount(count);
        }
      } catch (err) {
        console.error('Failed to fetch follower count:', err);
      }
    };

    fetchFollowerCount();
  }, [contractor.id, isFollowing]);

  const baseFollowerCount = contractor.username === 'AestheticArchitect' 
    ? 154 
    : contractor.username === 'CozyCottageCreator' 
    ? 98 
    : contractor.username === 'BloxburgAdmin'
    ? 342
    : 12;

  const followerCount = dbFollowerCount !== null 
    ? dbFollowerCount 
    : (baseFollowerCount + (isFollowing ? 1 : 0));

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
        return 'from-amber-400/25 to-orange-500/10 border-amber-400/30 text-amber-300';
      case 'elite':
        return 'from-blox-cyan/25 to-blue-500/10 border-blox-cyan/30 text-blox-cyan';
      default:
        return 'from-white/5 to-white/0 border-white/5 text-gray-400';
    }
  };

  // Derive specialty tags from bio
  const getSpecialtyTags = (bio: string | null) => {
    if (!bio) return ['General Builder'];
    const tags: string[] = [];
    const text = bio.toLowerCase();
    
    if (text.includes('mansion') || text.includes('castle') || text.includes('luxury')) tags.push('Mansions');
    if (text.includes('modern') || text.includes('minimalist') || text.includes('glass')) tags.push('Modern');
    if (text.includes('cottage') || text.includes('cozy') || text.includes('forest') || text.includes('linen')) tags.push('Cozy Cottages');
    if (text.includes('suburban') || text.includes('family') || text.includes('neighborhood')) tags.push('Suburban');
    if (text.includes('interior') || text.includes('furniture') || text.includes('styling')) tags.push('Interior Design');
    if (text.includes('cafe') || text.includes('restaurant') || text.includes('business') || text.includes('shop')) tags.push('Commercials');
    
    return tags.length > 0 ? tags.slice(0, 3) : ['General Builder'];
  };

  const isPro = contractor.subscription_tier === 'pro';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`relative rounded-2xl border p-6 bg-gradient-to-br ${getTierColors(
        contractor.subscription_tier
      )} glass-panel flex flex-col justify-between h-full overflow-hidden shadow-lg hover:shadow-2xl hover:border-blox-cyan/35 transition-all duration-300`}
    >
      {/* Commission status overlay banner */}
      {isPro && (
        <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-blox-cyan to-blue-500 text-[#0B0E14] text-[9px] font-black uppercase tracking-widest py-1.5 px-4 flex items-center justify-center gap-1.5 shadow-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          Open for Commissions
        </div>
      )}

      <div className={`flex flex-col items-center text-center ${isPro ? 'mt-4' : ''}`}>
        {/* Avatar */}
        <Link href={`/builders/${contractor.username}`} className="relative block group">
          <img
            src={contractor.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
            alt={contractor.username}
            className="w-20 h-20 rounded-full border-2 border-white/10 object-cover shadow-xl group-hover:scale-105 transition-transform duration-300"
          />
          {contractor.subscription_tier !== 'free' && (
            <span className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#0B0E14] border border-white/10 shadow-lg">
              {getBadgeIcon(contractor.subscription_tier)}
            </span>
          )}
        </Link>

        {/* Username */}
        <Link href={`/builders/${contractor.username}`}>
          <h3 className="text-base font-extrabold text-white hover:text-blox-cyan transition-colors mt-3 flex items-center gap-1 justify-center">
            @{contractor.username}
            {isPro && <CheckCircle2 size={14} className="text-blox-cyan fill-blox-cyan/10" />}
          </h3>
        </Link>

        {/* Badge Banner */}
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-white/5 border border-white/5 tracking-wider text-gray-400">
            {contractor.subscription_tier} Builder
          </span>
        </div>

        {/* Specialty tags */}
        <div className="flex flex-wrap gap-1 mt-3.5 justify-center">
          {getSpecialtyTags(contractor.bio).map((tag, idx) => (
            <span key={idx} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blox-cyan/10 border border-blox-cyan/20 text-blox-cyan">
              {tag}
            </span>
          ))}
        </div>

        {/* Bio */}
        <p className="text-xs text-gray-400 mt-4 line-clamp-3 leading-relaxed max-w-xs h-12">
          {contractor.bio || 'This builder has not written an architectural bio yet.'}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3.5">
        {/* Statistics info */}
        <div className="grid grid-cols-3 gap-1 border-y border-white/5 py-2.5 text-center text-xs font-semibold text-gray-400">
          <div>
            <div className="text-white font-bold">{buildsCount}</div>
            <div className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mt-0.5">Uploads</div>
          </div>
          <div>
            <div className="text-white font-bold">{followerCount}</div>
            <div className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mt-0.5">Followers</div>
          </div>
          <div>
            <div className="text-white font-bold">
              {isPro ? 'Yes' : 'No'}
            </div>
            <div className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mt-0.5">Bookable</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 mt-1">
          <Link href={`/builders/${contractor.username}`} className="flex-1">
            <Button variant="glass" size="sm" className="w-full text-xs py-2 uppercase tracking-wider font-bold">
              Profile
            </Button>
          </Link>

          {isPro && user?.id !== contractor.id && (
            <Button 
              variant="secondary" 
              size="sm" 
              glow={true}
              onClick={onHire}
              className="flex-1 text-xs py-2 uppercase tracking-wider font-extrabold gap-1"
            >
              <CalendarCheck size={13} />
              Hire
            </Button>
          )}

          {user?.id !== contractor.id && !isPro && (
            <Button
              variant={isFollowing ? 'glass' : 'secondary'}
              size="sm"
              onClick={onFollow}
              className="flex-1 text-xs py-2 uppercase tracking-wider font-bold gap-1"
            >
              {isFollowing ? <UserCheck size={13} /> : <UserPlus size={13} />}
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function ContractorsPage() {
  const { builds } = useBuildStore();
  const { user, followingIds, toggleFollow } = useAuthStore();
  const { addToast, setBookingModalOpen } = useUIStore();

  const [contractors, setContractors] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pro' | 'elite'>('all');
  const [onlyCommissionable, setOnlyCommissionable] = useState(false);

  useEffect(() => {
    const fetchProfiles = async () => {
      setIsLoading(true);
      try {
        const isConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (isConfigured) {
          const supabase = createClient();
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('subscription_tier', { ascending: false });

          if (!error && data && data.length > 0) {
            setContractors(data);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch contractors:', err);
      }

      // Fallback: merge profiles from builds + mock accounts
      const profilesMap = new Map<string, Profile>();
      
      // Default Mock Profiles
      const mockPro: Profile = {
        id: 'pro-uuid-2222',
        email: 'builder@pro.com',
        username: 'AestheticArchitect',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
        bio: 'Professional Bloxburg builder specializing in ultra-realistic modern mansions & mid-century suburban models. Open for commissions!',
        role: 'user',
        subscription_tier: 'pro',
        created_at: new Date().toISOString()
      };

      const mockElite: Profile = {
        id: 'elite-uuid-3333',
        email: 'elite@build.com',
        username: 'CozyCottageCreator',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
        bio: 'Linen and rustic build styles. Crafting the coziest spaces in Bloxburg.',
        role: 'user',
        subscription_tier: 'elite',
        created_at: new Date().toISOString()
      };

      profilesMap.set(mockPro.id, mockPro);
      profilesMap.set(mockElite.id, mockElite);

      builds.forEach((build) => {
        if (build.profiles) {
          profilesMap.set(build.profiles.id, build.profiles);
        }
      });

      setContractors(Array.from(profilesMap.values()));
      setIsLoading(false);
    };

    fetchProfiles();
  }, [builds]);

  // Handle follow actions
  const handleFollow = async (contractorId: string, username: string) => {
    if (!user) {
      addToast('Please login to follow creators', 'error');
      return;
    }
    const isFollowing = followingIds.includes(contractorId);
    await toggleFollow(contractorId);
    addToast(
      isFollowing ? `Unfollowed @${username}` : `Following @${username}`,
      'success'
    );
  };

  // Filter contractors
  const filteredContractors = contractors.filter((c) => {
    // Search filter
    const matchesSearch = 
      c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.bio && c.bio.toLowerCase().includes(searchQuery.toLowerCase()));

    // Tier tab filter
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'pro' && c.subscription_tier === 'pro') ||
      (activeTab === 'elite' && c.subscription_tier === 'elite');

    // Commission/Bookable toggle filter
    const matchesCommission = !onlyCommissionable || c.subscription_tier === 'pro';

    return matchesSearch && matchesTab && matchesCommission;
  });

  // Count builds for a specific builder
  const getBuildsCount = (builderId: string) => {
    return builds.filter((b) => b.user_id === builderId).length;
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white">
      {/* Hero Header */}
      <section className="relative overflow-hidden pt-16 pb-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blox-cyan/10 via-[#0B0E14] to-[#0B0E14] border-b border-white/5">
        <div className="hero-grid-pattern" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-blox-cyan/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-panel border-blox-cyan/30 text-[10px] text-blox-cyan font-black uppercase tracking-widest mb-4"
          >
            <Hammer size={12} className="animate-pulse" />
            Verified Builders Directory
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mb-4"
          >
            Bloxburg <span className="text-transparent bg-clip-text bg-gradient-to-r from-blox-cyan to-blue-400">Contractors</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xs sm:text-sm text-gray-400 font-semibold max-w-2xl mx-auto uppercase leading-relaxed"
          >
            Find, follow, and hire professional builders to construct your next dream home, modern mansion, or detailed roleplay environment.
          </motion.p>
        </div>
      </section>

      {/* Main Filter & Listing Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Search & Sliders */}
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between mb-10 bg-white/[0.01] border border-white/5 p-5 rounded-2xl glass-panel">
          {/* Search bar */}
          <div className="relative w-full lg:max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500 pointer-events-none">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search contractors by username or bio keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0B0E14]/60 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-white placeholder-gray-500 focus:outline-none focus:border-blox-cyan/60 transition-colors"
            />
          </div>

          {/* Controls / Tabs */}
          <div className="flex flex-col sm:flex-row w-full lg:w-auto items-center gap-4 sm:gap-6 justify-end">
            
            {/* Filter Tabs */}
            <div className="flex bg-white/[0.02] border border-white/5 rounded-xl p-1 shrink-0 w-full sm:w-auto justify-center">
              {(['all', 'pro', 'elite'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-blox-cyan/20 to-blue-500/20 border border-blox-cyan/30 text-blox-cyan shadow-sm'
                      : 'text-gray-400 hover:text-white border border-transparent'
                  }`}
                >
                  {tab === 'all' ? 'All Builders' : tab === 'pro' ? 'Pro Contractors' : 'Elite Builders'}
                </button>
              ))}
            </div>

            {/* Commissions Toggle */}
            <label className="flex items-center gap-3 shrink-0 cursor-pointer group py-1.5 select-none w-full sm:w-auto justify-start sm:justify-end">
              <input
                type="checkbox"
                checked={onlyCommissionable}
                onChange={() => setOnlyCommissionable(!onlyCommissionable)}
                className="sr-only peer"
              />
              <div className="relative w-8 h-4 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blox-cyan/30 peer-checked:after:bg-blox-cyan"></div>
              <span className="text-[10px] font-black uppercase text-gray-400 group-hover:text-white transition-colors tracking-widest flex items-center gap-1.5">
                <Sparkles size={11} className={onlyCommissionable ? 'text-blox-cyan' : ''} />
                Open for Commissions
              </span>
            </label>

          </div>
        </div>

        {/* Contractor Listing Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-2xl border border-white/5 p-6 bg-white/[0.01] animate-pulse h-96 flex flex-col justify-between">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-white/5" />
                  <div className="w-24 h-4 bg-white/5 rounded-md mt-4" />
                  <div className="w-16 h-3 bg-white/5 rounded-md mt-2" />
                  <div className="w-full h-12 bg-white/5 rounded-md mt-6" />
                </div>
                <div className="w-full h-10 bg-white/5 rounded-xl mt-6" />
              </div>
            ))}
          </div>
        ) : filteredContractors.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredContractors.map((contractor) => (
                <ContractorCard
                  key={contractor.id}
                  contractor={contractor}
                  buildsCount={getBuildsCount(contractor.id)}
                  user={user}
                  isFollowing={followingIds.includes(contractor.id)}
                  onFollow={() => handleFollow(contractor.id, contractor.username)}
                  onHire={() => setBookingModalOpen(true, contractor.id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="p-16 text-center bg-white/[0.01] border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-4">
            <AlertCircle size={32} className="text-gray-500" />
            <div>
              <h3 className="text-sm font-bold uppercase text-white tracking-wider">No contractors matched your search</h3>
              <p className="text-xs text-gray-500 font-semibold mt-1">Try resetting your filters or adjusting your query terms.</p>
            </div>
            <Button
              variant="glass"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setActiveTab('all');
                setOnlyCommissionable(false);
              }}
              className="text-xs uppercase font-extrabold tracking-wider mt-2"
            >
              Reset Filters
            </Button>
          </div>
        )}

      </section>
    </div>
  );
}
