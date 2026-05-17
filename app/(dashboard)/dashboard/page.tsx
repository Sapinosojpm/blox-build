'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { useBuildStore } from '@/store/useBuildStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import DashboardStats from '@/components/dashboard/DashboardStats';
import BookingQueue from '@/components/dashboard/BookingQueue';
import SubscriptionManager from '@/components/dashboard/SubscriptionManager';
import BuildUploadForm from '@/components/forms/BuildUploadForm';
import BuildCard from '@/components/cards/BuildCard';
import { LayoutDashboard, Image, Calendar, Crown, Edit3, Save, Plus, X, Award, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, updateProfile, isDemoMode } = useAuthStore();
  const { builds, savedBuildIds } = useBuildStore();
  const { isUploadModalOpen, setUploadModalOpen, addToast } = useUIStore();

  const [activeTab, setActiveTab] = useState<'creations' | 'bookings' | 'subscription' | 'saved'>('creations');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(user?.bio || '');
  const [updating, setUpdating] = useState(false);

  // If user is not logged in, redirect them or display login request
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

  const userBuilds = builds.filter((b) => b.user_id === user.id);
  const savedBuilds = builds.filter((b) => savedBuildIds.includes(b.id));
  const isFreeLimit = user.subscription_tier === 'free' && userBuilds.length >= 5;

  const handleBioSave = async () => {
    setUpdating(true);
    const success = await updateProfile({ bio: bioInput });
    if (success) {
      addToast('Profile bio updated!', 'success');
      setIsEditingBio(false);
    } else {
      addToast('Failed to update bio', 'error');
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

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10">
      {/* 1. Header Profile Box */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/5 relative overflow-hidden flex flex-col sm:flex-row justify-between items-center sm:items-start gap-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <img
            src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
            alt={user.username}
            className="w-20 h-20 rounded-full border-2 border-white/10 object-cover shadow-xl shrink-0"
          />

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                @{user.username}
              </h1>
              <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded bg-gradient-to-r from-blox-cyan to-blue-500 text-blox-dark">
                <Award size={10} />
                {user.subscription_tier}
              </span>
            </div>

            {isEditingBio ? (
              <div className="flex flex-col sm:flex-row gap-2 mt-1 max-w-xl w-full">
                <input
                  type="text"
                  className="px-4 py-2 bg-[#111622] rounded-xl border border-white/5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blox-cyan"
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  maxLength={180}
                />
                <div className="flex gap-2 justify-center sm:justify-start">
                  <Button variant="secondary" size="sm" onClick={handleBioSave} disabled={updating}>
                    <Save size={12} className="mr-1" />
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingBio(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 font-semibold max-w-md leading-relaxed flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                <span>{user.bio || 'Add a bio detailing your build styles!'}</span>
                <button
                  onClick={() => {
                    setBioInput(user.bio || '');
                    setIsEditingBio(true);
                  }}
                  className="text-gray-500 hover:text-white transition-colors cursor-pointer"
                  title="Edit bio"
                >
                  <Edit3 size={11} />
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Upload Trigger */}
        <Button
          variant="primary"
          glow={true}
          size="md"
          onClick={handleOpenUpload}
          className="gap-2 text-xs uppercase tracking-wider font-extrabold w-full sm:w-auto"
        >
          <Plus size={16} />
          Upload Build
        </Button>
      </div>

      {/* 2. Stats summary bar */}
      <DashboardStats />

      {/* 3. Navigation Tabs */}
      <div className="flex border-b border-white/5 gap-2.5 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('creations')}
          className={`px-4 py-3 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'creations'
              ? 'border-blox-cyan text-blox-cyan'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Image size={14} />
          Creations Catalog ({userBuilds.length})
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`px-4 py-3 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'saved'
              ? 'border-blox-cyan text-blox-cyan'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Save size={14} />
          Saved Builds ({savedBuilds.length})
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-3 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'bookings'
              ? 'border-blox-cyan text-blox-cyan'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Calendar size={14} />
          Commissions Queue
        </button>

        <button
          onClick={() => setActiveTab('subscription')}
          className={`px-4 py-3 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'subscription'
              ? 'border-blox-cyan text-blox-cyan'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Crown size={14} />
          Plan Settings
        </button>
      </div>

      {/* 4. Active Tab Content Panels */}
      <div className="min-h-[300px]">
        {activeTab === 'creations' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Creations Catalog
              </h3>
              {user.subscription_tier === 'free' && (
                <span className="text-[10px] text-gray-500 font-bold uppercase">
                  Upload capacity: {userBuilds.length} / 5 slots
                </span>
              )}
            </div>

            {userBuilds.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {userBuilds.map((build) => (
                  <BuildCard key={build.id} build={build} />
                ))}
              </div>
            ) : (
              <div className="p-16 rounded-3xl glass-panel border border-white/5 text-center flex flex-col items-center justify-center gap-4 max-w-md mx-auto">
                <Image size={32} className="text-gray-500" />
                <h4 className="text-xs font-black text-white uppercase tracking-wide">
                  No designs uploaded yet
                </h4>
                <p className="text-[11px] text-gray-400 font-semibold leading-relaxed">
                  Start showcasing your awesome Bloxburg creations, custom structural forms, mansions, cafe plots to attract commission hiring.
                </p>
                <Button variant="secondary" size="sm" onClick={handleOpenUpload}>
                  Publish your first build
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Saved Creations & Inspiration
            </h3>

            {savedBuilds.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedBuilds.map((build) => (
                  <BuildCard key={build.id} build={build} />
                ))}
              </div>
            ) : (
              <div className="p-16 rounded-3xl glass-panel border border-white/5 text-center flex flex-col items-center justify-center gap-4 max-w-md mx-auto">
                <Save size={32} className="text-gray-500" />
                <h4 className="text-xs font-black text-white uppercase tracking-wide">
                  No saved creations yet
                </h4>
                <p className="text-[11px] text-gray-400 font-semibold leading-relaxed">
                  Browse the Explore page and click the bookmark ribbon button on any build designs to save them for inspiration!
                </p>
                <Button variant="secondary" size="sm" onClick={() => router.push('/explore')}>
                  Explore Creations
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

      {/* 5. GORGEOUS MODAL OVERLAY FOR BUILD UPLOADING */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0E14]/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl p-6 sm:p-8 rounded-3xl glass-panel border border-white/5 shadow-2xl bg-[#0B0E14]/95 animate-in zoom-in-95 duration-300 my-8">
            <button
              onClick={() => setUploadModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <h2 className="text-lg font-black text-white uppercase tracking-wider border-b border-white/5 pb-4 mb-6">
              Publish New Creation
            </h2>

            <BuildUploadForm />
          </div>
        </div>
      )}
    </div>
  );
}
