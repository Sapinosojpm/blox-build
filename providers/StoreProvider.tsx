'use client'; // Let's make sure it is a client component

import { useEffect, ReactNode, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useBuildStore } from '@/store/useBuildStore';
import { useBookingStore } from '@/store/useBookingStore';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BookingModal from '@/components/forms/BookingModal';

export default function StoreProvider({ children }: { children: ReactNode }) {
  const { initialize: initAuth, user, isDemoMode } = useAuthStore();
  const { initialize: initBuilds } = useBuildStore();
  const { initialize: initBookings } = useBookingStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      await initAuth();
      setHydrated(true);
    };
    bootstrap();
  }, [initAuth]);

  useEffect(() => {
    if (hydrated) {
      initBuilds(isDemoMode, user?.id);
      initBookings(isDemoMode, user?.id);
    }
  }, [hydrated, isDemoMode, user?.id, initBuilds, initBookings]);

  if (!hydrated) {
    return (
      <div className="fixed inset-0 bg-[#0B0E14] flex flex-col items-center justify-center z-50">
        <div className="w-16 h-16 border-4 border-blox-red border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 font-medium tracking-wide animate-pulse">
          Loading Bloxburg Build Hub...
        </p>
      </div>
    );
  }

  return (
    <>
      {children}
      <BookingModal />
      <ToastContainer
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastClassName="!bg-[#111622] !border !border-white/5 !rounded-2xl !shadow-2xl !text-sm !font-semibold !font-sans"
      />
    </>
  );
}
