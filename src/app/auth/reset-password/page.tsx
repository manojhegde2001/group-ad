'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowLeft, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Password } from '@/components/ui/password';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordData) => {
    if (!token) {
      toast.error('Invalid or missing token');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
        toast.success('Password reset successfully! 🎉');
        setTimeout(() => {
          router.push('/auth');
        }, 3000);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Something went wrong');
      }
    } catch (error) {
      toast.error('Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 flex flex-col items-center justify-center p-4">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="w-full max-w-[450px] bg-white dark:bg-secondary-900 rounded-[2rem] shadow-2xl border border-secondary-100 dark:border-secondary-800 p-8 text-center"
        >
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400 mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-secondary-900 dark:text-white mb-3">Invalid Link</h1>
          <p className="text-secondary-500 dark:text-secondary-400 mb-8 font-medium">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link href="/auth/forgot-password" className="w-full inline-block bg-primary-600 hover:bg-primary-700 text-white rounded-xl py-3.5 font-bold transition-all shadow-lg shadow-primary-500/25">
             Request New Link
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 flex flex-col items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-[450px] bg-white dark:bg-secondary-900 rounded-[2.5rem] shadow-2xl border border-secondary-100 dark:border-secondary-800 p-10 text-center"
          >
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-[2rem] flex items-center justify-center text-green-600 dark:text-green-400 mx-auto mb-8 shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-black text-secondary-900 dark:text-white mb-4 tracking-tight">All Done!</h1>
            <p className="text-secondary-500 dark:text-secondary-400 font-medium mb-10 leading-relaxed">
              Your password has been successfully reset. You will be redirected to the login page momentarily.
            </p>
            <Button
              className="w-full h-12 rounded-xl font-bold"
              onClick={() => router.push('/auth')}
            >
              Sign In Now
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[450px] bg-white dark:bg-secondary-900 rounded-[2.5rem] shadow-2xl border border-secondary-100 dark:border-secondary-800 overflow-hidden"
          >
             <div className="p-8 md:p-10 pt-12">
                <div className="flex flex-col items-center text-center mb-10">
                   <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 mb-6">
                      <Lock className="w-8 h-8" />
                   </div>
                   <h1 className="text-3xl font-black text-secondary-900 dark:text-white mb-3 tracking-tight">Set New Password</h1>
                   <p className="text-secondary-500 dark:text-secondary-400 font-medium px-4">
                      Choose a password that is at least 8 characters long and includes letters and symbols.
                   </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                   <Controller
                      name="password"
                      control={control}
                      render={({ field }) => (
                         <div className="space-y-2">
                            <Password
                               {...field}
                               label="New Password"
                               placeholder="Enter at least 8 characters"
                               error={errors.password?.message}
                               className="w-full"
                            />
                         </div>
                      )}
                   />

                   <Controller
                      name="confirmPassword"
                      control={control}
                      render={({ field }) => (
                         <div className="space-y-2">
                            <Password
                               {...field}
                               label="Confirm Password"
                               placeholder="Confirm your new password"
                               error={errors.confirmPassword?.message}
                               className="w-full"
                            />
                         </div>
                      )}
                   />

                   <Button
                      type="submit"
                      className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary-500/25"
                      isLoading={isLoading}
                      disabled={isLoading}
                   >
                      Reset Password
                   </Button>
                </form>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </React.Suspense>
  );
}
