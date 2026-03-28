'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, User, Shield, Ban, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import toast from 'react-hot-toast';

interface UserEditModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function UserEditModal({ user, isOpen, onClose, onRefresh }: UserEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    userType: '',
    categoryId: '',
    verificationStatus: '',
    companyName: '',
    industry: '',
    website: '',
    websiteLabel: '',
  });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        userType: user.userType || 'INDIVIDUAL',
        categoryId: user.categoryId || 'NONE',
        verificationStatus: user.verificationStatus || 'UNVERIFIED',
        companyName: user.companyName || '',
        industry: user.industry || '',
        website: user.website || '',
        websiteLabel: user.websiteLabel || '',
      });
    }
  }, [user]);

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success('User updated successfully');
        onRefresh();
        onClose();
      } else {
        toast.error(result.error || 'Update failed');
      }
    } catch {
      toast.error('Internal server error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user || !mounted) return null;

  const isVerified = form.verificationStatus === 'VERIFIED';
  const f = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  const modal = (
    // ── Full-screen overlay ──
    <div
      className="fixed inset-0 z-[9999]"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/*
        Layout strategy:
        Mobile  → full-height flex column, sheet fills the screen
        Desktop → centered card with auto height, max capped
      */}
      <div
        className="absolute inset-0 flex flex-col sm:items-center sm:justify-center sm:p-6"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className="
            relative flex flex-col w-full h-full
            bg-white dark:bg-secondary-950
            border-t border-secondary-100 dark:border-secondary-800
            sm:h-auto sm:max-h-[90vh]
            sm:w-auto sm:min-w-[600px] sm:max-w-4xl
            sm:rounded-2xl sm:border sm:shadow-2xl
          "
          onClick={e => e.stopPropagation()}
        >
          {/* Drag handle — mobile only */}
          <div className="flex justify-center pt-3 pb-1 shrink-0 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-secondary-200 dark:bg-secondary-700" />
          </div>

          {/* ── Header ── */}
          <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-secondary-100 dark:border-secondary-800 bg-secondary-50/60 dark:bg-secondary-900/40 sm:rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center text-white shadow overflow-hidden shrink-0">
                {user?.avatar
                  ? <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                  : <User className="w-[18px] h-[18px]" />}
              </div>
              <div>
                <h2 className="text-sm font-black text-secondary-900 dark:text-white uppercase tracking-tight leading-none">
                  Edit Profile
                </h2>
                <p className="text-[9px] font-bold text-secondary-400 tracking-widest uppercase flex items-center gap-1 mt-0.5">
                  <Shield className="w-2.5 h-2.5" /> ID: {user?.id?.slice(-12)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors touch-manipulation"
            >
              <X className="w-5 h-5 text-secondary-400" />
            </button>
          </div>

          {/* ── Scrollable body ── */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5"
            style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
          >
            {/* IDENTITY */}
            <Section label="Identity">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Input label="Full Name" placeholder="John Doe"
                  value={form.name} onChange={e => f('name', e.target.value)} />
                <Input label="Email" placeholder="john@example.com"
                  value={form.email} onChange={e => f('email', e.target.value)} />
                <Select label="Account Type" value={form.userType}
                  onChange={val => f('userType', val)}
                  options={[
                    { label: 'Individual', value: 'INDIVIDUAL' },
                    { label: 'Business', value: 'BUSINESS' },
                    { label: 'Admin', value: 'ADMIN' },
                  ]}
                />
              </div>
            </Section>

            {/* VERIFICATION */}
            <Section label="Verification">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select label="Primary Interest" value={form.categoryId}
                  onChange={val => f('categoryId', val)}
                  options={[
                    { label: 'None / General', value: 'NONE' },
                    ...categories.map(c => ({ label: c.name, value: c.id })),
                  ]}
                />
                <Select label="Trust Status" value={form.verificationStatus}
                  onChange={val => f('verificationStatus', val)}
                  options={[
                    { label: 'Unverified', value: 'UNVERIFIED' },
                    { label: 'Pending Review', value: 'PENDING' },
                    { label: 'Verified', value: 'VERIFIED' },
                    { label: 'Rejected', value: 'REJECTED' },
                  ]}
                />
              </div>
              {isVerified && (
                <button
                  onClick={() => {
                    f('verificationStatus', 'UNVERIFIED');
                    toast.success('Set to Unverified. Click Save to apply.');
                  }}
                  className="mt-3 flex items-center gap-2 text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 active:scale-95 px-4 py-2.5 rounded-xl transition-all border border-red-200 dark:border-red-500/30 touch-manipulation"
                >
                  <Ban className="w-3.5 h-3.5 shrink-0" /> Revoke Verification
                </button>
              )}
            </Section>

            {/* PROFESSIONAL */}
            <Section label="Professional">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Organization" placeholder="ACME Corp"
                  value={form.companyName} onChange={e => f('companyName', e.target.value)} />
                <Input label="Industry" placeholder="Technology"
                  value={form.industry} onChange={e => f('industry', e.target.value)} />
              </div>
            </Section>

            {/* DIGITAL PRESENCE */}
            <Section label="Digital Presence">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Website" placeholder="https://example.com"
                  value={form.website} onChange={e => f('website', e.target.value)} />
                <Input label="Display Label" placeholder="Portfolio"
                  value={form.websiteLabel} onChange={e => f('websiteLabel', e.target.value)} />
              </div>
            </Section>

            {/* Spacer so last field isn't hidden behind footer / keyboard */}
            <div className="h-2" />
          </div>

          {/* ── Footer ── */}
          <div
            className="shrink-0 flex items-center justify-end gap-3 px-4 sm:px-6 py-3 bg-secondary-50/60 dark:bg-secondary-900/50 border-t border-secondary-100 dark:border-secondary-800 sm:rounded-b-2xl"
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
          >
            <button
              onClick={onClose}
              className="rounded-xl h-11 px-5 font-black uppercase text-[10px] tracking-widest border-2 border-secondary-200 dark:border-secondary-700 hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-700 dark:text-secondary-300 transition-colors touch-manipulation"
            >
              Dismiss
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="rounded-xl h-11 px-7 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 disabled:opacity-60 font-black uppercase text-[10px] tracking-widest text-white shadow-lg transition-all duration-200 flex items-center gap-2 touch-manipulation"
            >
              {loading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Save className="w-3.5 h-3.5" />}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

/* ── Section helper ── */
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-primary-500 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
        {label}
      </p>
      {children}
    </div>
  );
}