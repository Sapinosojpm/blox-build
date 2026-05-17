'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { Button } from '../ui/Button';
import { Check, ShieldAlert, Sparkles, Trophy, CreditCard, X, AlertTriangle } from 'lucide-react';
import { SubscriptionTier } from '@/types';

export default function SubscriptionManager() {
  const { user, changeSubscription } = useAuthStore();
  const { addToast } = useUIStore();

  const [checkoutTier, setCheckoutTier] = useState<SubscriptionTier | null>(null);
  const [loading, setLoading] = useState(false);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelChallengeInput, setCancelChallengeInput] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const [currency, setCurrency] = useState<'USD' | 'PHP'>('USD');

  const isPayMongoEnabled = process.env.NEXT_PUBLIC_ENABLE_PAYMONGO === 'true';

  useEffect(() => {
    if (!isPayMongoEnabled) return;
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const isPH = tz.includes('Manila') || navigator.language.includes('PH') || navigator.language.includes('fil');
      if (isPH) {
        setCurrency('PHP');
      }
    } catch (e) {
      console.error('Timezone auto-detect error:', e);
    }
  }, [isPayMongoEnabled]);

  const getPrice = (tierId: string) => {
    if (!isPayMongoEnabled) {
      if (tierId === 'free') return '$0';
      if (tierId === 'elite') return '$9.99/mo';
      if (tierId === 'pro') return '$19.99/mo';
      return '';
    }
    if (tierId === 'free') {
      return currency === 'USD' ? '$0' : '₱0';
    }
    if (tierId === 'elite') {
      return currency === 'USD' ? '$9.99/mo' : '₱575/mo';
    }
    if (tierId === 'pro') {
      return currency === 'USD' ? '$19.99/mo' : '₱1,150/mo';
    }
    return '';
  };

  const PLANS = [
    {
      id: 'free' as SubscriptionTier,
      name: 'Free Builder',
      price: '$0',
      description: 'Get started and share your builds.',
      icon: <CreditCard className="text-gray-400" size={20} />,
      features: [
        'Upload up to 5 build creations',
        'Receive up to 3 comments per build',
        'Explore and search builds repository',
        'Follow your favorite creators',
      ],
    },
    {
      id: 'elite' as SubscriptionTier,
      name: 'Elite Architect',
      price: '$9.99/mo',
      description: 'Maximize your visibility and designs.',
      icon: <Sparkles className="text-blox-cyan animate-pulse" size={20} />,
      features: [
        'Unlimited build creations uploads',
        'Elite Badge on profile and cards',
        'Higher search visibility rankings',
        'Access to style categorization tags',
      ],
      glow: true,
    },
    {
      id: 'pro' as SubscriptionTier,
      name: 'Pro Contractor',
      price: '$19.99/mo',
      description: 'Monetize and manage build commissions.',
      icon: <Trophy className="text-amber-400" size={20} />,
      features: [
        'Everything in Elite Architect',
        'Commission Booking system enabled',
        'Builder Dashboard & booking queue manager',
        'Set custom commission pricing packages',
      ],
    },
  ];

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (tier === user?.subscription_tier) {
      addToast('You are already subscribed to this tier!', 'info');
      return;
    }

    setCheckoutTier(tier);
    setLoading(true);

    if (!isPayMongoEnabled) {
      addToast('Payment gateway is currently undergoing maintenance. Please try again shortly or contact support.', 'error');
      setLoading(false);
      setCheckoutTier(null);
      return;
    }

    try {
      const response = await fetch('/api/paymongo/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier,
          email: user?.email,
          currency,
        }),
      });

      const data = await response.json();

      if (response.ok && data.checkoutUrl) {
        // Redirect user to PayMongo's secure payment page
        window.location.href = data.checkoutUrl;
      } else {
        addToast(data.error || 'Checkout process failed. Please retry.', 'error');
        setLoading(false);
        setCheckoutTier(null);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      addToast('Unable to connect to payment gateway. Please try again.', 'error');
      setLoading(false);
      setCheckoutTier(null);
    }
  };

  const handleCancel = async () => {
    if (cancelChallengeInput !== 'CANCEL') {
      addToast('Please type CANCEL exactly to confirm cancellation.', 'error');
      return;
    }

    setIsCancelling(true);
    const success = await changeSubscription('free');
    if (success) {
      addToast('Your subscription was cancelled. Downgraded to Free Builder.', 'success');
      setIsCancelModalOpen(false);
      setCancelChallengeInput('');
    } else {
      addToast('Failed to cancel subscription.', 'error');
    }
    setIsCancelling(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">
            Subscription Tier Settings
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            Manage your account status and builder privileges.
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-300 font-bold flex items-center gap-1.5">
          <span>Current Tier:</span>
          <span className="text-blox-cyan uppercase font-black">{user?.subscription_tier}</span>
        </div>
      </div>

      {/* Currency Localization Widget */}
      {isPayMongoEnabled && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">
              Upgrade Currency:
            </span>
            <div className="bg-[#111622]/60 border border-white/5 p-1 rounded-xl flex gap-1 shadow-inner">
              <button
                onClick={() => setCurrency('USD')}
                className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all duration-300 ${
                  currency === 'USD'
                    ? 'bg-gradient-to-r from-blox-red to-orange-500 text-white shadow-md shadow-blox-red/10'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                USD ($)
              </button>
              <button
                onClick={() => setCurrency('PHP')}
                className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all duration-300 ${
                  currency === 'PHP'
                    ? 'bg-gradient-to-r from-blox-cyan to-blue-500 text-blox-dark shadow-md shadow-blox-cyan/15'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                PHP (₱)
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-blox-cyan bg-blox-cyan/10 px-2.5 py-1 rounded-full border border-blox-cyan/10 uppercase tracking-wider animate-pulse">
              ⚡ Timezone Localized
            </span>
          </div>
        </div>
      )}

      {loading && checkoutTier && (
        <div className="p-6 rounded-2xl glass-panel-glow border border-blox-cyan/30 text-center flex flex-col items-center justify-center gap-3 animate-pulse">
          <div className="w-10 h-10 border-4 border-blox-cyan border-t-transparent rounded-full animate-spin" />
          <div className="text-sm font-bold text-white uppercase tracking-wide">
            Connecting to Stripe / PayMongo Gateway...
          </div>
          <p className="text-xs text-gray-400">
            Please do not close this tab. Processing payment checkout for {checkoutTier.toUpperCase()} package.
          </p>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrent = user?.subscription_tier === plan.id;
            return (
              <div
                key={plan.id}
                className={`p-6 rounded-2xl flex flex-col justify-between border transition-all h-full ${
                  plan.glow
                    ? 'glass-panel-glow border-blox-cyan/20'
                    : 'glass-panel border-white/5'
                } ${isCurrent ? 'ring-2 ring-blox-cyan/50 shadow-2xl' : ''}`}
              >
                <div>
                  {/* Title & Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-white">{plan.name}</h3>
                    <div className="p-2 bg-white/5 rounded-xl border border-white/5 shrink-0">
                      {plan.icon}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl font-black text-white">{getPrice(plan.id)}</span>
                  </div>

                  <p className="text-xs text-gray-500 font-semibold mb-6">{plan.description}</p>

                  <hr className="border-white/5 my-4" />

                  {/* Features */}
                  <ul className="flex flex-col gap-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-300 font-semibold leading-relaxed">
                        <Check size={14} className="text-blox-cyan shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Call to action */}
                <div className="flex flex-col gap-2 w-full">
                  <Button
                    variant={isCurrent ? 'glass' : plan.glow ? 'secondary' : 'glass'}
                    glow={plan.glow}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isCurrent}
                    className="w-full text-xs font-black py-3 uppercase tracking-wider"
                  >
                    {isCurrent ? 'Current Plan' : `Upgrade to ${plan.id}`}
                  </Button>

                  {isCurrent && plan.id !== 'free' && (
                    <button
                      onClick={() => setIsCancelModalOpen(true)}
                      className="text-[10px] font-extrabold uppercase tracking-wider text-red-400 hover:text-red-500 transition-colors mt-2 hover:underline cursor-pointer text-center"
                    >
                      Cancel Subscription
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. GORGEOUS CANCEL SUBSCRIPTION MODAL */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 shadow-2xl bg-[#0B0E14]/95 text-center flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300">
            {/* Close button */}
            <button
              onClick={() => {
                setIsCancelModalOpen(false);
                setCancelChallengeInput('');
              }}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
              disabled={isCancelling}
            >
              <X size={16} />
            </button>

            {/* Glowing Danger Container */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 shadow-lg shadow-red-500/10 animate-pulse">
              <AlertTriangle size={28} />
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-black text-white uppercase tracking-wider">
                Cancel Subscription?
              </h2>
              <p className="text-xs text-gray-400 font-semibold leading-relaxed">
                We're sad to see you go! If you cancel your premium tier, you will immediately lose your elite privileges: your commissions bookings manager will be deactivated and your catalog uploads will be capped back to 5.
              </p>
            </div>

            {/* Input challenge section */}
            <div className="w-full flex flex-col gap-2 text-left">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                To confirm, type <span className="text-red-400 font-black">CANCEL</span> below:
              </span>
              <input
                type="text"
                placeholder="Type CANCEL here"
                value={cancelChallengeInput}
                onChange={(e) => setCancelChallengeInput(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#111622]/50 border border-white/5 focus:border-red-500 text-sm text-white font-extrabold uppercase placeholder-gray-600 outline-none transition-all"
                disabled={isCancelling}
              />
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={() => {
                  setIsCancelModalOpen(false);
                  setCancelChallengeInput('');
                }}
                className="flex-1 py-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-xs font-black uppercase text-gray-400 hover:text-white transition-colors cursor-pointer"
                disabled={isCancelling}
              >
                Keep Active Plan
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelChallengeInput !== 'CANCEL' || isCancelling}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase text-white shadow-lg transition-all duration-300 ${
                  cancelChallengeInput === 'CANCEL' && !isCancelling
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-500/10 cursor-pointer'
                    : 'bg-red-950/20 text-gray-500 border border-white/5 cursor-not-allowed'
                }`}
              >
                {isCancelling ? 'Processing...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
