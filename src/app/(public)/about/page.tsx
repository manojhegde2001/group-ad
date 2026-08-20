'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Users, ShieldCheck, Target, Zap, Globe, MessageSquare, 
  ArrowRight, CheckCircle2, TrendingUp, RefreshCw, BarChart, 
  Briefcase, Network, Handshake, Eye, ArrowUpRight, ChevronDown
} from 'lucide-react';

// ============================================================================
// REUSABLE LOCAL COMPONENTS
// ============================================================================

const StoryFramework = () => {
  const steps = [
    {
      letter: 'S', title: 'Showcase',
      desc: 'Create your profile, share your expertise, and build a strong digital presence.',
      icon: <Eye className="w-5 h-5" />
    },
    {
      letter: 'T', title: 'Trust',
      desc: 'Connect with the right people and build trust through curated meetings.',
      icon: <ShieldCheck className="w-5 h-5" />
    },
    {
      letter: 'O', title: 'Offer',
      desc: 'Once trust is established, put your actual products and services on the table.',
      icon: <Handshake className="w-5 h-5" />
    },
    {
      letter: 'R', title: 'Referral',
      desc: 'When trust is visible, referrals flow naturally between verified partners.',
      icon: <Network className="w-5 h-5" />
    },
    {
      letter: 'Y', title: 'Yield',
      desc: 'Referrals compound into reputation, yielding inbound opportunities and growth.',
      icon: <TrendingUp className="w-5 h-5" />
    }
  ];

  return (
    <div className="relative max-w-7xl mx-auto py-8">
       {/* Desktop Connecting Line */}
       <div className="hidden lg:block absolute top-[100px] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200 dark:from-primary-500/20 dark:via-primary-500 dark:to-primary-500/20" />
       
       <div className="flex flex-col lg:flex-row justify-between relative z-10 gap-8 lg:gap-4 xl:gap-6">
          {steps.map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="flex-1 relative group"
            >
               {/* Mobile connecting line */}
               {i !== steps.length - 1 && (
                 <div className="lg:hidden absolute left-8 top-16 bottom-[-2rem] w-[2px] bg-primary-100 dark:bg-secondary-800" />
               )}

               <div className="flex lg:flex-col items-start lg:items-center gap-4 lg:gap-6">
                 <div className="relative shrink-0">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 shadow-md flex flex-col items-center justify-center group-hover:border-primary-500 dark:group-hover:border-primary-500 transition-colors z-10 relative">
                      <span className="text-xl md:text-2xl font-black text-primary-600 dark:text-primary-400 leading-none mb-1">{step.letter}</span>
                      <div className="text-secondary-400 dark:text-secondary-500">{step.icon}</div>
                    </div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-primary-500/10 dark:bg-primary-500/20 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                 </div>
                 
                 <div className="text-left lg:text-center pb-6 lg:pb-0">
                    <h3 className="text-base md:text-lg font-black text-secondary-900 dark:text-white mb-2 tracking-tight">{step.title}</h3>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400 leading-relaxed font-medium">
                      {step.desc}
                    </p>
                 </div>
               </div>
            </motion.div>
          ))}
       </div>

       {/* Flywheel Loop Back Arrow (Desktop) */}
       <motion.div 
         initial={{ opacity: 0 }}
         whileInView={{ opacity: 1 }}
         viewport={{ once: true }}
         transition={{ delay: 0.8, duration: 1 }}
         className="hidden lg:block absolute -bottom-10 left-[10%] right-[10%] h-24 border-b-2 border-dashed border-primary-300 dark:border-primary-500/30 rounded-b-[4rem]"
       >
         <div className="absolute -left-2 bottom-[-9px] text-primary-400 dark:text-primary-500/50 rotate-[135deg]">
           <ArrowRight className="w-5 h-5" />
         </div>
         <div className="absolute left-1/2 -translate-x-1/2 bottom-[-12px] bg-secondary-50 dark:bg-secondary-900/30 px-4 text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-500">
           The Flywheel Effect
         </div>
       </motion.div>
    </div>
  );
};


// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function AboutPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-secondary-950 overflow-x-hidden selection:bg-primary-500/30">
      
      {/* ==================== SECTION 1: HERO ==================== */}
      <section className="relative pt-6 pb-4 md:pt-10 md:pb-6 px-4 flex flex-col items-center justify-center text-center">
        {/* Subtle Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] pointer-events-none">
          <div className="absolute top-10 left-1/4 w-[400px] h-[400px] bg-primary-100 dark:bg-primary-900/20 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-70" />
          <div className="absolute top-20 right-1/4 w-[300px] h-[300px] bg-blue-100 dark:bg-blue-900/20 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-70" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-4xl mx-auto"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 text-secondary-900 dark:text-secondary-300 text-[10px] font-black uppercase tracking-[0.2em] mb-4 shadow-sm">
            <Globe className="w-3.5 h-3.5 text-primary-500" />
            Connecting the Business World
          </span>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-secondary-900 dark:text-white mb-4 tracking-tight leading-[1.1]">
            Word of Mouth Never Travels in a Straight Line. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600 dark:from-primary-400 dark:to-blue-400">
              It Moves in a Circle.
            </span>
          </h1>
          
          <p className="text-sm text-secondary-600 dark:text-secondary-400 max-w-lg mx-auto mb-6 leading-relaxed font-medium">
            A premium business network built for professionals to showcase their work, connect with the right people, and grow through trusted referrals.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto px-4 mb-4">
            <Link 
              href="/how-it-works"
              className="w-full sm:w-auto px-5 py-3 bg-primary-600 text-white rounded-xl font-black hover:bg-primary-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-primary-500/20 active:scale-95 text-[13px] uppercase tracking-wider"
            >
              See How It Works <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {/* Scroll Down Indicator */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="flex flex-col items-center justify-center text-secondary-400 dark:text-secondary-500"
          >
            <span className="text-[10px] font-black uppercase tracking-widest mb-2">Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ==================== SECTION 2: BUILD RELATIONSHIPS ==================== */}
      <section className="py-12 md:py-16 px-4 max-w-7xl mx-auto border-t border-secondary-100 dark:border-secondary-800/50">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            <h2 className="text-2xl md:text-4xl font-black text-secondary-900 dark:text-white mb-6 leading-tight tracking-tight">
              Build Relationships That <span className="text-primary-600 dark:text-primary-500">Create Business</span>
            </h2>
            <div className="space-y-5 text-sm md:text-base text-secondary-600 dark:text-secondary-400 font-medium leading-relaxed">
              <p>
                Visibility alone isn't enough. We combine it with purposeful relationship building to help you meet complementary businesses and grow through trusted referrals.
              </p>
            </div>
          </motion.div>

          <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6 }}
             className="relative lg:col-span-3 w-full h-64 sm:h-72 md:h-80 rounded-[2rem] bg-secondary-50/50 dark:bg-secondary-900/30 border border-secondary-100 dark:border-secondary-800 overflow-hidden p-4 sm:p-5 shadow-inner"
          >
            {/* Bento Grid Container */}
            <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-3 sm:gap-4 relative z-10">
              
              {/* Top Left: Upcoming Meeting */}
              <div className="bg-white dark:bg-secondary-950 rounded-2xl p-4 md:p-5 border border-secondary-200 dark:border-secondary-800 shadow-sm flex flex-col justify-between group hover:border-primary-200 dark:hover:border-primary-800 transition-colors relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary-50 to-transparent dark:from-primary-900/20 rounded-bl-3xl pointer-events-none" />
                <div className="flex items-start justify-between relative z-10">
                  <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                    <Handshake className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-secondary-400 mt-1">10:30 AM</span>
                </div>
                <div className="relative z-10">
                  <h4 className="text-sm md:text-base font-bold text-secondary-900 dark:text-white mt-3">Scheduled Meeting</h4>
                  <p className="text-[10px] md:text-xs text-secondary-500 font-medium mt-0.5">Manufacturing Partner</p>
                </div>
              </div>

              {/* Top Right: Match Score */}
              <div className="bg-gradient-to-br from-primary-600 to-blue-600 rounded-2xl p-4 md:p-5 border border-primary-500 shadow-md shadow-primary-500/20 flex flex-col justify-between text-white relative overflow-hidden group">
                <motion.div 
                  className="absolute -right-4 -bottom-4 opacity-20"
                  whileHover={{ rotate: 15, scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Target className="w-24 h-24" />
                </motion.div>
                <div className="relative z-10 flex items-start justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary-100">Match Score</span>
                  <ArrowUpRight className="w-4 h-4 text-primary-100" />
                </div>
                <div className="relative z-10">
                  <div className="text-3xl md:text-4xl font-black">94%</div>
                  <p className="text-[10px] md:text-xs text-primary-100 font-medium mt-1">High synergy found</p>
                </div>
              </div>

              {/* Bottom Full: Referrals Graph */}
              <div className="col-span-2 bg-white dark:bg-secondary-950 rounded-2xl p-4 md:p-5 border border-secondary-200 dark:border-secondary-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                      <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-xs md:text-sm font-bold text-secondary-900 dark:text-white">Network Growth</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">+12 this month</span>
                </div>
                
                {/* Fake Graph */}
                <div className="flex items-end gap-2 h-14 md:h-16 mt-2">
                  {[30, 45, 25, 60, 80, 50, 100].map((height, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${height}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: i * 0.1, type: "spring", bounce: 0.2 }}
                      className="flex-1 bg-primary-100 dark:bg-primary-900/30 rounded-t-sm relative group overflow-hidden"
                    >
                      <div className="absolute bottom-0 left-0 w-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" style={{ height: '100%' }} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Subtle floating glow behind bento */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary-400/20 dark:bg-primary-500/10 blur-[50px] rounded-full pointer-events-none" />
          </motion.div>
        </div>
      </section>

      {/* ==================== SECTION 3: STORY FRAMEWORK ==================== */}
      <section className="py-12 md:py-16 bg-secondary-50 dark:bg-secondary-900/30 border-y border-secondary-100 dark:border-secondary-800/50 overflow-hidden px-4">
        <div className="max-w-7xl mx-auto text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-secondary-900 dark:text-white mb-4 tracking-tight">
            The Tools You Need to Create a Success <span className="text-primary-600 dark:text-primary-500 uppercase">Story</span>
          </h2>
          <p className="text-base md:text-lg text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto font-medium">
            A comprehensive suite of features tailored for modern business communication.
          </p>
        </div>

        <StoryFramework />
      </section>

      {/* ==================== SECTION 4: WHY CHOOSE VRUTTA ==================== */}
      <section className="py-16 md:py-24 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-secondary-900 dark:text-white mb-3 tracking-tight">
            Why Businesses Choose Vrutta
          </h2>
          <p className="text-sm font-black text-primary-600 dark:text-secondary-400 uppercase tracking-widest">
            More than visibility. A platform built for business growth.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 md:gap-5">
          {/* Highlight Card 1: Visibility */}
          <div className="md:col-span-2 p-6 md:p-8 rounded-[2rem] bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center">
            <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 group-hover:scale-105 transition-transform duration-500">
              <Eye className="w-32 h-32 text-primary-500" />
            </div>
            <div className="relative z-10">
              <span className="inline-block px-3 py-1 rounded-full bg-primary-50 dark:bg-secondary-800 text-primary-600 dark:text-primary-400 text-[9px] font-black uppercase tracking-widest mb-4">Visibility</span>
              <h3 className="text-lg md:text-xl font-black text-secondary-900 dark:text-white mb-2 leading-tight">Showcase your business</h3>
              <p className="text-secondary-600 dark:text-secondary-400 font-medium max-w-md text-sm leading-relaxed mt-2">Stand out with a verified profile to an audience looking for partners.</p>
            </div>
          </div>

          {/* Card 2: Relationships */}
          <div className="md:col-span-1 p-6 md:p-8 rounded-[2rem] bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 flex flex-col justify-between group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center mb-5 shadow-sm shadow-blue-500/20 group-hover:-translate-y-1 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-secondary-900 dark:text-white mb-2 leading-tight">Meet business owners with shared goals</h3>
            </div>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 font-medium mt-3">Discover and connect with like-minded entrepreneurs ready to collaborate.</p>
          </div>

          {/* Card 3: Trust */}
          <div className="md:col-span-1 p-6 md:p-8 rounded-[2rem] bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 flex flex-col justify-between group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center mb-5 shadow-sm shadow-emerald-500/20 group-hover:-translate-y-1 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-secondary-900 dark:text-white mb-2 leading-tight">Build meaningful professional relationships</h3>
            </div>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 font-medium mt-3">Go beyond small talk. Have curated meetings that foster genuine trust.</p>
          </div>

          {/* Card 4: Tracking & Collaboration */}
          <div className="md:col-span-2 p-6 md:p-8 rounded-[2rem] bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 flex flex-col justify-center group shadow-sm">
             <div>
              <div className="w-10 h-10 rounded-xl bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-300 flex items-center justify-center mb-5 group-hover:-translate-y-1 transition-transform">
                <BarChart className="w-5 h-5" />
              </div>
              <h3 className="text-xl md:text-2xl font-black text-secondary-900 dark:text-white mb-2 leading-tight">Track connections & discover opportunities</h3>
             </div>
             <p className="text-sm text-secondary-600 dark:text-secondary-400 font-medium mt-2 max-w-md">Organize your network and find new avenues for strategic collaboration seamlessly.</p>
          </div>

          {/* Highlight Card 5: Referrals & Reputation */}
          <div className="md:col-span-2 p-6 md:p-8 rounded-[2rem] bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-secondary-900 border border-primary-100 dark:border-primary-800/50 relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center">
            <div className="absolute bottom-0 right-0 p-6 opacity-5 dark:opacity-10 group-hover:scale-105 transition-transform duration-500">
              <RefreshCw className="w-32 h-32 text-primary-600" />
            </div>
            <div className="relative z-10">
              <span className="inline-block px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-[9px] font-black uppercase tracking-widest mb-4">Referrals & Growth</span>
              <h3 className="text-lg md:text-xl font-black text-secondary-900 dark:text-white mb-2 leading-tight">Earn trusted referrals</h3>
              <p className="text-secondary-600 dark:text-secondary-300 font-medium max-w-md text-sm leading-relaxed mt-2">Build a verifiable history of partnerships that makes you the obvious choice.</p>
            </div>
          </div>
        </div>
      </section>



      {/* ==================== SECTION 6: EVERY STAGE OF GROWTH ==================== */}
      <section className="py-12 md:py-16 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-secondary-900 dark:text-white mb-4 tracking-tight">
            Designed for Every Stage of Business Growth
          </h2>
          <p className="text-base md:text-lg text-secondary-600 dark:text-secondary-400 font-medium max-w-2xl mx-auto">
            Vrutta helps you move from visibility to credibility and from credibility to business growth.
          </p>
        </div>

        <div className="relative">
          {/* Connecting Line */}
          <div className="hidden lg:block absolute top-[44px] left-[10%] right-[10%] h-0.5 bg-secondary-200 dark:bg-secondary-800 rounded-full" />
          
          <div className="flex flex-col lg:flex-row justify-between gap-6 lg:gap-4 xl:gap-8 relative z-10">
            {[
              { title: 'Launch', desc: 'Launching a new business', icon: <Target className="w-5 h-5" /> },
              { title: 'Grow', desc: 'Growing your customer base', icon: <TrendingUp className="w-5 h-5" /> },
              { title: 'Expand', desc: 'Expanding into new markets', icon: <Globe className="w-5 h-5" /> },
              { title: 'Partner', desc: 'Looking for trusted partners', icon: <Handshake className="w-5 h-5" /> },
              { title: 'Referrals', desc: 'Building referral relationships', icon: <Network className="w-5 h-5" /> },
            ].map((stage, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="flex-1 flex flex-row lg:flex-col items-center gap-4 lg:gap-5 group"
              >
                 <div className="w-20 h-20 shrink-0 lg:w-24 lg:h-24 rounded-2xl bg-white dark:bg-secondary-900/50 border border-secondary-200 dark:border-secondary-800 flex flex-col items-center justify-center gap-2 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 group-hover:border-primary-200 dark:group-hover:border-primary-800 transition-colors shadow-sm">
                   <div className="text-secondary-400 dark:text-secondary-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                     {stage.icon}
                   </div>
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-secondary-900 dark:text-white">{stage.title}</h3>
                 </div>
                 <div className="flex-1 lg:text-center">
                   <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400 leading-snug">
                     {stage.desc}
                   </p>
                 </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== SECTION 7: FINAL CTA ==================== */}
      <section className="py-8 md:py-12 px-4 border-t border-secondary-100 dark:border-secondary-800/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-secondary-50/50 dark:bg-primary-950/5 pointer-events-none" />
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
           <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             className="bg-white dark:bg-secondary-900 rounded-[2rem] p-6 md:p-10 border border-secondary-200 dark:border-secondary-800 shadow-xl shadow-primary-500/5"
           >
              <h2 className="text-2xl md:text-4xl font-black text-secondary-900 dark:text-white mb-3 tracking-tight">
                Ready to transform your business relationships?
              </h2>
              <p className="text-sm md:text-base text-secondary-600 dark:text-secondary-400 font-medium mb-6 max-w-xl mx-auto">
                Join a community of business owners who believe relationships create opportunities.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                <Link 
                  href="/how-it-works"
                  className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-white rounded-xl font-black hover:bg-primary-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-primary-500/20 active:scale-95 text-[13px] uppercase tracking-wider"
                >
                  See How It Works <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-50 dark:bg-secondary-950 border border-secondary-200 dark:border-secondary-800 text-[9px] font-black uppercase tracking-widest text-secondary-500">
                <Globe className="w-3 h-3" />
                Visibility powered by word of mouth
              </div>
           </motion.div>
        </div>
      </section>

    </div>
  );
}
