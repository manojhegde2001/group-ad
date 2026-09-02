'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Logo from '../ui/logo';

const FooterPricingModal = dynamic(
  () => import('./footer-pricing-modal').then((mod) => mod.FooterPricingModal),
  { ssr: false }
);

export type FooterLink = {
  label: string;
  href: string;
  isPricing?: boolean;
};

export const footerLinks: Record<string, FooterLink[]> = {
  Product: [
    { label: 'Pricing', href: '#', isPricing: true },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'How it Works', href: '/how-it-works' },
    { label: 'Blogs', href: '/blogs' },
    { label: 'Contact', href: '/contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};

export function Footer() {
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  return (
    <>
      <footer className="bg-secondary-50 dark:bg-secondary-900 border-t border-secondary-200 dark:border-secondary-800 mt-auto">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4 sm:py-10">
          {/* Top — brand + link columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-8">
            {/* Brand */}
            <div className="col-span-1 sm:col-span-2 md:col-span-1">
              <Logo className="w-24 h-7 mb-4" />
              <p className="text-sm text-secondary-600 dark:text-secondary-400 leading-relaxed max-w-sm">
                Business-focused collaboration platform for professionals and enterprises.
              </p>
            </div>

            {/* Link columns */}
            {Object.entries(footerLinks).map(([section, links]) => (
              <div key={section} className="flex flex-col">
                <p className="font-bold text-sm text-secondary-900 dark:text-secondary-200 mb-4">{section}</p>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      {link.isPricing ? (
                        <button
                          onClick={() => setIsPricingModalOpen(true)}
                          className="text-sm font-medium text-secondary-500 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-left"
                        >
                          {link.label}
                        </button>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm font-medium text-secondary-500 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors block py-0.5"
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

          {/* Bottom bar */}
          <div className="mt-8 sm:mt-10 pt-6 border-t border-secondary-200 dark:border-secondary-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <p className="text-xs sm:text-sm text-secondary-500 dark:text-secondary-400">
              © {new Date().getFullYear()} Vrutta. All rights reserved.
            </p>
            <p className="text-xs text-secondary-400 dark:text-secondary-500">
              Made with ❤️ for professionals
            </p>
          </div>
        </div>
      </footer>

      <FooterPricingModal open={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} />
    </>
  );
}
