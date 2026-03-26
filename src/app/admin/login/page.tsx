'use client';

import { useState } from 'react';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react';

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
    <div className="min-h-screen flex bg-[#0a0a0f] relative overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[300px] h-[300px] bg-purple-800/5 rounded-full blur-3xl pointer-events-none" />

      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-1 flex-col items-start justify-between p-16 relative z-10">
        <div className="flex items-center gap-4 group/logo">
          <div className="w-11 h-11 rounded-2xl overflow-hidden bg-white flex items-center justify-center border border-white/20 shadow-xl transition-transform group-hover/logo:scale-105">
            <Image src="/auth/logo-small.svg" alt="Group Ad" width={40} height={40} className="w-9 h-9 object-contain" priority />
          </div>
          <div className="flex flex-col">
            <p className="text-xl font-black text-white tracking-tighter leading-none mb-1">Group Ad</p>
            <p className="text-[10px] font-bold text-violet-400 uppercase tracking-[0.2em]">Admin Console</p>
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="text-4xl font-black text-white leading-tight mb-4">
            Welcome back,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
              administrator.
            </span>
          </h1>
          <p className="text-white/40 text-lg leading-relaxed">
            Your central command for managing Group Ad — users, content, analytics, and platform health at a glance.
          </p>

          {/* Feature list */}
          <div className="mt-10 space-y-3">
            {[
              { label: 'Real-time platform analytics', color: 'text-violet-400' },
              { label: 'User & business management', color: 'text-indigo-400' },
              { label: 'Content moderation & reports', color: 'text-purple-400' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full bg-current ${color}`} />
                <span className="text-sm text-white/50">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-xs">
          © 2024 Group Ad · Restricted to administrators only
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 lg:max-w-[480px] flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-4 lg:hidden mb-10 group/logo">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white flex items-center justify-center border border-white/20 shadow-lg">
              <Image src="/auth/logo-small.svg" alt="Group Ad" width={32} height={32} className="w-8 h-8 object-contain" priority />
            </div>
            <div className="flex flex-col">
              <p className="text-lg font-black text-white leading-none mb-1 tracking-tight">Group Ad</p>
              <p className="text-[10px] text-violet-400 uppercase tracking-widest font-bold">Admin Console</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-black text-white">Sign in</h2>
            <p className="text-white/40 text-sm mt-1">Enter your credentials to access the admin panel</p>
          </div>

          {/* Card */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl backdrop-blur-xl p-7 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="identifier" className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                  Email or Phone
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                  <input
                    id="identifier"
                    type="text"
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="admin@groupad.net"
                    className="w-full pl-10 pr-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all text-sm disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-12 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all text-sm disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !identifier || !password}
                className="w-full py-3 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-violet-900/30 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Authenticating…
                  </>
                ) : (
                  'Sign in to Admin Console'
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-white/20 text-xs mt-6">
            This portal is restricted to administrators only.
          </p>
        </div>
      </div>
    </div>
  );
}
