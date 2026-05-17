'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useBookingStore } from '@/store/useBookingStore';
import { useUIStore } from '@/store/useUIStore';
import { useBuildStore } from '@/store/useBuildStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Calendar, AlertCircle } from 'lucide-react';

interface BookingFormProps {
  builderId: string;
}

export default function BookingForm({ builderId }: BookingFormProps) {
  const { user, isDemoMode } = useAuthStore();
  const { createBooking } = useBookingStore();
  const { builds } = useBuildStore();
  const { setBookingModalOpen, addToast } = useUIStore();

  const [price, setPrice] = useState('200000');
  const [message, setMessage] = useState('');
  const [buildRef, setBuildRef] = useState('none');
  const [submitting, setSubmitting] = useState(false);

  // Filter builds belonging to this builder for reference
  const builderBuilds = builds.filter((b) => b.user_id === builderId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      addToast('Please login to book commissions', 'error');
      return;
    }

    if (!price || !message) {
      addToast('Please specify a price offer and message detailing your plot.', 'error');
      return;
    }

    setSubmitting(true);

    const payload = {
      client_id: user.id,
      builder_id: builderId,
      build_id: buildRef === 'none' ? null : buildRef,
      price: parseInt(price, 10),
      message,
    };

    const success = await createBooking(payload, isDemoMode);

    if (success) {
      addToast('Commission booking request submitted successfully!', 'success');
      setBookingModalOpen(false);
    } else {
      addToast('Failed to submit commission request.', 'error');
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Disclaimer */}
      <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl flex items-start gap-2.5 text-xs">
        <AlertCircle size={16} className="shrink-0 mt-0.5" />
        <p className="leading-relaxed font-semibold">
          Notice: Make sure you have the required Bloxburg funds available in-game and the necessary gamepasses (e.g. Advanced Placing, Multiple Floors) before requesting.
        </p>
      </div>

      {/* Price Offer */}
      <Input
        label="Pricing Offer (Bloxburg Cash)"
        type="number"
        placeholder="e.g. 200000"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        required
      />

      {/* Build Reference */}
      {builderBuilds.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Style Reference (Optional)
          </label>
          <select
            className="w-full px-4 py-3 bg-[#111622] rounded-xl border border-white/5 text-sm text-white focus:outline-none focus:border-blox-cyan transition-colors"
            value={buildRef}
            onChange={(e) => setBuildRef(e.target.value)}
          >
            <option value="none">No Specific Style Reference</option>
            {builderBuilds.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Message Requirements */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Build Requirements
        </label>
        <textarea
          className="w-full px-4 py-3 bg-[#111622] rounded-xl border border-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blox-cyan focus:ring-1 focus:ring-blox-cyan/30 transition-all duration-300 min-h-[110px]"
          placeholder="Specify plot size (e.g. 30x30), gamepasses you own, preferred colors/styles, number of bedrooms, and time availability."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 mt-4 border-t border-white/5 pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setBookingModalOpen(false)}
        >
          Cancel
        </Button>
        <Button type="submit" variant="secondary" glow={true} disabled={submitting}>
          {submitting ? 'Submitting request...' : 'Send Commission Offer'}
        </Button>
      </div>
    </form>
  );
}
