import { create } from 'zustand';
import { Thread, ThreadComment, Profile } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface ThreadState {
  threads: Thread[];
  comments: Record<string, ThreadComment[]>;
  likedThreadIds: string[];
  isLoading: boolean;
  initialize: (isDemoMode: boolean, currentUserId?: string) => Promise<void>;
  addThread: (title: string, content: string, isDemoMode: boolean, profile: Profile) => Promise<boolean>;
  deleteThread: (threadId: string, isDemoMode: boolean) => Promise<boolean>;
  toggleLikeThread: (threadId: string, isDemoMode: boolean, profile?: Profile) => Promise<void>;
  addComment: (threadId: string, content: string, isDemoMode: boolean, profile: Profile) => Promise<void>;
}

const MOCK_PROFILES: Record<string, Profile> = {
  'pro-uuid-2222': {
    id: 'pro-uuid-2222',
    email: 'builder@pro.com',
    username: 'AestheticArchitect',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    bio: 'Professional Bloxburg builder specializing in ultra-realistic modern mansions & mid-century suburban models. Open for commissions!',
    role: 'user',
    subscription_tier: 'pro',
    created_at: new Date().toISOString(),
  },
  'elite-uuid-3333': {
    id: 'elite-uuid-3333',
    email: 'elite@build.com',
    username: 'CozyCottageCreator',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    bio: 'Linen and rustic build styles. Crafting the coziest spaces in Bloxburg.',
    role: 'user',
    subscription_tier: 'elite',
    created_at: new Date().toISOString(),
  },
  'admin-uuid-1111': {
    id: 'admin-uuid-1111',
    email: 'admin@bloxburg.com',
    username: 'BloxburgAdmin',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    bio: 'Official Platform Administrator. Keeping the Bloxburg community safe and inspiring!',
    role: 'admin',
    subscription_tier: 'pro',
    created_at: new Date().toISOString(),
  }
};

const INITIAL_MOCK_THREADS: Thread[] = [];

const INITIAL_MOCK_COMMENTS: Record<string, ThreadComment[]> = {};

export const useThreadStore = create<ThreadState>((set, get) => ({
  threads: [],
  comments: {},
  likedThreadIds: [],
  isLoading: true,

  initialize: async (isDemoMode: boolean, currentUserId?: string) => {
    set({ isLoading: true });

    if (isDemoMode) {
      const localThreadsStr = localStorage.getItem('bloxburg_threads');
      const localCommentsStr = localStorage.getItem('bloxburg_thread_comments');
      const localLikesStr = localStorage.getItem('bloxburg_thread_likes');

      const loadedThreads = localThreadsStr ? JSON.parse(localThreadsStr) : INITIAL_MOCK_THREADS;
      const loadedComments = localCommentsStr ? JSON.parse(localCommentsStr) : INITIAL_MOCK_COMMENTS;
      const loadedLikes = localLikesStr ? JSON.parse(localLikesStr) : ['thread-2'];

      set({
        threads: loadedThreads,
        comments: loadedComments,
        likedThreadIds: loadedLikes,
        isLoading: false,
      });
      return;
    }

    try {
      const supabase = createClient();
      
      // Fetch threads
      const { data: threadsData, error } = await supabase
        .from('threads')
        .select('*, profiles:user_id(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      let likedIds: string[] = [];
      if (currentUserId) {
        const { data: likes } = await supabase
          .from('thread_likes')
          .select('thread_id')
          .eq('user_id', currentUserId);
        if (likes) likedIds = likes.map((l: any) => l.thread_id);
      }

      // Fetch comments
      const { data: commentsData } = await supabase
        .from('thread_comments')
        .select('*, profiles:user_id(*)')
        .order('created_at', { ascending: true });

      const commentMap: Record<string, ThreadComment[]> = {};
      if (commentsData) {
        commentsData.forEach((comment: any) => {
          if (!commentMap[comment.thread_id]) {
            commentMap[comment.thread_id] = [];
          }
          commentMap[comment.thread_id].push(comment);
        });
      }

      set({
        threads: (threadsData as Thread[]) || [],
        comments: commentMap,
        likedThreadIds: likedIds,
      });
    } catch (err) {
      console.error('Failed to query threads from database, using mock data:', err);
      set({
        threads: INITIAL_MOCK_THREADS,
        comments: INITIAL_MOCK_COMMENTS,
        likedThreadIds: ['thread-2'],
      });
    } finally {
      set({ isLoading: false });
    }
  },

  addThread: async (title, content, isDemoMode, profile) => {
    set({ isLoading: true });

    const newThread: Thread = {
      id: 'thread-' + Math.random().toString(36).substr(2, 9),
      user_id: profile.id,
      title,
      content,
      likes_count: 0,
      comments_count: 0,
      created_at: new Date().toISOString(),
      profiles: profile,
    };

    if (isDemoMode) {
      const updatedThreads = [newThread, ...get().threads];
      localStorage.setItem('bloxburg_threads', JSON.stringify(updatedThreads));
      set({ threads: updatedThreads, isLoading: false });
      return true;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('threads')
        .insert({
          user_id: profile.id,
          title,
          content,
        })
        .select('*, profiles:user_id(*)')
        .single();

      if (error) throw error;

      set(state => ({
        threads: [data as Thread, ...state.threads],
        isLoading: false,
      }));
      return true;
    } catch (err) {
      console.error('Failed to save thread to Supabase, saving locally:', err);
      const updatedThreads = [newThread, ...get().threads];
      localStorage.setItem('bloxburg_threads', JSON.stringify(updatedThreads));
      set({ threads: updatedThreads, isLoading: false });
      return true;
    }
  },

  deleteThread: async (threadId, isDemoMode) => {
    if (isDemoMode) {
      const remainingThreads = get().threads.filter(t => t.id !== threadId);
      localStorage.setItem('bloxburg_threads', JSON.stringify(remainingThreads));
      set({ threads: remainingThreads });
      return true;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('threads')
        .delete()
        .eq('id', threadId);

      if (error) throw error;
      set(state => ({
        threads: state.threads.filter(t => t.id !== threadId),
      }));
      return true;
    } catch (err) {
      console.error('Failed to delete thread from Supabase:', err);
      const remainingThreads = get().threads.filter(t => t.id !== threadId);
      localStorage.setItem('bloxburg_threads', JSON.stringify(remainingThreads));
      set({ threads: remainingThreads });
      return true;
    }
  },

  toggleLikeThread: async (threadId, isDemoMode, profile) => {
    const likes = [...get().likedThreadIds];
    const index = likes.indexOf(threadId);
    const hasLiked = index > -1;

    if (hasLiked) {
      likes.splice(index, 1);
    } else {
      likes.push(threadId);
    }

    const updatedThreads = get().threads.map(t => {
      if (t.id === threadId) {
        return {
          ...t,
          likes_count: t.likes_count + (hasLiked ? -1 : 1),
        };
      }
      return t;
    });

    if (isDemoMode) {
      localStorage.setItem('bloxburg_thread_likes', JSON.stringify(likes));
      localStorage.setItem('bloxburg_threads', JSON.stringify(updatedThreads));
      set({ likedThreadIds: likes, threads: updatedThreads });
      return;
    }

    try {
      const supabase = createClient();
      if (hasLiked) {
        await supabase
          .from('thread_likes')
          .delete()
          .eq('user_id', profile?.id)
          .eq('thread_id', threadId);
      } else {
        await supabase
          .from('thread_likes')
          .insert({ user_id: profile?.id, thread_id: threadId });
      }
      set({ likedThreadIds: likes, threads: updatedThreads });
    } catch (err) {
      console.error('Thread like failed, updating locally:', err);
      localStorage.setItem('bloxburg_thread_likes', JSON.stringify(likes));
      localStorage.setItem('bloxburg_threads', JSON.stringify(updatedThreads));
      set({ likedThreadIds: likes, threads: updatedThreads });
    }
  },

  addComment: async (threadId, content, isDemoMode, profile) => {
    const newComment: ThreadComment = {
      id: 'tcomment-' + Math.random().toString(36).substr(2, 9),
      thread_id: threadId,
      user_id: profile.id,
      content,
      created_at: new Date().toISOString(),
      profiles: profile,
    };

    const currentComments = { ...get().comments };
    if (!currentComments[threadId]) {
      currentComments[threadId] = [];
    }
    currentComments[threadId] = [...currentComments[threadId], newComment];

    // Optimistically update thread comments count
    const updatedThreads = get().threads.map(t => {
      if (t.id === threadId) {
        return {
          ...t,
          comments_count: t.comments_count + 1,
        };
      }
      return t;
    });

    if (isDemoMode) {
      localStorage.setItem('bloxburg_thread_comments', JSON.stringify(currentComments));
      localStorage.setItem('bloxburg_threads', JSON.stringify(updatedThreads));
      set({ comments: currentComments, threads: updatedThreads });
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('thread_comments')
        .insert({
          thread_id: threadId,
          user_id: profile.id,
          content,
        });

      if (error) throw error;
      set({ comments: currentComments, threads: updatedThreads });
    } catch (err) {
      console.error('Failed to post thread comment, updating locally:', err);
      localStorage.setItem('bloxburg_thread_comments', JSON.stringify(currentComments));
      localStorage.setItem('bloxburg_threads', JSON.stringify(updatedThreads));
      set({ comments: currentComments, threads: updatedThreads });
    }
  },
}));
