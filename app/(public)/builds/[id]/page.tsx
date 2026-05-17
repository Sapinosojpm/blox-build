'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBuildStore } from '@/store/useBuildStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { Button } from '@/components/ui/Button';
import CommentSection from '@/components/builds/CommentSection';
import BookingForm from '@/components/forms/BookingForm';
import { Heart, Bookmark, DollarSign, Calendar, ChevronLeft, CalendarCheck, ShieldAlert, BadgeInfo } from 'lucide-react';

export default function BuildDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isDemoMode } = useAuthStore();
  const { builds, likedBuildIds, savedBuildIds, toggleLikeBuild, toggleSaveBuild, deleteBuild } = useBuildStore();
  const { addToast } = useUIStore();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const build = builds.find((b) => b.id === id);

  if (!build) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center flex flex-col items-center gap-4">
        <BadgeInfo size={40} className="text-blox-red" />
        <h1 className="text-xl font-bold text-white uppercase tracking-wider">Creations Not Found</h1>
        <p className="text-xs text-gray-500 font-semibold leading-relaxed">
          The custom build ID you followed does not exist, was moderated, or was deleted by the author.
        </p>
        <Button variant="secondary" onClick={() => router.push('/explore')}>
          Back to Explore
        </Button>
      </div>
    );
  }

  const isLiked = likedBuildIds.includes(build.id);
  const isSaved = savedBuildIds.includes(build.id);

  const handleLike = async () => {
    if (!user) {
      addToast('Please login to like builds', 'error');
      return;
    }
    await toggleLikeBuild(build.id, isDemoMode, user);
  };

  const handleSave = async () => {
    if (!user) {
      addToast('Please login to save builds', 'error');
      return;
    }
    await toggleSaveBuild(build.id, isDemoMode, user);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this build as an administrator?')) {
      const success = await deleteBuild(build.id, isDemoMode);
      if (success) {
        addToast('Build post deleted.', 'success');
        router.push('/explore');
      }
    }
  };

  const formatBudget = (val: number) => {
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + ' Million';
    }
    if (val >= 1000) {
      return (val / 1000).toFixed(0) + 'k';
    }
    return val.toString();
  };

  const creator = build.profiles;
  const isProCreator = creator?.subscription_tier === 'pro';

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10">
      {/* Back link */}
      <div>
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wider"
        >
          <ChevronLeft size={16} />
          Back to Catalog Explore
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Images & Descriptions */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase bg-white/5 border border-white/5 text-blox-amber px-2 py-0.5 rounded tracking-wide">
                {build.category}
              </span>
              <span className="text-[10px] font-extrabold uppercase bg-blox-cyan/10 border border-blox-cyan/20 text-blox-cyan px-2 py-0.5 rounded tracking-wide">
                {build.style} Style
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white uppercase tracking-wide leading-tight">
              {build.title}
            </h1>
            
            {/* Creator link row */}
            <div className="flex items-center justify-between text-xs font-semibold text-gray-400 border-b border-white/5 pb-4">
              <div className="flex items-center gap-4">
                {creator ? (
                  <Link href={`/builders/${creator.username}`} className="flex items-center gap-2 group">
                    <img
                      src={creator.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
                      alt={creator.username}
                      className="w-8 h-8 rounded-full border border-white/10 object-cover"
                    />
                    <div>
                      <div className="text-white group-hover:text-blox-cyan transition-colors">
                        @{creator.username}
                      </div>
                      <div className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">
                        {creator.subscription_tier} Builder
                      </div>
                    </div>
                  </Link>
                ) : (
                  <span>Anonymous Creator</span>
                )}

                <div className="hidden sm:flex items-center gap-1.5 text-gray-500">
                  <Calendar size={14} />
                  <span>{new Date(build.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Actions row */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl border font-black uppercase text-[10px] tracking-wider transition-all cursor-pointer ${
                    isLiked
                      ? 'bg-blox-red/10 border-blox-red/30 text-blox-red'
                      : 'border-white/5 text-gray-400 hover:text-blox-red hover:bg-white/5'
                  }`}
                >
                  <Heart size={14} className={isLiked ? 'fill-blox-red' : ''} />
                  Like ({build.likes_count})
                </button>

                <button
                  onClick={handleSave}
                  className={`flex items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSaved
                      ? 'bg-blox-cyan/10 border-blox-cyan/30 text-blox-cyan'
                      : 'border-white/5 text-gray-400 hover:text-blox-cyan hover:bg-white/5'
                  }`}
                  title="Save build to dashboard"
                >
                  <Bookmark size={14} className={isSaved ? 'fill-blox-cyan' : ''} />
                </button>
              </div>
            </div>
          </div>

          {/* Slider Cover */}
          <div className="flex flex-col gap-3">
            <div className="aspect-[16/9] w-full rounded-2xl border border-white/5 overflow-hidden bg-blox-gray">
              <img
                src={build.images[activeImageIndex]}
                alt={build.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Gallery Selector boxes */}
            {build.images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto py-1">
                {build.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIndex(i)}
                    className={`w-24 h-16 rounded-xl border overflow-hidden shrink-0 transition-colors cursor-pointer ${
                      activeImageIndex === i ? 'border-blox-cyan ring-1 ring-blox-cyan/30' : 'border-white/5 opacity-60'
                    }`}
                  >
                    <img src={img} alt="subimg" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-black text-white uppercase tracking-wider">
              Creation Specifications
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed font-semibold">
              {build.description}
            </p>
          </div>

          <hr className="border-white/5" />

          {/* Comments System */}
          <CommentSection buildId={build.id} />
        </div>

        {/* Right Side: Attributes & Hire CTA */}
        <div className="flex flex-col gap-6 h-fit sticky top-24">
          {/* Admin Moderation Option */}
          {user?.role === 'admin' && (
            <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/10 flex items-center justify-between text-xs font-semibold text-red-400">
              <span className="flex items-center gap-1">
                <ShieldAlert size={14} />
                Admin moderated features
              </span>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 rounded-lg bg-blox-red text-white font-bold cursor-pointer hover:bg-red-600"
              >
                Delete Post
              </button>
            </div>
          )}

          {/* Core Info Grid */}
          <div className="p-6 rounded-2xl glass-panel border border-white/5 flex flex-col gap-5 shadow-xl">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-3">
              Build Attributes
            </h3>

            {/* Budget */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-semibold">Estimated Budget</span>
              <span className="text-xs font-black text-emerald-400 flex items-center gap-0.5 bg-emerald-950/20 border border-emerald-500/10 py-1 px-2.5 rounded-xl">
                <DollarSign size={12} />
                {formatBudget(build.budget)} Cash
              </span>
            </div>

            {/* Category */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-semibold">Classification</span>
              <span className="text-xs font-black text-white">{build.category}</span>
            </div>

            {/* Style */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-semibold">Design Layout Style</span>
              <span className="text-xs font-black text-blox-cyan">{build.style}</span>
            </div>

            {/* Total Likes */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-semibold">Total Critiques/Likes</span>
              <span className="text-xs font-black text-white">{build.likes_count} Hearts</span>
            </div>
          </div>

          {/* Book Commission Card (Pro builders only) */}
          {isProCreator && (
            <div className="p-6 rounded-2xl glass-panel-glow border border-blox-cyan/20 flex flex-col gap-4 shadow-xl">
              <div className="flex items-center gap-2 text-blox-cyan">
                <CalendarCheck size={20} className="animate-pulse" />
                <h3 className="text-sm font-black uppercase tracking-wider">Book Commission</h3>
              </div>
              <p className="text-[11px] text-gray-400 font-semibold leading-relaxed">
                @{creator?.username} has commission bookings enabled! You can submit a direct booking request with your specific Bloxburg cash offer.
              </p>

              {user ? (
                user.id === creator.id ? (
                  <div className="text-center text-[10px] text-gray-500 font-bold bg-white/5 py-2 px-3 rounded-lg">
                    This is your build posting
                  </div>
                ) : !isBookingOpen ? (
                  <Button
                    variant="secondary"
                    glow={true}
                    onClick={() => setIsBookingOpen(true)}
                    className="w-full text-xs font-extrabold uppercase py-3 tracking-wider mt-2"
                  >
                    Hire @{creator.username}
                  </Button>
                ) : (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider mb-4">
                      Direct Commission Details
                    </h4>
                    <BookingForm builderId={creator.id} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsBookingOpen(false)}
                      className="w-full text-[10px] mt-2 font-bold hover:text-blox-red"
                    >
                      Close Booking Box
                    </Button>
                  </div>
                )
              ) : (
                <div className="mt-2 text-center">
                  <Link href="/login">
                    <Button variant="secondary" className="w-full text-xs uppercase font-extrabold py-3">
                      🔐 Login to Hire Builder
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
