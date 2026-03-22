'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  useUpdateProfile, useProfile, useChangePassword, useUploadAvatar,
} from '@/hooks/use-api/use-user';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import {
  User, Lock, Shield, Bell, Globe, ChevronRight, Save,
  Loader2, CheckCircle, LogOut, Eye, EyeOff, Camera,
  MapPin, Twitter, Linkedin, Link2, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from 'next-auth/react';
import toast from 'react-hot-toast';

type Tab = 'profile' | 'security' | 'privacy' | 'notifications';

const TABS: { key: Tab; label: string; icon: any; accent: string }[] = [
  { key: 'profile',       label: 'Profile',       icon: User,   accent: 'text-violet-500 bg-violet-50 dark:bg-violet-900/20'    },
  { key: 'security',      label: 'Security',      icon: Lock,   accent: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'          },
  { key: 'privacy',       label: 'Privacy',       icon: Shield, accent: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
  { key: 'notifications', label: 'Notifications', icon: Bell,   accent: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20'       },
];

const inputCls =
  'w-full bg-secondary-50 dark:bg-secondary-800/60 border border-secondary-200 dark:border-secondary-700 ' +
  'rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 ring-primary-500/30 transition-all ' +
  'placeholder:text-secondary-300 dark:placeholder:text-secondary-600 text-secondary-900 dark:text-white';

const labelCls =
  'block text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-1.5';

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({
  label, children, span2 = false,
}: { label: string; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={span2 ? 'sm:col-span-2' : ''}>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={value}
      className={cn(
        'relative w-12 h-6 rounded-full transition-all duration-300 shrink-0',
        value ? 'bg-primary-500' : 'bg-secondary-300 dark:bg-secondary-600',
      )}
    >
      <span className={cn(
        'absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300',
        value ? 'left-7' : 'left-1',
      )} />
    </button>
  );
}

// ── Settings Card ─────────────────────────────────────────────────────────────
function SettingsCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'bg-white dark:bg-secondary-900 rounded-3xl border border-secondary-100 dark:border-secondary-800 shadow-sm',
      className,
    )}>
      {children}
    </div>
  );
}

// ── Section Title ─────────────────────────────────────────────────────────────
function SectionTitle({
  icon: Icon, label, accent,
}: { icon: any; label: string; accent: string }) {
  const [iconColor, ...bgParts] = accent.split(' ');
  return (
    <div className="flex items-center gap-2.5 mb-6">
      <div className={cn('p-1.5 rounded-lg', bgParts.join(' '))}>
        <Icon className={cn('w-3.5 h-3.5', iconColor)} />
      </div>
      <span className="text-[11px] font-black text-secondary-500 uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}

// ── Avatar Uploader ───────────────────────────────────────────────────────────
function AvatarUploader({
  src, name, uploading, onFileChange, fileRef,
}: {
  src?: string;
  name: string;
  uploading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="relative group">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      {/* Glow ring — spins while uploading, glows on hover */}
      <div className={cn(
        'absolute -inset-1 rounded-full transition-all duration-500 pointer-events-none',
        uploading
          ? 'bg-gradient-to-br from-primary-400 via-violet-400 to-pink-400 opacity-75 blur-sm animate-spin'
          : 'bg-gradient-to-br from-primary-300 via-violet-300 to-pink-300 opacity-0 group-hover:opacity-50 blur-sm',
      )} />

      {/* Clickable button */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="relative block rounded-full focus:outline-none focus-visible:ring-4 ring-primary-500/30"
      >
        {/* White border ring */}
        <div className="p-1 bg-white dark:bg-secondary-900 rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.2)]">

          {/* Fixed size container — Avatar fills this exactly */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden">
            <Avatar
              src={src}
              name={name}
              rounded="full"
              className="!w-full !h-full object-cover"
            />

            {/* Hover / upload overlay */}
            <div className={cn(
              'absolute inset-0 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 rounded-full',
              uploading
                ? 'bg-black/60 backdrop-blur-sm opacity-100'
                : 'bg-black/0 opacity-0 group-hover:bg-black/50 group-hover:opacity-100',
            )}>
              {uploading ? (
                <>
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                  <span className="text-[9px] font-black text-white/90 uppercase tracking-widest">
                    Uploading
                  </span>
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5 text-white drop-shadow" />
                  <span className="text-[9px] font-black text-white/90 uppercase tracking-widest">
                    Change
                  </span>
                </>
              )}
            </div>
          </div>

        </div>

        {/* Camera badge */}
        {!uploading && (
          <span className="absolute bottom-1 right-1 z-10 w-7 h-7 flex items-center justify-center
                           bg-primary-500 hover:bg-primary-600 active:scale-90 transition-all
                           rounded-full shadow-lg border-2 border-white dark:border-secondary-900">
            <Camera className="w-3.5 h-3.5 text-white" />
          </span>
        )}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { data: profileData, isLoading: profileLoading } = useProfile();
  const { mutate: updateProfile, isPending: savingProfile } = useUpdateProfile();
  const { mutate: changePassword, isPending: changingPassword } = useChangePassword();
  const { mutate: uploadAvatar, isPending: uploadingAvatar } = useUploadAvatar();

  const [tab, setTab] = useState<Tab>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile forms
  const [name, setName]               = useState('');
  const [bio, setBio]                 = useState('');
  const [website, setWebsite]         = useState('');
  const [location, setLocation]       = useState('');
  const [linkedin, setLinkedin]       = useState('');
  const [twitter, setTwitter]         = useState('');
  const [gstNumber, setGstNumber]     = useState('');
  const [phone, setPhone]             = useState('');
  const [address, setAddress]         = useState('');
  const [pincode, setPincode]         = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [visibility, setVisibility]   = useState('PUBLIC');

  // Password forms
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent]         = useState(false);
  const [showNew, setShowNew]                 = useState(false);

  // Notifications
  const [emailNotifs, setEmailNotifs]           = useState(true);
  const [pushNotifs, setPushNotifs]             = useState(true);
  const [connectionNotifs, setConnectionNotifs] = useState(true);
  const [messageNotifs, setMessageNotifs]       = useState(true);

  // ── Business Transition fields ──────────────────────────────────────────────
  const [showBusinessForm, setShowBusinessForm] = useState(false);
  const [categories, setCategories]             = useState<{id: string, name: string}[]>([]);
  const [pendingRequest, setPendingRequest]     = useState<any>(null);
  const [loadingRequest, setLoadingRequest]     = useState(true);
  
  // Business form fields
  const [bsCompanyName, setBsCompanyName]         = useState('');
  const [bsCategoryId, setBsCategoryId]           = useState('');
  const [bsIndustry, setBsIndustry]               = useState('');
  const [bsTurnover, setBsTurnover]               = useState('');
  const [bsCompanySize, setBsCompanySize]         = useState('');
  const [bsEstablishedYear, setBsEstablishedYear] = useState('');
  const [bsCompanyWebsite, setBsCompanyWebsite]   = useState('');
  const [bsReason, setBsReason]                   = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  useEffect(() => {
    // Fetch categories
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data.categories || []))
      .catch(() => {});

    // Fetch pending request
    fetch('/api/user/type-change/request')
      .then(res => res.json())
      .then(data => {
        setPendingRequest(data.request);
      })
      .catch(() => {})
      .finally(() => setLoadingRequest(false));
  }, []);

  const profile = profileData?.user ?? profileData;

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? '');
    setBio(profile.bio ?? '');
    setWebsite(profile.website ?? '');
    setLocation(profile.location ?? '');
    setLinkedin(profile.linkedin ?? '');
    setTwitter(profile.twitter ?? '');
    setGstNumber(profile.gstNumber ?? '');
    setPhone(profile.phone ?? '');
    setAddress(profile.address ?? '');
    setPincode(profile.pincode ?? '');
    setExternalLink(profile.externalLink ?? '');
    setVisibility(profile.visibility ?? 'PUBLIC');
    
    // Auto-fill business fields if already BUSINESS
    if (profile.userType === 'BUSINESS') {
      setBsCompanyName(profile.companyName ?? '');
      setBsCategoryId(profile.categoryId ?? '');
      setBsIndustry(profile.industry ?? '');
      setBsTurnover(profile.turnover ?? '');
      setBsCompanySize(profile.companySize ?? '');
      setBsEstablishedYear(profile.establishedYear ?? '');
      setBsCompanyWebsite(profile.companyWebsite ?? '');
    }
  }, [profile]);

  // ── Auth guards ─────────────────────────────────────────────────────────────
  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  );

  if (!isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-secondary-500 font-medium">Please log in to view settings.</p>
    </div>
  );

  const avatarSrc = profile?.avatar
    ? `${profile.avatar}${profile.avatar.includes('?') ? '&' : '?'}v=${Date.now()}`
    : (user as any)?.avatar;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleProfileSave = () => {
    if (profile?.userType === 'BUSINESS' && !gstNumber) {
      toast.error('GST Number is mandatory for Business users');
      return;
    }
    updateProfile({
      name, bio, website, location, linkedin, twitter,
      visibility, gstNumber, phone, address, pincode, externalLink,
    });
  };

  const handleBusinessRequest = async () => {
    if (!bsCompanyName || !bsCategoryId) {
      toast.error('Company Name and Category are required');
      return;
    }
    setSubmittingRequest(true);
    try {
      const res = await fetch('/api/user/type-change/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: bsCompanyName,
          categoryId: bsCategoryId,
          industry: bsIndustry,
          gstNumber, 
          turnover: bsTurnover,
          companySize: bsCompanySize,
          establishedYear: bsEstablishedYear,
          companyWebsite: bsCompanyWebsite,
          reason: bsReason
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setPendingRequest(data.request);
        setShowBusinessForm(false);
        // Refresh profile data
        window.location.reload();
      } else {
        toast.error(data.error || 'Failed to submit request');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword) { toast.error('Please fill all fields'); return; }
    if (newPassword !== confirmPassword)   { toast.error("Passwords don't match");  return; }
    if (newPassword.length < 6)            { toast.error('Min 6 characters');        return; }
    changePassword({ currentPassword, newPassword }, {
      onSuccess: () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      },
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    uploadAvatar(fd, {
      onSuccess: () => {
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
    });
  };

  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#f6f7fb] dark:bg-secondary-950">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-10">

          {/* ── Sidebar ─────────────────────────────────────────────────────── */}
          <aside className="w-full md:w-60 shrink-0">
            <div className="sticky top-8 space-y-5">

              <div>
                <h1 className="text-2xl font-black text-secondary-900 dark:text-white tracking-tight">
                  Settings
                </h1>
                <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest mt-0.5">
                  Account Management
                </p>
              </div>

              <nav className="space-y-0.5">
                {TABS.map(({ key, label, icon: Icon, accent }) => {
                  const active = tab === key;
                  const [iconColor, ...bgParts] = accent.split(' ');
                  return (
                    <button
                      key={key}
                      onClick={() => setTab(key)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-bold transition-all',
                        active
                          ? 'bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white shadow-sm border border-secondary-100 dark:border-secondary-800'
                          : 'text-secondary-500 hover:bg-white/60 dark:hover:bg-secondary-900/50 hover:text-secondary-800 dark:hover:text-secondary-200',
                      )}
                    >
                      <span className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        active ? bgParts.join(' ') : 'bg-transparent',
                      )}>
                        <Icon className={cn('w-3.5 h-3.5', active ? iconColor : 'text-secondary-400')} />
                      </span>
                      {label}
                      {active && (
                        <ChevronRight className={cn('w-3 h-3 ml-auto', iconColor)} />
                      )}
                    </button>
                  );
                })}

                <div className="pt-3 mt-1 border-t border-secondary-200 dark:border-secondary-800">
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-bold text-red-500
                               hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-colors group"
                  >
                    <span className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 group-hover:bg-red-100 transition-colors">
                      <LogOut className="w-3.5 h-3.5 text-red-500 transition-transform group-hover:-translate-x-0.5" />
                    </span>
                    Sign Out
                  </button>
                </div>
              </nav>

              {/* Account type chip */}
              <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-secondary-900 rounded-2xl border border-secondary-100 dark:border-secondary-800 shadow-sm">
                <span className={cn(
                  "w-2 h-2 rounded-full shadow-[0_0_6px_2px_rgba(52,211,153,0.4)]",
                  profile?.userType === 'BUSINESS' ? 'bg-indigo-400' : 'bg-emerald-400'
                )} />
                <div>
                  <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest">Account Type</p>
                  <p className="text-xs font-black text-secondary-900 dark:text-white uppercase flex items-center gap-1">
                    {profile?.userType === 'BUSINESS' ? (
                       profile?.verificationStatus === 'VERIFIED' ? 'Verified Business' : 'Unverified Business'
                    ) : (
                       profile?.userType ?? 'INDIVIDUAL'
                    )}
                    {profile?.verificationStatus === 'VERIFIED' && <CheckCircle className="w-3 h-3 text-primary-500" />}
                  </p>
                </div>
              </div>

            </div>
          </aside>

          {/* ── Main ────────────────────────────────────────────────────────── */}
          <main className="flex-1 min-w-0 max-w-3xl">

            {/* ════ PROFILE TAB ════════════════════════════════════════════ */}
            {tab === 'profile' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">

                {/* Hero Profile Card */}
                <SettingsCard className="overflow-hidden">

                  {/* Banner */}
                  <div className="relative h-40 bg-gradient-to-br from-violet-600 via-primary-600 to-pink-500 overflow-hidden">
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage:
                          'radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 40%)',
                      }}
                    />
                    <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-white/10 blur-2xl" />
                    <div className="absolute top-4 left-1/3 w-32 h-32 rounded-full bg-pink-300/20 blur-xl" />

                    {/* Username pill on banner */}
                    <div className="absolute top-4 right-4 text-xs">
                      <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full">
                        <div className={cn(
                          "w-2 h-2 rounded-full animate-pulse",
                          profile?.verificationStatus === 'VERIFIED' ? 'bg-emerald-400' : 'bg-secondary-400'
                        )} />
                        <span className="font-black text-white/90">
                          @{(user as any)?.username}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Avatar + identity row */}
                  <div className="px-6 sm:px-8 pb-6">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-5">

                      {/* Avatar — overlaps banner with negative margin */}
                      <div className="-mt-16 shrink-0">
                        <AvatarUploader
                          src={avatarSrc}
                          name={(user?.name as string) ?? ''}
                          uploading={uploadingAvatar}
                          onFileChange={handleAvatarChange}
                          fileRef={fileInputRef}
                        />
                      </div>

                      {/* Name + meta */}
                      <div className="flex-1 sm:pb-2 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mt-1 sm:mt-0">
                          <h2 className="text-xl font-black text-secondary-900 dark:text-white tracking-tight truncate">
                            {(user?.name as string) ?? '—'}
                          </h2>
                          {profile?.userType === 'BUSINESS' && (
                            <span className={cn(
                                "inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shrink-0 border",
                                profile?.verificationStatus === 'VERIFIED' 
                                  ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800"
                                  : "text-amber-600 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800"
                            )}>
                              {profile?.verificationStatus === 'VERIFIED' ? (
                                <><CheckCircle className="w-2.5 h-2.5" /> Verified Business</>
                              ) : (
                                <><Shield className="w-2.5 h-2.5" /> Unverified Business</>
                              )}
                            </span>
                          )}
                        </div>

                        {/* Quick info pills */}
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          {location && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-secondary-500 font-bold">
                              <MapPin className="w-3 h-3" /> {location}
                            </span>
                          )}
                          {website && (
                            <a
                              href={website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-primary-500 font-bold hover:underline"
                            >
                              <Link2 className="w-3 h-3" /> Website
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Save (desktop) */}
                      <div className="hidden sm:block pb-2 shrink-0">
                        <button
                          onClick={handleProfileSave}
                          disabled={savingProfile || profileLoading}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black
                                     bg-secondary-900 dark:bg-white text-white dark:text-secondary-900
                                     hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50"
                        >
                          {savingProfile
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Save className="w-4 h-4" />}
                          {savingProfile ? 'Saving…' : 'Save Changes'}
                        </button>
                      </div>
                    </div>

                    {/* Bio live preview */}
                    {bio && (
                      <p className="mt-4 text-sm text-secondary-500 font-medium leading-relaxed border-t border-secondary-100 dark:border-secondary-800 pt-4">
                        {bio}
                      </p>
                    )}
                  </div>
                </SettingsCard>

                {/* Business Switch Option for Individuals */}
                {profile?.userType === 'INDIVIDUAL' && !showBusinessForm && (
                  <Card className="p-6 border-2 border-dashed border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-3xl animate-in zoom-in-95 duration-400">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
                        <Shield className="w-8 h-8" />
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="text-lg font-black text-secondary-900 dark:text-white uppercase tracking-tight">Switch to Business</h3>
                        <p className="text-sm text-secondary-500 font-medium mt-1">
                          Unlock professional features, get a verified badge, and grow your networking reach.
                        </p>
                      </div>
                      <button 
                        onClick={() => setShowBusinessForm(true)}
                        className="px-6 py-3 bg-white dark:bg-secondary-800 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest border border-indigo-200 dark:border-indigo-700 rounded-2xl hover:bg-indigo-500 hover:text-white transition-all shadow-sm"
                      >
                        Get Started
                      </button>
                    </div>
                  </Card>
                )}

                {/* Business Transition Form */}
                {showBusinessForm && (
                  <SettingsCard className="p-6 sm:p-8 border-2 border-indigo-500/20 animate-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between mb-8">
                       <div>
                         <h3 className="text-lg font-black text-secondary-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                           <Shield className="w-5 h-5 text-indigo-500" />
                           Business Verification
                         </h3>
                         <p className="text-xs text-secondary-400 font-bold uppercase tracking-wider mt-1">Complete your professional identity</p>
                       </div>
                       <button onClick={() => setShowBusinessForm(false)} className="p-2 hover:bg-secondary-50 dark:hover:bg-secondary-800 rounded-xl transition-colors">
                         <X className="w-5 h-5 text-secondary-400" />
                       </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Field label="Business Name *" span2>
                        <input type="text" value={bsCompanyName} onChange={e => setBsCompanyName(e.target.value)} className={inputCls} placeholder="Global Enterprises Inc." />
                      </Field>
                      
                      <Field label="Business Category *">
                        <select value={bsCategoryId} onChange={e => setBsCategoryId(e.target.value)} className={cn(inputCls, "appearance-none")}>
                          <option value="">Select Category</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </Field>

                      <Field label="Industry">
                        <input type="text" value={bsIndustry} onChange={e => setBsIndustry(e.target.value)} className={inputCls} placeholder="E.g. Technology, Real Estate" />
                      </Field>

                      <Field label="GST Number">
                        <input type="text" value={gstNumber} onChange={e => setGstNumber(e.target.value.toUpperCase())} className={inputCls} placeholder="22AAAAA0000A1Z5" />
                      </Field>

                      <Field label="Established Year">
                        <input type="text" value={bsEstablishedYear} onChange={e => setBsEstablishedYear(e.target.value)} className={inputCls} placeholder="2010" />
                      </Field>

                      <Field label="Company Size">
                        <select value={bsCompanySize} onChange={e => setBsCompanySize(e.target.value)} className={cn(inputCls, "appearance-none")}>
                          <option value="">Select Size</option>
                          <option value="1-10">1-10 Employees</option>
                          <option value="11-50">11-50 Employees</option>
                          <option value="51-200">51-200 Employees</option>
                          <option value="200+">200+ Employees</option>
                        </select>
                      </Field>

                      <Field label="Website">
                         <input type="url" value={bsCompanyWebsite} onChange={e => setBsCompanyWebsite(e.target.value)} className={inputCls} placeholder="https://business.com" />
                      </Field>

                      <Field label="Reason for Switch" span2>
                        <textarea value={bsReason} onChange={e => setBsReason(e.target.value)} className={cn(inputCls, "resize-none")} rows={3} placeholder="Tell us why you want to switch to a business account..." />
                      </Field>
                    </div>

                    <div className="mt-8 flex gap-3">
                      <button
                        onClick={handleBusinessRequest}
                        disabled={submittingRequest}
                        className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                      >
                        {submittingRequest ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                        {submittingRequest ? 'Submitting...' : 'Submit Request'}
                      </button>
                      <button
                        onClick={() => setShowBusinessForm(false)}
                        className="px-6 py-4 bg-secondary-100 dark:bg-secondary-800 text-secondary-500 font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </SettingsCard>
                )}

                {/* Pending Verification Status */}
                {profile?.userType === 'BUSINESS' && profile?.verificationStatus === 'PENDING' && (
                  <Card className="p-6 border-2 border-dashed border-amber-100 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-950/20 rounded-3xl animate-in zoom-in-95">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 shrink-0">
                        <Loader2 className="w-8 h-8 animate-spin" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-secondary-900 dark:text-white uppercase tracking-tight">Verification Pending</h3>
                        <p className="text-sm text-secondary-500 font-medium mt-1">
                          Our team is currently reviewing your business information. This usually takes 24-48 hours.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Main Profile Sections */}
                {profileLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                  </div>
                ) : !showBusinessForm && (
                  <div className="space-y-5">
                    {/* Identity Card */}
                    <SettingsCard className="p-6 sm:p-8">
                      <SectionTitle
                        icon={User}
                        label="Identity"
                        accent="text-violet-500 bg-violet-100 dark:bg-violet-900/30"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Full Name" span2>
                          <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className={inputCls}
                            placeholder="Your full name"
                          />
                        </Field>

                        <Field label="Location">
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary-400 pointer-events-none" />
                            <input
                              type="text"
                              value={location}
                              onChange={e => setLocation(e.target.value)}
                              className={cn(inputCls, 'pl-9')}
                              placeholder="City, Country"
                            />
                          </div>
                        </Field>

                        <Field label="Phone">
                          <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            className={inputCls}
                            placeholder="+91 00000 00000"
                          />
                        </Field>

                        <Field label="Bio" span2>
                          <textarea
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                            rows={3}
                            maxLength={300}
                            placeholder="Write a short bio…"
                            className={cn(inputCls, 'resize-none')}
                          />
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[10px] text-secondary-300 font-bold">Max 300 chars</span>
                            <span className={cn(
                              'text-[10px] font-black',
                              bio.length > 260 ? 'text-amber-400' : 'text-secondary-400',
                            )}>
                              {bio.length}/300
                            </span>
                          </div>
                        </Field>
                      </div>
                    </SettingsCard>

                    {/* Professional Links */}
                    <SettingsCard className="p-6 sm:p-8">
                      <SectionTitle
                        icon={Globe}
                        label="Professional Links"
                        accent="text-blue-500 bg-blue-100 dark:bg-blue-900/30"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Website" span2>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary-400 pointer-events-none" />
                            <input
                              type="url"
                              value={website}
                              onChange={e => setWebsite(e.target.value)}
                              className={cn(inputCls, 'pl-9')}
                              placeholder="https://yoursite.com"
                            />
                          </div>
                        </Field>

                        <Field label="LinkedIn">
                          <div className="relative">
                            <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary-400 pointer-events-none" />
                            <input
                              type="text"
                              value={linkedin}
                              onChange={e => setLinkedin(e.target.value)}
                              className={cn(inputCls, 'pl-9')}
                              placeholder="linkedin.com/in/you"
                            />
                          </div>
                        </Field>

                        <Field label="Twitter / X">
                          <div className="relative">
                            <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary-400 pointer-events-none" />
                            <input
                              type="text"
                              value={twitter}
                              onChange={e => setTwitter(e.target.value)}
                              className={cn(inputCls, 'pl-9')}
                              placeholder="@handle"
                            />
                          </div>
                        </Field>
                      </div>
                    </SettingsCard>

                    {/* Business Details (Visible if already BUSINESS) */}
                    {profile?.userType === 'BUSINESS' && (
                      <SettingsCard className="p-6 sm:p-8 border-indigo-100 dark:border-indigo-900/40 animate-in fade-in duration-500">
                        <div className="flex items-start justify-between mb-4">
                          <SectionTitle
                            icon={Shield}
                            label="Business Details"
                            accent="text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30"
                          />
                          {profile?.verificationStatus === 'VERIFIED' && (
                            <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600
                                             bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100
                                             dark:border-emerald-800 px-3 py-1.5 rounded-full uppercase tracking-widest shrink-0">
                              <CheckCircle className="w-3.5 h-3.5" /> Approved
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Field label="Business Name" span2>
                            <input type="text" value={bsCompanyName} onChange={e => setBsCompanyName(e.target.value)} className={inputCls} />
                          </Field>
                          <Field label="GST Number *" span2>
                            <input
                              type="text"
                              value={gstNumber}
                              onChange={e => setGstNumber(e.target.value.toUpperCase())}
                              className={inputCls}
                              placeholder="22AAAAA0000A1Z5"
                            />
                          </Field>
                          <Field label="Industry">
                            <input type="text" value={bsIndustry} onChange={e => setBsIndustry(e.target.value)} className={inputCls} />
                          </Field>
                          <Field label="Address" span2>
                            <input
                              type="text"
                              value={address}
                              onChange={e => setAddress(e.target.value)}
                              className={inputCls}
                            />
                          </Field>
                          <Field label="Pincode">
                            <input
                              type="text"
                              value={pincode}
                              onChange={e => setPincode(e.target.value)}
                              className={inputCls}
                            />
                          </Field>
                          <Field label="External Link">
                            <input
                              type="url"
                              value={externalLink}
                              onChange={e => setExternalLink(e.target.value)}
                              className={inputCls}
                              placeholder="https://"
                            />
                          </Field>
                        </div>
                      </SettingsCard>
                    )}

                    {/* Mobile Save Button */}
                    <div className="sm:hidden pb-8">
                      <button
                        onClick={handleProfileSave}
                        disabled={savingProfile || profileLoading}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-secondary-900 dark:bg-white
                                   text-white dark:text-secondary-900 rounded-2xl text-sm font-black shadow-xl
                                   active:scale-95 transition-transform disabled:opacity-50"
                      >
                        {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {savingProfile ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ════ SECURITY TAB ══════════════════════════════════════════ */}
            {tab === 'security' && (
              <SettingsCard className="p-6 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-400">
                <div className="mb-8 pb-6 border-b border-secondary-100 dark:border-secondary-800">
                  <h2 className="text-lg font-black text-secondary-900 dark:text-white">Change Password</h2>
                  <p className="text-sm text-secondary-500 font-medium mt-1">
                    Keep your account secure with a strong password.
                  </p>
                </div>

                <div className="space-y-5 max-w-sm">
                  <Field label="Current Password">
                    <div className="relative">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        className={cn(inputCls, 'pr-10')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600 transition-colors"
                      >
                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>

                  <Field label="New Password">
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className={cn(inputCls, 'pr-10')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600 transition-colors"
                      >
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Strength bar */}
                    {newPassword.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2">
                        {[3, 6, 9, 12].map((threshold, i) => (
                          <div
                            key={i}
                            className={cn(
                              'h-1 flex-1 rounded-full transition-all duration-300',
                              newPassword.length >= threshold
                                ? newPassword.length < 6  ? 'bg-red-400'
                                : newPassword.length < 10 ? 'bg-amber-400'
                                : 'bg-emerald-400'
                                : 'bg-secondary-200 dark:bg-secondary-700',
                            )}
                          />
                        ))}
                        <span className="text-[10px] font-bold text-secondary-400 shrink-0 w-12 text-right">
                          {newPassword.length < 6 ? 'Weak' : newPassword.length < 10 ? 'Fair' : 'Strong'}
                        </span>
                      </div>
                    )}
                  </Field>

                  <Field label="Confirm New Password">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className={cn(
                        inputCls,
                        confirmPassword && confirmPassword !== newPassword
                          ? 'ring-2 ring-red-400/40 border-red-300'
                          : '',
                      )}
                    />
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="text-[11px] text-red-400 font-bold mt-1.5">Passwords don't match</p>
                    )}
                  </Field>
                </div>

                <div className="pt-6">
                  <button
                    onClick={handlePasswordChange}
                    disabled={changingPassword}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600
                               text-white rounded-2xl text-sm font-black transition-all shadow-sm
                               hover:shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    Update Password
                  </button>
                </div>
              </SettingsCard>
            )}

            {/* ════ PRIVACY TAB ════════════════════════════════════════════ */}
            {tab === 'privacy' && (
              <SettingsCard className="p-6 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-400">
                <div className="mb-8 pb-6 border-b border-secondary-100 dark:border-secondary-800">
                  <h2 className="text-lg font-black text-secondary-900 dark:text-white">Privacy Controls</h2>
                  <p className="text-sm text-secondary-500 font-medium mt-1">
                    Decide how your profile appears to others.
                  </p>
                </div>

                <div className="space-y-4 max-xl">
                  <div className="flex items-center justify-between p-5 rounded-2xl bg-secondary-50 dark:bg-secondary-800/60 border border-secondary-100 dark:border-secondary-700">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                        <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-bold text-secondary-900 dark:text-white">Public Profile</p>
                        <p className="text-xs text-secondary-500 font-medium mt-0.5">
                          {visibility === 'PUBLIC' ? 'Visible to everyone' : 'Only connections can see'}
                        </p>
                      </div>
                    </div>
                    <Toggle
                      value={visibility === 'PUBLIC'}
                      onChange={() => setVisibility(v => v === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC')}
                    />
                  </div>

                  <div className={cn(
                    'p-4 rounded-2xl border text-xs font-medium leading-relaxed transition-all duration-300',
                    visibility === 'PUBLIC'
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                      : 'bg-secondary-100 dark:bg-secondary-800/50 border-secondary-200 dark:border-secondary-700 text-secondary-500',
                  )}>
                    {visibility === 'PUBLIC'
                      ? '✓ Your profile and posts are discoverable by everyone on the platform.'
                      : '🔒 Your profile is restricted to your approved connections only.'}
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => updateProfile({ visibility })}
                    disabled={savingProfile}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600
                               text-white rounded-2xl text-sm font-black transition-all shadow-sm
                               active:scale-95 disabled:opacity-50"
                  >
                    {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Apply Settings
                  </button>
                </div>
              </SettingsCard>
            )}

            {/* ════ NOTIFICATIONS TAB ══════════════════════════════════════ */}
            {tab === 'notifications' && (
              <SettingsCard className="p-6 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-400">
                <div className="mb-8 pb-6 border-b border-secondary-100 dark:border-secondary-800">
                  <h2 className="text-lg font-black text-secondary-900 dark:text-white">Email & Alerts</h2>
                  <p className="text-sm text-secondary-500 font-medium mt-1">
                    Control when and how you're notified.
                  </p>
                </div>

                <div className="space-y-3 max-w-xl">
                  {([
                    { label: 'Platform Alerts',     desc: 'In-app messages & updates',     value: emailNotifs,      set: setEmailNotifs,      color: 'text-violet-500', bg: 'bg-violet-100 dark:bg-violet-900/30'    },
                    { label: 'Push Notifications',  desc: 'Direct browser push alerts',    value: pushNotifs,       set: setPushNotifs,       color: 'text-blue-500',   bg: 'bg-blue-100 dark:bg-blue-900/30'        },
                    { label: 'Connection Requests', desc: 'New follow / connect requests', value: connectionNotifs, set: setConnectionNotifs, color: 'text-emerald-500',bg: 'bg-emerald-100 dark:bg-emerald-900/30'  },
                    { label: 'Direct Messages',     desc: 'Private messages received',     value: messageNotifs,    set: setMessageNotifs,    color: 'text-amber-500',  bg: 'bg-amber-100 dark:bg-amber-900/30'      },
                  ] as const).map(({ label, desc, value, set, color, bg }) => (
                    <label
                      key={label}
                      className="flex items-center justify-between p-4 rounded-2xl cursor-pointer
                                 bg-secondary-50 dark:bg-secondary-800/40 border border-secondary-100
                                 dark:border-secondary-800 hover:bg-white dark:hover:bg-secondary-800
                                 transition-colors duration-150 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn('p-2 rounded-xl transition-transform group-hover:scale-110', bg)}>
                          <Bell className={cn('w-3.5 h-3.5', color)} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-secondary-900 dark:text-white">{label}</p>
                          <p className="text-[11px] text-secondary-400 font-medium mt-0.5">{desc}</p>
                        </div>
                      </div>
                      <Toggle value={value} onChange={() => set(!value)} />
                    </label>
                  ))}
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => toast.success('Notification preferences saved!')}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600
                               text-white rounded-2xl text-sm font-black transition-all shadow-sm active:scale-95"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Save Preferences
                  </button>
                </div>
              </SettingsCard>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
