import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Calendar, User, Share2 } from 'lucide-react';
import blogsData from '@/lib/data/blogs.json';
import { ShareButton } from '@/components/blog/share-button';



export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = blogsData.find((b) => b.slug === slug);

  if (!blog) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white dark:bg-secondary-950 overflow-x-hidden selection:bg-primary-500/30 pb-20">
      
      {/* ==================== ARTICLE HEADER ==================== */}
      <header className="relative pt-12 pb-10 md:pt-20 md:pb-16 px-4 flex flex-col items-center justify-center text-center border-b border-secondary-100 dark:border-secondary-800/50">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[400px] pointer-events-none">
          <div className="absolute top-10 left-1/4 w-[300px] h-[300px] bg-primary-100 dark:bg-primary-900/20 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-70" />
        </div>

        <div className="relative z-10 w-full max-w-3xl mx-auto">
          <Link 
            href="/blogs" 
            className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-secondary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-8"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Blogs
          </Link>
          
          <div className="flex flex-wrap items-center justify-center gap-4 mb-6 text-[10px] font-black uppercase tracking-widest text-secondary-500 dark:text-secondary-400">
            <span className="flex items-center gap-1 bg-secondary-50 dark:bg-secondary-900 px-3 py-1 rounded-full"><Calendar className="w-3 h-3" /> {new Date(blog.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric'})}</span>
            <span className="flex items-center gap-1 bg-secondary-50 dark:bg-secondary-900 px-3 py-1 rounded-full"><Clock className="w-3 h-3" /> {blog.readTime}</span>
            <span className="flex items-center gap-1 bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 px-3 py-1 rounded-full">{blog.category}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-secondary-900 dark:text-white mb-8 tracking-tight leading-[1.1]">
            {blog.title}
          </h1>
          
          <div className="flex items-center justify-center gap-3 mb-10">
             <div className="w-10 h-10 rounded-full bg-secondary-200 dark:bg-secondary-800 flex items-center justify-center text-secondary-600 dark:text-secondary-400">
               <User className="w-5 h-5" />
             </div>
             <div className="text-left">
               <div className="text-sm font-bold text-secondary-900 dark:text-white">{blog.author}</div>
             </div>
          </div>
        </div>
      </header>

      {/* ==================== HERO IMAGE ==================== */}
      {(blog as any).image && (
        <div className="max-w-5xl mx-auto px-4 -mt-12 relative z-20 mb-12">
          <div className="relative aspect-[21/9] md:aspect-[2.5/1] w-full rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl border border-secondary-200 dark:border-secondary-800 bg-secondary-100 dark:bg-secondary-900">
            <Image
              src={(blog as any).image}
              alt={blog.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
            />
          </div>
        </div>
      )}

      {/* ==================== ARTICLE CONTENT ==================== */}
      <article className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        <div className="prose prose-lg dark:prose-invert prose-headings:font-black prose-headings:tracking-tight prose-a:text-primary-600 dark:prose-a:text-primary-400 hover:prose-a:text-primary-700 prose-img:rounded-2xl prose-img:shadow-md mx-auto">
          {blog.content.map((block: any, index: number) => {
            switch (block.type) {
              case 'paragraph':
                return <p key={index} className="text-secondary-700 dark:text-secondary-300 leading-relaxed mb-6">{block.text}</p>;
              case 'heading':
                return <h2 key={index} className="text-2xl md:text-3xl font-black text-secondary-900 dark:text-white mt-12 mb-6">{block.text}</h2>;
              case 'subheading':
                return <h3 key={index} className="text-xl md:text-2xl font-bold text-secondary-900 dark:text-white mt-8 mb-4">{block.text}</h3>;
              case 'list':
                return (
                  <ul key={index} className="space-y-3 mb-8 ml-6 list-disc marker:text-primary-500">
                    {block.items.map((item: string, i: number) => (
                      <li key={i} className="text-secondary-700 dark:text-secondary-300 pl-2">{item}</li>
                    ))}
                  </ul>
                );
              case 'quote':
                return (
                  <blockquote key={index} className="border-l-4 border-primary-500 pl-6 my-8 italic text-lg text-secondary-800 dark:text-secondary-200 bg-primary-50/50 dark:bg-primary-900/10 py-4 pr-4 rounded-r-xl">
                    &quot;{block.text}&quot;
                  </blockquote>
                );
              default:
                return null;
            }
          })}
        </div>
        
        {/* ==================== ARTICLE FOOTER ==================== */}
        <div className="mt-16 pt-8 border-t border-secondary-200 dark:border-secondary-800 flex flex-col sm:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-3">
             <span className="text-sm font-bold text-secondary-900 dark:text-white">Share this article:</span>
             <ShareButton title={blog.title} text={blog.excerpt} url={`/blogs/${blog.slug}`} />
           </div>
        </div>
      </article>

    </div>
  );
}
