'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { Button } from '../ui/Button';
import { Check, ShieldAlert, Sparkles, Trophy, CreditCard } from 'lucide-react';
import { SubscriptionTier } from '@/types';

export default function SubscriptionManager() {
  const { user, changeSubscription } = useAuthStore();
  const { addToast } = useUIStore();

  const [checkoutTier, setCheckoutTier] = useState<SubscriptionTier | null>(null);
  const [loading, setLoading] = useState(false);

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

    // Simulate PayMongo / Stripe Checkout window loading
    setTimeout(async () => {
      const success = await changeSubscription(tier);
      if (success) {
        addToast(`Successfully upgraded to ${tier.toUpperCase()} status! Thank you!`, 'success');
      } else {
        addToast('Checkout process failed.', 'error');
      }
      setLoading(false);
      setCheckoutTier(null);
    }, 2000);
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
                    <span className="text-2xl font-black text-white">{plan.price}</span>
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
                <Button
                  variant={isCurrent ? 'glass' : plan.glow ? 'secondary' : 'glass'}
                  glow={plan.glow}
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrent}
                  className="w-full text-xs font-black py-3 uppercase tracking-wider"
                >
                  {isCurrent ? 'Current Plan' : `Upgrade to ${plan.id}`}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
