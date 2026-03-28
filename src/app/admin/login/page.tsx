'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, Eye, EyeOff, Lock, Mail, Activity, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

const Logo = dynamic(() => import('../../../components/ui/logo'), {
  ssr: false,
});

export default function AdminLoginPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex lg:grid lg:grid-cols-2 bg-background relative overflow-hidden font-jakarta select-none">
      

      {/* Logo Area - Absolute Top Left */}
      <div className="absolute top-8 left-8 z-50 animate-fade-in group">
        <Logo className="w-40 sm:w-44 h-auto text-foreground transition-transform duration-500 group-hover:scale-105" />
      </div>

      {/* Left Column (Desktop Only Visuals) */}
      <div className="hidden lg:flex flex-col justify-center p-16 relative overflow-hidden transition-colors duration-700 bg-secondary-50 dark:bg-secondary-950">
        
        {/* Animated Background Gradients - Theme Responsive */}
        <div className="absolute top-[-20%] left-[-10%] w-[150%] h-[150%] bg-gradient-to-br from-primary-600/10 dark:from-primary-600/30 via-transparent to-purple-600/10 dark:to-purple-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[100%] h-[100%] bg-primary-100/40 dark:bg-primary-900/40 rounded-full blur-[100px]" />
        
        {/* Geometric Decor */}
        <div className="absolute top-0 right-0 w-full h-full opacity-[0.03] dark:opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10 space-y-8 max-w-lg">
          <div className="space-y-4">
            <h1 className="text-5xl lg:text-6xl font-black text-secondary-900 dark:text-white leading-tight animate-slide-up stagger-1">
              Command <br />
              <span className="text-primary-600 dark:text-primary-400">Your Vision.</span>
            </h1>
            <p className="text-lg text-secondary-600 dark:text-secondary-400 font-medium leading-relaxed animate-slide-up stagger-2">
              Welcome back, Administrator. Access the core of your platform to manage, monitor, and scale your operations with precision.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 animate-slide-up stagger-3">
             <div className="p-6 bg-white/40 dark:bg-white/5 border border-secondary-200 dark:border-white/10 rounded-[2rem] backdrop-blur-sm shadow-xl shadow-black/5 dark:shadow-none">
                <Activity className="w-8 h-8 text-primary-600 dark:text-primary-400 mb-3" />
                <h3 className="text-secondary-900 dark:text-white font-bold">Live Stats</h3>
                <p className="text-secondary-500 text-xs">Real-time performance at your fingertips.</p>
             </div>
             <div className="p-6 bg-white/40 dark:bg-white/5 border border-secondary-200 dark:border-white/10 rounded-[2rem] backdrop-blur-sm shadow-xl shadow-black/5 dark:shadow-none">
                <Sparkles className="w-8 h-8 text-primary-600 dark:text-primary-400 mb-3" />
                <h3 className="text-secondary-900 dark:text-white font-bold">New Features</h3>
                <p className="text-secondary-500 text-xs">Optimized console for better management.</p>
             </div>
          </div>
        </div>

        {/* Footer Credit */}
        <p className="absolute bottom-12 left-16 text-secondary-400 dark:text-secondary-600 text-[10px] font-black uppercase tracking-widest animate-fade-in stagger-4">
          Group Ad &copy; 2026 Enterprise Edition
        </p>
      </div>

      {/* Right Column (Login Form) */}
      <div className="w-full flex items-center justify-center p-6 md:p-12 relative bg-background">
        {/* Background Ambience for Mobile */}
        <div className="lg:hidden absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-15%] left-[-10%] w-[300px] h-[300px] bg-primary/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[300px] h-[300px] bg-primary/10 rounded-full blur-[80px]" />
        </div>

        <div className="w-full max-w-[440px] animate-fade-in delay-200">
          <div className="mb-10 lg:mt-0 mt-32">
            <h2 className="text-3xl font-black text-foreground tracking-tight mb-2">
              Sign In
            </h2>
            <p className="text-secondary-500 text-sm font-medium">
              Enter your administrative credentials.
            </p>
          </div>

          <div className="space-y-8 animate-slide-up">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-2 group">
                  <label htmlFor="identifier" className="text-sm font-bold text-secondary-700 dark:text-secondary-300 ml-1 transition-colors group-focus-within:text-primary">
                    Administrator Email / Username
                  </label>
                  <div className="relative group/field">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400 group-focus-within:text-primary transition-colors" />
                    <input
                      id="identifier"
                      type="text"
                      autoComplete="username"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="admin@groupad.net"
                      className="w-full pl-14 pr-5 py-5 bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-3xl text-foreground placeholder-secondary-400/60 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-medium disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-2 group">
                  <div className="flex items-center justify-between px-1">
                    <label htmlFor="password" className="text-sm font-bold text-secondary-700 dark:text-secondary-300 transition-colors group-focus-within:text-primary">
                      Access Password
                    </label>
                  </div>
                  <div className="relative group/field">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400 group-focus-within:text-primary transition-colors" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="••••••••••••"
                      className="w-full pl-14 pr-14 py-5 bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-3xl text-foreground placeholder-secondary-400/60 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-medium disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-foreground transition-all p-2 rounded-xl hover:bg-secondary-100 dark:hover:bg-secondary-800"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-3 p-5 bg-red-500/5 border border-red-500/10 rounded-3xl text-red-600 dark:text-red-400 text-sm font-bold animate-shake">
                  <div className="bg-red-500/10 p-2 rounded-xl">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                  </div>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !identifier || !password}
                className="w-full py-5 bg-primary hover:bg-primary-600 text-white font-black rounded-3xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] mt-4 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer" />
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Authorizing Access…</span>
                  </>
                ) : (
                  <>
                    <span className="text-base tracking-wide">Enter Console</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
          
          <div className="mt-12 lg:hidden text-center opacity-30">
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Administrator Zone &copy; 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
