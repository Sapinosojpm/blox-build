'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useBookingStore } from '@/store/useBookingStore';
import BookingCard from '../cards/BookingCard';
import { CalendarRange, Sparkles } from 'lucide-react';

export default function BookingQueue() {
  const { user } = useAuthStore();
  const { bookings, isLoading } = useBookingStore();

  const isPro = user?.subscription_tier === 'pro';

  // Bookings where user is client
  const clientBookings = bookings.filter((b) => b.client_id === user?.id);

  // Bookings where user is builder (Pro only)
  const builderBookings = bookings.filter((b) => b.builder_id === user?.id);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="w-8 h-8 border-2 border-blox-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Builder Queue Section (Pro users only) */}
      {isPro && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-amber-400" size={18} />
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              Your Builder Commission Queue
            </h3>
          </div>
          {builderBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {builderBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white/5 border border-white/5 rounded-2xl text-xs text-gray-500 font-semibold">
              👋 No commission offers in your queue yet. Update your profile bio to let clients know your styles!
            </div>
          )}
        </div>
      )}

      {/* Client Bookings Section (Anyone who hired a builder) */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <CalendarRange className="text-blox-cyan" size={18} />
          <h3 className="text-base font-bold text-white uppercase tracking-wider">
            Your Hired Commissions Requests
          </h3>
        </div>
        {clientBookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clientBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white/5 border border-white/5 rounded-2xl text-xs text-gray-500 font-semibold">
            ✨ You haven't hired any Pro Builders yet! Browse builders on the Explore or Builder Profile pages to start.
          </div>
        )}
      </div>
    </div>
  );
}
