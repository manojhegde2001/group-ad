'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { footerLinks } from './footer';
import Logo from '../ui/logo';
import { useState } from 'react';

type HelpModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
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
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="relative w-full max-w-2xl bg-white dark:bg-secondary-900 rounded-[2rem] p-6 sm:p-8 border border-secondary-200 dark:border-secondary-800 shadow-2xl overflow-hidden"
            >
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-secondary-400 hover:text-secondary-900 dark:hover:text-white bg-secondary-100 dark:bg-secondary-800 rounded-full transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-8">
                <Logo className="w-24 h-7 mb-3" />
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Business-focused collaboration platform for professionals and enterprises.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8">
                {Object.entries(footerLinks).map(([section, links]) => (
                  <div key={section}>
                    <p className="font-semibold text-sm text-secondary-800 dark:text-secondary-200 mb-3">{section}</p>
                    <ul className="space-y-2">
                      {links.map((link) => (
                        <li key={link.label}>
                          {link.isPricing ? (
                            <button
                              onClick={() => setIsPricingModalOpen(true)}
                              className="text-sm text-secondary-500 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-left"
                            >
                              {link.label}
                            </button>
                          ) : (
                            <Link
                              href={link.href}
                              onClick={onClose}
                              className="text-sm text-secondary-500 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            >
                              {link.label}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-secondary-200 dark:border-secondary-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <p className="text-xs sm:text-sm text-secondary-500 dark:text-secondary-400">
                  © {new Date().getFullYear()} Vrutta. All rights reserved.
                </p>
                <p className="text-xs text-secondary-400 dark:text-secondary-500">
                  Made with ❤️ for professionals
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Creative Pricing Modal (from footer) */}
      <AnimatePresence>
        {isPricingModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-secondary-900/40 dark:bg-secondary-950/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPricingModalOpen(false)}
              className="absolute inset-0"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="relative w-full max-w-md bg-white dark:bg-secondary-900 rounded-[2rem] p-8 border border-secondary-200 dark:border-secondary-800 shadow-2xl overflow-hidden"
            >
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-400/20 rounded-full blur-[40px] pointer-events-none" />
              
              <button 
                onClick={() => setIsPricingModalOpen(false)}
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
                  We don't do massive paywalls here. We believe in building real business connections. Vrutta is completely free to join and start growing your connections.
                </p>

                <Link
                  href="/auth?mode=signup"
                  onClick={() => setIsPricingModalOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 rounded-xl font-bold hover:bg-primary-600 dark:hover:bg-primary-500 hover:text-white transition-all active:scale-95"
                >
                  Create Free Account <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
