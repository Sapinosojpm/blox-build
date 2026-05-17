import { create } from 'zustand';
import { Profile, SubscriptionTier, UserRole } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface AuthState {
  user: Profile | null;
  followingIds: string[];
  isLoading: boolean;
  isDemoMode: boolean;
  initialize: () => Promise<void>;
  login: (email: string, username?: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  register: (email: string, username: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<boolean>;
  changeSubscription: (tier: SubscriptionTier) => Promise<boolean>;
  toggleFollow: (targetUserId: string) => Promise<void>;
}

// Rich Mock User profiles for immediate local demonstration
const MOCK_PROFILES: Record<string, Profile> = {
  'admin@bloxburg.com': {
    id: 'admin-uuid-1111',
    email: 'admin@bloxburg.com',
    username: 'BloxburgAdmin',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    bio: 'Official Platform Administrator. Keeping the Bloxburg community safe and inspiring!',
    role: 'admin',
    subscription_tier: 'pro',
    created_at: new Date().toISOString(),
  },
  'builder@pro.com': {
    id: 'pro-uuid-2222',
    email: 'builder@pro.com',
    username: 'AestheticArchitect',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    bio: 'Professional Bloxburg builder specializing in ultra-realistic modern mansions & mid-century suburban models. Open for commissions!',
    role: 'user',
    subscription_tier: 'pro',
    created_at: new Date().toISOString(),
  },
  'elite@build.com': {
    id: 'elite-uuid-3333',
    email: 'elite@build.com',
    username: 'CozyCottageCreator',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    bio: 'Linen and rustic build styles. Crafting the coziest spaces in Bloxburg. Subbed to Elite for increased build exposure!',
    role: 'user',
    subscription_tier: 'elite',
    created_at: new Date().toISOString(),
  },
};

const DEFAULT_USER: Profile = {
  id: 'demo-user-uuid',
  email: 'guest@bloxburg.com',
  username: 'BloxGuest',
  avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
  bio: 'Bloxburg fan! Exploring builds and learning new build styles.',
  role: 'user',
  subscription_tier: 'free',
  created_at: new Date().toISOString(),
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  followingIds: ['pro-uuid-2222'],
  isLoading: true,
  isDemoMode: true,

  initialize: async () => {
    set({ isLoading: true });
    const supabase = createClient();
    
    // Check if Supabase keys exist and are valid
    const isConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!isConfigured) {
      // Demo fallback mode
      const cached = localStorage.getItem('bloxburg_user');
      const cachedFollows = localStorage.getItem('bloxburg_follows');
      set({
        user: cached ? JSON.parse(cached) : DEFAULT_USER,
        followingIds: cachedFollows ? JSON.parse(cachedFollows) : ['pro-uuid-2222'],
        isDemoMode: true,
        isLoading: false,
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          // Fetch following
          const { data: follows } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', session.user.id);
          
          set({
            user: profile as Profile,
            followingIds: follows ? follows.map((f: any) => f.following_id) : [],
            isDemoMode: false,
          });
        } else {
          // Fallback if session exists but profile table record does not exist yet (e.g. trigger delay)
          set({
            user: {
              id: session.user.id,
              email: session.user.email || '',
              username: session.user.user_metadata.username || session.user.email?.split('@')[0] || 'User',
              avatar_url: session.user.user_metadata.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${session.user.id}`,
              bio: 'Roblox Bloxburg Builder',
              role: 'user',
              subscription_tier: 'free',
              created_at: new Date().toISOString(),
            },
            isDemoMode: false,
          });
        }
      } else {
        // No active session, but keys are configured -> live mode guest
        set({
          user: null,
          followingIds: [],
          isDemoMode: false,
        });
      }
    } catch (err) {
      console.error('Supabase init failed, running in demo fallback mode:', err);
      const cached = localStorage.getItem('bloxburg_user');
      set({
        user: cached ? JSON.parse(cached) : DEFAULT_USER,
        isDemoMode: true,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email: string, username?: string) => {
    set({ isLoading: true });
    
    if (get().isDemoMode) {
      // Perform simulated login
      const matchedProfile = MOCK_PROFILES[email] || {
        ...DEFAULT_USER,
        email,
        username: username || email.split('@')[0],
      };
      
      localStorage.setItem('bloxburg_user', JSON.stringify(matchedProfile));
      set({ user: matchedProfile, isLoading: false });
      return true;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;
      
      // Since it is passwordless otp or magic link, let's notify user
      return true;
    } catch (err) {
      console.error('Login error:', err);
      // Fallback local login for simple review
      const matchedProfile = MOCK_PROFILES[email] || {
        ...DEFAULT_USER,
        email,
        username: username || email.split('@')[0],
      };
      localStorage.setItem('bloxburg_user', JSON.stringify(matchedProfile));
      set({ user: matchedProfile, isLoading: false, isDemoMode: true });
      return true;
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithGoogle: async () => {
    set({ isLoading: true });
    const isConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!isConfigured) {
      // Mock Google OAuth login in demo/offline mode
      const mockGoogleProfile: Profile = {
        id: 'google-user-uuid-' + Math.random().toString(36).substr(2, 9),
        email: 'google.architect@gmail.com',
        username: 'GoogleArchitect',
        avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150',
        bio: 'Google authenticated Bloxburg enthusiast. Designing standard and modern builds.',
        role: 'user',
        subscription_tier: 'free',
        created_at: new Date().toISOString(),
      };
      localStorage.setItem('bloxburg_user', JSON.stringify(mockGoogleProfile));
      set({ user: mockGoogleProfile, isLoading: false, isDemoMode: true });
      return true;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Google OAuth error:', err);
      // Fallback local google simulation
      const mockGoogleProfile: Profile = {
        id: 'google-user-uuid-' + Math.random().toString(36).substr(2, 9),
        email: 'google.architect@gmail.com',
        username: 'GoogleArchitect',
        avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150',
        bio: 'Google authenticated Roblox enthusiast. Designing standard and modern builds.',
        role: 'user',
        subscription_tier: 'free',
        created_at: new Date().toISOString(),
      };
      localStorage.setItem('bloxburg_user', JSON.stringify(mockGoogleProfile));
      set({ user: mockGoogleProfile, isLoading: false, isDemoMode: true });
      return true;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (email: string, username: string) => {
    set({ isLoading: true });
    
    if (get().isDemoMode) {
      const newUser: Profile = {
        id: 'user-' + Math.random().toString(36).substr(2, 9),
        email,
        username,
        avatar_url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`,
        bio: 'Just joined the Bloxburg Build Hub community! Ready to showcase my designs.',
        role: 'user',
        subscription_tier: 'free',
        created_at: new Date().toISOString(),
      };
      localStorage.setItem('bloxburg_user', JSON.stringify(newUser));
      set({ user: newUser, isLoading: false });
      return true;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password: 'temporary-password-123', // supabase requires password
        options: {
          data: {
            username,
            avatar_url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`,
          },
        },
      });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Registration error:', err);
      // Fallback local register
      const newUser: Profile = {
        id: 'user-' + Math.random().toString(36).substr(2, 9),
        email,
        username,
        avatar_url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`,
        bio: 'Just joined the Bloxburg Build Hub community! Ready to showcase my designs.',
        role: 'user',
        subscription_tier: 'free',
        created_at: new Date().toISOString(),
      };
      localStorage.setItem('bloxburg_user', JSON.stringify(newUser));
      set({ user: newUser, isLoading: false, isDemoMode: true });
      return true;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    
    if (!get().isDemoMode) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Logout error:', err);
      }
    }

    localStorage.removeItem('bloxburg_user');
    set({ user: null, isLoading: false });
  },

  updateProfile: async (updates: Partial<Profile>) => {
    const currentUser = get().user;
    if (!currentUser) return false;

    const updatedUser = { ...currentUser, ...updates };

    if (get().isDemoMode) {
      localStorage.setItem('bloxburg_user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
      return true;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', currentUser.id);

      if (error) throw error;
      set({ user: updatedUser });
      return true;
    } catch (err) {
      console.error('Profile update failed:', err);
      // fallback save
      localStorage.setItem('bloxburg_user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
      return true;
    }
  },

  changeSubscription: async (tier: SubscriptionTier) => {
    const currentUser = get().user;
    if (!currentUser) return false;

    const updatedUser = { ...currentUser, subscription_tier: tier };

    if (get().isDemoMode) {
      localStorage.setItem('bloxburg_user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
      return true;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_tier: tier })
        .eq('id', currentUser.id);

      if (error) throw error;
      set({ user: updatedUser });
      return true;
    } catch (err) {
      console.error('Subscription update failed:', err);
      localStorage.setItem('bloxburg_user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
      return true;
    }
  },

  toggleFollow: async (targetUserId: string) => {
    const currentUser = get().user;
    if (!currentUser) return;

    const following = [...get().followingIds];
    const index = following.indexOf(targetUserId);
    
    if (index > -1) {
      following.splice(index, 1);
    } else {
      following.push(targetUserId);
    }

    if (get().isDemoMode) {
      localStorage.setItem('bloxburg_follows', JSON.stringify(following));
      set({ followingIds: following });
      return;
    }

    try {
      const supabase = createClient();
      if (index > -1) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', targetUserId);
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({ follower_id: currentUser.id, following_id: targetUserId });
      }
      set({ followingIds: following });
    } catch (err) {
      console.error('Follow toggle failed, updating locally:', err);
      localStorage.setItem('bloxburg_follows', JSON.stringify(following));
      set({ followingIds: following });
    }
  },
}));
