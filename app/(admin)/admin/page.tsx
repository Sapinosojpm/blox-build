'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useBuildStore } from '@/store/useBuildStore';
import { useBookingStore } from '@/store/useBookingStore';
import { useUIStore } from '@/store/useUIStore';
import { Button } from '@/components/ui/Button';
import BuildCard from '@/components/cards/BuildCard';
import { createClient } from '@/lib/supabase/client';
import { Profile, SubscriptionTier, UserRole } from '@/types';
import {
  ShieldCheck,
  Users,
  Trash2,
  Award,
  Sparkles,
  Trophy,
  ShieldAlert,
  BarChart3,
  Landmark,
  UserCheck,
  Search,
  Filter,
  CheckCircle,
  Database,
  ArrowUpDown
} from 'lucide-react';

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

export default function AdminPage() {
  const router = useRouter();
  const { user, isDemoMode } = useAuthStore();
  const { builds, deleteBuild } = useBuildStore();
  const { bookings } = useBookingStore();
  const { addToast } = useUIStore();

  const [activeTab, setActiveTab] = useState<'users' | 'moderation' | 'analytics'>('users');
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

  // Check feature flag for PayMongo exchange rate conversions
  const isPayMongoEnabled = process.env.NEXT_PUBLIC_ENABLE_PAYMONGO === 'true';

  // Load registered users dynamically
  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      if (isDemoMode) {
        // Safe local state loader for demo fallbacks
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
    if (user && user.role === 'admin') {
      fetchUsers();
    }
  }, [user, isDemoMode]);

  // Guard access authorization
  if (!user || user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center flex flex-col items-center gap-4">
        <ShieldAlert size={40} className="text-blox-red animate-pulse" />
        <h1 className="text-xl font-black text-white uppercase tracking-wider">Access Denied</h1>
        <p className="text-xs text-gray-500 font-semibold leading-relaxed">
          Security clearance warning. You do not possess administrator rights to enter this quadrant.
        </p>
        <Button variant="secondary" onClick={() => router.push('/dashboard')}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  // Update a user's subscription tier
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
      addToast('Error writing update to Supabase. Check role permissions.', 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Toggle user admin/regular role
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
      addToast('Error updating role. Check database security rules.', 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Moderate and delete user post globally
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

  // Filtered registry list based on query and filters
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = tierFilter === 'all' || u.subscription_tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  // Calculate dynamic SaaS monetization ratios and MRR
  const eliteCount = usersList.filter((u) => u.subscription_tier === 'elite').length;
  const proCount = usersList.filter((u) => u.subscription_tier === 'pro').length;
  const freeCount = usersList.filter((u) => u.subscription_tier === 'free').length;
  const totalCount = usersList.length || 1;

  const getMRR = () => {
    if (isPayMongoEnabled) {
      // PHP localization rates
      const phpMRR = (eliteCount * 575) + (proCount * 1150);
      return `₱${phpMRR.toLocaleString()}`;
    }
    // Standard USD rates
    const usdMRR = (eliteCount * 9.99) + (proCount * 19.99);
    return `$${usdMRR.toFixed(2)}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex flex-col gap-2 items-center md:items-start text-center md:text-left">
          <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-wider flex items-center gap-3">
            <ShieldAlert className="text-blox-red animate-pulse" size={32} />
            Super Admin Control Center
          </h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1.5 justify-center md:justify-start">
            <Database size={12} className="text-blox-cyan" />
            {isDemoMode ? 'Sandbox Sandbox simulated environment' : 'Supabase Live Production Database connected'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="glass" size="sm" onClick={fetchUsers} className="text-[10px] uppercase font-black tracking-wider border-white/5">
            🔄 Refresh Registry
          </Button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registries */}
        <div className="p-5 rounded-2xl glass-panel border border-white/5 flex items-center justify-between shadow-xl">
          <div>
            <div className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest mb-1">
              Registered Users
            </div>
            <div className="text-2xl font-black text-white">{usersList.length} Accounts</div>
          </div>
          <div className="p-3 bg-blox-cyan/5 rounded-xl border border-blox-cyan/10">
            <Users className="text-blox-cyan" size={20} />
          </div>
        </div>

        {/* Dynamic SaaS MRR */}
        <div className="p-5 rounded-2xl glass-panel border border-white/5 flex items-center justify-between shadow-xl">
          <div>
            <div className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest mb-1">
              SaaS MRR (Real-time)
            </div>
            <div className="text-2xl font-black text-emerald-400">{getMRR()}</div>
          </div>
          <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
            <BarChart3 className="text-emerald-400" size={20} />
          </div>
        </div>

        {/* Global Structural Creations */}
        <div className="p-5 rounded-2xl glass-panel border border-white/5 flex items-center justify-between shadow-xl">
          <div>
            <div className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest mb-1">
              Designs Cataloged
            </div>
            <div className="text-2xl font-black text-white">{builds.length} Posts</div>
          </div>
          <div className="p-3 bg-orange-500/5 rounded-xl border border-orange-500/10">
            <Landmark className="text-orange-400" size={20} />
          </div>
        </div>

        {/* Core System Health */}
        <div className="p-5 rounded-2xl glass-panel border border-white/5 flex items-center justify-between shadow-xl">
          <div>
            <div className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest mb-1">
              Platform Status
            </div>
            <div className="text-2xl font-black text-emerald-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
              100% ONLINE
            </div>
          </div>
          <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
            <ShieldCheck className="text-emerald-400" size={20} />
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-white/5 gap-2.5 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-3 font-black text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'border-blox-red text-blox-red'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Users size={14} />
          User Registry ({usersList.length})
        </button>

        <button
          onClick={() => setActiveTab('moderation')}
          className={`px-4 py-3 font-black text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'moderation'
              ? 'border-blox-red text-blox-red'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Landmark size={14} />
          Creations Moderation ({builds.length})
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-3 font-black text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'border-blox-red text-blox-red'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <BarChart3 size={14} />
          SaaS Monitor
        </button>
      </div>

      {/* Tab Panels */}
      <div className="min-h-[400px]">
        {/* User Registry Panel */}
        {activeTab === 'users' && (
          <div className="flex flex-col gap-5 animate-in fade-in duration-300">
            {/* Filter and Search controls */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Search query input */}
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                <input
                  type="text"
                  placeholder="Search username or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs font-bold text-white bg-[#0e121d]/90 border border-white/5 rounded-xl focus:border-blox-cyan/50 focus:outline-none placeholder-gray-600 transition-all shadow-inner"
                />
              </div>

              {/* Tier Filter Widget */}
              <div className="flex gap-1 bg-[#0e121d]/90 border border-white/5 p-1 rounded-xl w-full sm:w-auto shadow-inner overflow-x-auto">
                {(['all', 'free', 'elite', 'pro'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTierFilter(filter)}
                    className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer w-full sm:w-auto text-center ${
                      tierFilter === filter
                        ? 'bg-white/5 text-white border border-white/5 shadow'
                        : 'text-gray-500 hover:text-white border border-transparent'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Registry view */}
            {isLoadingUsers ? (
              <div className="text-center py-20 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-4 border-blox-cyan border-t-transparent rounded-full animate-spin" />
                <div className="text-xs font-black text-gray-500 uppercase tracking-widest mt-2">
                  Syncing User Database...
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-20 p-8 rounded-3xl glass-panel border border-white/5 max-w-md mx-auto">
                <Users size={32} className="text-gray-600 mx-auto mb-2" />
                <h4 className="text-xs font-black text-white uppercase tracking-wider">No Builders Found</h4>
                <p className="text-[10px] text-gray-500 mt-1">
                  Adjust your search parameters or select a different tier filter array.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl glass-panel border border-white/5 shadow-2xl">
                <table className="min-w-full divide-y divide-white/5 text-left text-xs font-semibold text-gray-400">
                  <thead className="bg-[#111622] text-white uppercase tracking-widest text-[10px] font-black">
                    <tr>
                      <th className="px-6 py-4">Roblox User</th>
                      <th className="px-6 py-4">Email Address</th>
                      <th className="px-6 py-4">Access Authority</th>
                      <th className="px-6 py-4">Subscription Plan</th>
                      <th className="px-6 py-4">Registry Date</th>
                      <th className="px-6 py-4 text-center">Security Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-transparent">
                    {filteredUsers.map((usr) => (
                      <tr key={usr.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-white font-black">
                          <div className="flex items-center gap-2.5">
                            {/* Avatar placeholder */}
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#161f30] to-[#202d44] border border-white/5 flex items-center justify-center font-black text-[10px] text-blox-cyan uppercase tracking-wider shadow">
                              {usr.username.slice(0, 2)}
                            </div>
                            <span className="cursor-pointer hover:text-blox-cyan transition-colors" onClick={() => router.push(`/builders/${usr.username}`)}>
                              @{usr.username}
                            </span>
                            {bannedUserIds.includes(usr.id) && (
                              <span className="text-[8px] font-black tracking-widest text-blox-red bg-blox-red/10 border border-blox-red/25 px-1.5 py-0.5 rounded uppercase animate-pulse">
                                Banned
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-[11px] text-gray-500">{usr.email}</td>
                        <td className="px-6 py-4">
                          <span
                            onClick={() => handleToggleRole(usr.id, usr.role)}
                            className={`px-2.5 py-1 rounded-lg font-black text-[9px] uppercase tracking-wider border cursor-pointer transition-all duration-300 inline-flex items-center gap-1 ${
                              usr.role === 'admin'
                                ? 'bg-blox-red/10 text-blox-red border-blox-red/25 hover:bg-blox-red/20'
                                : 'bg-[#111622] text-gray-400 border-white/5 hover:text-white'
                            }`}
                          >
                            <ShieldCheck size={10} />
                            {usr.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {/* Plan Level Dropdown Selection */}
                          <select
                            value={usr.subscription_tier}
                            disabled={updatingUserId === usr.id}
                            onChange={(e) => handleUpdateTier(usr.id, e.target.value as SubscriptionTier)}
                            className="bg-[#111622] text-[9px] font-black text-white uppercase tracking-wider px-2 py-1 border border-white/5 rounded-lg focus:outline-none cursor-pointer focus:border-blox-cyan/50 hover:bg-white/5 transition-all"
                          >
                            <option value="free">FREE BUILDER</option>
                            <option value="elite">ELITE ARCHITECT</option>
                            <option value="pro">PRO CONTRACTOR</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 font-mono text-[10px] text-gray-500">
                          {new Date(usr.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {(() => {
                            const isBanned = bannedUserIds.includes(usr.id);
                            return (
                              <Button
                                variant="glass"
                                size="sm"
                                disabled={usr.id === user.id || isBanned}
                                onClick={() => {
                                  if (isBanned) return;
                                  setTargetBanUser(usr);
                                  setBanReason('');
                                  setIsBanModalOpen(true);
                                }}
                                className={`text-[9px] py-1 px-2.5 font-black uppercase tracking-widest ${
                                  usr.id === user.id || isBanned
                                    ? 'opacity-25 cursor-not-allowed text-gray-500'
                                    : 'text-blox-red hover:bg-blox-red/10 border-blox-red/10'
                                }`}
                              >
                                <Trash2 size={11} className="inline mr-1" />
                                {isBanned ? 'Banned' : 'Ban Builder'}
                              </Button>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Creations Moderation Panel */}
        {activeTab === 'moderation' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-300">
            <div className="border-b border-white/5 pb-2">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Platform creations audit moderation
              </h3>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed mt-1">
                Below lists all architectural designs cataloged globally on Explore Grids. Pressing the moderation deletion trashcan removes all Supabase storage images and deletes records instantly.
              </p>
            </div>
            {builds.length === 0 ? (
              <div className="text-center py-24 p-8 rounded-3xl glass-panel border border-white/5 max-w-md mx-auto">
                <Landmark size={36} className="text-gray-600 mx-auto mb-2 animate-bounce" />
                <h4 className="text-xs font-black text-white uppercase tracking-wider">No Structural Designs cataloged</h4>
                <p className="text-[10px] text-gray-500 mt-1">
                  Once users upload architectural designs, they will be cataloged here for moderation.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
                {builds.map((build) => (
                  <div key={build.id} className="relative group">
                    {/* Render regular Card */}
                    <BuildCard build={build} />
                    {/* Superimpose Prominent Absolute Deletion button */}
                    <div className="absolute top-3 right-3 z-30 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleModerateDelete(build.id)}
                        className="bg-blox-red/90 hover:bg-blox-red text-white p-2.5 rounded-xl border border-white/10 shadow-lg shadow-black/40 hover:scale-105 transition-all flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider cursor-pointer"
                      >
                        <Trash2 size={13} />
                        Moderate Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics Dashboard */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="border-b border-white/5 pb-2">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                SaaS Subscription Analytics Summary
              </h3>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed mt-1">
                A live summary of active tier conversion rates, customer ratios, and projected monthly recurring balance accounts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
              {/* Ratio breakdown Chart */}
              <div className="p-6 rounded-2xl glass-panel border border-white/5 flex flex-col justify-between gap-4">
                <h4 className="text-[11px] font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">
                  Subscription conversions ratio
                </h4>
                <div className="flex flex-col gap-3 text-xs font-semibold text-gray-400">
                  <div className="flex justify-between">
                    <span>Free Builder Plan</span>
                    <span className="font-mono text-white">{freeCount} Accounts ({((freeCount / totalCount) * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Elite Architect Plan</span>
                    <span className="font-mono text-blox-cyan">{eliteCount} Accounts ({((eliteCount / totalCount) * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pro Contractor Plan</span>
                    <span className="font-mono text-amber-400">{proCount} Accounts ({((proCount / totalCount) * 100).toFixed(0)}%)</span>
                  </div>
                </div>
                {/* Simulated bar chart representation */}
                <div className="w-full h-3 bg-[#0d121c] border border-white/5 rounded-full overflow-hidden flex mt-2 shadow-inner">
                  <div style={{ width: `${(freeCount / totalCount) * 100}%` }} className="bg-gray-600 h-full transition-all duration-500" />
                  <div style={{ width: `${(eliteCount / totalCount) * 100}%` }} className="bg-blox-cyan h-full transition-all duration-500" />
                  <div style={{ width: `${(proCount / totalCount) * 100}%` }} className="bg-amber-400 h-full transition-all duration-500" />
                </div>
              </div>

              {/* Dynamic MRR Sheet */}
              <div className="p-6 rounded-2xl glass-panel border border-white/5 flex flex-col justify-between gap-4 md:col-span-2">
                <h4 className="text-[11px] font-black text-white uppercase tracking-widest border-b border-white/5 pb-2 flex items-center justify-between">
                  <span>Balance account metrics</span>
                  <span className="text-[9px] text-blox-cyan px-2 py-0.5 bg-blox-cyan/5 border border-blox-cyan/10 rounded-full font-black animate-pulse">
                    {isPayMongoEnabled ? '₱ PHP ACTIVE' : '$ USD ACTIVE'}
                  </span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#0a0d16] border border-white/5 rounded-xl flex flex-col gap-1">
                    <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">
                      Elite Subscriptions Value
                    </span>
                    <span className="text-lg font-black text-white">
                      {isPayMongoEnabled
                        ? `₱${(eliteCount * 575).toLocaleString()}`
                        : `$${(eliteCount * 9.99).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="p-4 bg-[#0a0d16] border border-white/5 rounded-xl flex flex-col gap-1">
                    <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">
                      Pro Subscriptions Value
                    </span>
                    <span className="text-lg font-black text-white">
                      {isPayMongoEnabled
                        ? `₱${(proCount * 1150).toLocaleString()}`
                        : `$${(proCount * 19.99).toFixed(2)}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-4 text-xs">
                  <span className="text-gray-500 font-extrabold uppercase tracking-wider">
                    Total SaaS Monthly Recurring Revenue (MRR)
                  </span>
                  <span className="text-2xl font-black text-emerald-400">
                    {getMRR()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Ban Builder Modal */}
        {isBanModalOpen && targetBanUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-md p-6 rounded-2xl glass-panel border border-blox-red/30 bg-[#0d1117]/95 shadow-[0_0_50px_rgba(239,68,68,0.15)] flex flex-col gap-5 animate-in zoom-in-95 duration-300">
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                <div className="p-2 bg-blox-red/10 border border-blox-red/20 rounded-xl">
                  <ShieldAlert className="text-blox-red animate-pulse" size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">
                    Sanction Builder Profile
                  </h3>
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                    Administrative Action Required
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="text-xs text-gray-400 font-medium leading-relaxed">
                Are you absolutely sure you want to ban <span className="text-white font-black">@{targetBanUser.username}</span> ({targetBanUser.email}) from accessing the platform? 
                This will suspend their architectural portfolio listing.
              </div>

              {/* Reason Form */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest">
                  Reason for Ban Sanction *
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Enter official reason (e.g., copied/plagiarized builds, spam upload, suspicious commission behavior...)"
                  rows={3}
                  className="w-full bg-[#07090e] border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blox-red/50 hover:bg-[#07090e]/80 transition-all resize-none"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
                <Button
                  variant="glass"
                  size="sm"
                  onClick={() => {
                    setIsBanModalOpen(false);
                    setTargetBanUser(null);
                    setBanReason('');
                  }}
                  className="text-[10px] uppercase font-black tracking-wider border-white/5 hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmBan}
                  className="text-[10px] uppercase font-black tracking-wider bg-blox-red hover:bg-blox-red/90 text-white shadow-lg shadow-blox-red/20 border-none"
                >
                  Confirm Sanction
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
