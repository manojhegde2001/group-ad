'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { MailCheck, ArrowLeft, Mail, CheckCircle2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useResendVerification } from '@/hooks/use-api/use-auth';

const resendSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ResendData = z.infer<typeof resendSchema>;

// Status flags set by /api/auth/verify-email when it redirects back here.
const STATUS_COPY: Record<string, { title: string; body: string; ok: boolean }> = {
  success: {
    title: 'Email verified',
    body: 'Your account is now active. You can sign in.',
    ok: true,
  },
  already: {
    title: 'Already verified',
    body: 'This email address was already verified. You can sign in.',
    ok: true,
  },
  expired: {
    title: 'Link expired',
    body: 'That verification link has expired. Enter your email below to get a new one.',
    ok: false,
  },
  invalid: {
    title: 'Invalid link',
    body: "That verification link isn't valid. Enter your email below to get a new one.",
    ok: false,
  },
  error: {
    title: 'Something went wrong',
    body: 'We could not verify your email just now. Please request a new link and try again.',
    ok: false,
  },
};

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('verified');
  const emailFromQuery = searchParams.get('email') || '';
  const statusInfo = status ? STATUS_COPY[status] : null;

  const resendMutation = useResendVerification();
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ResendData>({
    resolver: zodResolver(resendSchema),
    defaultValues: { email: emailFromQuery },
  });

  useEffect(() => {
    if (emailFromQuery) setValue('email', emailFromQuery);
  }, [emailFromQuery, setValue]);

  const onSubmit = (data: ResendData) => {
    resendMutation.mutate(data, {
      onSuccess: () => setSent(true),
    });
  };

  const showSuccessState = statusInfo?.ok;

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
            {showSuccessState ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : statusInfo ? (
              <AlertTriangle className="w-8 h-8" />
            ) : (
              <MailCheck className="w-8 h-8" />
            )}
          </div>
          <h1 className="text-3xl font-black text-secondary-900 dark:text-white mb-3 tracking-tight">
            {statusInfo ? statusInfo.title : 'Check your email'}
          </h1>
          <p className="text-secondary-500 dark:text-secondary-400 font-medium leading-relaxed">
            {statusInfo
              ? statusInfo.body
              : "We've sent a verification link to your email address. Click it to activate your account, then sign in."}
          </p>
        </div>

        {showSuccessState ? (
          <Link href="/auth">
            <Button className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary-500/25">
              Go to Sign In
            </Button>
          </Link>
        ) : sent ? (
          <div className="space-y-4">
            <div className="bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/20 rounded-2xl p-4 flex items-start gap-4">
              <Mail className="w-5 h-5 text-primary-600 mt-0.5" />
              <p className="text-sm text-primary-800 dark:text-primary-200">
                If that account still needs verification, a new link is on its way. Check your spam folder if you don&apos;t see it.
              </p>
            </div>
            <Link href="/auth">
              <Button variant="outline" className="w-full h-12 rounded-xl font-bold">
                Back to Sign In
              </Button>
            </Link>
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
              isLoading={resendMutation.isPending}
              disabled={resendMutation.isPending}
            >
              Resend verification email
            </Button>

            <div className="text-center pt-2">
              <p className="text-sm text-secondary-500 dark:text-secondary-400">
                Already verified?{' '}
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

export default function VerifyEmailPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </React.Suspense>
  );
}
