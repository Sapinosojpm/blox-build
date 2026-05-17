import { create } from 'zustand';
import { Build, Comment, ExploreFilters, Profile } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface BuildState {
  builds: Build[];
  comments: Record<string, Comment[]>;
  likedBuildIds: string[];
  savedBuildIds: string[];
  filters: ExploreFilters;
  isLoading: boolean;
  initialize: (isDemoMode: boolean, currentUserId?: string) => Promise<void>;
  setFilters: (newFilters: Partial<ExploreFilters>) => void;
  resetFilters: () => void;
  addBuild: (build: Omit<Build, 'id' | 'likes_count' | 'saves_count' | 'created_at'>, isDemoMode: boolean) => Promise<boolean>;
  deleteBuild: (buildId: string, isDemoMode: boolean) => Promise<boolean>;
  toggleLikeBuild: (buildId: string, isDemoMode: boolean, profile?: Profile) => Promise<void>;
  toggleSaveBuild: (buildId: string, isDemoMode: boolean, profile?: Profile) => Promise<void>;
  addComment: (buildId: string, content: string, isDemoMode: boolean, profile: Profile) => Promise<void>;
}

// Gorgeous architectural mock builds that mimic Roblox Bloxburg elite and premium construction
const MOCK_BUILDERS: Record<string, Profile> = {
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
};

const INITIAL_MOCK_BUILDS: Build[] = [
  {
    id: 'build-1',
    user_id: 'pro-uuid-2222',
    title: 'Ultra Modern Glass Mansion',
    description: 'An elite 2-story glass architecture mansion featuring a customizable infinity pool, state-of-the-art kitchen, 4 master bedrooms, and advanced custom interior styling. Hand-crafted using custom shapes and light decals.',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600'
    ],
    category: 'Modern Mansion',
    style: 'Modern',
    budget: 850000,
    likes_count: 342,
    saves_count: 156,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    profiles: MOCK_BUILDERS['pro-uuid-2222'],
  },
  {
    id: 'build-2',
    user_id: 'elite-uuid-3333',
    title: 'Cozy Autumn Forest Cabin',
    description: 'A beautiful warm Linen themed cabin tucked away in a realistic forest build. Includes a large custom fireplace, reading lofts, glass skylights, and vintage furniture detailing. Very aesthetic!',
    images: [
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&q=80&w=600'
    ],
    category: 'Cozy Cottage',
    style: 'Linen',
    budget: 180000,
    likes_count: 215,
    saves_count: 98,
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    profiles: MOCK_BUILDERS['elite-uuid-3333'],
  },
  {
    id: 'build-3',
    user_id: 'pro-uuid-2222',
    title: 'Retro Mid-Century Suburban',
    description: 'A nostalgic family home inspired by 1960s suburban layout. Complete with custom retro appliances, a colorful basement game room, outdoor grill deck, and beautiful landscaping with custom cedar fences.',
    images: [
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=600'
    ],
    category: 'Suburban Family Home',
    style: 'Aesthetic',
    budget: 350000,
    likes_count: 184,
    saves_count: 67,
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    profiles: MOCK_BUILDERS['pro-uuid-2222'],
  },
  {
    id: 'build-4',
    user_id: 'elite-uuid-3333',
    title: 'Cyberpunk Neo-Tokyo Street',
    description: 'An advanced city-roleplay plot build with neon billboards, custom vending machines, a cozy noodle shop, anime arcade, and capsules apartments. Perfect for creators looking to record cinematic roleplays.',
    images: [
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&q=80&w=600'
    ],
    category: 'City / Town Roleplay',
    style: 'Industrial',
    budget: 1200000,
    likes_count: 512,
    saves_count: 320,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    profiles: MOCK_BUILDERS['elite-uuid-3333'],
  },
  {
    id: 'build-5',
    user_id: 'pro-uuid-2222',
    title: 'Blush French Provincial Villa',
    description: 'Elegant French-inspired luxury estate utilizing custom wall trims, gorgeous floral arrangements, a private vineyard, stone pathways, and marble textures. Extremely detailed interior design.',
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=600'
    ],
    category: 'Modern Mansion',
    style: 'Blush',
    budget: 980000,
    likes_count: 279,
    saves_count: 110,
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    profiles: MOCK_BUILDERS['pro-uuid-2222'],
  }
];

const INITIAL_MOCK_COMMENTS: Record<string, Comment[]> = {
  'build-1': [
    {
      id: 'c1',
      build_id: 'build-1',
      user_id: 'elite-uuid-3333',
      content: 'OMG, the custom window panels look absolutely insane! How did you align the basic shapes so perfectly?',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      profiles: MOCK_BUILDERS['elite-uuid-3333'],
    },
    {
      id: 'c2',
      build_id: 'build-1',
      user_id: 'demo-user-uuid',
      content: 'Stunning! Def saving this as inspiration for my next modern house build!',
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      profiles: {
        id: 'demo-user-uuid',
        email: 'guest@bloxburg.com',
        username: 'BloxGuest',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
        bio: 'Bloxburg fan! Exploring builds and learning new build styles.',
        role: 'user',
        subscription_tier: 'free',
        created_at: new Date().toISOString(),
      },
    }
  ],
  'build-2': [
    {
      id: 'c3',
      build_id: 'build-2',
      user_id: 'pro-uuid-2222',
      content: 'The lighting in the cabin interior is so warm and cozy. Excellent color choices with the linen woods!',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      profiles: MOCK_BUILDERS['pro-uuid-2222'],
    }
  ]
};

const DEFAULT_FILTERS: ExploreFilters = {
  search: '',
  category: 'All',
  style: 'All',
  budgetMin: 0,
  budgetMax: 2000000,
  sortBy: 'latest',
};

export const useBuildStore = create<BuildState>((set, get) => ({
  builds: [],
  comments: {},
  likedBuildIds: ['build-2'],
  savedBuildIds: ['build-1'],
  filters: DEFAULT_FILTERS,
  isLoading: true,

  initialize: async (isDemoMode: boolean, currentUserId?: string) => {
    set({ isLoading: true });
    
    if (isDemoMode) {
      // Local Storage support for custom builds added locally
      const localBuildsStr = localStorage.getItem('bloxburg_builds');
      const localCommentsStr = localStorage.getItem('bloxburg_comments');
      const localLikesStr = localStorage.getItem('bloxburg_likes');
      const localSavesStr = localStorage.getItem('bloxburg_saves');
      
      const loadedBuilds = localBuildsStr ? JSON.parse(localBuildsStr) : INITIAL_MOCK_BUILDS;
      const loadedComments = localCommentsStr ? JSON.parse(localCommentsStr) : INITIAL_MOCK_COMMENTS;
      const loadedLikes = localLikesStr ? JSON.parse(localLikesStr) : ['build-2'];
      const loadedSaves = localSavesStr ? JSON.parse(localSavesStr) : ['build-1'];

      set({
        builds: loadedBuilds,
        comments: loadedComments,
        likedBuildIds: loadedLikes,
        savedBuildIds: loadedSaves,
        isLoading: false,
      });
      return;
    }

    try {
      const supabase = createClient();
      
      // Fetch all builds joined with creator profile
      const { data: buildsData, error } = await supabase
        .from('builds')
        .select('*, profiles:user_id(*) ')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user's likes & saves if user logged in
      let likedIds: string[] = [];
      let savedIds: string[] = [];

      if (currentUserId) {
        const { data: likes } = await supabase
          .from('likes')
          .select('build_id')
          .eq('user_id', currentUserId);
        
        if (likes) likedIds = likes.map((l: any) => l.build_id);

        const { data: saves } = await supabase
          .from('saves')
          .select('build_id')
          .eq('user_id', currentUserId);

        if (saves) savedIds = saves.map((s: any) => s.build_id);
      }

      // Populate comments
      const { data: commentsData } = await supabase
        .from('comments')
        .select('*, profiles:user_id(*) ')
        .order('created_at', { ascending: true });

      const commentMap: Record<string, Comment[]> = {};
      if (commentsData) {
        commentsData.forEach((comment: any) => {
          if (!commentMap[comment.build_id]) {
            commentMap[comment.build_id] = [];
          }
          commentMap[comment.build_id].push(comment);
        });
      }

      set({
        builds: (buildsData as Build[]) || [],
        comments: commentMap,
        likedBuildIds: likedIds,
        savedBuildIds: savedIds,
      });
    } catch (err) {
      console.error('Failed to load builds from Supabase, loading mock fallback:', err);
      // Fallback
      set({
        builds: INITIAL_MOCK_BUILDS,
        comments: INITIAL_MOCK_COMMENTS,
        likedBuildIds: ['build-2'],
        savedBuildIds: ['build-1'],
      });
    } finally {
      set({ isLoading: false });
    }
  },

  setFilters: (newFilters: Partial<ExploreFilters>) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  resetFilters: () => {
    set({ filters: DEFAULT_FILTERS });
  },

  addBuild: async (build, isDemoMode) => {
    set({ isLoading: true });

    if (isDemoMode) {
      const newBuild: Build = {
        ...build,
        id: 'build-' + Math.random().toString(36).substr(2, 9),
        likes_count: 0,
        saves_count: 0,
        created_at: new Date().toISOString(),
      };
      
      const newBuilds = [newBuild, ...get().builds];
      localStorage.setItem('bloxburg_builds', JSON.stringify(newBuilds));
      set({ builds: newBuilds, isLoading: false });
      return true;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('builds')
        .insert({
          user_id: build.user_id,
          title: build.title,
          description: build.description,
          images: build.images,
          category: build.category,
          style: build.style,
          budget: build.budget,
        })
        .select('*, profiles:user_id(*)')
        .single();

      if (error) throw error;

      set(state => ({
        builds: [data as Build, ...state.builds],
        isLoading: false,
      }));
      return true;
    } catch (err) {
      console.error('Failed to upload build:', err);
      // fallback save
      const newBuild: Build = {
        ...build,
        id: 'build-' + Math.random().toString(36).substr(2, 9),
        likes_count: 0,
        saves_count: 0,
        created_at: new Date().toISOString(),
      };
      const newBuilds = [newBuild, ...get().builds];
      localStorage.setItem('bloxburg_builds', JSON.stringify(newBuilds));
      set({ builds: newBuilds, isLoading: false });
      return true;
    }
  },

  deleteBuild: async (buildId, isDemoMode) => {
    // 1. Get the build and its images before deleting the record
    const targetBuild = get().builds.find(b => b.id === buildId);
    const imageUrls = targetBuild?.images || [];

    if (isDemoMode) {
      const remainingBuilds = get().builds.filter(b => b.id !== buildId);
      localStorage.setItem('bloxburg_builds', JSON.stringify(remainingBuilds));
      set({ builds: remainingBuilds });
      return true;
    }

    try {
      const supabase = createClient();

      // 2. Extract and delete images from Supabase Storage
      const extractStoragePath = (url: string): string | null => {
        const marker = '/build-images/';
        const index = url.indexOf(marker);
        if (index !== -1) {
          const rawPath = url.substring(index + marker.length);
          return rawPath.split('?')[0];
        }
        return null;
      };

      const pathsToDelete = imageUrls
        .map(url => extractStoragePath(url))
        .filter((path): path is string => !!path);

      if (pathsToDelete.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('build-images')
          .remove(pathsToDelete);
        
        if (storageError) {
          console.error('Failed to clean up files from Supabase Storage:', storageError);
        } else {
          console.log('Successfully cleaned up storage files:', pathsToDelete);
        }
      }

      // 3. Delete the build database record
      const { error } = await supabase
        .from('builds')
        .delete()
        .eq('id', buildId);

      if (error) throw error;
      set(state => ({
        builds: state.builds.filter(b => b.id !== buildId),
      }));
      return true;
    } catch (err) {
      console.error('Failed to delete build:', err);
      // fallback delete
      const remainingBuilds = get().builds.filter(b => b.id !== buildId);
      localStorage.setItem('bloxburg_builds', JSON.stringify(remainingBuilds));
      set({ builds: remainingBuilds });
      return true;
    }
  },

  toggleLikeBuild: async (buildId, isDemoMode, profile) => {
    const likes = [...get().likedBuildIds];
    const index = likes.indexOf(buildId);
    const hasLiked = index > -1;

    if (hasLiked) {
      likes.splice(index, 1);
    } else {
      likes.push(buildId);
    }

    // Optimistically update build count
    const updatedBuilds = get().builds.map(b => {
      if (b.id === buildId) {
        return {
          ...b,
          likes_count: b.likes_count + (hasLiked ? -1 : 1),
        };
      }
      return b;
    });

    if (isDemoMode) {
      localStorage.setItem('bloxburg_likes', JSON.stringify(likes));
      localStorage.setItem('bloxburg_builds', JSON.stringify(updatedBuilds));
      set({ likedBuildIds: likes, builds: updatedBuilds });
      return;
    }

    try {
      const supabase = createClient();
      let dbError = null;

      if (hasLiked) {
        const { error: deleteError } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', profile?.id)
          .eq('build_id', buildId);
        if (deleteError) dbError = deleteError;

        const currentBuild = get().builds.find(b => b.id === buildId);
        if (currentBuild) {
          const { error: updateError } = await supabase
            .from('builds')
            .update({ likes_count: Math.max(0, currentBuild.likes_count - 1) })
            .eq('id', buildId);
          if (updateError) dbError = updateError;
        }
      } else {
        const { error: insertError } = await supabase
          .from('likes')
          .insert({ user_id: profile?.id, build_id: buildId });
        if (insertError) dbError = insertError;

        const currentBuild = get().builds.find(b => b.id === buildId);
        if (currentBuild) {
          const { error: updateError } = await supabase
            .from('builds')
            .update({ likes_count: currentBuild.likes_count + 1 })
            .eq('id', buildId);
          if (updateError) dbError = updateError;
        }
      }

      if (dbError) throw dbError;
      set({ likedBuildIds: likes, builds: updatedBuilds });
    } catch (err) {
      console.error('Like toggle failed, updating locally:', err);
      localStorage.setItem('bloxburg_likes', JSON.stringify(likes));
      localStorage.setItem('bloxburg_builds', JSON.stringify(updatedBuilds));
      set({ likedBuildIds: likes, builds: updatedBuilds });
    }
  },

  toggleSaveBuild: async (buildId, isDemoMode, profile) => {
    const saves = [...get().savedBuildIds];
    const index = saves.indexOf(buildId);
    const hasSaved = index > -1;

    if (hasSaved) {
      saves.splice(index, 1);
    } else {
      saves.push(buildId);
    }

    // Optimistically update build count
    const updatedBuilds = get().builds.map(b => {
      if (b.id === buildId) {
        return {
          ...b,
          saves_count: b.saves_count + (hasSaved ? -1 : 1),
        };
      }
      return b;
    });

    if (isDemoMode) {
      localStorage.setItem('bloxburg_saves', JSON.stringify(saves));
      localStorage.setItem('bloxburg_builds', JSON.stringify(updatedBuilds));
      set({ savedBuildIds: saves, builds: updatedBuilds });
      return;
    }

    try {
      const supabase = createClient();
      let dbError = null;

      if (hasSaved) {
        const { error: deleteError } = await supabase
          .from('saves')
          .delete()
          .eq('user_id', profile?.id)
          .eq('build_id', buildId);
        if (deleteError) dbError = deleteError;

        const currentBuild = get().builds.find(b => b.id === buildId);
        if (currentBuild) {
          const { error: updateError } = await supabase
            .from('builds')
            .update({ saves_count: Math.max(0, currentBuild.saves_count - 1) })
            .eq('id', buildId);
          if (updateError) dbError = updateError;
        }
      } else {
        const { error: insertError } = await supabase
          .from('saves')
          .insert({ user_id: profile?.id, build_id: buildId });
        if (insertError) dbError = insertError;

        const currentBuild = get().builds.find(b => b.id === buildId);
        if (currentBuild) {
          const { error: updateError } = await supabase
            .from('builds')
            .update({ saves_count: currentBuild.saves_count + 1 })
            .eq('id', buildId);
          if (updateError) dbError = updateError;
        }
      }

      if (dbError) throw dbError;
      set({ savedBuildIds: saves, builds: updatedBuilds });
    } catch (err) {
      console.error('Save toggle failed, updating locally:', err);
      localStorage.setItem('bloxburg_saves', JSON.stringify(saves));
      localStorage.setItem('bloxburg_builds', JSON.stringify(updatedBuilds));
      set({ savedBuildIds: saves, builds: updatedBuilds });
    }
  },

  addComment: async (buildId, content, isDemoMode, profile) => {
    const newComment: Comment = {
      id: 'comment-' + Math.random().toString(36).substr(2, 9),
      build_id: buildId,
      user_id: profile.id,
      content,
      created_at: new Date().toISOString(),
      profiles: profile,
    };

    const currentComments = { ...get().comments };
    if (!currentComments[buildId]) {
      currentComments[buildId] = [];
    }
    currentComments[buildId] = [...currentComments[buildId], newComment];

    if (isDemoMode) {
      localStorage.setItem('bloxburg_comments', JSON.stringify(currentComments));
      set({ comments: currentComments });
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('comments')
        .insert({
          build_id: buildId,
          user_id: profile.id,
          content,
        });

      if (error) throw error;
      set({ comments: currentComments });
    } catch (err) {
      console.error('Failed to submit comment, storing locally:', err);
      localStorage.setItem('bloxburg_comments', JSON.stringify(currentComments));
      set({ comments: currentComments });
    }
  },
}));
