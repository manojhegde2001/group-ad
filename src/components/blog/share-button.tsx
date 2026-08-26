'use client';

import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { toast } from 'react-hot-toast'; // Assuming react-hot-toast is installed based on standard Next.js stacks (I will check or fallback to simple UI)
import { logger } from '@/lib/logger';

export function ShareButton({ title, text, url }: { title: string; text: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const fullUrl = `${window.location.origin}${url}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: fullUrl,
        });
      } catch (err) {
        // Fallback to clipboard if share fails (e.g., user cancels)
        copyToClipboard(fullUrl);
      }
    } else {
      copyToClipboard(fullUrl);
    }
  };

  const copyToClipboard = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied to clipboard!');
    }).catch(err => {
      logger.error('Failed to copy', err);
    });
  };

  return (
    <button 
      onClick={handleShare}
      className="w-10 h-10 rounded-full bg-secondary-100 dark:bg-secondary-900 flex items-center justify-center text-secondary-600 dark:text-secondary-400 hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 transition-colors"
      title="Share this article"
    >
      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
    </button>
  );
}
