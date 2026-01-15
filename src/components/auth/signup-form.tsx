'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/hooks/use-modal';
import { Input, Password, Button, Text, Select } from 'rizzui';
import { Mail, Lock, User, AtSign, Briefcase } from 'lucide-react';
import { CATEGORIES, COMPANY_SIZES, TURNOVER_RANGES } from '@/lib/constants';

export function SignupForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    username: '',
    category: '',
    userType: 'INDIVIDUAL' as 'INDIVIDUAL' | 'BUSINESS',
    companyName: '',
    turnover: '',
    companySize: '',
    industry: '',
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
      <Input
        type="text"
        placeholder="Full Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        prefix={<User className="w-4 h-4" />}
        required
      />

      <Input
        type="text"
        placeholder="Username"
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        prefix={<AtSign className="w-4 h-4" />}
        required
      />

      <Input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        prefix={<Mail className="w-4 h-4" />}
        required
      />

      <Password
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        prefix={<Lock className="w-4 h-4" />}
        required
      />

      <Select
        options={CATEGORIES.map(cat => ({ label: cat, value: cat }))}
        value={formData.category}
        onChange={(value:any) => setFormData({ ...formData, category: value as string })}
        placeholder="Select Category *"
        className="w-full"
      />

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setFormData({ ...formData, userType: 'INDIVIDUAL' })}
          className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
            formData.userType === 'INDIVIDUAL'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-secondary-300 dark:border-secondary-700'
          }`}
        >
          Individual
        </button>
        <button
          type="button"
          onClick={() => setFormData({ ...formData, userType: 'BUSINESS' })}
          className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
            formData.userType === 'BUSINESS'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-secondary-300 dark:border-secondary-700'
          }`}
        >
          Business
        </button>
      </div>

      {formData.userType === 'BUSINESS' && (
        <>
          <Input
            type="text"
            placeholder="Company Name"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            prefix={<Briefcase className="w-4 h-4" />}
          />

          <Select
            options={TURNOVER_RANGES.map(t => ({ label: t, value: t }))}
            value={formData.turnover}
            onChange={(value:any) => setFormData({ ...formData, turnover: value as string })}
            placeholder="Annual Turnover"
          />

          <Select
            options={COMPANY_SIZES.map(s => ({ label: s, value: s }))}
            value={formData.companySize}
            onChange={(value:any) => setFormData({ ...formData, companySize: value as string })}
            placeholder="Company Size"
          />
        </>
      )}

      {error && <Text className="text-red-500 text-sm">{error}</Text>}

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary-600"
        isLoading={loading}
      >
        Create Account
      </Button>

      <div className="text-center">
        <Text className="text-sm text-secondary-600 dark:text-secondary-400">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => setMode('login')}
            className="text-primary hover:underline font-medium"
          >
            Login
          </button>
        </Text>
      </div>
    </form>
  );
}
