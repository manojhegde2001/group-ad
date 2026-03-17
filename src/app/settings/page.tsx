'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUpdateProfile, useProfile, useChangePassword, useUploadAvatar } from '@/hooks/use-api/use-user';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  User, Lock, Shield, Bell, Globe, ChevronRight, Save,
  Moon, Loader2, CheckCircle, LogOut, Eye, EyeOff,
  Camera, Pencil, Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut, useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { useRef } from 'react';

type Tab = 'profile' | 'security' | 'privacy' | 'notifications';

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'security', label: 'Security', icon: Lock },
  { key: 'privacy', label: 'Privacy', icon: Shield },
  { key: 'notifications', label: 'Notifications', icon: Bell },
];

export default function SettingsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { data: profileData, isLoading: profileLoading } = useProfile();
  const { mutate: updateProfile, isPending: savingProfile } = useUpdateProfile();
  const { mutate: changePassword, isPending: changingPassword } = useChangePassword();
  const { mutate: uploadAvatar, isPending: uploadingAvatar } = useUploadAvatar();

  const [tab, setTab] = useState<Tab>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile form
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [twitter, setTwitter] = useState('');
  const [gstNumber, setGstNumber] = useState('');

  // Security form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Privacy
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');

  // Notifications (UI only for now)
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [connectionNotifs, setConnectionNotifs] = useState(true);
  const [messageNotifs, setMessageNotifs] = useState(true);

  const profile = profileData?.user || profileData;

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setBio(profile.bio || '');
      setWebsite(profile.website || '');
      setLocation(profile.location || '');
      setLinkedin(profile.linkedin || '');
      setTwitter(profile.twitter || '');
      setGstNumber(profile.gstNumber || '');
      setVisibility(profile.visibility || 'PUBLIC');
    }
  }, [profile]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-secondary-500">Please log in to view settings.</p>
      </div>
    );
  }

  const handleProfileSave = () => {
    if (profile?.userType === 'BUSINESS' && !gstNumber) {
      toast.error('GST Number is mandatory for Business users');
      return;
    }
    updateProfile({ name, bio, website, location, linkedin, twitter, visibility, gstNumber });
  };

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword) {
      toast.error('Please fill all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    changePassword(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        },
      }
    );
  };

  const handleVisibilitySave = () => {
    updateProfile({ visibility });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('image', file);
      uploadAvatar(formData, {
        onSuccess: () => {
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="sticky top-8 space-y-6">
              <div>
                <h1 className="text-2xl font-black text-secondary-900 dark:text-white tracking-tight mb-1">Settings</h1>
                <p className="text-xs text-secondary-500 font-bold uppercase tracking-widest">Account Management</p>
              </div>

              <nav className="space-y-1">
                {TABS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all group',
                      tab === key
                        ? 'bg-white dark:bg-secondary-900 text-primary-600 dark:text-primary-400 shadow-sm border border-secondary-100 dark:border-secondary-800'
                        : 'text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-900/50 hover:text-secondary-900 dark:hover:text-secondary-200'
                    )}
                  >
                    <Icon className={cn("w-4 h-4 transition-colors", tab === key ? "text-primary-500" : "text-secondary-400 group-hover:text-secondary-600")} />
                    {label}
                    {tab === key && (
                      <ChevronRight className="w-4 h-4 ml-auto text-primary-500 animate-in fade-in slide-in-from-left-2 duration-300" />
                    )}
                  </button>
                ))}

                <div className="pt-4 mt-4 border-t border-secondary-200 dark:border-secondary-800">
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-colors group"
                  >
                    <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Sign Out
                  </button>
                </div>
              </nav>

              {/* Status Info */}
              <div className="p-4 bg-primary-50 dark:bg-primary-950/20 rounded-2xl border border-primary-100 dark:border-primary-900/50">
                <p className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-1">Account Type</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                  <p className="text-sm font-black text-secondary-900 dark:text-white uppercase">
                    {profile?.userType || 'INDIVIDUAL'}
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            <div className="max-w-3xl">
              {tab === 'profile' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Premium Profile Header Card */}
                  <div className="bg-white dark:bg-secondary-900 rounded-3xl overflow-hidden shadow-sm border border-secondary-100 dark:border-secondary-800">
                    {/* Banner Background */}
                    <div className="h-32 sm:h-40 bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]" />
                      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                      <div className="absolute -top-12 -left-12 w-48 h-48 bg-primary-400/20 rounded-full blur-2xl" />
                    </div>

                    {/* Overlapping Avatar Section - Significantly Enlarged */}
                    <div className="px-6 sm:px-10 pb-6 relative">
                      <div className="flex flex-col sm:items-center gap-5 -mt-20 sm:-mt-28 mb-4">
                        <div className="relative inline-block group">
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarChange}
                          />
                          <div 
                            className="p-1.5 bg-white dark:bg-secondary-900 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] cursor-pointer overflow-hidden relative"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Avatar
                              src={profile?.avatar ? `${profile.avatar}${profile.avatar.includes('?') ? '&' : '?'}v=${Date.now()}` : (user as any)?.avatar}
                              name={(user?.name as string) || ''}
                              size="xl"
                              rounded="full"
                              className="w-32 h-32 sm:w-48 sm:h-48 border-0"
                            />
                            {uploadingAvatar && (
                              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-full animate-in fade-in duration-300">
                                <Loader2 className="w-8 h-8 animate-spin text-white mb-2" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Updating...</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 rounded-full">
                              <Camera className="w-8 h-8 text-white" />
                            </div>
                          </div>
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            className="absolute bottom-3 right-3 p-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-xl transition-all active:scale-90 border-[3px] border-white dark:border-secondary-900 z-10 group disabled:opacity-50"
                            aria-label="Edit Profile Picture"
                          >
                            <Pencil className="w-3 h-3 transition-transform group-hover:rotate-12" />
                          </button>
                        </div>

                        <div className="flex-1 pb-2">
                          <h2 className="text-2xl font-black text-secondary-900 dark:text-white tracking-tight leading-none mb-1">
                            {(user?.name as string) || ''}
                          </h2>
                          <div className="flex items-center gap-2">
                            <p className="text-secondary-500 font-bold text-sm">
                              @{(user as any)?.username}
                            </p>
                            {profile?.userType === 'BUSINESS' && (
                              <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800">
                                Verified Business
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="hidden sm:block pb-2">
                          <button
                            onClick={handleProfileSave}
                            disabled={savingProfile || profileLoading}
                            className="flex items-center gap-2 px-5 py-2.5 bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 rounded-2xl text-xs font-black transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50"
                          >
                            {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            {savingProfile ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Fields - Groups optimized for space */}
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <Card className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-secondary-900 shadow-sm border border-secondary-100 dark:border-secondary-800">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-1.5 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                          <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        </div>
                        <h3 className="text-sm font-black text-secondary-900 dark:text-white uppercase tracking-widest">Identity</h3>
                      </div>

                      {profileLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary-500" /></div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-black text-secondary-500 uppercase tracking-widest mb-1.5">Full Name</label>
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full bg-secondary-50 dark:bg-secondary-800/50 border border-secondary-200 dark:border-secondary-700 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 ring-primary-500/20 transition-all font-medium"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-black text-secondary-500 uppercase tracking-widest mb-1.5">Bio</label>
                            <textarea
                              value={bio}
                              onChange={(e) => setBio(e.target.value)}
                              rows={3}
                              maxLength={300}
                              className="w-full bg-secondary-50 dark:bg-secondary-800/50 border border-secondary-200 dark:border-secondary-700 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 ring-primary-500/20 transition-all resize-none"
                            />
                            <div className="flex justify-end mt-1">
                              <p className="text-[10px] text-secondary-400 font-bold">{bio.length}/300</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>

                    {/* Business Details (Conditional) - Density optimized */}
                    {profile?.userType === 'BUSINESS' && (
                      <Card className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-secondary-900 shadow-sm border border-secondary-100 dark:border-secondary-800 animate-in fade-in duration-500">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                              <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-sm font-black text-secondary-900 dark:text-white uppercase tracking-widest">Business Info</h3>
                          </div>
                          <div className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900">
                            <CheckCircle className="w-3 h-3 text-indigo-500" />
                            <p className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">Approved</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-black text-secondary-500 uppercase tracking-widest mb-1.5">GST Number <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={gstNumber}
                              onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                              className="w-full bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-xl px-4 py-3 text-sm font-bold tracking-widest outline-none focus:ring-2 ring-indigo-500/20 transition-all"
                            />
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Contact & Professional */}
                    <Card className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-secondary-900 shadow-sm border border-secondary-100 dark:border-secondary-800">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-sm font-black text-secondary-900 dark:text-white uppercase tracking-widest">Professional Links</h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-black text-secondary-500 uppercase tracking-widest mb-1.5">Website</label>
                          <input
                            type="url"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            className="w-full bg-secondary-50 dark:bg-secondary-800/50 border border-secondary-200 dark:border-secondary-700 rounded-xl px-4 py-2.5 text-sm font-medium outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-secondary-500 uppercase tracking-widest mb-1.5">LinkedIn</label>
                          <input
                            type="text"
                            value={linkedin}
                            onChange={(e) => setLinkedin(e.target.value)}
                            className="w-full bg-secondary-50 dark:bg-secondary-800/50 border border-secondary-200 dark:border-secondary-700 rounded-xl px-4 py-2.5 text-sm font-medium outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-secondary-500 uppercase tracking-widest mb-1.5">Twitter / X</label>
                          <input
                            type="text"
                            value={twitter}
                            onChange={(e) => setTwitter(e.target.value)}
                            className="w-full bg-secondary-50 dark:bg-secondary-800/50 border border-secondary-200 dark:border-secondary-700 rounded-xl px-4 py-2.5 text-sm font-medium outline-none"
                          />
                        </div>
                      </div>
                    </Card>

                    {/* Mobile Only: Floating Save Button Container */}
                    <div className="sm:hidden pt-4 pb-20">
                      <button
                        onClick={handleProfileSave}
                        disabled={savingProfile || profileLoading}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 rounded-2xl text-sm font-black transition-all shadow-xl active:scale-95 disabled:opacity-50"
                      >
                        {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'security' && (
                <Card className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-secondary-900 shadow-sm border border-secondary-100 dark:border-secondary-800 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="pb-4 border-b border-secondary-100 dark:border-secondary-800">
                    <h2 className="font-bold text-lg text-secondary-900 dark:text-white">Change Password</h2>
                    <p className="text-sm text-secondary-500 mt-0.5 font-medium">Keep your account secure with a strong password</p>
                  </div>

                  <div className="space-y-4 max-w-sm">
                    <div>
                      <label className="block text-[10px] font-black text-secondary-500 uppercase tracking-widest mb-1.5">Current Password</label>
                      <div className="relative">
                        <input
                          type={showCurrent ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full bg-secondary-50 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium outline-none focus:ring-2 ring-primary-500/20"
                        />
                        <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600 transition-colors">
                          {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-secondary-500 uppercase tracking-widest mb-1.5">New Password</label>
                      <div className="relative">
                        <input
                          type={showNew ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-secondary-50 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium outline-none focus:ring-2 ring-primary-500/20"
                        />
                        <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600 transition-colors">
                          {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-secondary-500 uppercase tracking-widest mb-1.5">Confirm Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-secondary-50 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-xl px-4 py-2.5 text-sm font-medium outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-start pt-2">
                    <button
                      onClick={handlePasswordChange}
                      disabled={changingPassword}
                      className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-50"
                    >
                      {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                      Update Password
                    </button>
                  </div>
                </Card>
              )}

              {tab === 'privacy' && (
                <Card className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-secondary-900 shadow-sm border border-secondary-100 dark:border-secondary-800 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="pb-4 border-b border-secondary-100 dark:border-secondary-800">
                    <h2 className="font-bold text-lg text-secondary-900 dark:text-white">Privacy Controls</h2>
                    <p className="text-sm text-secondary-500 mt-0.5 font-medium">Decide how your profile is shown to others</p>
                  </div>

                  <div className="space-y-4 max-w-xl">
                    <div className="flex items-center justify-between p-5 rounded-3xl bg-secondary-50 dark:bg-secondary-800 border border-secondary-100 dark:border-secondary-700">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
                          <Globe className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                          <p className="font-bold text-secondary-900 dark:text-white text-base">Public Profile</p>
                          <p className="text-xs text-secondary-500 mt-0.5 font-medium">{visibility === 'PUBLIC' ? 'Visible to everyone' : 'Only connections can see'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setVisibility(visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC')}
                        className={cn(
                          'relative w-14 h-7 rounded-full transition-all duration-300 shrink-0',
                          visibility === 'PUBLIC' ? 'bg-primary-500' : 'bg-secondary-300 dark:bg-secondary-600'
                        )}
                      >
                        <span className={cn(
                          'absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300',
                          visibility === 'PUBLIC' ? 'left-8' : 'left-1'
                        )} />
                      </button>
                    </div>

                    <div className="bg-primary-50 dark:bg-primary-950/20 p-4 rounded-2xl border border-primary-100 dark:border-primary-900/50">
                      <p className="text-xs text-primary-700 dark:text-primary-400 font-medium leading-relaxed">
                        {visibility === 'PUBLIC'
                          ? 'Your professional profile and posts are discoverable by everyone on the platform.'
                          : 'Your interactions and detailed profile information are restricted to your approved connections only.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-start pt-2">
                    <button
                      onClick={handleVisibilitySave}
                      disabled={savingProfile}
                      className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-50"
                    >
                      {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Apply Privacy Settings
                    </button>
                  </div>
                </Card>
              )}

              {tab === 'notifications' && (
                <Card className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-secondary-900 shadow-sm border border-secondary-100 dark:border-secondary-800 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="pb-4 border-b border-secondary-100 dark:border-secondary-800">
                    <h2 className="font-bold text-lg text-secondary-900 dark:text-white">Email & Alerts</h2>
                    <p className="text-sm text-secondary-500 mt-0.5 font-medium">Control when you want to be notified</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 max-w-xl">
                    {[
                      { label: 'Platform Alerts', desc: 'New messages & notifications', value: emailNotifs, onChange: setEmailNotifs },
                      { label: 'Push Notifications', desc: 'Direct browser alerts', value: pushNotifs, onChange: setPushNotifs },
                      { label: 'Connection Requests', desc: 'New interaction requests', value: connectionNotifs, onChange: setConnectionNotifs },
                      { label: 'Direct Messages', desc: 'Private messages received', value: messageNotifs, onChange: setMessageNotifs },
                    ].map(({ label, desc, value, onChange }) => (
                      <div key={label} className="flex items-center justify-between p-4 rounded-2xl bg-secondary-100/30 dark:bg-secondary-800/50 border border-secondary-100 dark:border-secondary-800/50 transition-colors hover:bg-white dark:hover:bg-secondary-800">
                        <div>
                          <p className="font-bold text-secondary-900 dark:text-white text-sm">{label}</p>
                          <p className="text-[11px] text-secondary-500 font-medium mt-0.5">{desc}</p>
                        </div>
                        <button
                          onClick={() => onChange(!value)}
                          className={cn(
                            'relative w-11 h-6 rounded-full transition-all duration-300 shrink-0',
                            value ? 'bg-primary-500' : 'bg-secondary-300 dark:bg-secondary-600'
                          )}
                        >
                          <span className={cn(
                            'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300',
                            value ? 'left-6' : 'left-1'
                          )} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-start pt-2">
                    <button
                      onClick={() => toast.success('Preferences updated!')}
                      className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Save Preferences
                    </button>
                  </div>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
