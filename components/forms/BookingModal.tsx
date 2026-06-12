'use client';

import { useState, useEffect } from 'react';
import { useUIStore } from '@/store/useUIStore';
import { useBuildStore } from '@/store/useBuildStore';
import BookingForm from './BookingForm';
import { X, CalendarCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function BookingModal() {
  const { isBookingModalOpen, selectedBuilderIdForBooking, selectedBuildIdForBooking, setBookingModalOpen } = useUIStore();
  const { builds } = useBuildStore();
  const [resolvedUsername, setResolvedUsername] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedBuilderIdForBooking) {
      setResolvedUsername(null);
      return;
    }

    // Try finding in builds first
    const builderBuild = builds.find((b) => b.profiles?.id === selectedBuilderIdForBooking);
    if (builderBuild?.profiles?.username) {
      setResolvedUsername(builderBuild.profiles.username);
      return;
    }

    // Otherwise fetch from database
    const fetchUsername = async () => {
      try {
        const isConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (isConfigured) {
          const supabase = createClient();
          const { data, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', selectedBuilderIdForBooking)
            .single();
          if (data && !error) {
            setResolvedUsername(data.username);
            return;
          }
        }
      } catch (e) {
        console.error('Error fetching username for booking modal:', e);
      }
      
      // Secondary fallback (mock profiles matching known builders)
      if (selectedBuilderIdForBooking === 'pro-uuid-2222') {
        setResolvedUsername('AestheticArchitect');
      } else if (selectedBuilderIdForBooking === 'elite-uuid-3333') {
        setResolvedUsername('CozyCottageCreator');
      } else {
        setResolvedUsername('Builder');
      }
    };

    fetchUsername();
  }, [selectedBuilderIdForBooking, builds]);

  if (!isBookingModalOpen || !selectedBuilderIdForBooking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0E14]/80 backdrop-blur-md overflow-y-auto">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={() => setBookingModalOpen(false)} />

      <div className="relative w-full max-w-xl p-6 sm:p-8 rounded-3xl glass-panel border border-white/5 shadow-2xl bg-[#0B0E14]/95 animate-in zoom-in-95 duration-300 my-8 z-10">
        <button
          onClick={() => setBookingModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-2 text-blox-cyan border-b border-white/5 pb-4 mb-6">
          <CalendarCheck size={20} className="animate-pulse" />
          <h2 className="text-sm font-black text-white uppercase tracking-wider">
            Hire {resolvedUsername ? `@${resolvedUsername}` : 'Builder'}
          </h2>
        </div>

        <BookingForm builderId={selectedBuilderIdForBooking} defaultBuildId={selectedBuildIdForBooking} />
      </div>
    </div>
  );
}
