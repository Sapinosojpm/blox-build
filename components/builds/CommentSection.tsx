'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useBuildStore } from '@/store/useBuildStore';
import { useUIStore } from '@/store/useUIStore';
import { Button } from '../ui/Button';
import { Send, MessageSquare } from 'lucide-react';

interface CommentSectionProps {
  buildId: string;
}

export default function CommentSection({ buildId }: CommentSectionProps) {
  const { user, isDemoMode } = useAuthStore();
  const { comments, addComment } = useBuildStore();
  const { addToast } = useUIStore();
  
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const buildComments = comments[buildId] || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      addToast('Please login to post comments', 'error');
      return;
    }

    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      await addComment(buildId, commentText, isDemoMode, user);
      setCommentText('');
      addToast('Comment posted!', 'success');
    } catch (err) {
      addToast('Failed to post comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <MessageSquare size={18} className="text-blox-cyan" />
        Comments ({buildComments.length})
      </h3>

      {/* Write Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-3">
          <img
            src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
            alt={user.username}
            className="w-9 h-9 rounded-full border border-white/10 object-cover mt-0.5"
          />
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              className="flex-1 px-4 py-2.5 bg-[#111622] rounded-xl border border-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blox-cyan transition-all"
              placeholder="Add an architectural comment or ask about gamepasses..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={submitting}
            />
            <Button type="submit" variant="secondary" size="sm" className="px-3" disabled={submitting}>
              <Send size={14} />
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-center text-xs text-gray-400 font-semibold">
          🔐 Please login or register to participate in comments & architectural critiques.
        </div>
      )}

      {/* Comments List */}
      <div className="flex flex-col gap-4">
        {buildComments.length > 0 ? (
          buildComments.map((comment) => (
            <div key={comment.id} className="flex gap-3 items-start p-4 bg-[#111622]/40 border border-white/5 rounded-xl">
              <img
                src={comment.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
                alt={comment.profiles?.username}
                className="w-8 h-8 rounded-full border border-white/10 object-cover mt-0.5 shrink-0"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-white">
                    @{comment.profiles?.username || 'anonymous'}
                  </span>
                  {comment.profiles?.subscription_tier === 'pro' && (
                    <span className="text-[8px] font-extrabold uppercase px-1 py-0.2 rounded bg-gradient-to-r from-amber-400 to-orange-500 text-blox-dark">
                      pro
                    </span>
                  )}
                  <span className="text-[10px] text-gray-500">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-medium">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-500 italic text-center py-4 font-semibold">
            No comments yet. Be the first to share your thoughts on this build!
          </p>
        )}
      </div>
    </div>
  );
}
