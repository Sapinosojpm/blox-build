'use client';

import { useState, useEffect } from 'react';
import { useThreadStore } from '@/store/useThreadStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageSquare, Search, Send, Plus, Trash2, Award, Star, Shield, Users, Sparkles, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function CommunityPage() {
  const { user, isDemoMode } = useAuthStore();
  const { threads, comments, likedThreadIds, isLoading, initialize, addThread, deleteThread, toggleLikeThread, addComment } = useThreadStore();
  const { addToast } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [commentingId, setCommentingId] = useState<string | null>(null);

  useEffect(() => {
    initialize(isDemoMode, user?.id);
  }, [isDemoMode, user?.id]);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      addToast('Please login to create a discussion thread', 'error');
      return;
    }
    if (!newTitle.trim() || !newContent.trim()) {
      addToast('Please enter both a title and content', 'error');
      return;
    }

    const success = await addThread(newTitle, newContent, isDemoMode, user);
    if (success) {
      addToast('Thread posted successfully in the community!', 'success');
      setNewTitle('');
      setNewContent('');
      setIsFormOpen(false);
    } else {
      addToast('Failed to post thread.', 'error');
    }
  };

  const handlePostComment = async (threadId: string) => {
    if (!user) {
      addToast('Please login to post comments', 'error');
      return;
    }
    if (!newCommentContent.trim()) {
      addToast('Comment cannot be empty', 'error');
      return;
    }

    setCommentingId(threadId);
    await addComment(threadId, newCommentContent, isDemoMode, user);
    addToast('Comment added successfully!', 'success');
    setNewCommentContent('');
    setCommentingId(null);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this thread?')) {
      await deleteThread(id, isDemoMode);
      addToast('Thread deleted.', 'success');
      if (expandedThreadId === id) {
        setExpandedThreadId(null);
      }
    }
  };

  const handleLike = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user) {
      addToast('Please login to like discussion threads', 'error');
      return;
    }
    await toggleLikeThread(id, isDemoMode, user);
  };

  const getBadgeIcon = (tier?: string) => {
    switch (tier) {
      case 'pro':
        return <Award size={11} className="text-amber-400" />;
      case 'elite':
        return <Star size={11} className="text-blox-cyan animate-pulse" />;
      default:
        return <Shield size={11} className="text-gray-500" />;
    }
  };

  // Filter and sort threads
  const filteredThreads = threads
    .filter((t) => {
      const query = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(query) ||
        t.content.toLowerCase().includes(query) ||
        t.profiles?.username.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'popular') {
        return b.likes_count - a.likes_count;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8">
      {/* 1. Header Grid Pattern Background */}
      <div className="flex flex-col gap-3 items-center text-center border-b border-white/5 pb-8 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-blox-cyan/5 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 w-fit text-[9px] font-black text-blox-cyan uppercase tracking-widest">
          <MessageCircle size={10} />
          Bloxburg Builders Discussion Boards
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight leading-none mt-2">
          Builder <span className="text-gradient-cyan">Forum Threads</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 font-semibold max-w-xl leading-relaxed">
          Discuss build tricks, safe commission pricing models, gamepass combinations, and basic shapes rotation setups with elite Bloxburg architects.
        </p>
      </div>

      {/* 2. Top Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-sm">
          <input
            type="text"
            placeholder="Search discussion threads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#111622] rounded-xl border border-white/5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blox-cyan transition-colors"
          />
          <Search size={14} className="absolute left-3 top-3.5 text-gray-500" />
        </div>

        {/* Sorting + Add Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2.5 bg-[#111622] rounded-xl border border-white/5 text-xs text-white focus:outline-none focus:border-blox-cyan transition-colors cursor-pointer"
          >
            <option value="latest">Latest Threads</option>
            <option value="popular">Most Liked</option>
          </select>

          <Button
            variant="primary"
            glow={true}
            size="sm"
            onClick={() => {
              if (!user) {
                addToast('Please login to post a thread!', 'error');
                return;
              }
              setIsFormOpen(!isFormOpen);
            }}
            className="gap-1.5 text-xs uppercase tracking-wider font-extrabold"
          >
            <Plus size={14} />
            New Thread
          </Button>
        </div>
      </div>

      {/* 3. New Thread Form Drawer */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleCreateThread}
              className="p-6 rounded-2xl glass-panel-glow border border-blox-cyan/20 flex flex-col gap-4 shadow-2xl relative"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-blox-cyan animate-pulse" />
                  Publish Thread discussion
                </h3>
                <span className="text-[9px] text-blox-red font-black uppercase px-2 py-0.5 bg-blox-red/10 border border-blox-red/20 rounded">
                  🚫 Text posts only
                </span>
              </div>

              {/* Title input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  Thread Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. How to prevent Advanced Placing overlap glitch?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  maxLength={100}
                  className="w-full px-4 py-2.5 bg-[#111622] rounded-xl border border-white/5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blox-cyan transition-colors"
                  required
                />
              </div>

              {/* Content text area */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  Discussion Content
                </label>
                <textarea
                  placeholder="Describe your question, guide, or thoughts in detail. Standard text only — no images or attachment files allowed."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-4 py-3 bg-[#111622] rounded-xl border border-white/5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blox-cyan min-h-[120px] transition-colors leading-relaxed"
                  required
                />
              </div>

              <div className="text-[10px] text-gray-500 font-semibold leading-relaxed border-t border-white/5 pt-3">
                💡 Discussion boards maintain a safe, clean text-only environment. Posts violating Roblox guidelines or spamming external links will be deleted.
              </div>

              <div className="flex justify-end gap-3 mt-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" glow={true} size="sm" className="font-extrabold uppercase tracking-wider">
                  Post Thread
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Threads Feed */}
      <div className="flex flex-col gap-5">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-blox-cyan border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredThreads.length > 0 ? (
          filteredThreads.map((thread) => {
            const isLiked = likedThreadIds.includes(thread.id);
            const isOwner = user?.id === thread.user_id;
            const isAdmin = user?.role === 'admin';
            const isExpanded = expandedThreadId === thread.id;
            const threadComments = comments[thread.id] || [];

            return (
              <div
                key={thread.id}
                onClick={() => setExpandedThreadId(isExpanded ? null : thread.id)}
                className={`p-6 rounded-2xl glass-panel border ${
                  isExpanded ? 'border-blox-cyan/30 bg-[#161C26]/40' : 'border-white/5 hover:border-blox-cyan/20'
                } transition-all duration-300 flex flex-col gap-4 cursor-pointer shadow-lg`}
              >
                {/* Author row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/builders/${thread.profiles?.username || ''}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <img
                        src={thread.profiles?.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${thread.profiles?.username}`}
                        alt={thread.profiles?.username}
                        className="w-9 h-9 rounded-full border border-white/10 object-cover hover:scale-105 transition-transform"
                      />
                    </Link>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/builders/${thread.profiles?.username || ''}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-bold text-white hover:text-blox-cyan transition-colors"
                        >
                          @{thread.profiles?.username || 'user'}
                        </Link>
                        <span className="flex items-center gap-0.5 text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-gray-400">
                          {getBadgeIcon(thread.profiles?.subscription_tier)}
                          {thread.profiles?.subscription_tier || 'free'}
                        </span>
                      </div>
                      <span className="text-[9px] text-gray-500 font-bold uppercase">
                        {new Date(thread.created_at).toLocaleDateString()} at{' '}
                        {new Date(thread.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Actions (Delete if owner/admin) */}
                  {(isOwner || isAdmin) && (
                    <button
                      onClick={(e) => handleDelete(e, thread.id)}
                      className="p-2 rounded-lg bg-white/0 hover:bg-blox-red/10 text-gray-500 hover:text-blox-red transition-all cursor-pointer"
                      title="Delete Thread"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {/* Title and Content snippet */}
                <div className="flex flex-col gap-2 text-left">
                  <h2 className="text-sm sm:text-base font-black text-white tracking-wide uppercase hover:text-blox-cyan transition-colors">
                    {thread.title}
                  </h2>
                  <p
                    className={`text-xs text-gray-300 leading-relaxed font-semibold ${
                      isExpanded ? '' : 'line-clamp-3'
                    }`}
                  >
                    {thread.content}
                  </p>
                </div>

                {/* Engagement row */}
                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-gray-400 border-t border-white/5 pt-3">
                  <button
                    onClick={(e) => handleLike(e, thread.id)}
                    className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isLiked ? 'text-blox-red' : 'hover:text-white'
                    }`}
                  >
                    <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} className="shrink-0" />
                    <span>{thread.likes_count} Likes</span>
                  </button>

                  <div className="flex items-center gap-1.5 hover:text-white transition-colors">
                    <MessageSquare size={14} className="shrink-0 text-blox-cyan" />
                    <span>{thread.comments_count} Comments</span>
                  </div>
                </div>

                {/* Detailed comments list & comment input drawer */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mt-2 flex flex-col gap-4 border-t border-white/5 pt-4 cursor-default"
                      onClick={(e) => e.stopPropagation()} // Prevent card closing when clicking details
                    >
                      <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-left">
                        Comments Board ({threadComments.length})
                      </h4>

                      {/* Comments feed list */}
                      {threadComments.length > 0 ? (
                        <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                          {threadComments.map((comment) => (
                            <div
                              key={comment.id}
                              className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-left flex gap-3 items-start hover:bg-white/10 transition-colors"
                            >
                              <Link href={`/builders/${comment.profiles?.username || ''}`}>
                                <img
                                  src={comment.profiles?.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${comment.profiles?.username}`}
                                  alt={comment.profiles?.username}
                                  className="w-7 h-7 rounded-full border border-white/5 object-cover shrink-0 hover:scale-105 transition-transform"
                                />
                              </Link>
                              <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <Link
                                    href={`/builders/${comment.profiles?.username || ''}`}
                                    className="text-[11px] font-bold text-white hover:text-blox-cyan transition-colors"
                                  >
                                    @{comment.profiles?.username || 'user'}
                                  </Link>
                                  <span className="text-[7px] font-extrabold uppercase px-1 py-0.2 rounded bg-white/5 text-gray-400">
                                    {comment.profiles?.subscription_tier || 'free'}
                                  </span>
                                  <span className="text-[8px] text-gray-500 font-bold ml-auto">
                                    {new Date(comment.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-300 font-semibold leading-relaxed">
                                  {comment.content}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center bg-[#111622] rounded-xl text-[10px] text-gray-500 font-bold border border-white/5 uppercase tracking-wide">
                          💬 No comments yet. Be the first to start the discussion!
                        </div>
                      )}

                      {/* Comment Input Box */}
                      {user ? (
                        <div className="flex gap-2 items-center mt-2">
                          <input
                            type="text"
                            placeholder="Add a text comment..."
                            value={newCommentContent}
                            onChange={(e) => setNewCommentContent(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handlePostComment(thread.id);
                            }}
                            className="flex-1 px-4 py-2.5 bg-[#111622] rounded-xl border border-white/5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blox-cyan transition-colors"
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={commentingId === thread.id}
                            onClick={() => handlePostComment(thread.id)}
                            className="px-3 shrink-0 flex items-center justify-center"
                          >
                            <Send size={12} className="text-blox-cyan" />
                          </Button>
                        </div>
                      ) : (
                        <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-center text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                          🔒 Please login to share comments in this thread.
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        ) : (
          <div className="p-16 text-center bg-white/5 border border-white/5 rounded-3xl text-xs text-gray-500 font-bold uppercase tracking-wider">
            🔍 No discussion threads match your filter queries. Start a new topic!
          </div>
        )}
      </div>
    </div>
  );
}
