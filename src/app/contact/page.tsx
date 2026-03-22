'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageCircle, Clock, Globe } from 'lucide-react';
import Link from 'next/link';

const contactInfo = [
  {
    icon: <Phone className="w-6 h-6" />,
    title: 'Call Us',
    value: '+91 8431029460',
    href: 'tel:+918431029460',
    description: 'Mon-Fri from 9am to 6pm.',
  },
  {
    icon: <Mail className="w-6 h-6" />,
    title: 'Email Us',
    value: 'manojhegde2001@gmail.com',
    href: 'mailto:manojhegde2001@gmail.com',
    description: 'We usually respond within 24 hours.',
  },
  {
    icon: <MessageCircle className="w-6 h-6" />,
    title: 'Live Chat',
    value: 'Available in App',
    href: '#',
    description: 'Instant professional support.',
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-secondary-950 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 bg-secondary-50 dark:bg-secondary-900/50 overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-sm font-bold mb-6">
              <Clock className="w-4 h-4" />
              We're here for you
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-secondary-900 dark:text-white mb-6">
              Get in Touch with <span className="text-primary-600">Group Ad</span>
            </h1>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto font-medium">
              Have questions about our enterprise features or need technical assistance? Our team is ready to help you thrive.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 -mt-16 pb-32">
        <div className="grid lg:grid-cols-3 gap-8">
          {contactInfo.map((info, i) => (
            <motion.a
                key={i}
                href={info.href}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-white dark:bg-secondary-900 rounded-[2.5rem] shadow-xl shadow-secondary-200/50 dark:shadow-none border border-secondary-100 dark:border-secondary-800 hover:border-primary-500 transition-all group"
            >
                <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {info.icon}
                </div>
                <h3 className="text-xl font-black text-secondary-900 dark:text-white mb-2">{info.title}</h3>
                <p className="text-lg font-bold text-primary-600 mb-2 truncate">{info.value}</p>
                <p className="text-sm text-secondary-500 dark:text-secondary-400 font-medium">
                    {info.description}
                </p>
            </motion.a>
          ))}
        </div>

        {/* Contact Form Section */}
        <div className="mt-20 grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
            >
                <h2 className="text-3xl font-black text-secondary-900 dark:text-white mb-6">Reach out to us directly</h2>
                <p className="text-lg text-secondary-600 dark:text-secondary-400 mb-10 leading-relaxed font-medium">
                    Fill out the form and our team will get back to you within 24 hours with a personalized response.
                </p>
                
                <div className="space-y-8">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center shrink-0">
                            <MapPin className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
                        </div>
                        <div>
                            <p className="font-bold text-secondary-900 dark:text-white">Global Headquarters</p>
                            <p className="text-secondary-500 dark:text-secondary-400">123 Business Avenue, Tech Park, City, India</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="p-10 bg-white dark:bg-secondary-900 rounded-[3rem] shadow-2xl border border-secondary-100 dark:border-secondary-800"
            >
                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-secondary-700 dark:text-secondary-300 ml-1">First Name</label>
                            <input 
                                type="text" 
                                placeholder="John"
                                className="w-full px-6 py-4 rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-secondary-50 dark:bg-secondary-950 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-secondary-700 dark:text-secondary-300 ml-1">Last Name</label>
                            <input 
                                type="text" 
                                placeholder="Doe"
                                className="w-full px-6 py-4 rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-secondary-50 dark:bg-secondary-950 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-secondary-700 dark:text-secondary-300 ml-1">Work Email</label>
                        <input 
                            type="email" 
                            placeholder="john@company.com"
                            className="w-full px-6 py-4 rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-secondary-50 dark:bg-secondary-950 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-secondary-700 dark:text-secondary-300 ml-1">Message</label>
                        <textarea 
                            rows={4}
                            placeholder="Tell us how we can help..."
                            className="w-full px-6 py-4 rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-secondary-50 dark:bg-secondary-950 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none"
                        />
                    </div>
                    <button className="w-full py-5 bg-primary-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/20 active:scale-[0.98]">
                        Send Message <Send className="w-5 h-5" />
                    </button>
                </form>
            </motion.div>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="py-12 border-t border-secondary-100 dark:border-secondary-900 text-center">
        <p className="text-sm font-bold flex items-center justify-center gap-2 text-secondary-500">
            <span className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white text-xs font-black">G</span>
            Group Ad Support • Connecting Businesses Worldwide
        </p>
      </footer>
    </div>
  );
}
