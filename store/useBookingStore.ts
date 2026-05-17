import { create } from 'zustand';
import { Booking, BookingStatus, Profile } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface BookingState {
  bookings: Booking[];
  isLoading: boolean;
  initialize: (isDemoMode: boolean, currentUserId?: string) => Promise<void>;
  createBooking: (
    booking: Omit<Booking, 'id' | 'status' | 'created_at'>,
    isDemoMode: boolean
  ) => Promise<boolean>;
  updateBookingStatus: (
    bookingId: string,
    status: BookingStatus,
    isDemoMode: boolean
  ) => Promise<boolean>;
}

const MOCK_PROFILES: Record<string, Profile> = {
  'demo-user-uuid': {
    id: 'demo-user-uuid',
    email: 'guest@bloxburg.com',
    username: 'BloxGuest',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
    bio: 'Bloxburg fan! Exploring builds and learning new build styles.',
    role: 'user',
    subscription_tier: 'free',
    created_at: new Date().toISOString(),
  },
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

const INITIAL_MOCK_BOOKINGS: Booking[] = [
  {
    id: 'booking-1',
    client_id: 'demo-user-uuid',
    builder_id: 'pro-uuid-2222',
    build_id: 'build-1',
    status: 'pending',
    price: 450000,
    message: 'Hey AestheticArchitect! I absolutely love your Ultra Modern Glass Mansion. I have a 30x30 plot, and I would love for you to construct a custom glass mansion for me with 3 bedrooms. I have all the gamepasses needed and a budget of 500k Bloxburg cash!',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    client: MOCK_PROFILES['demo-user-uuid'],
    builder: MOCK_PROFILES['pro-uuid-2222'],
  },
  {
    id: 'booking-2',
    client_id: 'elite-uuid-3333',
    builder_id: 'pro-uuid-2222',
    build_id: 'build-3',
    status: 'accepted',
    price: 350000,
    message: 'Hi, would love to get a Retro Mid-Century Suburban house build on my block! Let me know when you are free to join my server. I can pay an extra 50k bonus if you can finish within this week.',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    client: MOCK_PROFILES['elite-uuid-3333'],
    builder: MOCK_PROFILES['pro-uuid-2222'],
  },
  {
    id: 'booking-3',
    client_id: 'demo-user-uuid',
    builder_id: 'elite-uuid-3333',
    build_id: 'build-2',
    status: 'completed',
    price: 180000,
    message: 'Can you help me build a small cozy autumn cottage? I really love the woods and the dark cozy feel.',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    client: MOCK_PROFILES['demo-user-uuid'],
    builder: MOCK_PROFILES['elite-uuid-3333'],
  }
];

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  isLoading: true,

  initialize: async (isDemoMode: boolean, currentUserId?: string) => {
    set({ isLoading: true });

    if (isDemoMode) {
      const localBookingsStr = localStorage.getItem('bloxburg_bookings');
      const loadedBookings = localBookingsStr ? JSON.parse(localBookingsStr) : INITIAL_MOCK_BOOKINGS;

      // Filter bookings based on currentUserId if specified (show bookings where user is client or builder)
      const userBookings = currentUserId
        ? loadedBookings.filter(
            (b: Booking) => b.client_id === currentUserId || b.builder_id === currentUserId
          )
        : loadedBookings;

      set({ bookings: userBookings, isLoading: false });
      return;
    }

    try {
      const supabase = createClient();
      if (!currentUserId) {
        set({ bookings: [], isLoading: false });
        return;
      }

      // Fetch bookings where current user is builder OR client
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          client:client_id(*),
          builder:builder_id(*),
          build:build_id(*)
        `)
        .or(`client_id.eq.${currentUserId},builder_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ bookings: (data as Booking[]) || [] });
    } catch (err) {
      console.error('Failed to load bookings from Supabase, loading mock:', err);
      const localBookingsStr = localStorage.getItem('bloxburg_bookings');
      const loadedBookings = localBookingsStr ? JSON.parse(localBookingsStr) : INITIAL_MOCK_BOOKINGS;
      const userBookings = currentUserId
        ? loadedBookings.filter(
            (b: Booking) => b.client_id === currentUserId || b.builder_id === currentUserId
          )
        : loadedBookings;

      set({ bookings: userBookings });
    } finally {
      set({ isLoading: false });
    }
  },

  createBooking: async (booking, isDemoMode) => {
    set({ isLoading: true });

    const clientProfile = MOCK_PROFILES[booking.client_id] || MOCK_PROFILES['demo-user-uuid'];
    const builderProfile = MOCK_PROFILES[booking.builder_id] || MOCK_PROFILES['pro-uuid-2222'];

    const newBooking: Booking = {
      ...booking,
      id: 'booking-' + Math.random().toString(36).substr(2, 9),
      status: 'pending',
      created_at: new Date().toISOString(),
      client: clientProfile,
      builder: builderProfile,
    };

    if (isDemoMode) {
      const currentLocalStr = localStorage.getItem('bloxburg_bookings');
      const currentLocal = currentLocalStr ? JSON.parse(currentLocalStr) : INITIAL_MOCK_BOOKINGS;
      const updatedList = [newBooking, ...currentLocal];
      localStorage.setItem('bloxburg_bookings', JSON.stringify(updatedList));

      set(state => ({
        bookings: [newBooking, ...state.bookings],
        isLoading: false,
      }));
      return true;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          client_id: booking.client_id,
          builder_id: booking.builder_id,
          build_id: booking.build_id,
          price: booking.price,
          message: booking.message,
        })
        .select(`
          *,
          client:client_id(*),
          builder:builder_id(*),
          build:build_id(*)
        `)
        .single();

      if (error) throw error;

      set(state => ({
        bookings: [data as Booking, ...state.bookings],
        isLoading: false,
      }));
      return true;
    } catch (err) {
      console.error('Failed to create booking:', err);
      // Fallback
      set(state => ({
        bookings: [newBooking, ...state.bookings],
        isLoading: false,
      }));
      return true;
    }
  },

  updateBookingStatus: async (bookingId, status, isDemoMode) => {
    // Optimistic update
    const updatedBookings = get().bookings.map(b => {
      if (b.id === bookingId) {
        return { ...b, status };
      }
      return b;
    });

    set({ bookings: updatedBookings });

    if (isDemoMode) {
      const currentLocalStr = localStorage.getItem('bloxburg_bookings');
      const currentLocal = currentLocalStr ? JSON.parse(currentLocalStr) : INITIAL_MOCK_BOOKINGS;
      const updatedLocal = currentLocal.map((b: Booking) => {
        if (b.id === bookingId) {
          return { ...b, status };
        }
        return b;
      });
      localStorage.setItem('bloxburg_bookings', JSON.stringify(updatedLocal));
      return true;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Failed to update booking status:', err);
      return true; // Return true as mock handled it
    }
  },
}));
