'use client';

import React from 'react';
import SignupForm from '@/components/auth/signup-form';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 flex flex-col items-center justify-center p-4">
      <div className="absolute top-8 left-8">
        <Link href="/" className="flex items-center gap-2 text-secondary-600 dark:text-secondary-400 font-bold hover:text-primary-600 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white dark:bg-secondary-900 rounded-[2.5rem] shadow-2xl border border-secondary-100 dark:border-secondary-800 overflow-hidden"
      >
        <div className="p-8 md:p-12">
            <div className="flex flex-col items-center text-center mb-10">
                <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-primary-500/20">
                    <ShieldCheck className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-black text-secondary-900 dark:text-white mb-3 tracking-tight">Join Group Ad</h1>
                <p className="text-secondary-500 dark:text-secondary-400 font-medium">Create your account and start networking with professionals.</p>
            </div>

            <SignupForm />
        </div>
      </motion.div>
    </div>
  );
}
