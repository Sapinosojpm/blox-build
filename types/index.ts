export type UserRole = 'user' | 'admin';
export type SubscriptionTier = 'free' | 'elite' | 'pro';
export type BookingStatus = 'pending' | 'accepted' | 'completed' | 'declined';

export interface Profile {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  subscription_tier: SubscriptionTier;
  created_at: string;
}

export interface Build {
  id: string;
  user_id: string;
  title: string;
  description: string;
  images: string[];
  category: string;
  style: string;
  budget: number;
  likes_count: number;
  saves_count: number;
  created_at: string;
  // Expanded fields
  profiles?: Profile;
  liked_by_me?: boolean;
  saved_by_me?: boolean;
}

export interface Like {
  id: string;
  user_id: string;
  build_id: string;
  created_at: string;
}

export interface Save {
  id: string;
  user_id: string;
  build_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  build_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
}

export interface Booking {
  id: string;
  client_id: string;
  builder_id: string;
  build_id: string | null;
  status: BookingStatus;
  price: number;
  message: string;
  created_at: string;
  client?: Profile;
  builder?: Profile;
  build?: Build;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface ExploreFilters {
  search: string;
  category: string;
  style: string;
  budgetMin: number;
  budgetMax: number;
  sortBy: 'latest' | 'popular' | 'budget';
}

export interface Thread {
  id: string;
  user_id: string;
  title: string;
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles?: Profile;
  liked_by_me?: boolean;
}

export interface ThreadComment {
  id: string;
  thread_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
}
