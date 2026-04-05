'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setIsSubmitted(true);
        toast.success('Reset link sent to your email');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Something went wrong');
      }
    } catch (error) {
      toast.error('Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 flex flex-col items-center justify-center p-4">
      <div className="absolute top-8 left-8 z-50">
        <Link href="/auth" className="flex items-center gap-2 text-secondary-500 hover:text-primary-600 transition-colors font-medium text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[450px] bg-white dark:bg-secondary-900 rounded-[2rem] shadow-2xl border border-secondary-100 dark:border-secondary-800 p-8 md:p-10"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 mb-6 shadow-inner">
            {isSubmitted ? <CheckCircle2 className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
          </div>
          <h1 className="text-3xl font-black text-secondary-900 dark:text-white mb-3 tracking-tight">
            {isSubmitted ? 'Check Your Email' : 'Forgot Password?'}
          </h1>
          <p className="text-secondary-500 dark:text-secondary-400 font-medium leading-relaxed">
            {isSubmitted 
              ? "We've sent a password reset link to your email address." 
              : "No worries! Enter your email and we'll send you a link to reset your password."}
          </p>
        </div>

        {isSubmitted ? (
          <div className="space-y-4">
            <div className="bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/20 rounded-2xl p-4 flex items-start gap-4">
              <Mail className="w-5 h-5 text-primary-600 mt-0.5" />
              <p className="text-sm text-primary-800 dark:text-primary-200">
                Didn't receive the email? Check your spam folder or try again in a few minutes.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl font-bold"
              onClick={() => setIsSubmitted(false)}
            >
              Try another email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Input
                {...register('email')}
                type="email"
                label="Email Address"
                placeholder="name@example.com"
                error={errors.email?.message}
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary-500/25"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Send Reset Link
            </Button>

            <div className="text-center pt-2">
              <p className="text-sm text-secondary-500 dark:text-secondary-400">
                Remember your password?{' '}
                <Link href="/auth" className="text-primary-600 dark:text-primary-400 hover:underline font-bold transition-colors">
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
