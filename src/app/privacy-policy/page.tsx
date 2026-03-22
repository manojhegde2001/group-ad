'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, ChevronRight, Scale, Info } from 'lucide-react';
import Link from 'next/link';

const sections = [
  { id: 'data-collection', title: 'Data Collection', icon: <Eye className="w-5 h-5" /> },
  { id: 'data-usage', title: 'How We Use Data', icon: <FileText className="w-5 h-5" /> },
  { id: 'data-sharing', title: 'Data Sharing', icon: <ChevronRight className="w-5 h-5" /> },
  { id: 'user-rights', title: 'Your Rights', icon: <Scale className="w-5 h-5" /> },
  { id: 'security', title: 'Security Measures', icon: <Lock className="w-5 h-5" /> },
];

export default function PrivacyPolicyPage() {
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
                <Shield className="w-8 h-8" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-black text-secondary-900 dark:text-white mb-6">Privacy Policy</h1>
            <p className="text-secondary-500 dark:text-secondary-400 font-medium">Last Updated: March 2026</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-20 grid lg:grid-cols-[250px_1fr] gap-16">
        {/* Sticky Sidebar Navigation */}
        <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-2">
                <p className="text-xs font-black text-secondary-400 uppercase tracking-widest pl-3 mb-4">On this page</p>
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

        {/* Policy Content */}
        <article className="prose prose-secondary dark:prose-invert max-w-none">
            <section id="introduction" className="mb-16">
                <div className="flex items-center gap-2 text-primary-600 mb-4">
                    <Info className="w-5 h-5" />
                    <span className="text-sm font-black uppercase tracking-wider">Introduction</span>
                </div>
                <h2 className="text-3xl font-black text-secondary-900 dark:text-white mb-6">Welcome to Group Ad</h2>
                <p className="text-lg text-secondary-600 dark:text-secondary-400 leading-relaxed">
                    At Group Ad, we are committed to protecting your privacy and ensuring your trust. This Privacy Policy outlines how we collect, use, and protect the information of our business and individual users. By using our platform, you agree to the practices described in this policy.
                </p>
            </section>

            <section id="data-collection" className="mb-16">
                <h2 className="text-2xl font-black text-secondary-900 dark:text-white mb-4 border-l-4 border-primary-500 pl-4">1. Information We Collect</h2>
                <div className="space-y-4 text-secondary-600 dark:text-secondary-400">
                    <p>We collect information that you provide directly to us, including:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Profile Information:</strong> Name, professional title, bio, company affiliation, and contact details.</li>
                        <li><strong>Verification Data:</strong> For business accounts, we may collect GST numbers, registration certificates, and other identification documents.</li>
                        <li><strong>Content:</strong> Posts, comments, messages, and events you create on the platform.</li>
                        <li><strong>Usage Data:</strong> Information about your interactions with the platform, including views, likes, and connections.</li>
                    </ul>
                </div>
            </section>

            <section id="data-usage" className="mb-16">
                <h2 className="text-2xl font-black text-secondary-900 dark:text-white mb-4 border-l-4 border-primary-500 pl-4">2. How We Use Your Information</h2>
                <p className="text-secondary-600 dark:text-secondary-400 mb-4">We use the collected information for various professional purposes:</p>
                <div className="grid md:grid-cols-2 gap-4">
                    {[
                        'Facilitating professional connections',
                        'Verifying business legitimacy',
                        'Personalizing your feed and event discoveries',
                        'Improving our algorithms and platform security',
                        'Communicating platform updates and notifications',
                        'Analyzing professional trends within categories'
                    ].map((usage, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-secondary-50 dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-800">
                            <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 shrink-0" />
                            <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">{usage}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section id="data-sharing" className="mb-16">
                <h2 className="text-2xl font-black text-secondary-900 dark:text-white mb-4 border-l-4 border-primary-500 pl-4">3. Data Sharing and Disclosure</h2>
                <p className="text-secondary-600 dark:text-secondary-400">
                    We do not sell your personal data. However, as an enterprise social network, some information is shared to facilitate the platform's core mission:
                </p>
                <ul className="list-disc pl-6 text-secondary-600 dark:text-secondary-400 space-y-2 mt-4">
                    <li><strong>Public Profile:</strong> Your username, bio, and company details are visible based on your visibility settings.</li>
                    <li><strong>Service Providers:</strong> We share data with trusted third-party providers (e.g., Cloudinary for images, MongoDB for storage) to maintain platform functionality.</li>
                    <li><strong>Legal Obligations:</strong> We may disclose information if required by law or in response to valid legal requests.</li>
                </ul>
            </section>

            <section id="security" className="mb-24 px-8 py-10 bg-primary-50 dark:bg-primary-950/20 rounded-[2.5rem] border border-primary-100 dark:border-primary-900/50">
                <div className="flex items-center gap-3 text-primary-600 mb-6">
                    <Lock className="w-8 h-8" />
                    <h2 className="text-2xl font-black m-0 tracking-tight">Enterprise-Grade Security</h2>
                </div>
                <p className="text-secondary-700 dark:text-secondary-300 m-0 text-lg leading-relaxed">
                    We utilize industry-standard encryption and security protocols (incl. JSON Web Tokens andbcrypt hashing) to protect your account and data. Our infrastructure is hosted on secure cloud providers with multi-layered defense mechanisms.
                </p>
            </section>
        </article>
      </main>

      {/* Quick CTA */}
      <footer className="py-20 bg-secondary-950 text-white text-center">
            <h3 className="text-2xl font-bold mb-6">Have questions about your privacy?</h3>
            <div className="flex justify-center gap-6">
                <Link href="/contact" className="px-6 py-3 bg-primary-600 rounded-xl font-bold hover:bg-primary-700 transition-colors">
                    Contact Support
                </Link>
                <Link href="/" className="px-6 py-3 bg-white/10 rounded-xl font-bold hover:bg-white/20 transition-colors">
                    Back to Home
                </Link>
            </div>
      </footer>
    </div>
  );
}
