'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { Button } from '@/components/ui/Button';
import { Check, Sparkles, Trophy, ShieldCheck, HelpCircle } from 'lucide-react';
import { SubscriptionTier } from '@/types';

export default function PricingPage() {
  const router = useRouter();
  const { user, changeSubscription } = useAuthStore();
  const { addToast } = useUIStore();
  const [currency, setCurrency] = useState<'USD' | 'PHP'>('USD');
  const [exchangeRate, setExchangeRate] = useState(56.5);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const isPayMongoEnabled = process.env.NEXT_PUBLIC_ENABLE_PAYMONGO === 'true';

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then((res) => res.json())
      .then((data) => {
        if (data?.rates?.PHP) {
          setExchangeRate(data.rates.PHP);
        }
      })
      .catch((err) => console.error('Failed to fetch live exchange rate:', err));
  }, []);

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

  const handleUpgrade = async (planName: string) => {
    const tier = planName.split(' ')[0].toLowerCase() as SubscriptionTier;
    
    if (!user) {
      router.push('/register');
      return;
    }

    if (tier === user.subscription_tier) {
      addToast('You are already subscribed to this package!', 'info');
      return;
    }

    setLoadingTier(tier);
    setIsProcessing(true);

    if (!isPayMongoEnabled) {
      addToast('Payment gateway is currently undergoing maintenance. Please try again shortly or contact support.', 'error');
      setIsProcessing(false);
      setLoadingTier(null);
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
          email: user.email,
          currency,
        }),
      });

      const data = await response.json();

      if (response.ok && data.checkoutUrl) {
        // Direct redirect to PayMongo secure payment page!
        window.location.href = data.checkoutUrl;
      } else {
        addToast(data.error || 'Checkout process failed. Please retry.', 'error');
        setIsProcessing(false);
        setLoadingTier(null);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      addToast('Unable to connect to payment gateway. Please try again.', 'error');
      setIsProcessing(false);
      setLoadingTier(null);
    }
  };

  const getPrice = (planName: string) => {
    if (!isPayMongoEnabled) {
      if (planName === 'Free Builder') return '$0';
      if (planName === 'Elite Architect') return '$9.99';
      if (planName === 'Pro Contractor') return '$19.99';
      return '';
    }
    if (planName === 'Free Builder') {
      return currency === 'USD' ? '$0' : '₱0';
    }
    if (planName === 'Elite Architect') {
      return currency === 'USD' 
        ? `$${(299 / exchangeRate).toFixed(2)}` 
        : '₱299';
    }
    if (planName === 'Pro Contractor') {
      return currency === 'USD' 
        ? `$${(499 / exchangeRate).toFixed(2)}` 
        : '₱499';
    }
    return '';
  };

  const PLANS = [
    {
      name: 'Free Builder',
      price: '$0',
      period: 'forever',
      description: 'Perfect for showcase testing and exploration.',
      icon: <Check className="text-gray-400" size={24} />,
      features: [
        'Upload up to 5 build creations',
        'Upload up to 3 images per post',
        'Explore and search builds catalog',
        'Participate in comments section',
      ],
      ctaText: 'Get Started',
      variant: 'glass' as const,
    },
    {
      name: 'Elite Architect',
      price: '$9.99',
      period: 'per month',
      description: 'Maximize your exposure with unlimited posts.',
      icon: <Sparkles className="text-blox-cyan" size={24} />,
      features: [
        'Unlimited build creations uploads',
        'Upload up to 5 images per post',
        'Elite Badge displayed on profile',
        'High-priority search rankings',
        'Access to specialized design style tags',
      ],
      ctaText: 'Upgrade to Elite',
      variant: 'secondary' as const,
      glow: true,
      popular: true,
    },
    {
      name: 'Pro Contractor',
      price: '$19.99',
      period: 'per month',
      description: 'Monetize your building skills and manage jobs.',
      icon: <Trophy className="text-amber-400" size={24} />,
      features: [
        'Everything in Elite Architect',
        'Accept commission booking request direct',
        'Professional dashboard commission queues',
        'Set pricing offers in Bloxburg cash',
        'Direct builder-client secure chat flags',
      ],
      ctaText: 'Become a Pro',
      variant: 'premium' as const,
    },
  ];

  const FAQS = [
    {
      q: 'How does the booking system work?',
      a: 'Pro Contractors receive hire requests from other users detailing their budget, plot sizes, and preferred styles. Builders can accept or decline bookings and track progress on their dashboard queues.',
    },
    {
      q: 'Can I cancel my subscription at any time?',
      a: 'Absolutely. You can downgrade, upgrade, or cancel your subscription instantly inside your dashboard profile settings with no cancellation fees.',
    },
    {
      q: 'How do I get paid for commissions?',
      a: 'All architectural fees are arranged in-game using Bloxburg cash transfers, or custom terms agreed by both client and builder.',
    },
  ];

  return (
    <div className="flex flex-col gap-20 pb-20 pt-10">
      {/* 1. Header Hero */}
      <section className="text-center max-w-3xl mx-auto flex flex-col items-center px-4">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full glass-panel border-blox-cyan/30 text-xs text-blox-cyan font-bold uppercase tracking-widest mb-6">
          <Sparkles size={13} className="animate-pulse" />
          Builder Privilege Pricing
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight uppercase">
          Elevate your <span className="bg-gradient-to-r from-blox-cyan to-blue-500 bg-clip-text text-transparent">Builder Status</span>
        </h1>
        <p className="mt-4 text-xs sm:text-sm text-gray-400 leading-relaxed font-semibold max-w-xl">
          Showcase your gorgeous Roblox designs, gather high search priority, and open up commission booking channels to start monetizing your architectural designs.
        </p>
      </section>

      {/* Currency Selector (Dynamic & Localized Toggle) */}
      {isPayMongoEnabled && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 -mt-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">
            Choose Currency:
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
          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-blox-cyan bg-blox-cyan/5 px-2.5 py-1 rounded-full border border-blox-cyan/10 uppercase tracking-wider animate-pulse">
            ⚡ Auto Localized
          </span>
        </div>
      )}

      {/* 2. Grid Cards */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {PLANS.map((plan) => {
          const isCurrent = user?.subscription_tier === plan.name.split(' ')[0].toLowerCase();
          return (
            <div
              key={plan.name}
              className={`p-8 rounded-3xl flex flex-col justify-between border relative transition-all h-full ${
                plan.glow
                  ? 'glass-panel-glow border-blox-cyan/25'
                  : 'glass-panel border-white/5'
              } ${plan.popular ? 'shadow-2xl shadow-blox-cyan/5 ring-1 ring-blox-cyan/20' : ''}`}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-widest py-1 px-3.5 rounded-full bg-blox-cyan text-blox-dark shadow-lg shadow-blox-cyan/20">
                  Most Popular choice
                </span>
              )}

              <div>
                {/* Title & Icon */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">{plan.name}</h3>
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/5 shrink-0">
                    {plan.icon}
                  </div>
                </div>

                {/* Pricing */}
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-4xl font-black text-white">{getPrice(plan.name)}</span>
                  <span className="text-xs text-gray-500 font-bold uppercase">/ {plan.period}</span>
                </div>

                <p className="text-xs text-gray-500 font-semibold mb-6">{plan.description}</p>

                <hr className="border-white/5 my-4" />

                {/* Features */}
                <ul className="flex flex-col gap-3.5 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-gray-300 font-semibold leading-relaxed">
                      <Check size={14} className="text-blox-cyan shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <Button
                variant={isCurrent ? 'glass' : plan.variant}
                glow={plan.glow}
                disabled={isCurrent || isProcessing}
                onClick={() => handleUpgrade(plan.name)}
                className="w-full py-3.5 text-xs font-black uppercase tracking-wider"
              >
                {isCurrent
                  ? 'Your Active Plan'
                  : loadingTier === plan.name.split(' ')[0].toLowerCase()
                  ? 'Processing Gateway...'
                  : plan.ctaText}
              </Button>
            </div>
          );
        })}
      </section>

      {/* 3. FAQ Section */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="p-8 sm:p-12 rounded-3xl glass-panel border border-white/5 flex flex-col gap-8 shadow-2xl">
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider text-center flex items-center justify-center gap-2">
            <HelpCircle size={22} className="text-blox-cyan" />
            Frequently Asked Questions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="flex flex-col gap-2 p-4 bg-white/5 rounded-2xl border border-white/5">
                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                  {faq.q}
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed font-semibold">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Payment Processing Blur Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative p-8 rounded-3xl glass-panel border border-blox-cyan/30 bg-[#0d1117]/90 shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col items-center text-center gap-6 max-w-sm w-full animate-in zoom-in-95 duration-300">
            {/* Loading Spinner */}
            <div className="relative w-16 h-16">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blox-cyan/30 opacity-75"></span>
              <div className="relative inline-flex rounded-full h-16 w-16 border-2 border-t-blox-cyan border-white/5 animate-spin"></div>
            </div>
            
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center justify-center gap-2">
                <Sparkles size={16} className="text-blox-cyan animate-pulse" />
                Securing Gateway Session
              </h3>
              <p className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider leading-relaxed">
                Please do not close this window. We are establishing your encrypted transaction stream...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
