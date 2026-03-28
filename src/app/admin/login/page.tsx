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
      {/* Dynamic Background Accents */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[440px] px-6 relative z-10 animate-fade-in">
        <div className="flex flex-col items-center mb-10">
          <Logo className="w-44 h-12 mb-6 text-foreground" />
          <div className="text-center">
            <h1 className="text-2xl font-black text-foreground tracking-tight mb-2">
              Admin Console
            </h1>
            <p className="text-secondary-500 text-sm font-medium">
              Enterprise management portal for Group Ad
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white/70 dark:bg-secondary-900/40 backdrop-blur-xl border border-secondary-200 dark:border-secondary-800 rounded-[2rem] p-8 shadow-2xl shadow-black/5 ring-1 ring-black/5">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Email/Identifier field */}
              <div className="space-y-2">
                <label htmlFor="identifier" className="text-[10px] font-black uppercase tracking-[0.15em] text-secondary-500 ml-1">
                  Administrator ID
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 group-focus-within:text-primary transition-colors" />
                  <input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="admin@groupad.net"
                    className="w-full pl-11 pr-4 py-3.5 bg-secondary-50/50 dark:bg-secondary-800/20 border border-secondary-200 dark:border-secondary-700/50 rounded-2xl text-foreground placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.15em] text-secondary-500 ml-1">
                  Access Key
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 group-focus-within:text-primary transition-colors" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="••••••••••••"
                    className="w-full pl-11 pr-12 py-3.5 bg-secondary-50/50 dark:bg-secondary-800/20 border border-secondary-200 dark:border-secondary-700/50 rounded-2xl text-foreground placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm disabled:opacity-50"
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

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2.5 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-red-500 text-xs font-bold animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !identifier || !password}
              className="w-full py-4 bg-primary hover:bg-primary-600 text-white font-black rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] mt-2 group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Authenticating…</span>
                </>
              ) : (
                <>
                  <span>Sign in to Cluster</span>
                  <Activity className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center space-y-4">
          <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-[0.2em]">
            Restricted Administrator Zone
          </p>
          <div className="flex items-center justify-center gap-6">
             <div className="w-12 h-px bg-secondary-100 dark:bg-secondary-800" />
             <span className="text-[10px] text-secondary-300 dark:text-secondary-600 font-bold">© 2024 GROUP AD</span>
             <div className="w-12 h-px bg-secondary-100 dark:bg-secondary-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
