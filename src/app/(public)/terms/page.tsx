'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Scale, ShieldAlert, UserCheck, Gavel, Globe, Info, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const sections = [
  { id: 'acceptance', title: 'Acceptance of Terms', icon: <UserCheck className="w-5 h-5" /> },
  { id: 'user-accounts', title: 'User Accounts & Verification', icon: <ShieldAlert className="w-5 h-5" /> },
  { id: 'content', title: 'Content & Conduct', icon: <Gavel className="w-5 h-5" /> },
  { id: 'intellectual-property', title: 'Intellectual Property', icon: <Globe className="w-5 h-5" /> },
  { id: 'termination', title: 'Termination', icon: <Info className="w-5 h-5" /> },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-secondary-950">
      {/* Header */}
      <header className="py-20 bg-secondary-50 dark:bg-secondary-900/50 border-b border-secondary-100 dark:border-secondary-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary-600 text-white mb-6 shadow-xl shadow-primary-500/20"
            >
                <Scale className="w-8 h-8" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-black text-secondary-900 dark:text-white mb-6">Terms & Conditions</h1>
            <p className="text-secondary-500 dark:text-secondary-400 font-medium tracking-tight">Last Updated: March 2026</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-20 grid lg:grid-cols-[250px_1fr] gap-16">
        {/* Sticky Sidebar */}
        <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-2">
                <p className="text-xs font-black text-secondary-400 uppercase tracking-widest pl-3 mb-4">Navigation</p>
                {sections.map((section) => (
                    <a 
                        key={section.id}
                        href={`#${section.id}`}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary-50 dark:hover:bg-secondary-900 text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 font-bold transition-all text-sm group"
                    >
                        <span className="opacity-50 group-hover:opacity-100">{section.icon}</span>
                        {section.title}
                    </a>
                ))}
            </div>
        </aside>

        {/* Content */}
        <article className="prose prose-secondary dark:prose-invert max-w-none">
            <section id="acceptance" className="mb-16">
                <h2 className="text-3xl font-black text-secondary-900 dark:text-white mb-6">1. Acceptance of These Terms</h2>
                <p className="text-lg text-secondary-600 dark:text-secondary-400 leading-relaxed">
                    By accessing or using Group Ad (the "Service"), you agree to be bound by these Terms and Conditions. If you are using the Service on behalf of a business, you represent that you have the authority to bind that business to these terms.
                </p>
            </section>

            <section id="user-accounts" className="mb-16">
                <h2 className="text-2xl font-black text-secondary-900 dark:text-white mb-4 border-l-4 border-primary-500 pl-4">2. User Accounts & Business Verification</h2>
                <div className="space-y-4 text-secondary-600 dark:text-secondary-400">
                    <p>
                        To access certain features, you must create an account. You agree to provide accurate, current, and complete information during registration.
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Verification:</strong> Business accounts require verification. We reserve the right to request documentation (e.g., GST certificates) and to reject or revoke verification status at our discretion.</li>
                        <li><strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.</li>
                    </ul>
                </div>
            </section>

            <section id="content" className="mb-16">
                <h2 className="text-2xl font-black text-secondary-900 dark:text-white mb-4 border-l-4 border-primary-500 pl-4">3. Content Standards & Professional Conduct</h2>
                <p className="text-secondary-600 dark:text-secondary-400">
                    Group Ad is a professional networking environment. You agree not to post content that:
                </p>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                    {[
                        'Is harassing, abusive, or discriminatory',
                        'Contains false or misleading business claims',
                        'Infringes on intellectual property rights',
                        'Promotes illegal activities or restricted goods',
                        'Is purely spam or unsolicited marketing',
                        'Attempts to scrape or harvest user data'
                    ].map((rule, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-secondary-50 dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-800">
                            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                            <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">{rule}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section id="intellectual-property" className="mb-16">
                <h2 className="text-2xl font-black text-secondary-900 dark:text-white mb-4 border-l-4 border-primary-500 pl-4">4. Intellectual Property</h2>
                <p className="text-secondary-600 dark:text-secondary-400">
                    The Service and its original content (excluding User Content), features, and functionality are and will remain the exclusive property of Group Ad and its licensors. By posting content to the Service, you grant us a worldwide, non-exclusive, royalty-free license to use, display, and distribute that content within the platform.
                </p>
            </section>

            <section id="limitation" className="mb-24 px-8 py-10 bg-secondary-900 text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                    <Scale className="w-24 h-24" />
                </div>
                <h2 className="text-2xl font-black m-0 mb-4 text-white">Limitation of Liability</h2>
                <p className="m-0 text-secondary-400 leading-relaxed">
                    Group Ad is provided on an "AS IS" and "AS AVAILABLE" basis. To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the Service.
                </p>
            </section>
        </article>
      </main>

      {/* CTA Section */}
      <footer className="py-20 bg-primary-600 text-white text-center rounded-t-[3rem]">
            <h3 className="text-2xl md:text-3xl font-black mb-8 px-4">Standardized for Global Enterprise Trusts</h3>
            <div className="flex justify-center flex-wrap gap-4">
                <Link href="/privacy-policy" className="px-6 py-3 bg-white text-primary-600 rounded-xl font-bold hover:bg-secondary-50 transition-all flex items-center gap-2">
                    Review Privacy Policy <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/" className="px-6 py-3 bg-primary-700 rounded-xl font-bold hover:bg-primary-800 transition-all border border-primary-500">
                    Return to Dashboard
                </Link>
            </div>
      </footer>
    </div>
  );
}
