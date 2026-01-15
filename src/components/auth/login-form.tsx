'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/hooks/use-modal';
import { Input } from '@/components/ui/input';
import { Password } from '@/components/ui/password';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Mail, Lock } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { close, setMode, onSuccessCallback } = useAuthModal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      close();
      if (onSuccessCallback) onSuccessCallback();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <Alert variant="danger" closable onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Input
        type="email"
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        prefix={<Mail className="w-4 h-4" />}
        required
        autoFocus
      />

      <Password
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        prefix={<Lock className="w-4 h-4" />}
        required
      />

      <Button type="submit" fullWidth isLoading={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>

      <div className="text-center">
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => setMode('signup')}
            className="text-primary hover:underline font-medium"
          >
            Sign up
          </button>
        </p>
      </div>
    </form>
  );
}
