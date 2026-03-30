'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, ShieldCheck, Calendar, MessageSquare, ArrowRight, Target, Zap, Globe } from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Professional Networking',
    description: 'Connect with industry leaders, professionals, and innovative companies in a dedicated business ecosystem.',
    color: 'bg-blue-500',
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: 'Verified Businesses',
    description: 'Our rigorous verification process ensures you interact with legitimate, high-trust business entities.',
    color: 'bg-emerald-500',
  },
  {
    icon: <Calendar className="w-6 h-6" />,
    title: 'Event Management',
    description: 'Discovery and host conferences, webinars, and workshops tailored to your industry interests.',
    color: 'bg-purple-500',
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: 'Real-time Collaboration',
    description: 'Share insights, discuss trends, and collaborate through our integrated messaging and post systems.',
    color: 'bg-rose-500',
  },
];

const stats = [
  { label: 'Verified Companies', value: '5,000+' },
  { label: 'Active Professionals', value: '50,000+' },
  { label: 'Monthly Events', value: '1,200+' },
  { label: 'Daily Interactions', value: '100k+' },
];

export default function AboutPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-secondary-950 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 flex flex-col items-center justify-center text-center px-4">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px]">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 blur-[120px] rounded-full" />
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400 text-sm font-bold mb-6 border border-primary-100 dark:border-primary-800">
            <Zap className="w-4 h-4" />
            Empowering Professional Growth
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-secondary-900 dark:text-white mb-8 tracking-tight max-w-4xl">
            Connecting the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">Enterprise</span> World
          </h1>
          <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Group Ad is the premium social network designed specifically for verified businesses and industry professionals to thrive together.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/auth?mode=signup"
              className="px-8 py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all flex items-center gap-2 shadow-xl shadow-primary-500/20 active:scale-95"
            >
              Get Started Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/explore" 
              className="px-8 py-4 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white border border-secondary-200 dark:border-secondary-800 rounded-2xl font-bold hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-all"
            >
              Explore Platform
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Hero Image / Illustration Placeholder */}
      <section className="px-4 -mt-20 mb-32 max-w-6xl mx-auto relative z-20">
         <motion.div 
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="aspect-[21/9] bg-gradient-to-br from-secondary-100 to-secondary-200 dark:from-secondary-800 dark:to-secondary-900 rounded-[3rem] shadow-2xl border border-secondary-200 dark:border-secondary-700 overflow-hidden relative group"
         >
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay opacity-50 group-hover:scale-105 transition-transform duration-[2s]" />
            <div className="absolute inset-0 bg-gradient-to-t from-secondary-950/60 to-transparent" />
            <div className="absolute bottom-12 left-12">
                <div className="flex items-center gap-4 text-white">
                    <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20">
                        <Globe className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold">Global Business Ecosystem</h3>
                        <p className="text-white/60">Bridging borders, industries, and ideas.</p>
                    </div>
                </div>
            </div>
         </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-secondary-50 dark:bg-secondary-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-4xl md:text-5xl font-black text-primary-600 mb-2">{stat.value}</p>
                <p className="text-sm font-bold text-secondary-500 uppercase tracking-widest">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-32 px-4 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
            >
                <Target className="w-12 h-12 text-primary-600 mb-6" />
                <h2 className="text-4xl font-black text-secondary-900 dark:text-white mb-6 leading-tight">
                    Our Mission: To Build the Future of Enterprise Networking
                </h2>
                <div className="space-y-6 text-lg text-secondary-600 dark:text-secondary-400">
                    <p>
                        We believe that business growth is fueled by meaningful connections. Traditional social networks are cluttered with noise, making it difficult for professionals to find high-value opportunities.
                    </p>
                    <p>
                        Group Ad provides a clean, verified, and professional environment where information flows securely and transparency is the standard.
                    </p>
                </div>
            </motion.div>
            <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
                 className="grid grid-cols-2 gap-4"
            >
                <div className="space-y-4 pt-12">
                    <div className="aspect-square bg-blue-500/10 rounded-[2rem] border border-blue-500/20 flex items-center justify-center">
                        <Users className="w-12 h-12 text-blue-600" />
                    </div>
                    <div className="aspect-square bg-purple-500/10 rounded-[2rem] border border-purple-500/20 flex items-center justify-center">
                        <ShieldCheck className="w-12 h-12 text-purple-600" />
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="aspect-square bg-emerald-500/10 rounded-[2rem] border border-emerald-500/20 flex items-center justify-center">
                        <MessageSquare className="w-12 h-12 text-emerald-600" />
                    </div>
                    <div className="aspect-square bg-rose-500/10 rounded-[2rem] border border-rose-500/20 flex items-center justify-center">
                        <Calendar className="w-12 h-12 text-rose-600" />
                    </div>
                </div>
            </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-4 bg-secondary-950 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-tl from-primary-900/20 to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h2 className="text-4xl font-black mb-4">The Tools You Need to Succeed</h2>
          <p className="text-secondary-400 max-w-2xl mx-auto mb-20 text-lg">
            A comprehensive suite of features tailored for modern business communication.
          </p>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {features.map((feature, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="p-8 bg-secondary-900/50 backdrop-blur-xl border border-secondary-800 rounded-[2.5rem] text-left hover:border-primary-500/50 transition-all group"
              >
                <div className={`${feature.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-${feature.color.split('-')[1]}-500/20 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-secondary-400 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 max-w-5xl mx-auto text-center">
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-primary-600 rounded-[3rem] p-12 md:p-20 relative overflow-hidden shadow-2xl shadow-primary-500/30"
        >
            <div className="absolute top-0 right-0 p-8">
                <Users className="w-32 h-32 text-white/10 -rotate-12" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-8 relative z-10 leading-tight">
                Ready to transform your business network?
            </h2>
            <p className="text-white/80 text-lg mb-12 max-w-xl mx-auto relative z-10">
                Join thousands of verified companies and professionals today. It only takes a few minutes to get verified.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
                <Link 
                    href="/auth?mode=signup"
                    className="px-10 py-5 bg-white text-primary-600 rounded-2xl font-black shadow-xl hover:bg-secondary-50 transition-all active:scale-95"
                >
                    Create Free Account
                </Link>
                <Link 
                    href="/contact" 
                    className="flex items-center gap-2 text-white font-bold hover:underline"
                >
                    Contact Sales <ArrowRight className="w-5 h-5" />
                </Link>
            </div>
        </motion.div>
      </section>

      {/* Footer Branding */}
      <footer className="py-12 border-t border-secondary-100 dark:border-secondary-900 text-center">
        <p className="text-sm font-bold flex items-center justify-center gap-2 text-secondary-500">
            <span className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white text-xs">G</span>
            Group Ad © 2026. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
