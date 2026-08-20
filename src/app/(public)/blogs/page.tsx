'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, BookOpen, Clock, Calendar } from 'lucide-react';
import blogsData from '@/lib/data/blogs.json';

export default function BlogsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-secondary-950 overflow-x-hidden selection:bg-primary-500/30">
      {/* ==================== HERO SECTION ==================== */}
      <section className="relative pt-8 pb-4 md:pt-12 md:pb-8 px-4 flex flex-col items-center justify-center text-center">
        {/* Subtle Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[250px] pointer-events-none">
          <div className="absolute top-4 left-1/4 w-[250px] h-[250px] bg-primary-100 dark:bg-primary-900/20 blur-[80px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-50" />
          <div className="absolute top-8 right-1/4 w-[200px] h-[200px] bg-blue-100 dark:bg-blue-900/20 blur-[80px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-50" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-4xl mx-auto"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 text-secondary-900 dark:text-secondary-300 text-[10px] font-black uppercase tracking-[0.2em] mb-3 shadow-sm">
            <BookOpen className="w-3.5 h-3.5 text-primary-500" />
            Insights & Stories
          </span>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-secondary-900 dark:text-white mb-4 tracking-tight leading-[1.1]">
            Insights for the <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600 dark:from-primary-400 dark:to-blue-400">
              Modern Business
            </span>
          </h1>
          
          <p className="text-sm md:text-base text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto mb-4 leading-relaxed font-medium">
            Discover strategies, success stories, and actionable insights to grow your business, build trust, and turn visibility into real opportunity.
          </p>
        </motion.div>
      </section>

      {/* ==================== BLOGS GRID SECTION ==================== */}
      <section className="py-8 md:py-12 px-4 max-w-7xl mx-auto border-t border-secondary-100 dark:border-secondary-800/50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogsData.map((blog, index) => (
            <motion.div
              key={blog.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group flex flex-col bg-white dark:bg-secondary-900 rounded-[2rem] border border-secondary-200 dark:border-secondary-800 overflow-hidden shadow-sm hover:shadow-md transition-all hover:border-primary-200 dark:hover:border-primary-800"
            >
              {/* Card Image */}
              <div className="h-48 relative overflow-hidden bg-secondary-100 dark:bg-secondary-800">
                {blog.image ? (
                  <img 
                    src={blog.image} 
                    alt={blog.title} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary-100 to-secondary-50 dark:from-secondary-800 dark:to-secondary-900/50 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-secondary-300 dark:text-secondary-700 group-hover:scale-110 transition-transform duration-500" />
                  </div>
                )}
                <div className="absolute inset-0 bg-primary-500/0 group-hover:bg-primary-500/10 transition-colors pointer-events-none" />
              </div>
              
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-4 text-[10px] font-black uppercase tracking-widest text-secondary-500 dark:text-secondary-400">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(blog.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {blog.readTime}</span>
                </div>
                
                <h3 className="text-xl font-black text-secondary-900 dark:text-white mb-3 leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  <Link href={`/blogs/${blog.slug}`} className="focus:outline-none">
                    <span className="absolute inset-0" aria-hidden="true" />
                    {blog.title}
                  </Link>
                </h3>
                
                <p className="text-sm text-secondary-600 dark:text-secondary-400 font-medium leading-relaxed mb-6 flex-1 line-clamp-3">
                  {blog.excerpt}
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-secondary-100 dark:border-secondary-800/50">
                   <span className="text-xs font-bold text-secondary-900 dark:text-white">{blog.author}</span>
                   <span className="text-primary-600 dark:text-primary-500 flex items-center gap-1 text-[11px] font-black uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                     Read Article <ArrowRight className="w-3.5 h-3.5" />
                   </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
