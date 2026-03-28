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
    <div className="min-h-screen flex bg-background relative overflow-hidden font-jakarta">
      {/* Dynamic Theme Glows */}
      <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] animate-pulse pointer-events-none" />

      {/* Left Panel — Brand Identity (Lg only) */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 lg:p-16 relative z-10 border-r border-secondary-100 dark:border-secondary-800/30">
        <div className="animate-enter stagger-1">
          <Logo className="w-48 h-12 mb-12 text-foreground" />
          
          <div className="max-w-xl">
            <h1 className="text-5xl font-black text-foreground leading-[1.1] tracking-tight mb-6">
              The heartbeat of <br />
              <span className="text-primary italic">Group Ad</span> console.
            </h1>
            <p className="text-secondary-500 text-xl font-medium leading-relaxed">
              Your comprehensive ecosystem for controlling assets, <br />
              moderating content, and analyzing growth.
            </p>
          </div>

          {/* Status Indicators */}
          <div className="mt-16 flex flex-wrap gap-8 animate-enter stagger-2">
            {[
              { label: 'Platform Activity', value: 'Nominal', color: 'bg-emerald-500' },
              { label: 'Security Protocols', value: 'Active', color: 'bg-blue-500' },
              { label: 'Data Nodes', value: 'Synced', color: 'bg-primary' },
            ].map((stat) => (
              <div key={stat.label} className="space-y-1.5 focus-within:scale-105 transition-transform cursor-default">
                <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400">{stat.label}</p>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${stat.color} animate-pulse`} />
                  <span className="text-sm font-bold text-foreground">{stat.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 animate-enter stagger-3">
          <div className="w-10 h-10 rounded-xl bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center">
             <Lock className="w-4 h-4 text-secondary-500" />
          </div>
          <p className="text-xs font-bold text-secondary-400 tracking-wide uppercase">
            End-to-End Encrypted Authentication
          </p>
        </div>
      </div>

      {/* Right Panel — Access Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative z-10">
        {/* Mobile Header (Saturate on mobile only) */}
        <div className="lg:hidden flex flex-col items-center mb-8 animate-enter">
          <Logo className="w-40 h-10 mb-6" />
          <h2 className="text-2xl font-black text-foreground">Sign In</h2>
        </div>

        <div className="w-full max-w-[480px] animate-enter stagger-2">
          {/* Main Card */}
          <div className="bg-white/60 dark:bg-secondary-900/40 backdrop-blur-3xl border border-secondary-200 dark:border-secondary-800 rounded-[2.5rem] p-10 lg:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] ring-1 ring-black/5">
            <div className="mb-10 text-center lg:text-left">
              <h3 className="text-2xl font-black text-foreground tracking-tight mb-2">Administrator Access</h3>
              <p className="text-secondary-500 text-sm font-medium">Verify your credentials to enter the cluster</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-2 group">
                  <label htmlFor="identifier" className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400 ml-1 group-focus-within:text-primary transition-colors">
                    Security ID
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
                className="w-full py-4.5 bg-primary hover:bg-primary-600 text-white font-black rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] mt-4 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer" />
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Validating Signal…</span>
                  </>
                ) : (
                  <>
                    <span>Decrypt & Access</span>
                    <Activity className="w-4 h-4 opacity-70 group-hover:rotate-12 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer Branding */}
          <div className="mt-12 flex flex-col items-center gap-2 opacity-30 group hover:opacity-100 transition-opacity">
             <div className="flex items-center gap-4">
                <div className="w-8 h-px bg-current" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Node-AD 2.0</p>
                <div className="w-8 h-px bg-current" />
             </div>
             <p className="text-[8px] font-bold">LEGACY ENFORCED · SYSTEM-71</p>
          </div>
        </div>
      </div>
    </div>
  );
}
