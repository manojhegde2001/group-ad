'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useProfile, useUpdateProfile, useChangePassword, useUploadAvatar, useTypeChangeRequest, useSubmitTypeChangeRequest } from '@/hooks/use-api/use-user';
import { useCategories } from '@/hooks/use-api/use-categories';
import {
  User, Shield, Lock, Bell, Globe, CheckCircle,
  Save, LogOut, ChevronRight, MapPin, Link2, CreditCard,
  Building2, Briefcase, Users, Layout, Map, Compass, Trash2,
  Camera, Loader2, Edit3, X, Eye, EyeOff, Linkedin, Twitter, BarChart3, Phone,
  Zap, Plus, Search, ArrowRight, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, Button, Input, Textarea, Switch, Checkbox } from 'rizzui';
import { Select } from '@/components/ui/select';
import toast from 'react-hot-toast';
import { signOut } from 'next-auth/react';
import { useAuthModal } from '@/hooks/use-modal';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import { PowerTeamGrid } from '@/components/power-teams/PowerTeamGrid';
import { CreateTeamModal } from '@/components/power-teams/CreateTeamModal';
import { EditTeamModal } from '@/components/power-teams/EditTeamModal';
import { usePowerTeams, useMyPowerTeam } from '@/hooks/use-api/use-power-teams';
import { usePowerTeamModal } from '@/hooks/use-power-teams';
import Link from 'next/link';

type Tab = 'profile' | 'security' | 'privacy' | 'notifications' | 'analytics' | 'power-teams';

const TABS: { key: Tab; label: string; icon: any; accent: string; businessOnly?: boolean }[] = [
  { key: 'profile', label: 'My Profile', icon: User, accent: 'text-violet-500 bg-violet-100 dark:bg-violet-900/30' },
  { key: 'security', label: 'Security', icon: Lock, accent: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' },
  { key: 'privacy', label: 'Privacy', icon: Globe, accent: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30' },
  { key: 'notifications', label: 'Alerts', icon: Bell, accent: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30' },
  { key: 'power-teams', label: 'Power Teams', icon: Zap, accent: 'text-rose-500 bg-rose-100 dark:bg-rose-900/30', businessOnly: true },
  { key: 'analytics', label: 'Analytics', icon: BarChart3, accent: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30' },
];

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
  const [websiteLabel, setWebsiteLabel] = useState('');
  const [location, setLocation]       = useState('');
  const [linkedin, setLinkedin]       = useState('');
  const [twitter, setTwitter]         = useState('');
  const [gstNumber, setGstNumber]     = useState('');
  const [phone, setPhone]             = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [phoneVisibility, setPhoneVisibility] = useState('NONE');

  const phoneVisibilityOptions = [
    { label: 'Hide All Numbers', value: 'NONE' },
    { label: 'Primary Only', value: 'PRIMARY' },
    { label: 'Secondary Only', value: 'SECONDARY' },
    { label: 'Both Numbers', value: 'BOTH' },
  ];
  const [address, setAddress]         = useState('');
  const [pincode, setPincode]         = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [visibility, setVisibility]   = useState('PUBLIC');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
  const [messagingEnabled, setMessagingEnabled] = useState(true);

  // Business Transition fields
  const [showBusinessForm, setShowBusinessForm] = useState(false);
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.categories || [];
  const { data: requestData, isLoading: loadingRequest } = useTypeChangeRequest();
  const pendingRequest = requestData?.request;
  const submitTypeChange = useSubmitTypeChangeRequest();
  const submittingRequest = submitTypeChange.isPending;

  // Business form fields
  const [bsCompanyName, setBsCompanyName]         = useState('');
  const [bsCategoryId, setBsCategoryId]           = useState('');
  const [bsIndustry, setBsIndustry]               = useState('');
  const [bsTurnover, setBsTurnover]               = useState('');
  const [bsCompanySize, setBsCompanySize]         = useState('');
  const [bsEstablishedYear, setBsEstablishedYear] = useState('');
  const [bsCompanyWebsite, setBsCompanyWebsite]   = useState('');
  const [bsReason, setBsReason]                   = useState('');

  // Power Teams state
  const [ptCategoryId, setPtCategoryId] = useState<string | null>(null);
  const [ptSearchQuery, setPtSearchQuery] = useState('');
  const { open: openPtModal, openEditTeam } = usePowerTeamModal();
  const { data: myTeam, isLoading: loadingMyTeam } = useMyPowerTeam();
  const { data: teamsData, isLoading: teamsLoading } = usePowerTeams({
    categoryId: ptCategoryId || undefined,
    search: ptSearchQuery || undefined,
  });
  const teams = teamsData?.teams || [];
  const profile = profileData?.user ?? profileData;
  const isAdmin = profile?.userType === 'ADMIN';

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? '');
    setBio(profile.bio ?? '');
    setWebsite(profile.website ?? '');
    setWebsiteLabel(profile.websiteLabel ?? '');
    setLocation(profile.location ?? '');
    setLinkedin(profile.linkedin ?? '');
    setTwitter(profile.twitter ?? '');
    setGstNumber(profile.gstNumber ?? '');
    setPhone(profile.phone ?? '');
    setSecondaryPhone(profile.secondaryPhone ?? '');
    setPhoneVisibility(profile.phoneVisibility ?? 'NONE');
    setAddress(profile.address ?? '');
    setPincode(profile.pincode ?? '');
    setExternalLink(profile.externalLink ?? '');
    setVisibility(profile.visibility ?? 'PUBLIC');
    setMessagingEnabled(profile.messagingEnabled ?? true);
    
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

  const handleProfileSave = () => {
    setFieldErrors({});
    if (profile?.userType === 'BUSINESS' && !gstNumber) {
      toast.error('GST Number is mandatory for Business users');
      setFieldErrors({ gstNumber: 'GST Number is mandatory' });
      return;
    }
    updateProfile({
      name, bio, website, websiteLabel, location, linkedin, twitter,
      visibility, messagingEnabled, gstNumber, phone, secondaryPhone, phoneVisibility, address, pincode, externalLink,
      companyName: bsCompanyName,
    }, {
      onError: (error: any) => {
        if (error.data?.details) {
          setFieldErrors(error.data.details);
          toast.error('Please check the form for errors');
        } else {
          toast.error(error.message || 'Failed to update profile');
        }
      }
    });
  };

  const handleBusinessRequest = () => {
    if (!bsCompanyName || !bsCategoryId) {
      toast.error('Company Name and Category are required');
      return;
    }
    
    submitTypeChange.mutate({
      companyName: bsCompanyName,
      categoryId: bsCategoryId,
      industry: bsIndustry,
      gstNumber, 
      turnover: bsTurnover,
      companySize: bsCompanySize,
      establishedYear: bsEstablishedYear,
      companyWebsite: bsCompanyWebsite,
      reason: bsReason
    }, {
      onSuccess: () => {
        setShowBusinessForm(false);
        // Refresh or sync state if needed, hook already invalidates query.
      }
    });
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

  const avatarSrc = profile?.avatar
    ? `${profile.avatar}${profile.avatar.includes('?') ? '&' : '?'}v=${Date.now()}`
    : (user as any)?.avatar;

  const inputCls = "w-full bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-2xl px-4 py-3 text-sm font-bold text-secondary-900 dark:text-white placeholder:text-secondary-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none disabled:opacity-50";

  return (
    <div className="min-h-screen bg-[#f6f7fb] dark:bg-secondary-950">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-10">

          <aside className="w-full md:w-60 shrink-0">
            <div className="sticky top-8 space-y-5">
              <div>
                <h1 className="text-2xl font-black text-secondary-900 dark:text-white tracking-tight">Settings</h1>
                <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest mt-0.5">Account Management</p>
              </div>

              <nav className="space-y-0.5">
                {TABS.filter(t => !t.businessOnly || profile?.userType === 'BUSINESS' || profile?.userType === 'ADMIN').map(({ key, label, icon: Icon, accent }) => {
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
                      <span className={cn('p-1.5 rounded-lg transition-colors', active ? bgParts.join(' ') : 'bg-transparent')}>
                        <Icon className={cn('w-3.5 h-3.5', active ? iconColor : 'text-secondary-400')} />
                      </span>
                      {label}
                      {active && <ChevronRight className={cn('w-3 h-3 ml-auto', iconColor)} />}
                    </button>
                  );
                })}

                <div className="pt-3 mt-1 border-t border-secondary-200 dark:border-secondary-800">
                  <button
                    onClick={() => signOut({ callbackUrl: window.location.origin })}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-colors group"
                  >
                    <span className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 group-hover:bg-red-100 transition-colors">
                      <LogOut className="w-3.5 h-3.5 text-red-500 transition-transform group-hover:-translate-x-0.5" />
                    </span>
                    Sign Out
                  </button>
                </div>
              </nav>

              <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-secondary-900 rounded-2xl border border-secondary-100 dark:border-secondary-800 shadow-sm">
                <span className={cn("w-2 h-2 rounded-full", profile?.userType === 'BUSINESS' ? 'bg-indigo-400 shadow-[0_0_6px_2px_rgba(129,140,248,0.4)]' : 'bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.4)]')} />
                <div>
                  <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest">Account Type</p>
                  <p className="text-xs font-black text-secondary-900 dark:text-white uppercase flex items-center gap-1">
                    {profile?.userType === 'BUSINESS' ? (profile?.verificationStatus === 'VERIFIED' ? 'Verified Business' : 'Unverified Business') : (profile?.userType ?? 'INDIVIDUAL')}
                    {profile?.verificationStatus === 'VERIFIED' && <CheckCircle className="w-3 h-3 text-primary-500" />}
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1 min-w-0 max-w-3xl">
            {tab === 'profile' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
                <SettingsCard className="overflow-hidden">
                  <div className="relative h-40 bg-gradient-to-br from-violet-600 via-primary-600 to-pink-500 overflow-hidden">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 40%)' }} />
                    <div className="absolute top-4 right-4 text-xs">
                      <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-white/90 font-black">
                         @{(user as any)?.username}
                      </div>
                    </div>
                  </div>
                  <div className="px-6 sm:px-8 pb-6">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                      <div className="-mt-16 shrink-0">
                        <AvatarUploader src={avatarSrc} name={(user?.name as string) ?? ''} uploading={uploadingAvatar} onFileChange={handleAvatarChange} fileRef={fileInputRef} />
                      </div>
                      <div className="flex-1 sm:pb-2 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mt-1 sm:mt-0">
                          <h2 className="text-xl font-black text-secondary-900 dark:text-white tracking-tight truncate">{user?.name as string}</h2>
                          {profile?.userType === 'BUSINESS' && (
                            <span className={cn("inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border", profile?.verificationStatus === 'VERIFIED' ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800" : "text-amber-600 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800")}>
                               {profile?.verificationStatus === 'VERIFIED' ? <CheckCircle className="w-2.5 h-2.5" /> : <Shield className="w-2.5 h-2.5" />}
                               {profile?.verificationStatus === 'VERIFIED' ? 'Verified Business' : 'Unverified Business'}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-secondary-500 font-bold">
                          {location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {location}</span>}
                          {website && <a href={website} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline flex items-center gap-1"><Link2 className="w-3 h-3" /> Website</a>}
                        </div>
                      </div>
                      <div className="hidden sm:block pb-2">
                        <Button onClick={handleProfileSave} isLoading={savingProfile} disabled={profileLoading} className="rounded-2xl font-black px-6 shadow-md shadow-primary-500/10 active:scale-95">Save Changes</Button>
                      </div>
                    </div>
                  </div>
                </SettingsCard>

                {profile?.userType === 'INDIVIDUAL' && !showBusinessForm && (
                  <div className="p-6 border-2 border-dashed border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-3xl flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shrink-0"><Shield className="w-8 h-8" /></div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-lg font-black text-secondary-900 dark:text-white uppercase tracking-tight">Switch to Business</h3>
                      <p className="text-sm text-secondary-500 font-medium mt-1">Unlock professional features and verified badge.</p>
                    </div>
                    <Button variant="outline" onClick={() => setShowBusinessForm(true)} rounded="pill" className="font-black uppercase tracking-widest text-xs h-11 px-8">Get Started</Button>
                  </div>
                )}

                {profile?.userType === 'BUSINESS' && profile?.verificationStatus === 'UNVERIFIED' && !showBusinessForm && (
                  <div className="p-6 border-2 border-dashed border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-950/20 rounded-3xl flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shrink-0"><CheckCircle className="w-8 h-8" /></div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-lg font-black text-secondary-900 dark:text-white uppercase tracking-tight">Get Verified</h3>
                      <p className="text-sm text-secondary-500 font-medium mt-1">Submit your business details for official verification.</p>
                    </div>
                    <Button variant="outline" onClick={() => setShowBusinessForm(true)} rounded="pill" className="font-black uppercase tracking-widest text-xs h-11 px-8">Verify Now</Button>
                  </div>
                )}

                {profile?.userType === 'BUSINESS' && profile?.verificationStatus === 'PENDING' && (
                  <div className="p-6 border-2 border-dashed border-amber-100 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-950/20 rounded-3xl flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shrink-0"><Shield className="w-8 h-8" /></div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-lg font-black text-secondary-900 dark:text-white uppercase tracking-tight">Verification Pending</h3>
                      <p className="text-sm text-secondary-500 font-medium mt-1">Our team is reviewing your business details. We'll notify you soon.</p>
                    </div>
                    <div className="px-6 py-2 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-200 dark:border-amber-800">Under Review</div>
                  </div>
                )}

                {showBusinessForm && (
                  <SettingsCard className="p-6 sm:p-8 border-2 border-indigo-500/20 animate-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between mb-8">
                       <div>
                         <h3 className="text-lg font-black text-secondary-900 dark:text-white uppercase tracking-tight">Business Verification</h3>
                         <p className="text-xs text-secondary-400 font-bold uppercase tracking-wider mt-1">Complete your professional identity</p>
                       </div>
                       <button onClick={() => setShowBusinessForm(false)} className="p-2 hover:bg-secondary-50 dark:hover:bg-secondary-800 rounded-xl transition-colors"><X className="w-5 h-5 text-secondary-400" /></button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                      <Field label="Business Name *" span2><input type="text" value={bsCompanyName} onChange={e => setBsCompanyName(e.target.value)} className={inputCls} placeholder="Global Enterprises Inc." /></Field>
                      <Field label="Business Category *">
                        <select value={bsCategoryId} onChange={e => setBsCategoryId(e.target.value)} className={cn(inputCls, "appearance-none")}>
                          <option value="">Select Category</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </Field>
                      <Field label="Industry"><input type="text" value={bsIndustry} onChange={e => setBsIndustry(e.target.value)} className={inputCls} placeholder="E.g. Technology" /></Field>
                      <Field label="GST Number"><input type="text" value={gstNumber} onChange={e => setGstNumber(e.target.value.toUpperCase())} className={inputCls} placeholder="22AAAAA0000A1Z5" /></Field>
                      <Field label="Reason for Switch" span2><textarea value={bsReason} onChange={e => setBsReason(e.target.value)} className={cn(inputCls, "resize-none")} rows={3} placeholder="Tell us why you want to switch..." /></Field>
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={handleBusinessRequest} isLoading={submittingRequest} className="flex-1 rounded-2xl h-14 font-black uppercase text-xs tracking-widest">Submit Request</Button>
                      <Button variant="outline" onClick={() => setShowBusinessForm(false)} className="rounded-2xl h-14 px-8 font-black uppercase text-xs tracking-widest">Cancel</Button>
                    </div>
                  </SettingsCard>
                )}

                {!showBusinessForm && profileLoading ? (
                  <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
                ) : !showBusinessForm && (
                  <div className="space-y-5">
                    <SettingsCard className="p-6 sm:p-8">
                      <SectionTitle icon={User} label="Identity" accent="text-violet-500 bg-violet-100 dark:bg-violet-900/30" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                        <Field label="Full Name" span2 error={fieldErrors.name}><input type="text" value={name} onChange={e => setName(e.target.value)} className={cn(inputCls, fieldErrors.name && 'ring-1 ring-red-500 border-red-500')} /></Field>
                        <Field label="Location" error={fieldErrors.location}><div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary-400" /><input type="text" value={location} onChange={e => setLocation(e.target.value)} className={cn(inputCls, "pl-9", fieldErrors.location && 'ring-1 ring-red-500 border-red-500')} /></div></Field>
                        <Field label="Primary Phone" error={fieldErrors.phone}><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary-400" /><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={cn(inputCls, "pl-9", fieldErrors.phone && 'ring-1 ring-red-500 border-red-500')} /></div></Field>
                        <Field label="Secondary Phone (Optional)" error={fieldErrors.secondaryPhone}><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary-400" /><input type="tel" value={secondaryPhone} onChange={e => setSecondaryPhone(e.target.value)} className={cn(inputCls, "pl-9", fieldErrors.secondaryPhone && 'ring-1 ring-red-500 border-red-500')} /></div></Field>
                        <Select
                          label="Phone Visibility"
                          value={phoneVisibility}
                          onChange={setPhoneVisibility}
                          options={phoneVisibilityOptions}
                          placeholder="Select visibility"
                          rounded="lg"
                          size="lg"
                          error={fieldErrors.phoneVisibility}
                        />
                        <Field label="Bio" span2 error={fieldErrors.bio}><textarea value={bio} onChange={e => setBio(e.target.value)} className={cn(inputCls, "resize-none", fieldErrors.bio && 'ring-1 ring-red-500 border-red-500')} rows={3} maxLength={300} /><div className="flex justify-end mt-1 text-[10px] font-bold text-secondary-400">{bio.length}/300</div></Field>
                      </div>
                    </SettingsCard>

                    <SettingsCard className="p-6 sm:p-8">
                      <SectionTitle icon={Globe} label="Professional Links" accent="text-blue-500 bg-blue-100 dark:bg-blue-900/30" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                        <Field label="Website URL" span2 error={fieldErrors.website}><div className="relative"><Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary-400" /><input type="url" value={website} onChange={e => setWebsite(e.target.value)} className={cn(inputCls, "pl-9", fieldErrors.website && 'ring-1 ring-red-500 border-red-500')} /></div></Field>
                        <Field label="Website Link Label (e.g. 'Book a Demo')" span2 error={fieldErrors.websiteLabel}><input type="text" value={websiteLabel} onChange={e => setWebsiteLabel(e.target.value)} className={cn(inputCls, fieldErrors.websiteLabel && 'ring-1 ring-red-500 border-red-500')} placeholder="E.g. Book a Demo, Download App" /></Field>
                        <Field label="LinkedIn" error={fieldErrors.linkedin}><div className="relative"><Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary-400" /><input type="text" value={linkedin} onChange={e => setLinkedin(e.target.value)} className={cn(inputCls, "pl-9", fieldErrors.linkedin && 'ring-1 ring-red-500 border-red-500')} /></div></Field>
                        <Field label="Twitter / X" error={fieldErrors.twitter}><div className="relative"><Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary-400" /><input type="text" value={twitter} onChange={e => setTwitter(e.target.value)} className={cn(inputCls, "pl-9", fieldErrors.twitter && 'ring-1 ring-red-500 border-red-500')} /></div></Field>
                      </div>
                    </SettingsCard>

                    {profile?.userType === 'BUSINESS' && (
                      <SettingsCard className="p-6 sm:p-8 border-indigo-100 ring-2 ring-indigo-500/5">
                        <SectionTitle icon={Shield} label="Business Details" accent="text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                          <Field label="Business Name" span2 error={fieldErrors.companyName}><input type="text" value={bsCompanyName} onChange={e => setBsCompanyName(e.target.value)} className={cn(inputCls, fieldErrors.companyName && 'ring-1 ring-red-500 border-red-500')} /></Field>
                          <Field label="GST Number *" span2 error={fieldErrors.gstNumber}><input type="text" value={gstNumber} onChange={e => setGstNumber(e.target.value.toUpperCase())} className={cn(inputCls, fieldErrors.gstNumber && 'ring-1 ring-red-500 border-red-500')} /></Field>
                          <Field label="Address" span2 error={fieldErrors.address}><input type="text" value={address} onChange={e => setAddress(e.target.value)} className={cn(inputCls, fieldErrors.address && 'ring-1 ring-red-500 border-red-500')} /></Field>
                          <Field label="Pincode" error={fieldErrors.pincode}><input type="text" value={pincode} onChange={e => setPincode(e.target.value)} className={cn(inputCls, fieldErrors.pincode && 'ring-1 ring-red-500 border-red-500')} /></Field>
                          <Field label="External Profile Link" error={fieldErrors.externalLink}><input type="text" value={externalLink} onChange={e => setExternalLink(e.target.value)} className={cn(inputCls, fieldErrors.externalLink && 'ring-1 ring-red-500 border-red-500')} placeholder="E.g. Portfolio, Blog" /></Field>
                        </div>
                      </SettingsCard>
                    )}

                    <div className="sm:hidden pb-8"><Button onClick={handleProfileSave} isLoading={savingProfile} className="w-full h-14 rounded-2xl font-black shadow-xl">Save Changes</Button></div>
                  </div>
                )}
              </div>
            )}

            {tab === 'security' && (
              <SettingsCard className="p-6 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-400">
                <div className="mb-8 pb-6 border-b border-secondary-100 dark:border-secondary-800"><h2 className="text-lg font-black text-secondary-900 dark:text-white">Change Password</h2></div>
                <div className="space-y-5 max-w-sm">
                  <Field label="Current Password"><div className="relative"><input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={cn(inputCls, 'pr-10')} /><button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400">{showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></Field>
                  <Field label="New Password"><div className="relative"><input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} className={cn(inputCls, 'pr-10')} /><button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400">{showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></Field>
                  <Field label="Confirm Password"><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputCls} /></Field>
                </div>
                <div className="pt-6"><Button onClick={handlePasswordChange} isLoading={changingPassword} className="px-8 rounded-2xl font-black uppercase text-xs">Update Password</Button></div>
              </SettingsCard>
            )}

            {tab === 'privacy' && (
              <SettingsCard className="p-6 sm:p-10 animate-in fade-in slide-in-from-bottom-4">
                <div className="mb-8 pb-6 border-b border-secondary-100 dark:border-secondary-800"><h2 className="text-lg font-black text-secondary-900 dark:text-white">Privacy Controls</h2></div>
                <div className="space-y-4 max-xl">
                  <div className={cn("flex items-center justify-between p-5 rounded-2xl bg-secondary-50 dark:bg-secondary-800/60 border transition-all", fieldErrors.visibility ? "border-red-500" : "border-secondary-100 dark:border-secondary-700")}>
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl"><Globe className="w-5 h-5 text-emerald-600" /></div>
                      <div>
                        <p className="font-bold text-secondary-900 dark:text-white">Account Visibility</p>
                        <p className="text-xs text-secondary-500 font-medium">
                          {visibility === 'PUBLIC' ? 'Everyone can see your posts and profile.' : 'Only connections can see your posts.'}
                        </p>
                        {fieldErrors.visibility && <p className="text-[10px] font-bold text-red-500 mt-1">{fieldErrors.visibility}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-secondary-400">{visibility}</span>
                      <Switch checked={visibility === 'PUBLIC'} onChange={() => setVisibility(v => v === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC')} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-5 rounded-2xl bg-secondary-50 dark:bg-secondary-800/60 border border-secondary-100 dark:border-secondary-700">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl"><Users className="w-5 h-5 text-blue-600" /></div>
                      <div>
                        <p className="font-bold text-secondary-900 dark:text-white">Direct Messaging</p>
                        <p className="text-xs text-secondary-500 font-medium">Allow others to start conversations with you.</p>
                      </div>
                    </div>
                    <Switch checked={messagingEnabled} onChange={() => setMessagingEnabled(!messagingEnabled)} />
                  </div>
                </div>
                <div className="pt-6"><Button onClick={() => updateProfile({ visibility, messagingEnabled })} isLoading={savingProfile} className="px-8 rounded-2xl font-black uppercase text-xs">Apply Settings</Button></div>
              </SettingsCard>
            )}

            {tab === 'notifications' && (
              <SettingsCard className="p-6 sm:p-10 animate-in fade-in slide-in-from-bottom-4">
                <div className="mb-8 pb-6 border-b border-secondary-100 dark:border-secondary-800"><h2 className="text-lg font-black text-secondary-900 dark:text-white">Email & Alerts</h2></div>
                <div className="space-y-3 max-w-xl">
                  {([
                    { label: 'Platform Alerts', value: emailNotifs, set: setEmailNotifs, color: 'text-violet-500', bg: 'bg-violet-100' },
                    { label: 'Push Notifications', value: pushNotifs, set: setPushNotifs, color: 'text-blue-500', bg: 'bg-blue-100' },
                  ]).map(({ label, value, set, color, bg }) => (
                    <label key={label} className="flex items-center justify-between p-4 rounded-2xl bg-secondary-50 dark:bg-secondary-800/40 border border-secondary-100 dark:border-secondary-800 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className={cn('p-2 rounded-xl', bg)}><Bell className={cn('w-3.5 h-3.5', color)} /></div>
                        <p className="text-sm font-bold text-secondary-900 dark:text-white">{label}</p>
                      </div>
                      <Switch checked={value} onChange={() => set(!value)} />
                    </label>
                  ))}
                </div>
                <div className="pt-6"><Button onClick={() => toast.success('Preferences saved!')} className="px-8 rounded-2xl font-black uppercase text-xs">Save Preferences</Button></div>
              </SettingsCard>
            )}

            {tab === 'analytics' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-white dark:bg-secondary-900 p-6 rounded-[2rem] border border-secondary-100 dark:border-secondary-800 shadow-sm">
                  <div>
                    <h2 className="text-xl font-black text-secondary-900 dark:text-white tracking-tight">Impact Analytics</h2>
                    <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest mt-0.5">Performance Intelligence</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-indigo-500 opacity-20" />
                </div>
                
                <AnalyticsDashboard userType={profile?.userType} />
              </div>
            )}

            {tab === 'power-teams' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
                {/* My Team Dashboard Section */}
                {myTeam && (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-secondary-900 rounded-[2rem] border-2 border-primary-500/20 overflow-hidden shadow-xl shadow-primary-500/5">
                      <div className="relative h-28 bg-gradient-to-r from-primary-600 via-indigo-600 to-violet-600">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }} />
                        <div className="absolute top-4 right-4">
                           <Link href={`/power-teams/${myTeam.slug}`}>
                             <Button size="sm" variant="outline" className="rounded-xl bg-white/10 backdrop-blur-md border-white/20 text-white font-black text-[9px] uppercase tracking-widest hover:bg-white/20 transition-all">
                               Go to Hub <ArrowRight className="w-3 h-3 ml-1.5" />
                             </Button>
                           </Link>
                        </div>
                      </div>
                      <div className="px-8 pb-8">
                        <div className="flex flex-col sm:flex-row sm:items-end gap-6 -mt-10 relative z-10">
                          <div className="w-24 h-24 rounded-3xl bg-white dark:bg-secondary-800 p-1.5 shadow-2xl border border-secondary-100 dark:border-secondary-800">
                            {myTeam.logo ? (
                              <img src={myTeam.logo} alt={myTeam.name} className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                              <div className="w-full h-full rounded-2xl bg-secondary-50 dark:bg-secondary-900 flex items-center justify-center text-primary-500">
                                <Building2 className="w-10 h-10" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pb-2">
                            <div className="flex items-center gap-3">
                              <h3 className="text-2xl font-black text-secondary-900 dark:text-white uppercase tracking-tight truncate">{myTeam.name}</h3>
                              <span className={cn("px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest", myTeam.members?.[0]?.status === 'APPROVED' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500")}>
                                {myTeam.members?.[0]?.status === 'APPROVED' ? 'Active Alliance' : 'Joining Alliance...'}
                              </span>
                            </div>
                            <p className="text-sm text-secondary-500 font-medium mt-1.5 line-clamp-1">{myTeam.description}</p>
                          </div>
                          {(myTeam.creatorId === user?.id || isAdmin) && (
                            <div className="pb-2">
                              <Button onClick={() => openEditTeam(myTeam)} variant="outline" className="rounded-xl font-black text-[10px] uppercase tracking-widest h-11 px-6 border-secondary-200 dark:border-secondary-800">
                                Alliance Settings
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats & Members */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {/* Partners List */}
                       <div className="bg-white dark:bg-secondary-900 p-6 rounded-[2rem] border border-secondary-100 dark:border-secondary-800 shadow-sm">
                          <div className="flex items-center justify-between mb-6">
                             <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary-500" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-secondary-900 dark:text-white">Active Partners</h4>
                             </div>
                             <span className="px-2 py-0.5 rounded-md bg-secondary-50 dark:bg-secondary-800 text-[9px] font-black text-secondary-500">{myTeam.members?.filter((m: any) => m.status === 'APPROVED').length || 0}</span>
                          </div>
                          <div className="space-y-3">
                             {myTeam.members?.filter((m: any) => m.status === 'APPROVED').slice(0, 4).map((member: any) => (
                               <div key={member.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors">
                                  <div className="flex items-center gap-3">
                                     <Avatar src={member.user?.avatar} name={member.user?.name} className="w-8 h-8 rounded-xl" />
                                     <div>
                                        <p className="text-[11px] font-black text-secondary-900 dark:text-white uppercase leading-none">{member.user?.name}</p>
                                        <p className="text-[9px] text-secondary-400 font-bold mt-1">@{member.user?.username}</p>
                                     </div>
                                  </div>
                                  {member.userId === myTeam.creatorId && <Shield className="w-3.5 h-3.5 text-primary-500" />}
                               </div>
                             ))}
                             {myTeam.members?.filter((m: any) => m.status === 'APPROVED').length > 4 && (
                               <button className="w-full py-2 text-[9px] font-black text-secondary-400 uppercase tracking-widest hover:text-primary-500 transition-colors">View All Partners</button>
                             )}
                             {myTeam.members?.filter((m: any) => m.status === 'APPROVED').length === 0 && (
                               <p className="text-[10px] text-secondary-400 font-bold uppercase tracking-widest text-center py-6 italic">No partners yet</p>
                             )}
                          </div>
                       </div>

                       {/* Action Center - Pending Requests or Join Status */}
                       <div className="bg-white dark:bg-secondary-900 p-6 rounded-[2rem] border border-secondary-100 dark:border-secondary-800 shadow-sm">
                          {myTeam.creatorId === user?.id || isAdmin ? (
                            <>
                              <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-amber-500" />
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-secondary-900 dark:text-white">Partner Requests</h4>
                                </div>
                                {myTeam.members?.filter((m: any) => m.status === 'PENDING').length > 0 && (
                                  <span className="px-2 py-0.5 rounded-md bg-red-500 text-white text-[9px] font-black animate-pulse">
                                    {myTeam.members?.filter((m: any) => m.status === 'PENDING').length} NEW
                                  </span>
                                )}
                              </div>
                              <div className="space-y-3">
                                 {myTeam.members?.filter((m: any) => m.status === 'PENDING').slice(0, 3).map((req: any) => (
                                   <div key={req.id} className="p-3 rounded-2xl bg-secondary-50 dark:bg-secondary-800/40 border border-secondary-100 dark:border-secondary-800">
                                      <div className="flex items-center gap-3 mb-3">
                                         <Avatar src={req.user?.avatar} name={req.user?.name} className="w-8 h-8 rounded-xl" />
                                         <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-black text-secondary-900 dark:text-white uppercase truncate">{req.user?.name}</p>
                                            <p className="text-[9px] text-secondary-400 font-bold">@{req.user?.username}</p>
                                         </div>
                                      </div>
                                      <div className="flex gap-2">
                                         <Button size="sm" className="flex-1 h-8 rounded-lg bg-emerald-500 text-white font-black text-[9px] uppercase tracking-widest">Approve</Button>
                                         <Button size="sm" variant="outline" className="flex-1 h-8 rounded-lg border-secondary-200 text-red-500 font-black text-[9px] uppercase tracking-widest">Reject</Button>
                                      </div>
                                   </div>
                                 ))}
                                 {myTeam.members?.filter((m: any) => m.status === 'PENDING').length === 0 && (
                                   <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                                      <div className="p-3 rounded-2xl bg-secondary-50 dark:bg-secondary-800/50 text-secondary-300">
                                         <CheckCircle className="w-6 h-6" />
                                      </div>
                                      <p className="text-[10px] text-secondary-400 font-black uppercase tracking-widest">Inbox Zero</p>
                                   </div>
                                 )}
                              </div>
                            </>
                          ) : (
                            <>
                               <div className="flex items-center gap-2 mb-6">
                                  <Shield className="w-4 h-4 text-primary-500" />
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-secondary-900 dark:text-white">Your Membership</h4>
                               </div>
                               <div className="p-6 rounded-3xl bg-secondary-50 dark:bg-secondary-800/40 border border-secondary-100 dark:border-secondary-800 text-center space-y-4">
                                  <div className={cn("inline-flex p-4 rounded-2xl", myTeam.members?.[0]?.status === 'APPROVED' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500")}>
                                     {myTeam.members?.[0]?.status === 'APPROVED' ? <CheckCircle className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
                                  </div>
                                  <div>
                                     <p className="text-sm font-black text-secondary-900 dark:text-white uppercase tracking-tight">
                                        {myTeam.members?.[0]?.status === 'APPROVED' ? 'Active Alliance Member' : 'Request is Under Review'}
                                     </p>
                                     <p className="text-xs text-secondary-500 font-medium mt-1">
                                        {myTeam.members?.[0]?.status === 'APPROVED' ? 'You are part of this strategic alliance.' : 'The team creator will review your request soon.'}
                                     </p>
                                  </div>
                                  {myTeam.members?.[0]?.status === 'APPROVED' && (
                                    <Button variant="outline" className="w-full h-11 rounded-xl border-red-100 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all">
                                      Leave Power Team
                                    </Button>
                                  )}
                               </div>
                            </>
                          )}
                       </div>
                    </div>
                  </div>
                )}

                {/* Listing Section - Hidden for normal members who have a team, unless they are admins */}
                {(!myTeam || isAdmin) && (
                  <div className="bg-white dark:bg-secondary-900 p-6 sm:p-8 rounded-[2rem] border border-secondary-100 dark:border-secondary-800 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div>
                          <h2 className="text-xl font-black text-secondary-900 dark:text-white tracking-tight">Explore Alliances</h2>
                          <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest mt-0.5">Strategic Partnerships</p>
                        </div>
                        {(profile?.userType === 'ADMIN' || (profile?.userType === 'BUSINESS' && profile?.verificationStatus === 'VERIFIED')) && (
                          <Button
                            onClick={openPtModal}
                            className="rounded-2xl bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 font-black text-[10px] uppercase tracking-widest h-10 px-6 shadow-lg active:scale-95 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5 mr-2" /> Initialize Team
                          </Button>
                        )}
                    </div>

                    <div className="flex flex-col lg:flex-row items-center gap-4 mb-8">
                        <div className="flex flex-wrap items-center gap-1.5 flex-1">
                          <button
                            onClick={() => setPtCategoryId(null)}
                            className={cn(
                              "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                              !ptCategoryId 
                                ? "bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 shadow-md" 
                                : "bg-secondary-50 dark:bg-secondary-800/50 text-secondary-500 hover:bg-secondary-100"
                            )}
                          >
                            All Hubs
                          </button>
                          {categories.map((cat: any) => (
                            <button
                              key={cat.id}
                              onClick={() => setPtCategoryId(cat.id)}
                              className={cn(
                                "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                ptCategoryId === cat.id 
                                  ? "bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 shadow-md" 
                                  : "bg-secondary-50 dark:bg-secondary-800/50 text-secondary-500 hover:bg-secondary-100"
                              )}
                            >
                              {cat.name}
                            </button>
                          ))}
                        </div>

                        <div className="relative w-full lg:w-64">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary-400" />
                          <input
                            type="text"
                            placeholder="Search teams..."
                            value={ptSearchQuery}
                            onChange={(e) => setPtSearchQuery(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-secondary-50 dark:bg-secondary-800/50 border border-secondary-100 dark:border-secondary-800 outline-none focus:ring-2 ring-primary-500/20 text-xs font-bold transition-all"
                          />
                        </div>
                    </div>

                    <PowerTeamGrid teams={teams} isLoading={teamsLoading} />
                  </div>
                )}
                <CreateTeamModal />
                <EditTeamModal />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// ── Shared UI Components ───────────────────────────────────────────────────

function SettingsCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-800 shadow-[0_1px_6px_rgba(0,0,0,0.02)] rounded-[2rem]", className)}>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, label, accent }: { icon: any; label: string; accent: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("p-2 rounded-xl", accent)}><Icon className="w-4 h-4" /></div>
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400">{label}</h3>
    </div>
  );
}

function Field({ label, children, span2, error }: { label: string; children: React.ReactNode; span2?: boolean; error?: string }) {
  return (
    <div className={cn("space-y-2", span2 ? "sm:col-span-2" : "")}>
      <label className="text-[10px] font-black uppercase tracking-widest text-secondary-400 ml-1">{label}</label>
      {children}
      {error && <p className="text-[11px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1 ml-1">{error}</p>}
    </div>
  );
}

function AvatarUploader({ src, name, uploading, onFileChange, fileRef }: { src?: string; name: string; uploading: boolean; onFileChange: any; fileRef: any }) {
  return (
    <div className="relative group">
      <div className="w-28 h-28 rounded-[2rem] overflow-hidden bg-white dark:bg-secondary-800 p-1.5 shadow-xl transition-transform group-hover:scale-[1.02]">
        <div className="w-full h-full rounded-[1.6rem] overflow-hidden relative">
          {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-secondary-100 dark:bg-secondary-800 text-3xl font-black text-secondary-300 uppercase">{name.charAt(0)}</div>}
          {uploading && <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-white" /></div>}
        </div>
      </div>
      <button onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 p-2 bg-primary-500 text-white rounded-xl shadow-lg hover:scale-110 active:scale-90 transition-all border-4 border-white dark:border-secondary-950"><Camera className="w-4 h-4" /></button>
      <input type="file" ref={fileRef} onChange={onFileChange} accept="image/*" className="hidden" />
    </div>
  );
}
