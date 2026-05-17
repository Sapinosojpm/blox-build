'use client';

import { Booking, BookingStatus } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { useBookingStore } from '@/store/useBookingStore';
import { useUIStore } from '@/store/useUIStore';
import { Button } from '../ui/Button';
import { Calendar, DollarSign, MessageSquare, Check, X, CheckSquare, RefreshCw } from 'lucide-react';

interface BookingCardProps {
  booking: Booking;
}

export default function BookingCard({ booking }: BookingCardProps) {
  const { user, isDemoMode } = useAuthStore();
  const { updateBookingStatus } = useBookingStore();
  const { addToast } = useUIStore();

  const isBuilder = user?.id === booking.builder_id;
  const isClient = user?.id === booking.client_id;

  const handleStatusChange = async (newStatus: BookingStatus) => {
    const success = await updateBookingStatus(booking.id, newStatus, isDemoMode);
    if (success) {
      addToast(`Booking status updated to ${newStatus}!`, 'success');
    }
  };

  const getStatusStyles = (status: BookingStatus) => {
    switch (status) {
      case 'accepted':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-300';
      case 'completed':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
      case 'declined':
        return 'bg-rose-500/10 border-rose-500/30 text-rose-300';
      default:
        return 'bg-amber-500/10 border-amber-500/30 text-amber-300 animate-pulse';
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return (price / 1000).toFixed(0) + 'k';
    }
    return price.toString();
  };

  return (
    <div className={`p-5 rounded-2xl glass-panel border border-white/5 flex flex-col gap-4 shadow-xl hover:border-white/10 transition-colors`}>
      {/* Top Meta */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar of the counterpart */}
          <img
            src={
              (isBuilder ? booking.client?.avatar_url : booking.builder?.avatar_url) ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'
            }
            alt={isBuilder ? booking.client?.username : booking.builder?.username}
            className="w-10 h-10 rounded-full border border-white/10 object-cover"
          />
          <div>
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">
              {isBuilder ? 'Client Request' : 'Hire Request To'}
            </div>
            <div className="text-sm font-bold text-white">
              @{isBuilder ? booking.client?.username : booking.builder?.username}
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg border ${getStatusStyles(booking.status)}`}>
          {booking.status}
        </span>
      </div>

      {/* Booking Message */}
      <div className="bg-blox-dark/40 border border-white/5 p-4 rounded-xl flex items-start gap-2.5">
        <MessageSquare size={16} className="text-gray-500 mt-1 shrink-0" />
        <p className="text-xs text-gray-300 leading-relaxed font-medium italic">
          "{booking.message}"
        </p>
      </div>

      {/* Cost & Timestamp */}
      <div className="flex items-center justify-between text-xs font-semibold text-gray-400">
        <div className="flex items-center gap-1">
          <Calendar size={13} />
          <span>{new Date(booking.created_at).toLocaleDateString()}</span>
        </div>

        <div className="flex items-center gap-0.5 text-emerald-400 font-bold">
          <DollarSign size={13} className="mt-0.5" />
          <span>{formatPrice(booking.price)} Cash</span>
        </div>
      </div>

      {/* Action panel (Pro builder actions) */}
      {isBuilder && booking.status === 'pending' && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
          <Button
            variant="glass"
            size="sm"
            onClick={() => handleStatusChange('declined')}
            className="flex-1 text-xs gap-1 py-2 hover:bg-rose-500/10 hover:border-rose-500/30 text-rose-400"
          >
            <X size={13} />
            Decline
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleStatusChange('accepted')}
            className="flex-1 text-xs gap-1 py-2"
          >
            <Check size={13} />
            Accept Commission
          </Button>
        </div>
      )}

      {isBuilder && booking.status === 'accepted' && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
          <Button
            variant="primary"
            size="sm"
            glow={true}
            onClick={() => handleStatusChange('completed')}
            className="w-full text-xs gap-1.5 py-2"
          >
            <CheckSquare size={13} />
            Mark As Completed
          </Button>
        </div>
      )}

      {/* Completion congratulations for client */}
      {isClient && booking.status === 'completed' && (
        <div className="text-center text-[10px] font-bold text-emerald-400 bg-emerald-950/20 border border-emerald-500/15 py-2 px-3 rounded-xl mt-2 animate-pulse">
          ✨ Builder completed your request! Review details in game! ✨
        </div>
      )}
    </div>
  );
}
