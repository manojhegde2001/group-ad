'use client';

import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import {
  Clock, CalendarCheck, Users, RefreshCw, 
  ArrowRight, ShieldCheck, UserCheck, Play, Grip, ChevronDown
} from 'lucide-react';

export default function HowItWorksPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-secondary-950 overflow-x-hidden selection:bg-primary-500/30">
      
      {/* ==================== HERO SECTION ==================== */}
      <section className="relative pt-10 pb-6 md:pt-12 md:pb-10 px-4 max-w-5xl mx-auto text-center flex flex-col items-center">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[400px] pointer-events-none">
          <div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-primary-100 dark:bg-primary-900/20 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-60" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 text-secondary-900 dark:text-secondary-300 text-[10px] font-black uppercase tracking-[0.2em] mb-4 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-primary-500" />
            The Vrutta Model
          </span>
          
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-black text-secondary-900 dark:text-white mb-4 tracking-tight leading-[1.1]">
            How Vrutta Meetings <span className="text-primary-600 dark:text-primary-500">Work.</span>
          </h1>
          
          <p className="text-base md:text-lg font-bold text-secondary-900 dark:text-white max-w-2xl mx-auto mb-3 leading-tight">
            One office. One full day. Endless opportunities to connect.
          </p>

          <p className="text-sm md:text-base text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto mb-8 leading-relaxed font-medium">
            Every day, from 9 AM to 8 PM, Vrutta offices stay open for structured 2-hour meeting blocks — designed for business owners to meet each other, build relationships, and grow through word of mouth.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
            <div className="bg-secondary-50 dark:bg-secondary-900/50 rounded-2xl p-5 border border-secondary-100 dark:border-secondary-800 flex flex-col items-center justify-center text-center">
              <Clock className="w-6 h-6 text-primary-500 mb-2" />
              <h3 className="font-black text-secondary-900 dark:text-white text-base">9 AM – 8 PM</h3>
              <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1 font-medium">Open daily, walk in</p>
            </div>
            <div className="bg-secondary-50 dark:bg-secondary-900/50 rounded-2xl p-5 border border-secondary-100 dark:border-secondary-800 flex flex-col items-center justify-center text-center">
              <CalendarCheck className="w-6 h-6 text-primary-500 mb-2" />
              <h3 className="font-black text-secondary-900 dark:text-white text-base">2 Hours</h3>
              <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1 font-medium">Per structured slot</p>
            </div>
            <div className="bg-secondary-50 dark:bg-secondary-900/50 rounded-2xl p-5 border border-secondary-100 dark:border-secondary-800 flex flex-col items-center justify-center text-center">
              <Users className="w-6 h-6 text-primary-500 mb-2" />
              <h3 className="font-black text-secondary-900 dark:text-white text-base">Up to 40</h3>
              <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1 font-medium">One seat per profession</p>
            </div>
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

      {/* ==================== THE DAY, SLOT BY SLOT ==================== */}
      <section className="py-12 md:py-20 px-4 border-t border-secondary-100 dark:border-secondary-800/50 overflow-hidden bg-secondary-50 dark:bg-secondary-900/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 text-secondary-600 dark:text-secondary-300 text-[10px] font-black uppercase tracking-widest mb-4">The day, slot by slot</span>
            <h2 className="text-3xl md:text-5xl font-black text-secondary-900 dark:text-white mb-4 tracking-tight">
              One room, a new mix of trades every two hours
            </h2>
            <p className="text-base text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto font-medium">
              Each block below is a real Vrutta meeting slot. Every seat in it belongs to a different profession — so the CA never competes with another CA in the same room.
            </p>
          </div>

          {/* Timeline Scroll */}
          <div className="relative w-full max-w-6xl mx-auto py-8">
            <div className="flex overflow-x-auto pb-8 snap-x snap-mandatory gap-6 scrollbar-hide px-4 md:px-0">
              {[
                { time: '9:00 – 11:00', booked: 14, tags: ['Chartered Accountant', 'Interior Designer', 'Printer'], color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' },
                { time: '11:00 – 1:00', booked: 22, tags: ['Architect', 'Caterer', 'Photographer'], color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' },
                { time: '1:00 – 3:00', booked: 31, tags: ['Lawyer', 'Real Estate Broker', 'Event Planner'], color: 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-800' },
                { time: '3:00 – 5:00', booked: 9, tags: ['Web Developer', 'Tailor', 'Logistics Owner'], color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' },
                { time: '5:00 – 7:00', booked: 18, tags: ['Insurance Agent', 'Bakery Owner', 'Gym Owner'], color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' },
              ].map((slot, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="shrink-0 w-80 md:w-96 snap-center"
                >
                  <div className="mb-3 text-sm font-black text-secondary-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary-500" />
                    {slot.time}
                  </div>
                  <div className="bg-white dark:bg-secondary-900 rounded-[2rem] p-6 border border-secondary-200 dark:border-secondary-800 shadow-sm relative overflow-hidden group hover:border-primary-300 dark:hover:border-primary-700 transition-colors cursor-pointer h-full flex flex-col">
                    <div className="flex flex-wrap gap-2 mb-8">
                      {slot.tags.map((tag, j) => (
                        <span key={j} className={`px-3 py-1.5 rounded-full text-[11px] font-bold border ${slot.color}`}>
                          {tag}
                        </span>
                      ))}
                      <span className="px-3 py-1.5 rounded-full text-[11px] font-bold border bg-secondary-50 text-secondary-500 border-secondary-200 dark:bg-secondary-800 dark:text-secondary-400 dark:border-secondary-700">
                        + more
                      </span>
                    </div>
                    
                    <div className="mt-auto">
                      <div className="flex justify-between text-xs font-bold text-secondary-500 mb-2">
                        <span>{slot.booked} / 40 seats booked</span>
                      </div>
                      <div className="w-full h-1.5 bg-secondary-100 dark:bg-secondary-800 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full" style={{ width: `${(slot.booked / 40) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="text-center mt-6 flex flex-col md:flex-row items-center justify-center gap-4 text-xs font-medium text-secondary-500">
              <p>Slots are illustrative — the app shows live availability.</p>
              <div className="hidden md:block w-1 h-1 bg-secondary-300 rounded-full" />
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Services</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Trade & Design</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary-500" /> Consulting</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== THE PROCESS ==================== */}
      <section className="py-16 md:py-24 px-4 max-w-7xl mx-auto border-t border-secondary-100 dark:border-secondary-800/50">
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-secondary-50 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 text-secondary-600 dark:text-secondary-300 text-[10px] font-black uppercase tracking-widest mb-4">The process</span>
          <h2 className="text-3xl md:text-5xl font-black text-secondary-900 dark:text-white mb-4 tracking-tight">
            Four steps, start to finish
          </h2>
          <p className="text-base text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto font-medium">
            No fixed appointment, no crowded waiting room — just a slot that fits your day.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
          {[
            { num: '01', title: 'Book your slot via the app', desc: 'Open the Vrutta app and pick any 2-hour block between 9 AM and 8 PM — morning, afternoon or evening, whatever suits you.', icon: <Play className="w-5 h-5" /> },
            { num: '02', title: 'One profession, one seat', desc: 'Every slot holds a single seat per business category, across up to 40 categories — so you\'re never up against someone from your own trade.', icon: <UserCheck className="w-5 h-5" /> },
            { num: '03', title: 'Meet, talk, connect', desc: 'Walk in, meet fellow business owners face-to-face, and explore referral opportunities — all within a focused 2-hour window.', icon: <Users className="w-5 h-5" /> },
            { num: '04', title: 'Book more slots, same day', desc: 'Slots run all day, every day. Book several in one day to meet more owners and build visibility faster.', icon: <RefreshCw className="w-5 h-5" /> }
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="p-8 md:p-10 bg-white dark:bg-secondary-900 rounded-[2rem] border border-secondary-200 dark:border-secondary-800 shadow-sm hover:shadow-md transition-shadow group flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 rounded-2xl bg-secondary-50 dark:bg-secondary-800 text-secondary-900 dark:text-white flex items-center justify-center font-black text-lg border border-secondary-200 dark:border-secondary-700 group-hover:bg-primary-500 group-hover:text-white group-hover:border-primary-500 transition-colors">
                  {step.num}
                </div>
                <div className="text-secondary-300 dark:text-secondary-700 group-hover:text-primary-300 dark:group-hover:text-primary-700 transition-colors">
                  {step.icon}
                </div>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-secondary-900 dark:text-white mb-3">{step.title}</h3>
              <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ==================== CAPACITY SECTION ==================== */}
      <section className="py-16 md:py-24 px-4 bg-secondary-50 dark:bg-black text-secondary-900 dark:text-white relative overflow-hidden border-y border-secondary-200 dark:border-secondary-900/50">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-white dark:bg-white/10 border border-secondary-200 dark:border-white/20 text-secondary-600 dark:text-white/70 text-[10px] font-black uppercase tracking-widest mb-6">Capacity</span>
            <div className="text-7xl md:text-8xl lg:text-[140px] font-black leading-none mb-6 tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-secondary-900 to-secondary-400 dark:from-white dark:to-white/40">
              40<span className="text-primary-500 text-5xl md:text-6xl align-top">*</span>
            </div>
            <p className="text-lg md:text-xl font-medium text-secondary-600 dark:text-white/80 leading-relaxed max-w-md">
              Business categories can hold a seat in a single slot — <strong className="text-secondary-900 dark:text-white">one member per profession</strong>, so the mix in the room stays wide and non-competing.
            </p>
            <p className="text-xs text-secondary-400 dark:text-white/40 mt-6 font-medium italic">*Category count may vary by office and city.</p>
          </div>

          <div className="relative">
            {/* Visual Dot Grid showing 40 seats */}
            <div className="grid grid-cols-8 gap-2 md:gap-3 max-w-sm mx-auto lg:mx-0 p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-secondary-200 dark:border-white/10 backdrop-blur-sm shadow-sm dark:shadow-none">
              {Array.from({ length: 40 }).map((_, i) => {
                // Randomly highlight some dots to show "booked" seats
                const isBooked = i % 5 === 0 || i % 7 === 0 || i % 11 === 0;
                const isUser = i === 18;
                return (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: (i % 8) * 0.05 + Math.floor(i / 8) * 0.05, type: 'spring' }}
                    className={`aspect-square rounded-lg flex items-center justify-center transition-colors ${
                      isUser ? 'bg-primary-500 shadow-[0_0_15px_rgba(var(--color-primary-500),0.5)]' : 
                      isBooked ? 'bg-secondary-200 dark:bg-white/20' : 'bg-secondary-50 dark:bg-white/5 border border-secondary-100 dark:border-white/10'
                    }`}
                  >
                    {isUser && <ShieldCheck className="w-3 h-3 text-white" />}
                  </motion.div>
                );
              })}
            </div>
            <div className="absolute -bottom-6 -right-6 md:bottom-10 md:-right-10 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white rounded-xl p-4 shadow-xl max-w-[200px] border border-secondary-200 dark:border-secondary-800">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-3 h-3 rounded-full bg-primary-500" />
                <span className="text-xs font-black uppercase tracking-wider">Your Seat</span>
              </div>
              <p className="text-[10px] text-secondary-500 dark:text-secondary-400 font-medium leading-tight">Exclusive to your profession for this 2-hour block.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== NO DAILY LIMIT ==================== */}
      <section className="py-16 md:py-24 px-4 max-w-7xl mx-auto border-b border-secondary-100 dark:border-secondary-800/50">
        <div className="bg-primary-50/50 dark:bg-primary-900/10 rounded-[3rem] p-8 md:p-16 border border-primary-100 dark:border-primary-800/30">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 text-secondary-600 dark:text-secondary-300 text-[10px] font-black uppercase tracking-widest mb-6">No daily limit</span>
              <h2 className="text-3xl md:text-5xl font-black text-secondary-900 dark:text-white mb-6 tracking-tight">
                Attend as many slots as your day allows
              </h2>
              <p className="text-base md:text-lg text-secondary-600 dark:text-secondary-400 font-medium leading-relaxed">
                Since meetings run back-to-back from 9 AM to 8 PM, you can book and attend multiple different slots in the same day — each one a fresh room of business owners.
              </p>
            </div>
            
            <div className="relative h-24 md:h-32 flex items-center justify-center">
              {/* Animated Track */}
              <div className="absolute left-0 right-0 h-1.5 bg-secondary-200 dark:bg-secondary-800 rounded-full" />
              <motion.div 
                className="absolute left-0 h-1.5 bg-primary-500 rounded-full"
                initial={{ width: "0%" }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
              
              <div className="absolute left-0 right-0 flex justify-between px-2">
                {[1, 2, 3, 4, 5].map((node, i) => (
                  <div key={i} className="relative flex flex-col items-center">
                    <motion.div 
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.4, type: "spring" }}
                      className={`w-4 h-4 md:w-6 md:h-6 rounded-full border-[3px] border-white dark:border-secondary-900 z-10 ${i % 2 === 0 ? 'bg-primary-500 shadow-md shadow-primary-500/30' : 'bg-secondary-300 dark:bg-secondary-700'}`} 
                    />
                    {i % 2 === 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.4 + 0.2 }}
                        className="absolute top-8 whitespace-nowrap text-[10px] md:text-xs font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest bg-white dark:bg-secondary-800 px-3 py-1 rounded-full border border-secondary-200 dark:border-secondary-700 shadow-sm"
                      >
                        Attended
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FINAL CTA ==================== */}
      <section className="py-16 md:py-24 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block px-3 py-1 rounded-full bg-secondary-50 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 text-secondary-600 dark:text-secondary-300 text-[10px] font-black uppercase tracking-widest mb-6">Ready when you are</span>
          <h2 className="text-3xl md:text-5xl font-black text-secondary-900 dark:text-white mb-6 tracking-tight">
            Book your first slot today
          </h2>
          <p className="text-base md:text-lg text-secondary-600 dark:text-secondary-400 font-medium mb-10 max-w-xl mx-auto">
            Real conversations, at your own pace, with the right mix of people — no scheduling conflicts, no crowded rooms, no wasted time.
          </p>
          
          <Link 
            href="/events/calendar"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-xl font-black hover:bg-primary-700 transition-all shadow-md shadow-primary-500/20 active:scale-95 text-sm uppercase tracking-wider mb-6"
          >
            Explore Vrutta Events <ArrowRight className="w-4 h-4" />
          </Link>
          
          <p className="text-xs text-secondary-500 dark:text-secondary-500 font-medium">
            Slots are first-come, first-served. One seat per profession, per slot.
          </p>
        </div>
      </section>

    </div>
  );
}
