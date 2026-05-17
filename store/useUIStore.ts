import { create } from 'zustand';
import { toast } from 'react-toastify';

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
    if (type === 'success') {
      toast.success(message);
    } else if (type === 'error') {
      toast.error(message);
    } else {
      toast.info(message);
    }
  },

  removeToast: () => {},
}));
