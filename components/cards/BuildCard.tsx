'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Build } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { useBuildStore } from '@/store/useBuildStore';
import { useUIStore } from '@/store/useUIStore';
import { Heart, Bookmark, DollarSign, User, ShieldAlert, Trash2, Briefcase } from 'lucide-react';

interface BuildCardProps {
  build: Build;
  showModeration?: boolean;
}

export default function BuildCard({ build, showModeration = false }: BuildCardProps) {
  const { user, isDemoMode } = useAuthStore();
  const { likedBuildIds, savedBuildIds, toggleLikeBuild, toggleSaveBuild, deleteBuild } = useBuildStore();
  const { addToast } = useUIStore();

  const isLiked = likedBuildIds.includes(build.id);
  const isSaved = savedBuildIds.includes(build.id);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      addToast('Please login to like builds', 'error');
      return;
    }
    await toggleLikeBuild(build.id, isDemoMode, user);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      addToast('Please login to save builds', 'error');
      return;
    }
    await toggleSaveBuild(build.id, isDemoMode, user);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleting(true);
    const success = await deleteBuild(build.id, isDemoMode);
    if (success) {
      addToast('Build deleted successfully', 'success');
    } else {
      addToast('Failed to delete build', 'error');
    }
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
  };

  // Format budget to readable string e.g. $350k
  const formatBudget = (val: number) => {
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (val >= 1000) {
      return (val / 1000).toFixed(0) + 'k';
    }
    return val.toString();
  };

  const creator = build.profiles;
  const isOpenForCommissions = creator?.subscription_tier === 'pro';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className="group relative flex flex-col h-full rounded-2xl overflow-hidden glass-panel border border-white/5 hover:border-blox-cyan/30 hover:shadow-[0_8px_30px_rgb(0,210,255,0.06)]"
    >
      {/* Moderation Button */}
      {showModeration && user?.role === 'admin' && (
        <button
          onClick={handleDeleteClick}
          className="absolute top-3 left-3 z-10 p-2 rounded-xl bg-blox-red hover:bg-red-600 text-white shadow-lg cursor-pointer transition-colors"
          title="Delete Build (Admin Action)"
        >
          <ShieldAlert size={16} />
        </button>
      )}

      {/* Owner Delete Button */}
      {user?.id === build.user_id && (
        <button
          onClick={handleDeleteClick}
          className="absolute top-3 right-3 z-10 p-2 rounded-xl bg-[#0B0E14]/80 backdrop-blur-md border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white shadow-lg cursor-pointer transition-all duration-300"
          title="Delete Build"
        >
          <Trash2 size={14} />
        </button>
      )}

      {/* Build Image */}
      <Link href={`/builds/${build.id}`} className="relative block aspect-[16/10] w-full overflow-hidden bg-blox-gray">
        <img
          src={build.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600'}
          alt={build.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Open for Commissions Banner */}
        {isOpenForCommissions && (
          <div className="absolute top-0 left-0 right-0 flex items-center justify-center gap-1.5 py-1.5 bg-gradient-to-r from-blox-cyan/80 via-blox-cyan/70 to-blox-cyan/80 backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
            </span>
            <Briefcase size={9} className="text-[#0B0E14]" strokeWidth={2.5} />
            <span className="text-[9px] font-black uppercase tracking-widest text-[#0B0E14]">Open for Commissions</span>
          </div>
        )}
        {/* Style Badge */}
        <span className="absolute bottom-3 right-3 text-[10px] font-extrabold uppercase bg-[#0B0E14]/80 backdrop-blur-md text-blox-cyan border border-blox-cyan/20 px-2 py-1 rounded-md tracking-wider">
          {build.style}
        </span>
      </Link>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-5">
        {/* Category & Budget */}
        <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-2">
          <span className="text-blox-amber">{build.category}</span>
          <span className="flex items-center gap-0.5 text-emerald-400 font-bold bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-500/10">
            <DollarSign size={12} className="mt-0.5" />
            {formatBudget(build.budget)}
          </span>
        </div>

        {/* Title */}
        <Link href={`/builds/${build.id}`} className="block">
          <h3 className="text-base font-bold text-white leading-snug hover:text-blox-cyan transition-colors mb-2 line-clamp-1">
            {build.title}
          </h3>
        </Link>

        {/* Description Snippet */}
        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-4 flex-1">
          {build.description}
        </p>

        <hr className="border-white/5 my-3" />

        {/* Creator Info & Action Controls */}
        <div className="flex items-center justify-between mt-auto">
          {/* Creator Profile */}
          {creator ? (
            <Link href={`/builders/${creator.username}`} className="flex items-center gap-2 group/creator">
              <img
                src={creator.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
                alt={creator.username}
                className="h-6 w-6 rounded-full border border-white/10 object-cover"
              />
              <span className="text-xs font-bold text-gray-300 group-hover/creator:text-white transition-colors truncate max-w-[80px]">
                {creator.username}
              </span>
            </Link>
          ) : (
            <span className="flex items-center gap-1 text-xs text-gray-500 font-bold">
              <User size={12} />
              Anonymous
            </span>
          )}

          {/* Likes & Saves Counters */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 text-xs font-bold transition-all py-1 px-2 rounded-lg cursor-pointer ${
                isLiked
                  ? 'bg-blox-red/10 text-blox-red border border-blox-red/20'
                  : 'text-gray-400 hover:text-blox-red hover:bg-white/5'
              }`}
            >
              <Heart size={14} className={isLiked ? 'fill-blox-red' : ''} />
              <span>{build.likes_count}</span>
            </button>

            <button
              onClick={handleSave}
              className={`flex items-center justify-center p-2 rounded-lg border transition-all cursor-pointer ${
                isSaved
                  ? 'bg-blox-cyan/10 text-blox-cyan border-blox-cyan/20'
                  : 'text-gray-400 border-transparent hover:text-blox-cyan hover:bg-white/5'
              }`}
              title="Save Build"
            >
              <Bookmark size={14} className={isSaved ? 'fill-blox-cyan' : ''} />
            </button>
          </div>
        </div>
      </div>
      {/* 4. PREMIUM CONFIRM DELETE MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-sm p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 shadow-2xl bg-[#0B0E14]/95 text-center flex flex-col items-center gap-5 animate-in zoom-in-95 duration-300">
            {/* Glowing Trash Container */}
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 shadow-lg shadow-red-500/5 animate-pulse">
              <Trash2 size={24} />
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-black text-white uppercase tracking-wider">
                Delete Creation?
              </h2>
              <p className="text-[11px] text-gray-400 font-semibold leading-relaxed">
                Are you sure you want to permanently delete this build? This will wipe the post and delete all uploaded photos from our servers forever.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDeleteModalOpen(false);
                }}
                className="flex-1 py-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-xs font-black uppercase text-gray-400 hover:text-white transition-colors cursor-pointer"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-blox-red hover:bg-red-600 text-xs font-black uppercase text-white shadow-lg shadow-blox-red/10 cursor-pointer transition-colors"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
