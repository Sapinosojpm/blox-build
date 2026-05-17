'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useBuildStore } from '@/store/useBuildStore';
import { useBookingStore } from '@/store/useBookingStore';
import { useUIStore } from '@/store/useUIStore';
import { Button } from '@/components/ui/Button';
import BuildCard from '@/components/cards/BuildCard';
import { ShieldCheck, Users, Trash, Award, Sparkles, Trophy, Star, ShieldAlert, BarChart3, Landmark } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const { user, isDemoMode } = useAuthStore();
  const { builds } = useBuildStore();
  const { bookings } = useBookingStore();
  const { addToast } = useUIStore();

  const [activeTab, setActiveTab] = useState<'users' | 'moderation' | 'analytics'>('users');

  // Verify administrator clearance
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

  // Pre-configured list of users for administration simulation
  const SIMULATED_USERS = [
    { id: 'admin-uuid-1111', username: 'BloxburgAdmin', email: 'admin@bloxburg.com', role: 'admin', subscription_tier: 'pro', joinDate: '2026-01-10' },
    { id: 'pro-uuid-2222', username: 'AestheticArchitect', email: 'builder@pro.com', role: 'user', subscription_tier: 'pro', joinDate: '2026-02-15' },
    { id: 'elite-uuid-3333', username: 'CozyCottageCreator', email: 'elite@build.com', role: 'user', subscription_tier: 'elite', joinDate: '2026-03-01' },
    { id: 'demo-user-uuid', username: 'BloxGuest', email: 'guest@bloxburg.com', role: 'user', subscription_tier: 'free', joinDate: '2026-05-17' },
  ];

  const handleModerationMessage = () => {
    addToast('Action logged in admin audit registry successfully!', 'success');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col gap-2 items-center sm:items-start text-center sm:text-left border-b border-white/5 pb-6">
        <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="text-blox-red" size={32} />
          Central Administration Control
        </h1>
        <p className="text-xs text-gray-500 font-bold uppercase">
          Audit user listings, manage subscriptions, monitor booking queues, and moderate structural designs.
        </p>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registered Users */}
        <div className="p-5 rounded-2xl glass-panel border border-white/5 flex items-center justify-between shadow-xl">
          <div>
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
              Registered Users
            </div>
            <div className="text-xl font-black text-white">4 Accounts</div>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/5">
            <Users className="text-blox-cyan" size={20} />
          </div>
        </div>

        {/* Total Creations posted */}
        <div className="p-5 rounded-2xl glass-panel border border-white/5 flex items-center justify-between shadow-xl">
          <div>
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
              Total Creations Published
            </div>
            <div className="text-xl font-black text-white">{builds.length} Posts</div>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/5">
            <Landmark className="text-blox-amber" size={20} />
          </div>
        </div>

        {/* Total Jobs Transacted */}
        <div className="p-5 rounded-2xl glass-panel border border-white/5 flex items-center justify-between shadow-xl">
          <div>
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
              Bookings Arranged
            </div>
            <div className="text-xl font-black text-white">{bookings.length} jobs</div>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/5">
            <Trophy className="text-blox-purple" size={20} />
          </div>
        </div>

        {/* Platform health indicator */}
        <div className="p-5 rounded-2xl glass-panel border border-white/5 flex items-center justify-between shadow-xl">
          <div>
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
              System Core Health
            </div>
            <div className="text-xl font-black text-emerald-400">100% ONLINE</div>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/5">
            <ShieldCheck className="text-emerald-400" size={20} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 gap-2.5 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-3 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'border-blox-red text-blox-red'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Users size={14} />
          User Registry
        </button>

        <button
          onClick={() => setActiveTab('moderation')}
          className={`px-4 py-3 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
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
          className={`px-4 py-3 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'border-blox-red text-blox-red'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <BarChart3 size={14} />
          SaaS Monitor
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[300px]">
        {/* User Registry List */}
        {activeTab === 'users' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-300">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Registered Accounts List
            </h3>
            
            <div className="overflow-x-auto rounded-2xl glass-panel border border-white/5 shadow-2xl">
              <table className="min-w-full divide-y divide-white/5 text-left text-xs font-semibold text-gray-400">
                <thead className="bg-[#111622] text-white uppercase tracking-widest text-[10px] font-black">
                  <tr>
                    <th className="px-6 py-4">Roblox User</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Tier Status</th>
                    <th className="px-6 py-4">Access Authority</th>
                    <th className="px-6 py-4">Joined Date</th>
                    <th className="px-6 py-4 text-center">Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-transparent">
                  {SIMULATED_USERS.map((usr) => (
                    <tr key={usr.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-white font-black">@{usr.username}</td>
                      <td className="px-6 py-4">{usr.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${
                          usr.subscription_tier === 'pro'
                            ? 'bg-amber-400/20 text-amber-400 border border-amber-400/20'
                            : usr.subscription_tier === 'elite'
                            ? 'bg-blox-cyan/20 text-blox-cyan border border-blox-cyan/20'
                            : 'bg-white/5 text-gray-400'
                        }`}>
                          {usr.subscription_tier}
                        </span>
                      </td>
                      <td className="px-6 py-4 capitalize font-black text-white">{usr.role}</td>
                      <td className="px-6 py-4">{usr.joinDate}</td>
                      <td className="px-6 py-4 text-center flex justify-center gap-2">
                        <Button variant="glass" size="sm" onClick={handleModerationMessage} className="text-[10px] py-1 px-2.5">
                          Change Role
                        </Button>
                        <Button variant="glass" size="sm" onClick={handleModerationMessage} className="text-[10px] py-1 px-2.5 text-blox-cyan border-blox-cyan/10">
                          Upgrade Tier
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Moderation catalog */}
        {activeTab === 'moderation' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-300">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Catalog posts audit
            </h3>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed">
              Below matches all designs currently indexed on the explore grids. Clicking the trash moderation icon on each card triggers immediate global deletion.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
              {builds.map((build) => (
                <BuildCard key={build.id} build={build} showModeration={true} />
              ))}
            </div>
          </div>
        )}

        {/* SaaS Monitor */}
        {activeTab === 'analytics' && (
          <div className="p-8 rounded-3xl glass-panel border border-white/5 text-center flex flex-col items-center justify-center gap-4 max-w-lg mx-auto animate-in fade-in duration-300">
            <BarChart3 size={32} className="text-blox-cyan" />
            <h4 className="text-xs font-black text-white uppercase tracking-wide">
              SaaS Subscription Monetization Analytics
            </h4>
            
            <div className="flex flex-col gap-3 w-full text-xs font-semibold text-gray-400 mt-4 text-left border-t border-white/5 pt-4">
              <div className="flex justify-between">
                <span>Free Plan users ratio</span>
                <span>25% (1 / 4)</span>
              </div>
              <div className="flex justify-between">
                <span>Elite Plan users ratio</span>
                <span>25% (1 / 4)</span>
              </div>
              <div className="flex justify-between">
                <span>Pro Plan users ratio</span>
                <span>50% (2 / 4)</span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-2 text-white font-black">
                <span>Simulated Monthly SaaS Revenue</span>
                <span className="text-emerald-400 font-black">$49.97 / mo</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
