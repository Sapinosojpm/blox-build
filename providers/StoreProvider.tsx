'use client'; // Let's make sure it is a client component

import { useEffect, ReactNode, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useBuildStore } from '@/store/useBuildStore';
import { useBookingStore } from '@/store/useBookingStore';
import { useUIStore } from '@/store/useUIStore';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function StoreProvider({ children }: { children: ReactNode }) {
  const { initialize: initAuth, user, isDemoMode } = useAuthStore();
  const { initialize: initBuilds } = useBuildStore();
  const { initialize: initBookings } = useBookingStore();
  const { toasts, removeToast } = useUIStore();
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

      {/* Floating Notifications (Toast System) */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-xl glass-panel border flex items-start gap-3 shadow-2xl animate-in slide-in-from-bottom duration-300 ${
              toast.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                : toast.type === 'error'
                ? 'border-blox-red/30 bg-red-950/20 text-red-300'
                : 'border-blox-cyan/30 bg-cyan-950/20 text-cyan-300'
            }`}
          >
            <div className="mt-0.5">
              {toast.type === 'success' && <CheckCircle size={18} />}
              {toast.type === 'error' && <AlertCircle size={18} />}
              {toast.type === 'info' && <Info size={18} />}
            </div>
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
