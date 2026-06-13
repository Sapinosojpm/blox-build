'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { useBuildStore } from '@/store/useBuildStore';
import { useBookingStore } from '@/store/useBookingStore';
import { createClient } from '@/lib/supabase/client';
import { Profile, SubscriptionTier, UserRole } from '@/types';
import { Button } from '@/components/ui/Button';
import DashboardStats from '@/components/dashboard/DashboardStats';
import BookingQueue from '@/components/dashboard/BookingQueue';
import SubscriptionManager from '@/components/dashboard/SubscriptionManager';
import BuildUploadForm from '@/components/forms/BuildUploadForm';
import BuildCard from '@/components/cards/BuildCard';
import { 
  Image as ImageIcon, Calendar, Crown, Edit3, Save, Plus, X, 
  Award, AlertCircle, Sparkles, Upload, CheckCircle2, ChevronRight,
  ShieldCheck, ShieldAlert, ArrowRight, Bookmark, Hammer, BookOpen, Share2,
  Users, Trash2, Trophy, BarChart3, Database, Shield, ExternalLink, Landmark, Search,
  Activity, Cpu, Zap, Settings, Globe
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, updateProfile, isDemoMode, isLoading } = useAuthStore();
  const { builds, savedBuildIds, deleteBuild } = useBuildStore();
  const { bookings } = useBookingStore();
  const { isUploadModalOpen, setUploadModalOpen, addToast } = useUIStore();

  const [activeTab, setActiveTab] = useState<'creations' | 'bookings' | 'subscription' | 'saved'>('creations');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(user?.bio || '');
  const [usernameInput, setUsernameInput] = useState(user?.username || '');
  const [avatarInput, setAvatarInput] = useState(user?.avatar_url || '');
  const [isBookableInput, setIsBookableInput] = useState(user?.is_bookable !== false);
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Redirect unauthenticated user to login
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  // Sync state with user profile shifts
  useEffect(() => {
    if (user) {
      setIsBookableInput(user.is_bookable !== false);
    }
  }, [user]);

  const handleShare = async () => {
    try {
      const profileUrl = window.location.origin + '/builders/' + user?.username;
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      addToast('Public profile link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy profile link:', err);
      addToast('Failed to copy link.', 'error');
    }
  };

  const [nicknameInput, setNicknameInput] = useState('');
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);

  // Sync nickname modal state once user is loaded
  useEffect(() => {
    if (user) {
      const emailPrefix = user.email.split('@')[0].toLowerCase();
      const currentUsername = user.username.toLowerCase();
      setIsNicknameModalOpen(currentUsername === emailPrefix);
    }
  }, [user]);

  // Capture PayMongo redirect success flags
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const tier = params.get('tier');

    if (paymentStatus === 'success' && tier) {
      const activeTier = tier as any;
      useAuthStore.getState().changeSubscription(activeTier).then((success) => {
        if (success) {
          addToast(`Success! Your account has been upgraded to ${activeTier.toUpperCase()} status! 🚀`, 'success');
        }
      });
      const newUrl = window.location.pathname + '?tab=subscription';
      window.history.replaceState({}, '', newUrl);
      setActiveTab('subscription');
    } else if (paymentStatus === 'cancel') {
      addToast('Payment cancelled. Feel free to upgrade whenever you are ready!', 'info');
      const newUrl = window.location.pathname + '?tab=subscription';
      window.history.replaceState({}, '', newUrl);
      setActiveTab('subscription');
    } else {
      const tab = params.get('tab');
      if (tab === 'subscription') {
        setActiveTab('subscription');
      }
    }
  }, [addToast]);

  // If user is not logged in
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center flex flex-col items-center gap-4">
        <AlertCircle size={40} className="text-blox-red animate-bounce" />
        <h1 className="text-xl font-black text-white uppercase tracking-wider">Unauthenticated</h1>
        <p className="text-xs text-gray-500 font-semibold leading-relaxed">
          Please log in or register a builder profile to access your personal dashboard.
        </p>
        <Button variant="secondary" onClick={() => router.push('/login')}>
          Go to Log In
        </Button>
      </div>
    );
  }

  if (user.role === 'admin') {
    return (
      <AdminDashboardView
        user={user}
        isDemoMode={isDemoMode}
        builds={builds}
        deleteBuild={deleteBuild}
        bookings={bookings}
        addToast={addToast}
      />
    );
  }

  const userBuilds = builds.filter((b) => b.user_id === user.id);
  const savedBuilds = builds.filter((b) => savedBuildIds.includes(b.id));
  const isFreeLimit = user.subscription_tier === 'free' && userBuilds.length >= 5;

  const handleProfileSave = async () => {
    if (!usernameInput.trim()) {
      addToast('Username cannot be empty!', 'error');
      return;
    }
    setUpdating(true);
    const success = await updateProfile({ 
      username: usernameInput.trim(), 
      bio: bioInput.trim(),
      avatar_url: avatarInput.trim() || undefined,
      is_bookable: user.subscription_tier === 'pro' ? isBookableInput : undefined
    });
    if (success) {
      addToast('Profile updated successfully!', 'success');
      setIsEditingBio(false);
    } else {
      addToast('Failed to update profile', 'error');
    }
    setUpdating(false);
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    if (file.size > 5 * 1024 * 1024) {
      addToast('Image is too large! Please choose a file smaller than 5MB.', 'error');
      return;
    }

    addToast('Processing and compressing avatar...', 'info');

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 150;
          canvas.height = 150;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, 150, 150);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            setAvatarInput(dataUrl);
            addToast('Avatar uploaded from device successfully! Click Save Changes.', 'success');
          }
        };
      };
    } catch (err) {
      console.error('Avatar file process failed:', err);
      addToast('Failed to process selected file.', 'error');
    }
  };

  const handleNicknameOnboard = async () => {
    const trimmed = nicknameInput.trim();
    if (!trimmed) {
      addToast('Nickname cannot be empty!', 'error');
      return;
    }
    if (user && trimmed === user.email.split('@')[0]) {
      addToast('Please choose a nickname that is different from your email prefix for privacy!', 'error');
      return;
    }
    setUpdating(true);
    const success = await updateProfile({ username: trimmed });
    if (success) {
      addToast('Welcome aboard! Nickname updated successfully!', 'success');
      setIsNicknameModalOpen(false);
    } else {
      addToast('Failed to update nickname. Please try another one!', 'error');
    }
    setUpdating(false);
  };

  const handleOpenUpload = () => {
    if (isFreeLimit) {
      addToast('Free builders are capped at 5 uploads. Upgrade to Elite or Pro for unlimited uploads!', 'error');
      setActiveTab('subscription');
      return;
    }
    setUploadModalOpen(true);
  };

  // Profile Checklist items
  const hasBio = !!user.bio;
  const hasCustomAvatar = !!user.avatar_url && !user.avatar_url.includes('dicebear.com');
  const hasBuilds = userBuilds.length > 0;
  const isPremium = user.subscription_tier !== 'free';

  const checklistItems = [
    { label: 'Set profile avatar photo', completed: hasCustomAvatar, desc: 'Personalize your brand picture' },
    { label: 'Write builder portfolio bio', completed: hasBio, desc: 'Detail your specific styles' },
    { label: 'Upload your first build creation', completed: hasBuilds, desc: 'Show off your craftsmanship' },
    { label: 'Unlock Elite/Pro features', completed: isPremium, desc: 'Remove limits & accept hires' }
  ];

  const completedCount = checklistItems.filter(i => i.completed).length;
  const progressPercent = Math.round((completedCount / checklistItems.length) * 100);

  const getTierColors = (tier: string) => {
    switch (tier) {
      case 'pro':
        return 'from-amber-400/20 to-orange-500/10 border-amber-400/35 text-amber-300';
      case 'elite':
        return 'from-blox-cyan/20 to-blue-500/10 border-blox-cyan/35 text-blox-cyan';
      default:
        return 'from-white/5 to-white/0 border-white/5 text-gray-400';
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col gap-6 sm:gap-10 bg-[#0B0E14] text-white">
      {/* 1. Premium Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/5 relative overflow-hidden flex flex-col justify-between shadow-2xl gap-6">
        {/* Decorative Grid Lines and Glowing blobs */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
        <div className="hero-grid-pattern opacity-10" />
        <div className="absolute top-0 left-0 w-48 h-48 bg-blox-cyan/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-blox-red/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left w-full">
            {/* Avatar block */}
            <div className="relative group shrink-0 select-none">
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.username}`}
                alt={user.username}
                className="w-24 h-24 rounded-full border-2 border-white/10 object-cover shadow-2xl shrink-0 transition-all duration-300 group-hover:brightness-50"
              />
              <button
                onClick={() => {
                  setBioInput(user.bio || '');
                  setUsernameInput(user.username || '');
                  setAvatarInput(user.avatar_url || '');
                  setIsBookableInput(user.is_bookable !== false);
                  setIsEditingBio(true);
                }}
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                title="Edit Profile"
              >
                <Edit3 size={18} className="text-white drop-shadow-md" />
              </button>
            </div>

            {/* Profile info block */}
            <div className="flex flex-col gap-2 w-full">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl font-black text-white uppercase tracking-tight">
                  @{user.username}
                </h1>
                <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border bg-gradient-to-r ${getTierColors(user.subscription_tier)}`}>
                  <Award size={11} />
                  {user.subscription_tier}
                </span>
                
                {/* Commission status beacon */}
                {user.subscription_tier === 'pro' ? (
                  user.is_bookable !== false ? (
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                      Open for Hires
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400">
                      Hires Closed
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-gray-500">
                    Commissions Locked
                  </span>
                )}
              </div>

              {isEditingBio ? (
                <div className="flex flex-col gap-4 mt-3 max-w-3xl w-full animate-in fade-in slide-in-from-top-2 duration-300 bg-white/[0.01] border border-white/5 p-4 rounded-2xl glass-panel">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest">Username / Nickname</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-gray-500 font-bold">@</span>
                        <input
                          type="text"
                          className="w-full pl-7 pr-3 py-2 bg-[#0B0E14] rounded-xl border border-white/15 text-xs text-white focus:outline-none focus:border-blox-cyan font-bold transition-all"
                          value={usernameInput}
                          onChange={(e) => setUsernameInput(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                          placeholder="username"
                          maxLength={25}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest">Builder Bio</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-[#0B0E14] rounded-xl border border-white/15 text-xs text-white focus:outline-none focus:border-blox-cyan transition-all"
                        value={bioInput}
                        onChange={(e) => setBioInput(e.target.value)}
                        placeholder="Add a bio detailing your build styles!"
                        maxLength={180}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest">Avatar Picture</label>
                      <div className="flex items-center gap-2">
                        <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#0B0E14] hover:bg-white/5 border border-white/15 rounded-xl cursor-pointer transition-colors text-[10px] font-black uppercase tracking-wider text-gray-300">
                          <Upload size={12} className="text-blox-cyan" />
                          <span>Upload File</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarFileChange}
                          />
                        </label>
                        <input
                          type="text"
                          className="w-1/2 px-3 py-2 bg-[#0B0E14] rounded-xl border border-white/15 text-xs text-white focus:outline-none focus:border-blox-cyan truncate transition-all"
                          value={avatarInput}
                          onChange={(e) => setAvatarInput(e.target.value)}
                          placeholder="Or paste image URL..."
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest">Commissions / Hires</label>
                      {user.subscription_tier === 'pro' ? (
                        <div className="flex items-center gap-2.5 h-10 mt-1">
                          <button
                            type="button"
                            onClick={() => setIsBookableInput(prev => !prev)}
                            className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer outline-none ${isBookableInput ? 'bg-emerald-500' : 'bg-white/10'}`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-[#0b0e14] transition-transform ${isBookableInput ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                          <span className={`text-[10px] font-black uppercase ${isBookableInput ? 'text-emerald-400' : 'text-gray-500'}`}>
                            {isBookableInput ? 'Accepting Hires' : 'Closed'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 h-10 mt-1 text-gray-500">
                          <Crown size={12} className="text-gray-600" />
                          <span className="text-[9px] font-black uppercase tracking-wider">Pro Tier Only</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 justify-end mt-1">
                    <Button variant="secondary" size="sm" onClick={handleProfileSave} disabled={updating} className="text-xs uppercase font-extrabold tracking-wider px-4">
                      <Save size={12} className="mr-1.5" />
                      Save Changes
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingBio(false)} className="text-xs uppercase font-bold text-gray-400">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-gray-400 font-semibold max-w-xl leading-relaxed flex items-center justify-center sm:justify-start gap-2 mt-1">
                  <span>{user.bio || 'Provide a builder bio detailing your build styles to attract commissions!'}</span>
                  <button
                    onClick={() => {
                      setBioInput(user.bio || '');
                      setUsernameInput(user.username || '');
                      setAvatarInput(user.avatar_url || '');
                      setIsBookableInput(user.is_bookable !== false);
                      setIsEditingBio(true);
                    }}
                    className="text-gray-500 hover:text-white transition-colors cursor-pointer shrink-0"
                    title="Edit Bio"
                  >
                    <Edit3 size={12} />
                  </button>
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="shrink-0 flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto mt-2">
            <Button
              variant="glass"
              size="md"
              onClick={handleShare}
              className="gap-2 text-xs uppercase tracking-wider font-extrabold py-2.5"
            >
              <Share2 size={15} />
              {copied ? 'Copied!' : 'Share Profile'}
            </Button>

            <Button
              variant="primary"
              glow={true}
              size="md"
              onClick={handleOpenUpload}
              className="gap-2 text-xs uppercase tracking-wider font-extrabold py-2.5 shadow-lg hover:shadow-blox-red/10"
            >
              <Plus size={15} />
              Upload Build
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Redesigned Stats cards */}
      <DashboardStats />

      {/* 3. Main Dashboard Workspace Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Column: Navigation Tabs & Tab Panels */}
        <div className="flex-1 w-full flex flex-col gap-6 sm:gap-8">
          
          {/* Custom Tab Selectors */}
          <div className="flex border-b border-white/5 gap-1.5 sm:gap-2.5 overflow-x-auto pb-px scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setActiveTab('creations')}
              className={`px-4 py-3 font-black text-[10px] sm:text-xs uppercase tracking-widest flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'creations'
                  ? 'border-blox-cyan text-blox-cyan'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Creations ({userBuilds.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-3 font-black text-[10px] sm:text-xs uppercase tracking-widest flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'saved'
                  ? 'border-blox-cyan text-blox-cyan'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved Builds ({savedBuilds.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-3 font-black text-[10px] sm:text-xs uppercase tracking-widest flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'bookings'
                  ? 'border-blox-cyan text-blox-cyan'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Commissions Queue</span>
            </button>

            <button
              onClick={() => setActiveTab('subscription')}
              className={`px-4 py-3 font-black text-[10px] sm:text-xs uppercase tracking-widest flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'subscription'
                  ? 'border-blox-cyan text-blox-cyan'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Plan Settings</span>
            </button>
          </div>

          {/* Active Tab Panel Content */}
          <div className="min-h-[300px]">
            {activeTab === 'creations' && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                    Creations Catalog
                  </h3>
                  {user.subscription_tier === 'free' && (
                    <span className="text-[10px] text-gray-500 font-bold uppercase">
                      Upload capacity: {userBuilds.length} / 5 slots
                    </span>
                  )}
                </div>

                {userBuilds.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {userBuilds.map((build) => (
                      <BuildCard key={build.id} build={build} />
                    ))}
                  </div>
                ) : (
                  /* Custom blueprint drafting board empty state */
                  <div className="p-10 rounded-3xl border border-dashed border-white/10 text-center flex flex-col items-center justify-center gap-4 bg-white/[0.01] hover:bg-white/[0.02] transition-colors max-w-lg mx-auto py-12">
                    <div className="w-14 h-14 rounded-2xl bg-blox-cyan/10 border border-blox-cyan/20 flex items-center justify-center text-blox-cyan mb-2 shadow-lg shadow-blox-cyan/5">
                      <Hammer size={24} className="animate-pulse" />
                    </div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      Blueprint Catalog Empty
                    </h4>
                    <p className="text-[11px] text-gray-400 font-semibold leading-relaxed max-w-sm">
                      Upload detailed screenshots, styles, and pricing structures of your builds. Sharing builds helps establish your credibility in the commissions market!
                    </p>
                    <Button variant="secondary" size="sm" onClick={handleOpenUpload} className="text-[10px] font-black uppercase tracking-wider mt-2 px-5 py-2">
                      Upload first creation
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'saved' && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                  Saved Creations & Inspiration
                </h3>

                {savedBuilds.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {savedBuilds.map((build) => (
                      <BuildCard key={build.id} build={build} />
                    ))}
                  </div>
                ) : (
                  /* Custom drafting board empty state */
                  <div className="p-10 rounded-3xl border border-dashed border-white/10 text-center flex flex-col items-center justify-center gap-4 bg-white/[0.01] hover:bg-white/[0.02] transition-colors max-w-lg mx-auto py-12">
                    <div className="w-14 h-14 rounded-2xl bg-blox-cyan/10 border border-blox-cyan/20 flex items-center justify-center text-blox-cyan mb-2">
                      <Bookmark size={24} />
                    </div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      No Saved Blueprints
                    </h4>
                    <p className="text-[11px] text-gray-400 font-semibold leading-relaxed max-w-sm">
                      Explore the public builder repository and click the bookmark ribbon button on any builds you like to save them to your workstation catalog!
                    </p>
                    <Button variant="secondary" size="sm" onClick={() => router.push('/explore')} className="text-[10px] font-black uppercase tracking-wider mt-2 px-5 py-2">
                      Explore builds catalog
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className="animate-in fade-in duration-300">
                <BookingQueue />
              </div>
            )}

            {activeTab === 'subscription' && (
              <div className="animate-in fade-in duration-300">
                <SubscriptionManager />
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Sidebar Widgets */}
        <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
          
          {/* Widget 1: Profile Checklist */}
          <div className="p-5 rounded-2xl border border-white/5 bg-[#161C26]/50 glass-panel shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blox-cyan/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={16} className="text-blox-cyan" />
              <h3 className="text-xs font-black text-white uppercase tracking-widest">
                Setup Workstation
              </h3>
            </div>

            {/* Checklist progress bar */}
            <div className="mb-4 bg-white/5 border border-white/5 p-3 rounded-xl">
              <div className="flex items-center justify-between text-[9px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">
                <span>Profile Progress</span>
                <span className="text-blox-cyan">{progressPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blox-cyan to-blue-500 rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Checklist items list */}
            <div className="flex flex-col gap-3">
              {checklistItems.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className={`mt-0.5 rounded-full shrink-0 flex items-center justify-center ${
                    item.completed ? 'text-emerald-400' : 'text-gray-600'
                  }`}>
                    <CheckCircle2 size={14} className={item.completed ? 'fill-emerald-400/10' : ''} />
                  </span>
                  <div>
                    <p className={`text-[10.5px] font-bold leading-tight ${item.completed ? 'text-gray-300 line-through decoration-white/20' : 'text-white'}`}>
                      {item.label}
                    </p>
                    <p className="text-[9px] text-gray-500 font-semibold mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 2: Commission Help & Upgrades info */}
          <div className="p-5 rounded-2xl border border-white/5 bg-[#161C26]/50 glass-panel shadow-xl relative overflow-hidden flex flex-col gap-4">
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-blox-red/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-blox-red" />
              <h3 className="text-xs font-black text-white uppercase tracking-widest">
                Developer Tips
              </h3>
            </div>

            <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
              Accepting building commissions is a great way to monetize your skills. Pro Contractors rank higher in the explore catalog and receive direct booking orders.
            </p>

            <div className="border-t border-white/5 pt-3 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-500 font-bold uppercase">Booking Tier</span>
                <span className="font-extrabold uppercase text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/10">Pro Only</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-500 font-bold uppercase">Upload Limits</span>
                <span className="font-extrabold text-white">
                  {user.subscription_tier === 'free' ? '5 Slots' : 'Unlimited'}
                </span>
              </div>
            </div>

            {user.subscription_tier !== 'pro' && (
              <Button 
                variant="glass" 
                size="sm" 
                onClick={() => setActiveTab('subscription')}
                className="w-full text-[9px] uppercase tracking-widest font-black py-2 mt-1 border-blox-cyan/25 text-blox-cyan hover:bg-blox-cyan/5 hover:border-blox-cyan"
              >
                <span>Upgrade for commissions</span>
                <ChevronRight size={10} />
              </Button>
            )}
          </div>

        </div>

      </div>

      {/* 4. GORGEOUS MODAL OVERLAY FOR BUILD UPLOADING */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0E14]/80 backdrop-blur-md overflow-y-auto">
          {/* Click outside to close */}
          <div className="absolute inset-0" onClick={() => setUploadModalOpen(false)} />
          
          <div className="relative w-full max-w-xl p-6 sm:p-8 rounded-3xl glass-panel border border-white/5 shadow-2xl bg-[#0B0E14]/95 animate-in zoom-in-95 duration-300 my-8 z-10">
            <button
              onClick={() => setUploadModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <h2 className="text-sm font-black text-white uppercase tracking-wider border-b border-white/5 pb-4 mb-6">
              Publish New Creation
            </h2>

            <BuildUploadForm />
          </div>
        </div>
      )}

      {/* 5. GORGEOUS ONBOARDING MODAL FOR NICKNAME SELECTION */}
      {isNicknameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-2xl overflow-y-auto">
          <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 shadow-2xl bg-[#0B0E14]/95 text-center flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blox-cyan to-blue-500 text-blox-dark shadow-lg shadow-blox-cyan/20 animate-pulse">
              <Sparkles size={28} />
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-black text-white uppercase tracking-wider">
                Choose Builder Nickname
              </h2>
              <p className="text-xs text-gray-400 font-semibold leading-relaxed">
                Welcome to BloxBuild Hub! To protect your privacy and brand your profile, please set a custom nickname. Your email will be kept 100% private.
              </p>
            </div>

            <div className="w-full flex flex-col gap-1.5 text-left">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Your Nickname</span>
              <div className="relative">
                <span className="absolute left-4 top-3 text-sm text-gray-500 font-bold">@</span>
                <input
                  type="text"
                  className="w-full pl-8 pr-4 py-3 bg-[#111622] rounded-xl border border-white/5 text-sm text-white focus:outline-none focus:border-blox-cyan font-bold transition-all"
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  placeholder="builder_name"
                  maxLength={25}
                />
              </div>
            </div>

            <Button
              variant="primary"
              glow={true}
              size="md"
              className="w-full uppercase tracking-wider font-extrabold text-xs"
              onClick={handleNicknameOnboard}
              disabled={updating}
            >
              Set Nickname & Get Started
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

const INITIAL_SIMULATED_USERS: Profile[] = [
  {
    id: 'admin-uuid-1111',
    username: 'BloxburgAdmin',
    email: 'admin@bloxburg.com',
    role: 'admin',
    subscription_tier: 'pro',
    avatar_url: null,
    bio: 'Platform core developer and administrator.',
    created_at: '2026-01-10T12:00:00Z'
  },
  {
    id: 'pro-uuid-2222',
    username: 'AestheticArchitect',
    email: 'builder@pro.com',
    role: 'user',
    subscription_tier: 'pro',
    avatar_url: null,
    bio: 'Professional custom modern villa designer.',
    created_at: '2026-02-15T12:00:00Z'
  },
  {
    id: 'elite-uuid-3333',
    username: 'CozyCottageCreator',
    email: 'elite@build.com',
    role: 'user',
    subscription_tier: 'elite',
    avatar_url: null,
    bio: 'Dedicated to tiny houses and cottage designs.',
    created_at: '2026-03-01T12:00:00Z'
  },
  {
    id: 'demo-user-uuid',
    username: 'BloxGuest',
    email: 'guest@bloxburg.com',
    role: 'user',
    subscription_tier: 'free',
    avatar_url: null,
    bio: 'Exploring structural masterpieces.',
    created_at: '2026-05-17T12:00:00Z'
  }
];

function AdminDashboardView({ 
  user, 
  isDemoMode, 
  builds, 
  deleteBuild, 
  bookings, 
  addToast 
}: { 
  user: Profile; 
  isDemoMode: boolean; 
  builds: any[]; 
  deleteBuild: (id: string, demo: boolean) => Promise<boolean>; 
  bookings: any[]; 
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void; 
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'moderation' | 'analytics' | 'security'>('users');
  const [usersList, setUsersList] = useState<Profile[]>(INITIAL_SIMULATED_USERS);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'elite' | 'pro'>('all');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Ban Builder Modal State
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [targetBanUser, setTargetBanUser] = useState<Profile | null>(null);
  const [banReason, setBanReason] = useState('');
  const [bannedUserIds, setBannedUserIds] = useState<string[]>([]);

  // Pending tier change modal state
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [targetTierUser, setTargetTierUser] = useState<Profile | null>(null);
  const [pendingTier, setPendingTier] = useState<SubscriptionTier | null>(null);

  // Automated Security Policy state
  const [securityRules, setSecurityRules] = useState({
    blockScrapers: true,
    rateLimiting: true,
    blockHeadless: true,
    honeypots: true,
  });

  const [threatLogs, setThreatLogs] = useState([
    { id: '1', ip: '185.220.101.4', type: 'Tor Exit Node', rule: 'Anonymous Proxy Bypass', time: 'Just now', userAgent: 'Mozilla/5.0 (Windows NT 10.0; rv:109.0) Tor/13.0.1', status: 'Blocked' },
    { id: '2', ip: '46.101.12.87', type: 'Python Scraper', rule: 'Bot User-Agent Blocked', time: '2 mins ago', userAgent: 'python-requests/2.28.1', status: 'Blocked' },
    { id: '3', ip: '54.210.35.112', type: 'Headless Browser', rule: 'Puppeteer Signature Flagged', time: '5 mins ago', userAgent: 'Mozilla/5.0 headless...', status: 'Blocked' },
    { id: '4', ip: '198.51.100.72', type: 'DDoS Burst Attack', rule: 'Rate Limit (120 req/min)', time: '12 mins ago', userAgent: 'Axios/0.27.2', status: 'Blocked' },
    { id: '5', ip: '203.0.113.15', type: 'Exploit Scanner', rule: 'SQL Injection /api Trapped', time: '1 hour ago', userAgent: 'sqlmap/1.6.8', status: 'Blocked' },
  ]);

  const [blockedCount, setBlockedCount] = useState(1342);

  const simulateBotAttack = (type: 'scraper' | 'headless' | 'exploit') => {
    const randomIP = `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`;
    
    let newLog;
    if (type === 'scraper') {
      newLog = {
        id: Math.random().toString(),
        ip: randomIP,
        type: 'Web Scraper Bot',
        rule: 'Scraper Signature Trap',
        time: 'Just now',
        userAgent: 'Scrapy/2.11.0 (+https://scrapy.org)',
        status: 'Blocked'
      };
      addToast(`🛡️ Automated Block: Intercepted scraper request from IP ${randomIP}`, 'info');
    } else if (type === 'headless') {
      newLog = {
        id: Math.random().toString(),
        ip: randomIP,
        type: 'Headless Chrome client',
        rule: 'Anti-Automation Sandbox',
        time: 'Just now',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36... HeadlessChrome',
        status: 'Blocked'
      };
      addToast(`🛡️ Automated Block: Headless web crawler isolated and blocked from IP ${randomIP}`, 'info');
    } else {
      newLog = {
        id: Math.random().toString(),
        ip: randomIP,
        type: 'CVE Vulnerability Scan',
        rule: 'Directory Traversal Decoy',
        time: 'Just now',
        userAgent: 'Nuclei/v3.1.8 (https://github.com/projectdiscovery/nuclei)',
        status: 'Blocked'
      };
      addToast(`🚨 Security Alert: Malicious scanner IP ${randomIP} blocked globally`, 'error');
    }

    setThreatLogs(prev => [newLog, ...prev.slice(0, 7)]);
    setBlockedCount(prev => prev + 1);
  };

  const handleConfirmBan = () => {
    if (!targetBanUser) return;
    if (!banReason.trim()) {
      addToast('Please provide a valid reason for this ban sanction.', 'error');
      return;
    }

    setBannedUserIds((prev) => [...prev, targetBanUser.id]);
    addToast(`Successfully banned @${targetBanUser.username} from the platform. Reason: "${banReason}"`, 'success');
    setIsBanModalOpen(false);
    setTargetBanUser(null);
    setBanReason('');
  };

  const isPayMongoEnabled = process.env.NEXT_PUBLIC_ENABLE_PAYMONGO === 'true';

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      if (isDemoMode) {
        setUsersList(INITIAL_SIMULATED_USERS);
        return;
      }
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setUsersList(data as Profile[]);
      }
    } catch (e: any) {
      console.error('Failed to load user profiles from database:', e);
      addToast('Supabase profiles offline. Loading sandbox simulated user directory.', 'info');
      setUsersList(INITIAL_SIMULATED_USERS);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isDemoMode]);

  const handleUpdateTier = async (targetUserId: string, newTier: SubscriptionTier) => {
    setUpdatingUserId(targetUserId);
    try {
      if (isDemoMode) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === targetUserId ? { ...u, subscription_tier: newTier } : u))
        );
        addToast(`[Demo Mode] Upgraded user tier to ${newTier.toUpperCase()}`, 'success');
        return;
      }

      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_tier: newTier })
        .eq('id', targetUserId);

      if (error) throw error;

      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, subscription_tier: newTier } : u))
      );
      addToast(`Successfully upgraded subscriber tier to ${newTier.toUpperCase()}`, 'success');
    } catch (e: any) {
      console.error('Failed to update subscription tier:', e);
      addToast('Error writing update to Supabase.', 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleToggleRole = async (targetUserId: string, currentRole: UserRole) => {
    if (targetUserId === user.id) {
      addToast('Security override: You cannot demote your own administrator profile!', 'error');
      return;
    }

    setUpdatingUserId(targetUserId);
    const newRole: UserRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      if (isDemoMode) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === targetUserId ? { ...u, role: newRole } : u))
        );
        addToast(`[Demo Mode] Adjusted role to ${newRole.toUpperCase()}`, 'success');
        return;
      }

      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', targetUserId);

      if (error) throw error;

      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, role: newRole } : u))
      );
      addToast(`Successfully promoted user authorization to ${newRole.toUpperCase()}`, 'success');
    } catch (e: any) {
      console.error('Failed to toggle role:', e);
      addToast('Error updating role.', 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleModerateDelete = async (buildId: string) => {
    const confirmDelete = window.confirm(
      'Are you absolutely sure you want to moderate and globally delete this creation? This cannot be undone.'
    );
    if (!confirmDelete) return;

    try {
      const success = await deleteBuild(buildId, isDemoMode);
      if (success) {
        addToast('Structural design moderated and globally deleted successfully.', 'success');
      } else {
        addToast('Deletion encountered a network error. Try again.', 'error');
      }
    } catch (e) {
      console.error('Moderate delete failed:', e);
      addToast('Failed to coordinate global deletion.', 'error');
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = tierFilter === 'all' || u.subscription_tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const eliteCount = usersList.filter((u) => u.subscription_tier === 'elite').length;
  const proCount = usersList.filter((u) => u.subscription_tier === 'pro').length;
  const freeCount = usersList.filter((u) => u.subscription_tier === 'free').length;
  const totalCount = usersList.length || 1;

  const getMRR = () => {
    if (isPayMongoEnabled) {
      const phpMRR = (eliteCount * 299) + (proCount * 499);
      return `₱${phpMRR.toLocaleString()}`;
    }
    const usdMRR = (eliteCount * 9.99) + (proCount * 19.99);
    return `$${usdMRR.toFixed(2)}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col gap-6 sm:gap-10 bg-[#0B0E14] text-white">
      {/* 1. Admin Header cover card */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-red-500/20 relative overflow-hidden flex flex-col sm:flex-row justify-between items-center sm:items-start gap-6 shadow-2xl bg-[#16131b]/30">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
        <div className="hero-grid-pattern opacity-5" />
        <div className="absolute top-0 left-0 w-48 h-48 bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="relative group shrink-0 select-none">
            <div className="w-20 h-20 rounded-full border-2 border-red-500/30 flex items-center justify-center bg-red-500/10 text-red-500 shadow-xl shadow-red-500/10">
              <ShieldAlert size={40} className="animate-pulse" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                @{user.username}
              </h1>
              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-red-500/35 bg-red-500/15 text-red-400">
                <ShieldAlert size={11} />
                Super Admin
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 font-semibold max-w-xl leading-relaxed">
              Platform administrator workstation. Manage users, moderate creations catalog, audit bookings and monitor SaaS subscription metrics.
            </p>
          </div>
        </div>

        {/* Launch Advanced Panel Link */}
        <Button
          variant="secondary"
          glow={true}
          size="md"
          onClick={() => router.push('/admin')}
          className="gap-2 text-xs uppercase tracking-wider font-extrabold w-full sm:w-auto shrink-0 py-2.5 mt-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 border-none shadow-lg shadow-red-500/20 text-white"
        >
          <ExternalLink size={15} />
          Launch Control Center
        </Button>
      </div>

      {/* 2. Admin stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#161C26]/90 to-[#0B0E14]/90 border border-white/5 glass-panel relative overflow-hidden flex flex-col justify-between shadow-xl group hover:border-blox-cyan/20 hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 bg-blox-cyan pointer-events-none" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest block mb-1">Total Registry</span>
              <h4 className="text-xl font-black text-white tracking-wide">{usersList.length} Users</h4>
            </div>
            <div className="p-2.5 rounded-xl bg-blox-cyan/10 border border-blox-cyan/20 shrink-0">
              <Users className="w-5 h-5 text-blox-cyan" />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#161C26]/90 to-[#0B0E14]/90 border border-white/5 glass-panel relative overflow-hidden flex flex-col justify-between shadow-xl group hover:border-emerald-500/20 hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 bg-emerald-500 pointer-events-none" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest block mb-1">Saas Projected MRR</span>
              <h4 className="text-xl font-black text-emerald-400 tracking-wide">{getMRR()}</h4>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shrink-0">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#161C26]/90 to-[#0B0E14]/90 border border-white/5 glass-panel relative overflow-hidden flex flex-col justify-between shadow-xl group hover:border-orange-500/20 hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 bg-orange-500 pointer-events-none" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest block mb-1">Cataloged Designs</span>
              <h4 className="text-xl font-black text-white tracking-wide">{builds.length} Posts</h4>
            </div>
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 shrink-0">
              <Landmark className="w-5 h-5 text-orange-400" />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#161C26]/90 to-[#0B0E14]/90 border border-white/5 glass-panel relative overflow-hidden flex flex-col justify-between shadow-xl group hover:border-red-500/20 hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 bg-red-500 pointer-events-none" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest block mb-1">Sytem Gateway Status</span>
              <h4 className="text-sm font-black text-emerald-400 flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                100% SECURE
              </h4>
            </div>
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 shrink-0">
              <ShieldCheck className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main admin workspace */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left column: tabs content */}
        <div className="flex-1 w-full flex flex-col gap-6 sm:gap-8">
          {/* Custom Tabs */}
          <div className="flex border-b border-white/5 gap-1.5 sm:gap-2.5 overflow-x-auto pb-px scrollbar-none">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-3 font-black text-[10px] sm:text-xs uppercase tracking-widest flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'users'
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>User Registry ({usersList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('moderation')}
              className={`px-4 py-3 font-black text-[10px] sm:text-xs uppercase tracking-widest flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'moderation'
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Creations Audit ({builds.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-3 font-black text-[10px] sm:text-xs uppercase tracking-widest flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'analytics'
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Monetization metrics</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-3 font-black text-[10px] sm:text-xs uppercase tracking-widest flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'security'
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Security Monitor</span>
            </button>
          </div>

          {/* Tab Content Panels */}
          <div className="min-h-[300px] w-full">
            {activeTab === 'users' && (
              <div className="flex flex-col gap-5 animate-in fade-in duration-300">
                {/* Search query & Filter */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                    <input
                      type="text"
                      placeholder="Search username or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs font-bold text-white bg-[#0e121d]/90 border border-white/5 rounded-xl focus:border-red-500/50 focus:outline-none placeholder-gray-600 transition-all shadow-inner"
                    />
                  </div>

                  <div className="flex gap-1 bg-[#0e121d]/90 border border-white/5 p-1 rounded-xl w-full sm:w-auto shadow-inner overflow-x-auto">
                    {(['all', 'free', 'elite', 'pro'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setTierFilter(filter)}
                        className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer w-full sm:w-auto text-center ${
                          tierFilter === filter
                            ? 'bg-white/5 text-white border border-white/5'
                            : 'text-gray-500 hover:text-white border border-transparent'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table */}
                {isLoadingUsers ? (
                  <div className="text-center py-20 flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                    <div className="text-xs font-black text-gray-500 uppercase tracking-widest mt-2">Syncing database...</div>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-16 rounded-3xl border border-white/5 bg-white/[0.01]">
                    <Users size={32} className="text-gray-600 mx-auto mb-2" />
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">No Builders Found</h4>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl glass-panel border border-white/5 shadow-2xl">
                    <table className="min-w-full divide-y divide-white/5 text-left text-xs font-semibold text-gray-400">
                      <thead className="bg-[#111622] text-white uppercase tracking-widest text-[9px] font-black">
                        <tr>
                          <th className="px-6 py-4">Roblox User</th>
                          <th className="px-6 py-4">Email</th>
                          <th className="px-6 py-4">Permissions</th>
                          <th className="px-6 py-4">Subscription Plan</th>
                          <th className="px-6 py-4 text-center">Sanctions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 bg-transparent">
                        {filteredUsers.map((usr) => (
                          <tr key={usr.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 text-white font-black">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#161f30] to-[#202d44] border border-white/5 flex items-center justify-center font-black text-[10px] text-blox-cyan uppercase">
                                  {usr.username.slice(0, 2)}
                                </div>
                                <span>@{usr.username}</span>
                                {bannedUserIds.includes(usr.id) && (
                                  <span className="text-[7px] font-black text-red-500 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded uppercase">Banned</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 font-mono text-[10px] text-gray-500">{usr.email}</td>
                            <td className="px-6 py-4">
                              <span
                                onClick={() => handleToggleRole(usr.id, usr.role)}
                                className={`px-2 py-0.5 rounded font-black text-[8px] uppercase tracking-wider border cursor-pointer inline-flex items-center gap-1 ${
                                  usr.role === 'admin'
                                    ? 'bg-red-500/10 text-red-400 border-red-500/25'
                                    : 'bg-[#111622] text-gray-400 border-white/5'
                                }`}
                              >
                                {usr.role}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <select
                                value={usr.subscription_tier}
                                disabled={updatingUserId === usr.id}
                                onChange={(e) => {
                                  setTargetTierUser(usr);
                                  setPendingTier(e.target.value as SubscriptionTier);
                                  setIsTierModalOpen(true);
                                }}
                                className="bg-[#111622] text-[8px] font-black text-white uppercase tracking-wider px-2 py-1 border border-white/5 rounded-lg focus:outline-none cursor-pointer"
                              >
                                <option value="free">FREE BUILDER</option>
                                <option value="elite">ELITE ARCHITECT</option>
                                <option value="pro">PRO CONTRACTOR</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Button
                                variant="glass"
                                size="sm"
                                disabled={usr.id === user.id || bannedUserIds.includes(usr.id)}
                                onClick={() => {
                                  setTargetBanUser(usr);
                                  setIsBanModalOpen(true);
                                }}
                                className="text-[8px] py-1 px-2 font-black uppercase text-red-400 hover:bg-red-500/10 border-red-500/10"
                              >
                                {bannedUserIds.includes(usr.id) ? 'Banned' : 'Ban Builder'}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'moderation' && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                {builds.length === 0 ? (
                  <div className="text-center py-20 border border-white/5 bg-white/[0.01] rounded-3xl">
                    <Landmark size={32} className="text-gray-600 mx-auto mb-2" />
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">No catalog items cataloged</h4>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {builds.map((build) => (
                      <div key={build.id} className="relative group">
                        <BuildCard build={build} />
                        <div className="absolute top-3 right-3 z-30">
                          <button
                            onClick={() => handleModerateDelete(build.id)}
                            className="bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-xl border border-white/10 shadow-lg text-[9px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 size={12} />
                            Moderate Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-2xl glass-panel border border-white/5 flex flex-col justify-between gap-4">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">
                      Conversions Ratio
                    </h4>
                    <div className="flex flex-col gap-2.5 text-xs text-gray-400">
                      <div className="flex justify-between">
                        <span>Free Builder</span>
                        <span className="font-mono text-white">{freeCount} ({((freeCount / totalCount) * 100).toFixed(0)}%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Elite Plan</span>
                        <span className="font-mono text-blox-cyan">{eliteCount} ({((eliteCount / totalCount) * 100).toFixed(0)}%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pro Plan</span>
                        <span className="font-mono text-amber-400">{proCount} ({((proCount / totalCount) * 100).toFixed(0)}%)</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl glass-panel border border-white/5 flex flex-col justify-between gap-4 md:col-span-2 bg-[#121622]/50">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">
                      Projected Revenue Breakdowns
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-[#0a0d16] border border-white/5 rounded-xl flex flex-col gap-0.5">
                        <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Elite Value</span>
                        <span className="text-base font-black text-white">
                          {isPayMongoEnabled ? `₱${(eliteCount * 299).toLocaleString()}` : `$${(eliteCount * 9.99).toFixed(2)}`}
                        </span>
                      </div>
                      <div className="p-3 bg-[#0a0d16] border border-white/5 rounded-xl flex flex-col gap-0.5">
                        <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Pro Value</span>
                        <span className="text-base font-black text-white">
                          {isPayMongoEnabled ? `₱${(proCount * 499).toLocaleString()}` : `$${(proCount * 19.99).toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/5 pt-3">
                      <span className="text-[9px] text-gray-500 font-black uppercase">Projected SaaS MRR</span>
                      <span className="text-xl font-black text-emerald-400">{getMRR()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: Rules Config & Simulator */}
                  <div className="md:col-span-1 flex flex-col gap-6">
                    {/* Policy Toggles */}
                    <div className="p-5 rounded-2xl glass-panel border border-white/5 bg-[#121622]/40 flex flex-col gap-4">
                      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                        <Settings className="w-4 h-4 text-blox-cyan" />
                        <h4 className="text-[10px] font-black text-white uppercase tracking-widest">
                          Firewall Policies
                        </h4>
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10.5px] font-black text-white block">Bot & Scraper Shield</span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase">Block crawling user-agents</span>
                          </div>
                          <button
                            onClick={() => setSecurityRules(prev => ({ ...prev, blockScrapers: !prev.blockScrapers }))}
                            className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer outline-none ${securityRules.blockScrapers ? 'bg-blox-cyan' : 'bg-white/10'}`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-[#0b0e14] transition-transform ${securityRules.blockScrapers ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10.5px] font-black text-white block">Rate Limiting</span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase">Max 120 reqs/min per IP</span>
                          </div>
                          <button
                            onClick={() => setSecurityRules(prev => ({ ...prev, rateLimiting: !prev.rateLimiting }))}
                            className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer outline-none ${securityRules.rateLimiting ? 'bg-blox-cyan' : 'bg-white/10'}`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-[#0b0e14] transition-transform ${securityRules.rateLimiting ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10.5px] font-black text-white block">Automation Sandbox</span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase">Isolate Puppeteer/Selenium</span>
                          </div>
                          <button
                            onClick={() => setSecurityRules(prev => ({ ...prev, blockHeadless: !prev.blockHeadless }))}
                            className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer outline-none ${securityRules.blockHeadless ? 'bg-blox-cyan' : 'bg-white/10'}`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-[#0b0e14] transition-transform ${securityRules.blockHeadless ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10.5px] font-black text-white block">Honeypot Decoy Traps</span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase">Catch & auto-ban scanners</span>
                          </div>
                          <button
                            onClick={() => setSecurityRules(prev => ({ ...prev, honeypots: !prev.honeypots }))}
                            className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer outline-none ${securityRules.honeypots ? 'bg-blox-cyan' : 'bg-white/10'}`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-[#0b0e14] transition-transform ${securityRules.honeypots ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Threat Simulator */}
                    <div className="p-5 rounded-2xl glass-panel border border-white/5 bg-[#121622]/40 flex flex-col gap-4">
                      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                        <Cpu className="w-4 h-4 text-red-500" />
                        <h4 className="text-[10px] font-black text-white uppercase tracking-widest">
                          Threat Simulator
                        </h4>
                      </div>
                      
                      <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">
                        Manually trigger simulated attacks to verify real-time firewall interception and automated blocking.
                      </p>

                      <div className="flex flex-col gap-2">
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => simulateBotAttack('scraper')}
                          className="w-full text-[9px] uppercase tracking-wider font-extrabold justify-start gap-1.5 border-white/5 hover:bg-white/5 text-blox-cyan"
                        >
                          <Zap size={11} />
                          Simulate Bot Scraper Burst
                        </Button>
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => simulateBotAttack('headless')}
                          className="w-full text-[9px] uppercase tracking-wider font-extrabold justify-start gap-1.5 border-white/5 hover:bg-white/5 text-orange-400"
                        >
                          <Globe size={11} />
                          Simulate Headless Browser
                        </Button>
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => simulateBotAttack('exploit')}
                          className="w-full text-[9px] uppercase tracking-wider font-extrabold justify-start gap-1.5 border-white/5 hover:bg-red-500/10 border-red-500/10 text-red-500"
                        >
                          <ShieldAlert size={11} />
                          Simulate Exploit Attack
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Real-time Firewall logs table */}
                  <div className="md:col-span-2 flex flex-col gap-4 p-5 rounded-2xl glass-panel border border-white/5 bg-[#121622]/40">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-red-500 animate-pulse" />
                        <h4 className="text-[10px] font-black text-white uppercase tracking-widest">
                          Real-time Firewall Logs
                        </h4>
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 border border-red-500/25 px-2 py-0.5 rounded-full">
                        {blockedCount.toLocaleString()} Bots Blocked
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-white/5">
                      <table className="min-w-full divide-y divide-white/5 text-left text-xs font-semibold text-gray-400">
                        <thead className="bg-[#0b0e14] text-white uppercase tracking-widest text-[8px] font-black">
                          <tr>
                            <th className="px-4 py-3">IP Address</th>
                            <th className="px-4 py-3">Client Type</th>
                            <th className="px-4 py-3">Triggered Rule</th>
                            <th className="px-4 py-3">Timestamp</th>
                            <th className="px-4 py-3 text-center">Sanction</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 bg-[#0b0e14]/30">
                          {threatLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3 font-mono text-[9px] text-white font-bold">{log.ip}</td>
                              <td className="px-4 py-3">
                                <span className="text-[9px] font-extrabold uppercase text-gray-300 block">{log.type}</span>
                                <span className="text-[7px] text-gray-600 font-semibold block max-w-[120px] truncate" title={log.userAgent}>{log.userAgent}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-[8px] font-bold text-orange-400 uppercase">{log.rule}</span>
                              </td>
                              <td className="px-4 py-3 text-[9px] text-gray-500 font-mono">{log.time}</td>
                              <td className="px-4 py-3 text-center">
                                <span className="px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest bg-red-500/10 border border-red-500/25 text-red-500">
                                  {log.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column: admin checklist / monitors */}
        <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
          <div className="p-5 rounded-2xl border border-red-500/10 bg-[#16131b]/35 glass-panel shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={16} className="text-red-400" />
              <h3 className="text-xs font-black text-white uppercase tracking-widest">Platform Integrity</h3>
            </div>
            
            <div className="flex flex-col gap-3.5 text-[10px] font-semibold text-gray-400">
              <div className="flex items-center justify-between">
                <span>Database Client</span>
                <span className="text-emerald-400 font-black">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between">
                <span>PayMongo Sandbox</span>
                <span className={isPayMongoEnabled ? 'text-emerald-400 font-black' : 'text-amber-400 font-black'}>
                  {isPayMongoEnabled ? 'ENABLED' : 'MOCK MODE'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>RLS Policies auditing</span>
                <span className="text-emerald-400 font-black">ENFORCED</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Node.js Env</span>
                <span className="font-mono text-white">production</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-white/5 bg-[#161C26]/50 glass-panel shadow-xl flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-blox-cyan" />
              <h3 className="text-xs font-black text-white uppercase tracking-widest">Admin Quick Actions</h3>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed font-semibold">
              Verify payouts, monitor user reports, or adjust subscription models. Make sure to audit designs regularly.
            </p>
            <Button 
              variant="glass" 
              size="sm" 
              onClick={() => router.push('/admin')}
              className="w-full text-[9px] uppercase tracking-widest font-black py-2 mt-1 border-red-500/20 text-red-400 hover:bg-red-500/5 hover:border-red-500"
            >
              <span>Launch Control Panel</span>
              <ChevronRight size={10} />
            </Button>
          </div>
        </div>
      </div>

      {/* Change Plan Modal */}
      {isTierModalOpen && targetTierUser && pendingTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-md p-6 rounded-2xl glass-panel border border-blox-cyan/30 bg-[#0d1117]/95 shadow-[0_0_50px_rgba(0,240,255,0.15)] flex flex-col gap-5 animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
              <div className="p-2 bg-blox-cyan/10 border border-blox-cyan/20 rounded-xl">
                <Award className="text-blox-cyan animate-pulse" size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">
                  Change Subscription Plan
                </h3>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                  Administrative Tier Override
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="text-xs text-gray-400 font-medium leading-relaxed">
              Are you sure you want to change the subscription plan of <span className="text-white font-black">@{targetTierUser.username}</span>?
              <div className="mt-3 p-3 bg-[#07090e] border border-white/5 rounded-xl flex items-center justify-around gap-2 text-center">
                <div>
                  <span className="text-[8px] text-gray-500 font-bold uppercase block">Current Plan</span>
                  <span className="text-[10px] font-black uppercase text-gray-400">{targetTierUser.subscription_tier}</span>
                </div>
                <div className="text-blox-cyan font-bold">➔</div>
                <div>
                  <span className="text-[8px] text-gray-500 font-bold uppercase block">New Plan</span>
                  <span className="text-[10px] font-black uppercase text-blox-cyan">{pendingTier}</span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
              <Button
                variant="glass"
                size="sm"
                onClick={() => {
                  setIsTierModalOpen(false);
                  setTargetTierUser(null);
                  setPendingTier(null);
                }}
                className="text-[10px] uppercase font-black tracking-wider border-white/5 hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  handleUpdateTier(targetTierUser.id, pendingTier);
                  setIsTierModalOpen(false);
                  setTargetTierUser(null);
                  setPendingTier(null);
                }}
                className="text-[10px] uppercase font-black tracking-wider bg-blox-cyan hover:bg-blox-cyan/90 text-blox-dark shadow-lg shadow-blox-cyan/20 border-none"
              >
                Confirm Change
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Builder Modal */}
      {isBanModalOpen && targetBanUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-md p-6 rounded-2xl glass-panel border border-red-500/30 bg-[#0d1117]/95 shadow-[0_0_50px_rgba(239,68,68,0.15)] flex flex-col gap-5 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
              <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                <ShieldAlert className="text-red-500 animate-pulse" size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Sanction Builder</h3>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Administrative Sanction</p>
              </div>
            </div>

            <div className="text-xs text-gray-400 font-medium leading-relaxed">
              Are you sure you want to suspend <span className="text-white font-black">@{targetBanUser.username}</span>? This will temporarily hide their profile portfolio.
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest">Reason for Sanction *</label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter official reason..."
                rows={3}
                className="w-full bg-[#07090e] border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
              <Button
                variant="glass"
                size="sm"
                onClick={() => {
                  setIsBanModalOpen(false);
                  setTargetBanUser(null);
                  setBanReason('');
                }}
                className="text-[10px] uppercase font-black border-white/5 text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmBan}
                className="text-[10px] uppercase font-black bg-red-600 hover:bg-red-700 text-white shadow-lg border-none"
              >
                Confirm Ban
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
