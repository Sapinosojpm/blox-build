import { create } from 'zustand';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface UIState {
  isUploadModalOpen: boolean;
  isBookingModalOpen: boolean;
  selectedBuilderIdForBooking: string | null;
  toasts: ToastMessage[];
  setUploadModalOpen: (isOpen: boolean) => void;
  setBookingModalOpen: (isOpen: boolean, builderId?: string | null) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isUploadModalOpen: false,
  isBookingModalOpen: false,
  selectedBuilderIdForBooking: null,
  toasts: [],

  setUploadModalOpen: (isOpen) => set({ isUploadModalOpen: isOpen }),

  setBookingModalOpen: (isOpen, builderId = null) =>
    set({
      isBookingModalOpen: isOpen,
      selectedBuilderIdForBooking: builderId,
    }),

  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));

    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
