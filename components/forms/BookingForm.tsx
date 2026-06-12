'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useBookingStore } from '@/store/useBookingStore';
import { useUIStore } from '@/store/useUIStore';
import { useBuildStore } from '@/store/useBuildStore';
import { Button } from '../ui/Button';
import { AlertCircle, Check, Wallet } from 'lucide-react';

interface BookingFormProps {
  builderId: string;
  defaultBuildId?: string | null;
}

// All Bloxburg gamepasses / build features the client may own
const GAMEPASS_OPTIONS = [
  { id: 'advanced_placing', label: 'Advanced Placing', emoji: '🔩' },
  { id: 'transform',        label: 'Transform',        emoji: '↔️' },
  { id: 'multiple_floors',  label: 'Multiple Floors',  emoji: '🏢' },
  { id: 'basement',         label: 'Basement',         emoji: '🪨' },
  { id: 'large_plot',       label: 'Large Plot',       emoji: '📐' },
  { id: 'excellent_employee', label: 'Excellent Employee', emoji: '💼' },
  { id: 'premium',          label: 'Premium (Roblox)', emoji: '⭐' },
  { id: 'gamepass_tv',      label: 'Gamepass TV',      emoji: '📺' },
];

export default function BookingForm({ builderId, defaultBuildId }: BookingFormProps) {
  const { user, isDemoMode } = useAuthStore();
  const { createBooking } = useBookingStore();
  const { builds } = useBuildStore();
  const { setBookingModalOpen, addToast } = useUIStore();

  const [bloxburgBalance, setBloxburgBalance] = useState('');
  const [message, setMessage] = useState('');
  const [buildRef, setBuildRef] = useState(defaultBuildId ?? 'none');
  const [submitting, setSubmitting] = useState(false);
  const [selectedPasses, setSelectedPasses] = useState<string[]>([]);

  const balanceNum = parseInt(bloxburgBalance, 10);
  const hasBalance = bloxburgBalance !== '' && !isNaN(balanceNum);

  // Filter builds belonging to this builder for reference
  const builderBuilds = builds.filter((b) => b.user_id === builderId);

  const togglePass = (id: string) => {
    setSelectedPasses((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      addToast('Please login to book commissions', 'error');
      return;
    }

    if (!message) {
      addToast('Please describe your build requirements.', 'error');
      return;
    }

    setSubmitting(true);

    // Prepend balance + gamepasses to message so the builder sees them
    const balanceLine = hasBalance ? `[My Bloxburg Balance: ₿${balanceNum.toLocaleString()}]\n` : '';
    const passLines =
      selectedPasses.length > 0
        ? `[Gamepasses Owned: ${selectedPasses
            .map((id) => GAMEPASS_OPTIONS.find((g) => g.id === id)?.label ?? id)
            .join(', ')}]\n\n`
        : '';

    const payload = {
      client_id: user.id,
      builder_id: builderId,
      build_id: buildRef === 'none' ? null : buildRef,
      price: 0,
      message: balanceLine + passLines + message,
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

      {/* ── Gamepasses Checklist ── */}
      <div className="flex flex-col gap-2.5">
        <label className="text-xs font-black text-gray-400 uppercase tracking-wider">
          Gamepasses You Own
        </label>
        <div className="grid grid-cols-2 gap-2">
          {GAMEPASS_OPTIONS.map((gp) => {
            const checked = selectedPasses.includes(gp.id);
            return (
              <button
                key={gp.id}
                type="button"
                onClick={() => togglePass(gp.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer group ${
                  checked
                    ? 'bg-blox-cyan/10 border-blox-cyan/40 text-white'
                    : 'bg-white/[0.03] border-white/5 text-gray-400 hover:border-white/20 hover:text-gray-200'
                }`}
              >
                {/* Custom checkbox */}
                <span
                  className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all duration-200 ${
                    checked
                      ? 'bg-blox-cyan border-blox-cyan'
                      : 'border-white/20 bg-white/5 group-hover:border-white/30'
                  }`}
                >
                  {checked && <Check size={10} strokeWidth={3.5} className="text-[#0B0E14]" />}
                </span>
                <span className="text-[11px] font-bold leading-tight">
                  {gp.emoji} {gp.label}
                </span>
              </button>
            );
          })}
        </div>
        {selectedPasses.length > 0 && (
          <p className="text-[10px] text-blox-cyan font-semibold">
            ✓ {selectedPasses.length} gamepass{selectedPasses.length > 1 ? 'es' : ''} selected — will be included in your request
          </p>
        )}
      </div>


      {/* ── Bloxburg Cash Balance ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Wallet size={11} />
          Your Bloxburg Cash Balance
        </label>
        <input
          type="number"
          placeholder="e.g. 500000"
          value={bloxburgBalance}
          onChange={(e) => setBloxburgBalance(e.target.value)}
          className="w-full px-4 py-3 bg-[#111622] rounded-xl border border-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blox-cyan transition-all duration-200"
        />
        {hasBalance && (
          <p className="text-[10px] text-blox-cyan font-bold flex items-center gap-1">
            <Check size={10} strokeWidth={3} />
            ₿{balanceNum.toLocaleString()} — included in your commission request
          </p>
        )}
      </div>

      {/* Build Reference */}
      {builderBuilds.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Style Reference
          </label>

          {/* Pre-selected build highlight pill */}
          {buildRef !== 'none' && (() => {
            const refBuild = builderBuilds.find((b) => b.id === buildRef);
            return refBuild ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blox-cyan/10 border border-blox-cyan/30">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blox-cyan opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blox-cyan" />
                </span>
                <span className="text-[11px] font-black text-blox-cyan uppercase tracking-wide">
                  Referencing:
                </span>
                <span className="text-[11px] font-bold text-white truncate">{refBuild.title}</span>
              </div>
            ) : null;
          })()}

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
          className="w-full px-4 py-3 bg-[#111622] rounded-xl border border-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blox-cyan focus:ring-1 focus:ring-blox-cyan/30 transition-all duration-300 min-h-[100px]"
          placeholder="Specify plot size (e.g. 30x30), preferred colors/styles, number of bedrooms, and time availability."
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
