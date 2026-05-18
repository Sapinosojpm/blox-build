-- SQL Schema for Roblox Bloxburg Community Platform (Bloxburg Build Hub)
-- This file defines tables, relations, indexes, and Row Level Security (RLS) policies.

-- 1. Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create User Profiles (extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'elite', 'pro')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create Builds Table
CREATE TABLE IF NOT EXISTS public.builds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    images TEXT[] NOT NULL DEFAULT '{}',
    category TEXT NOT NULL, -- e.g., 'Modern Mansion', 'Suburban House', 'Cottage', 'City/Town'
    style TEXT NOT NULL, -- e.g., 'Aesthetic', 'Linen', 'Minimalist', 'Industrial', 'Blush'
    budget INTEGER NOT NULL DEFAULT 0, -- Bloxburg cash budget
    likes_count INTEGER DEFAULT 0 NOT NULL,
    saves_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for builds
ALTER TABLE public.builds ENABLE ROW LEVEL SECURITY;

-- 4. Create Likes Table
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    build_id UUID REFERENCES public.builds(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, build_id)
);

-- Enable RLS for likes
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- 5. Create Saves Table
CREATE TABLE IF NOT EXISTS public.saves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    build_id UUID REFERENCES public.builds(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, build_id)
);

-- Enable RLS for saves
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;

-- 6. Create Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    build_id UUID REFERENCES public.builds(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 7. Create Bookings (Commissions) Table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    builder_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    build_id UUID REFERENCES public.builds(id) ON DELETE SET NULL, -- Optional build style reference
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'declined')),
    price INTEGER NOT NULL, -- Commission cost in Bloxburg cash or other terms
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 8. Create Follows Table
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(follower_id, following_id)
);

-- Enable RLS for follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;


-- ==================== ROW LEVEL SECURITY POLICIES ====================

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Builds Policies
CREATE POLICY "Builds are viewable by everyone" ON public.builds
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create builds" ON public.builds
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own builds" ON public.builds
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own builds" ON public.builds
    FOR DELETE USING (auth.uid() = user_id);

-- Likes Policies
CREATE POLICY "Likes are viewable by everyone" ON public.likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like builds" ON public.likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike builds" ON public.likes
    FOR DELETE USING (auth.uid() = user_id);

-- Saves Policies
CREATE POLICY "Saves are viewable by the user who saved" ON public.saves
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can save builds" ON public.saves
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave builds" ON public.saves
    FOR DELETE USING (auth.uid() = user_id);

-- Comments Policies
CREATE POLICY "Comments are viewable by everyone" ON public.comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
    FOR DELETE USING (auth.uid() = user_id);

-- Bookings Policies
CREATE POLICY "Users can view bookings where they are the client or builder" ON public.bookings
    FOR SELECT USING (auth.uid() = client_id OR auth.uid() = builder_id);

CREATE POLICY "Authenticated users can create a booking" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients and Builders can update booking status" ON public.bookings
    FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = builder_id);

-- Follows Policies
CREATE POLICY "Follows are viewable by everyone" ON public.follows
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can follow" ON public.follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" ON public.follows
    FOR DELETE USING (auth.uid() = follower_id);


-- ==================== DATABASE TRIGGERS FOR USER PROFILE CREATION ====================

-- This automatically inserts a new profile row when a user signs up via auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, username, avatar_url, bio, role, subscription_tier)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'username', SPLIT_PART(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url',
        'Hey there! I am a Bloxburg Builder.',
        'user',
        'free'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==================== NEW FORUM TABLES FOR COMMUNITY BOARD ====================

-- 9. Create Threads Table
CREATE TABLE IF NOT EXISTS public.threads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0 NOT NULL,
    comments_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for threads
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;

-- 10. Create Thread Likes Table
CREATE TABLE IF NOT EXISTS public.thread_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    thread_id UUID REFERENCES public.threads(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, thread_id)
);

-- Enable RLS for thread_likes
ALTER TABLE public.thread_likes ENABLE ROW LEVEL SECURITY;

-- 11. Create Thread Comments Table
CREATE TABLE IF NOT EXISTS public.thread_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id UUID REFERENCES public.threads(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for thread_comments
ALTER TABLE public.thread_comments ENABLE ROW LEVEL SECURITY;


-- ==================== ROW LEVEL SECURITY POLICIES FOR FORUMS ====================

-- Threads Policies
CREATE POLICY "Threads are viewable by everyone" ON public.threads
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create threads" ON public.threads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own threads" ON public.threads
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own threads" ON public.threads
    FOR DELETE USING (auth.uid() = user_id);

-- Thread Likes Policies
CREATE POLICY "Thread likes are viewable by everyone" ON public.thread_likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like threads" ON public.thread_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike threads" ON public.thread_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Thread Comments Policies
CREATE POLICY "Thread comments are viewable by everyone" ON public.thread_comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post thread comments" ON public.thread_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own thread comments" ON public.thread_comments
    FOR DELETE USING (auth.uid() = user_id);
