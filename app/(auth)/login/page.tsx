'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion } from 'framer-motion';
import { LogIn, Sparkles, User, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, isLoading } = useAuthStore();
  const { addToast } = useUIStore();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');

  const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const success = await login(email, username);
    if (success) {
      addToast(`Welcome back to BloxBuild Hub!`, 'success');
      router.push('/dashboard');
    } else {
      addToast('Login check failed.', 'error');
    }
  };

  const handleGoogleLogin = async () => {
    const success = await loginWithGoogle();
    if (success) {
      addToast('Connecting Google account...', 'success');
      router.push('/dashboard');
    } else {
      addToast('Google login initiation failed.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-blox-cyan/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center flex flex-col items-center">
        {/* Logo Icon */}
        <Link href="/" className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blox-red text-white font-extrabold text-2xl shadow-xl shadow-blox-red/20 mb-4 hover:scale-105 transition-transform duration-300">
          B
        </Link>
        <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-wider">
          Log In to your Hub account
        </h2>
        <p className="mt-2 text-xs text-gray-500 font-semibold uppercase">
          Welcome back to the Roblox Bloxburg community
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4"
      >
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 shadow-2xl flex flex-col gap-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email Address */}
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. builder@pro.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {/* Username */}
            <Input
              label="Roblox Username (Optional)"
              type="text"
              placeholder="e.g. AestheticArchitect"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <Button
              type="submit"
              variant="secondary"
              glow={true}
              className="w-full mt-1 py-3 text-xs uppercase tracking-wider font-extrabold"
              disabled={isLoading}
            >
              <LogIn size={15} className="mr-2" />
              {isLoading ? 'Authenticating...' : 'Proceed to Dashboard'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink mx-3 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
              Or Continue With
            </span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          {/* Google Login Button */}
          <Button
            type="button"
            variant="ghost"
            onClick={handleGoogleLogin}
            className="w-full py-3 text-xs uppercase tracking-wider font-extrabold bg-[#111622]/40 hover:bg-[#111622]/80 border border-white/5 text-white hover:text-white"
            disabled={isLoading}
          >
            <GoogleIcon />
            {isLoading ? 'Connecting...' : 'Sign in with Google'}
          </Button>

          <div className="text-center text-xs text-gray-500 font-semibold mt-2">
            Don't have an account?{' '}
            <Link href="/register" className="text-blox-cyan hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
