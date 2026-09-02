'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ArrowRight } from 'lucide-react';

interface FooterPricingModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Split out of footer.tsx and lazy-loaded so framer-motion stays out of the
 * initial bundle (the footer renders on every page; this modal only opens when
 * a visitor clicks "Pricing").
 */
export function FooterPricingModal({ open, onClose }: FooterPricingModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-secondary-900/40 dark:bg-secondary-950/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
            className="relative w-full max-w-md bg-white dark:bg-secondary-900 rounded-[2rem] p-8 border border-secondary-200 dark:border-secondary-800 shadow-2xl overflow-hidden"
          >
            {/* Decorative Background */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-400/20 rounded-full blur-[40px] pointer-events-none" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-secondary-400 hover:text-secondary-900 dark:hover:text-white bg-secondary-100 dark:bg-secondary-800 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-primary-100 dark:border-primary-800/50">
                <Sparkles className="w-8 h-8 text-primary-500" />
              </div>

              <h3 className="text-2xl font-black text-secondary-900 dark:text-white mb-3 tracking-tight">
                Pricing? Nah. 🤫
              </h3>

              <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400 leading-relaxed mb-8">
                We don&apos;t do massive paywalls here. We believe in building real business connections. Vrutta is completely free to join and start growing your connections.
              </p>

              <Link
                href="/auth?mode=signup"
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 rounded-xl font-bold hover:bg-primary-600 dark:hover:bg-primary-500 hover:text-white transition-all active:scale-95"
              >
                Create Free Account <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
