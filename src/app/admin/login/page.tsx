'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, Eye, EyeOff, Lock, Mail, Activity } from 'lucide-react';

const Logo = dynamic(() => import('../../../components/ui/logo'), {
  ssr: false,
});

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        identifier,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid credentials. Please try again.');
      } else {
        const isLocalhost = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1');
        router.push(isLocalhost ? '/admin' : '/');
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden font-jakarta">
      {/* Background Ambience */}
      <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[440px] px-6 relative z-10">
        <div className="flex flex-col items-center mb-10 animate-slide-up">
          <Logo className="w-44 h-12 mb-8 text-foreground" />
          <div className="text-center">
            <h1 className="text-2xl font-black text-foreground tracking-tight mb-2">
              Admin Access
            </h1>
            <p className="text-secondary-500 text-sm font-medium">
              Enter your credentials to manage the console
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/70 dark:bg-secondary-900/40 backdrop-blur-2xl border border-secondary-200 dark:border-secondary-800 rounded-[2.5rem] p-8 lg:p-10 shadow-2xl shadow-black/5 animate-slide-up stagger-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2 group">
                <label htmlFor="identifier" className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400 ml-1 group-focus-within:text-primary transition-colors">
                  Administrator ID
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-secondary-300 group-focus-within:text-primary transition-colors" />
                  <input
                    id="identifier"
                    type="text"
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="admin@groupad.net"
                    className="w-full pl-12 pr-4 py-4 bg-secondary-50/50 dark:bg-secondary-800/20 border border-secondary-200 dark:border-secondary-700/50 rounded-2xl text-foreground placeholder-secondary-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400 ml-1 group-focus-within:text-primary transition-colors">
                  Access Key
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-secondary-300 group-focus-within:text-primary transition-colors" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="••••••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-secondary-50/50 dark:bg-secondary-800/20 border border-secondary-200 dark:border-secondary-700/50 rounded-2xl text-foreground placeholder-secondary-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-foreground transition p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-red-500 text-xs font-bold animate-shake">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !identifier || !password}
              className="w-full py-4.5 bg-primary hover:bg-primary-600 text-white font-black rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] mt-2 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer" />
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Authenticating…</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <Activity className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center animate-slide-up stagger-2">
           <div className="flex items-center justify-center gap-3 opacity-30 select-none">
              <div className="w-8 h-px bg-current" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">Administrator Zone</p>
              <div className="w-8 h-px bg-current" />
           </div>
        </div>
      </div>
    </div>
  );
}
