'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/hooks/use-modal';
import { Input } from '@/components/ui/input';
import { Password } from '@/components/ui/password';
import { Select, SelectOption } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Mail, Lock, User, AtSign } from 'lucide-react';

const CATEGORIES: SelectOption[] = [
  { label: 'Technology', value: 'Technology' },
  { label: 'Healthcare', value: 'Healthcare' },
  { label: 'Finance', value: 'Finance' },
  { label: 'Education', value: 'Education' },
  { label: 'Retail', value: 'Retail' },
  { label: 'Real Estate', value: 'Real Estate' },
  { label: 'Food & Beverage', value: 'Food & Beverage' },
  { label: 'Entertainment', value: 'Entertainment' },
  { label: 'Other', value: 'Other' },
];

export function SignupForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    username: '',
    category: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { checkAuth } = useAuth();
  const { close, setMode, onSuccessCallback } = useAuthModal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Signup failed');
      }

      await checkAuth();
      close();
      if (onSuccessCallback) onSuccessCallback();
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (value: string) => {
    setFormData({ ...formData, category: value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="danger" closable onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Input
        type="text"
        label="Full Name"
        placeholder="Enter your full name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        prefix={<User className="w-4 h-4" />}
        required
      />

      <Input
        type="text"
        label="Username"
        placeholder="Choose a username"
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        prefix={<AtSign className="w-4 h-4" />}
        required
      />

      <Input
        type="email"
        label="Email"
        placeholder="Enter your email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        prefix={<Mail className="w-4 h-4" />}
        required
      />

      <Password
        label="Password"
        placeholder="Create a password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        prefix={<Lock className="w-4 h-4" />}
        required
      />

      <Select
        label="Category"
        options={CATEGORIES}
        value={formData.category}
        onChange={handleCategoryChange}
        placeholder="Select your category"
        searchable
        required
      />

      <Button type="submit" fullWidth isLoading={loading}>
        {loading ? 'Creating account...' : 'Create Account'}
      </Button>

      <div className="text-center">
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => setMode('login')}
            className="text-primary hover:underline font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
    </form>
  );
}
