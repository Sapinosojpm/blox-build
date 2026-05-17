'use client';

import { useState, useEffect } from 'react';
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
import { LayoutDashboard, Image, Calendar, Crown, Edit3, Save, Plus, X, Award, AlertCircle, Sparkles, Upload } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, updateProfile, isDemoMode } = useAuthStore();
  const { builds, savedBuildIds } = useBuildStore();
  const { isUploadModalOpen, setUploadModalOpen, addToast } = useUIStore();

  const [activeTab, setActiveTab] = useState<'creations' | 'bookings' | 'subscription' | 'saved'>('creations');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(user?.bio || '');
  const [usernameInput, setUsernameInput] = useState(user?.username || '');
  const [avatarInput, setAvatarInput] = useState(user?.avatar_url || '');
  const [updating, setUpdating] = useState(false);

  const [nicknameInput, setNicknameInput] = useState('');
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);

  // Sync nickname modal state once user is loaded asynchronously
  useEffect(() => {
    if (user) {
      const emailPrefix = user.email.split('@')[0].toLowerCase();
      const currentUsername = user.username.toLowerCase();
      setIsNicknameModalOpen(currentUsername === emailPrefix);
    }
  }, [user]);

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

  const handleProfileSave = async () => {
    if (!usernameInput.trim()) {
      addToast('Username cannot be empty!', 'error');
      return;
    }
    setUpdating(true);
    const success = await updateProfile({ 
      username: usernameInput.trim(), 
      bio: bioInput.trim(),
      avatar_url: avatarInput.trim() || undefined
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

    // File size safety check (Max 5MB)
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

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10">
      {/* 1. Header Profile Box */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/5 relative overflow-hidden flex flex-col sm:flex-row justify-between items-center sm:items-start gap-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="relative group shrink-0">
            <img
              src={user.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.username}`}
              alt={user.username}
              className="w-20 h-20 rounded-full border-2 border-white/10 object-cover shadow-xl shrink-0 transition-all duration-300 group-hover:brightness-50"
            />
            <button
              onClick={() => {
                setBioInput(user.bio || '');
                setUsernameInput(user.username || '');
                setAvatarInput(user.avatar_url || '');
                setIsEditingBio(true);
              }}
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
              title="Edit Profile & Photo"
            >
              <Edit3 size={16} className="text-white drop-shadow-md" />
            </button>
          </div>

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
              <div className="flex flex-col gap-3 mt-2 max-w-2xl w-full animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex flex-col gap-1 w-full sm:w-1/4">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Username / Nickname</span>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-gray-500 font-bold">@</span>
                      <input
                        type="text"
                        className="w-full pl-7 pr-3 py-2 bg-[#111622] rounded-xl border border-white/5 text-xs text-white focus:outline-none focus:border-blox-cyan font-bold"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                        placeholder="username"
                        maxLength={25}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 w-full sm:w-1/2">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Builder Bio</span>
                    <input
                      type="text"
                      className="w-full px-4 py-2 bg-[#111622] rounded-xl border border-white/5 text-xs text-white focus:outline-none focus:border-blox-cyan"
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      placeholder="Add a bio detailing your build styles!"
                      maxLength={180}
                    />
                  </div>
                  <div className="flex flex-col gap-1 w-full sm:w-1/4">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Avatar Photo</span>
                    <div className="flex items-center gap-1.5">
                      <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#111622] hover:bg-[#111622]/80 border border-white/5 rounded-xl cursor-pointer transition-colors text-xs font-bold text-gray-300">
                        <Upload size={13} className="text-blox-cyan" />
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
                        className="w-1/2 px-3 py-2 bg-[#111622] rounded-xl border border-white/5 text-xs text-white focus:outline-none focus:border-blox-cyan truncate"
                        value={avatarInput}
                        onChange={(e) => setAvatarInput(e.target.value)}
                        placeholder="Or paste URL..."
                        title={avatarInput.startsWith('data:') ? 'Image uploaded from device (Base64)' : avatarInput}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end sm:justify-start">
                  <Button variant="secondary" size="sm" onClick={handleProfileSave} disabled={updating}>
                    <Save size={12} className="mr-1" />
                    Save Changes
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
                    setUsernameInput(user.username || '');
                    setAvatarInput(user.avatar_url || '');
                    setIsEditingBio(true);
                  }}
                  className="text-gray-500 hover:text-white transition-colors cursor-pointer"
                  title="Edit Profile"
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

      {/* 6. GORGEOUS ONBOARDING MODAL FOR CHOOSING CUSTOM NICKNAME */}
      {isNicknameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-2xl overflow-y-auto">
          <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 shadow-2xl bg-[#0B0E14]/95 text-center flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300">
            {/* Glowing Icon Container */}
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

            {/* Input Form */}
            <div className="w-full flex flex-col gap-1 text-left">
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
