'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { Button } from '../ui/Button';
import { Menu, X, LayoutDashboard, Crown, LogOut, ShieldAlert, Sparkles, Compass } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { addToast } = useUIStore();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Explore', href: '/explore', icon: Compass },
    { name: 'Pricing Plans', href: '/pricing', icon: Crown },
  ];

  const handleLogout = async () => {
    await logout();
    addToast('Logged out successfully', 'success');
  };

  const getTierBadgeColor = (tier?: string) => {
    switch (tier) {
      case 'pro':
        return 'from-amber-400 to-orange-500 text-blox-dark';
      case 'elite':
        return 'from-blox-cyan to-blue-500 text-blox-dark';
      default:
        return 'bg-gray-800 text-gray-400';
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#0B0E14]/85 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blox-red text-white font-extrabold text-xl shadow-lg shadow-blox-red/20 group-hover:scale-105 transition-transform duration-300">
                B
              </div>
              <span className="text-lg font-bold tracking-tight text-white group-hover:text-blox-red transition-colors duration-300">
                BLOX<span className="text-blox-cyan">BUILD</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors duration-200 ${
                    isActive ? 'text-blox-cyan' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* User Section (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                {/* Admin panel link */}
                {user.role === 'admin' && (
                  <Link href="/admin">
                    <Button variant="glass" size="sm" className="gap-1.5 text-red-400 border-red-500/20">
                      <ShieldAlert size={14} />
                      Admin
                    </Button>
                  </Link>
                )}

                {/* Dashboard link */}
                <Link href="/dashboard">
                  <Button variant="glass" size="sm" className="gap-1.5">
                    <LayoutDashboard size={14} />
                    Dashboard
                  </Button>
                </Link>

                {/* Profile Card Summary */}
                <div className="flex items-center gap-2 bg-blox-gray/40 border border-white/5 rounded-xl py-1 px-2.5">
                  <div className="text-right">
                    <div className="text-xs font-bold text-white max-w-[100px] truncate">{user.username}</div>
                    <div className="flex items-center justify-end">
                      <span
                        className={`text-[9px] font-extrabold uppercase px-1 rounded bg-gradient-to-r ${getTierBadgeColor(
                          user.subscription_tier
                        )}`}
                      >
                        {user.subscription_tier}
                      </span>
                    </div>
                  </div>
                  <Link href={`/builders/${user.username}`}>
                    <img
                      src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
                      alt={user.username}
                      className="h-8 w-8 rounded-full border border-white/10 object-cover cursor-pointer hover:opacity-85 transition-opacity"
                    />
                  </Link>
                </div>

                <Button variant="ghost" size="sm" onClick={handleLogout} className="p-2">
                  <LogOut size={16} className="text-gray-400 hover:text-blox-red" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm" glow={true}>
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white focus:outline-none"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden glass-panel border-x-0 border-b border-white/5 bg-[#0B0E14] px-4 pt-2 pb-4 space-y-3">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-base font-semibold text-gray-300 hover:bg-white/5 hover:text-white"
              >
                <Icon size={18} />
                {link.name}
              </Link>
            );
          })}

          <hr className="border-white/5 my-2" />

          {user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2">
                <img
                  src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
                  alt={user.username}
                  className="h-10 w-10 rounded-full border border-white/10 object-cover"
                />
                <div>
                  <div className="text-sm font-bold text-white">{user.username}</div>
                  <span
                    className={`inline-block text-[9px] font-extrabold uppercase px-1 rounded bg-gradient-to-r ${getTierBadgeColor(
                      user.subscription_tier
                    )}`}
                  >
                    {user.subscription_tier}
                  </span>
                </div>
              </div>

              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-base font-semibold text-red-400 hover:bg-white/5"
                >
                  <ShieldAlert size={18} />
                  Admin Panel
                </Link>
              )}

              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-base font-semibold text-blox-cyan hover:bg-white/5"
              >
                <LayoutDashboard size={18} />
                Dashboard
              </Link>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-base font-semibold text-gray-400 hover:bg-white/5 hover:text-blox-red text-left cursor-pointer"
              >
                <LogOut size={18} />
                Log Out
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="glass" size="sm" className="w-full">
                  Log In
                </Button>
              </Link>
              <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="primary" size="sm" className="w-full">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
