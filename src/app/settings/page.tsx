'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUpdateProfile, useProfile, useChangePassword } from '@/hooks/use-api/use-user';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  User, Lock, Shield, Bell, Globe, ChevronRight, Save,
  Moon, Loader2, CheckCircle, LogOut, Eye, EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut, useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import ProfileImageUpload from '@/components/profile/profile-image-upload';

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

  const [tab, setTab] = useState<Tab>('profile');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // Profile form
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [twitter, setTwitter] = useState('');

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
    updateProfile({ name, bio, website, location, linkedin, twitter, visibility });
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

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-secondary-900 dark:text-white tracking-tight">Settings</h1>
          <p className="text-secondary-500 mt-1 font-medium">Manage your account preferences and privacy</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Nav */}
          <aside className="w-full md:w-60 shrink-0">
            <Card className="overflow-hidden rounded-2xl p-1 gap-0.5 flex flex-col bg-white dark:bg-secondary-900 shadow-sm border-0">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={cn(
                    'flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all',
                    tab === key
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-800'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                  {tab !== key && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-40" />}
                </button>
              ))}

              <div className="mt-2 pt-2 border-t border-secondary-100 dark:border-secondary-800">
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* ── PROFILE ── */}
            {tab === 'profile' && (
              <Card className="p-6 md:p-8 rounded-2xl bg-white dark:bg-secondary-900 shadow-sm border-0 space-y-6">
                <div className="flex items-center gap-4 pb-4 border-b border-secondary-100 dark:border-secondary-800">
                  <div className="relative group">
                    <Avatar
                      src={(user as any)?.avatar}
                      name={(user?.name as string) || ''}
                      size="lg"
                      rounded="full"
                      className="w-16 h-16 ring-4 ring-primary-100 dark:ring-primary-900/30"
                    />
                    <button 
                      onClick={() => setIsAvatarModalOpen(true)}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="text-[10px] font-bold uppercase">Edit</span>
                    </button>
                  </div>
                  <div>
                    <p className="font-bold text-secondary-900 dark:text-white">{(user?.name as string) || ''}</p>
                    <p className="text-sm text-secondary-500">@{(user as any)?.username}</p>
                  </div>
                </div>

                {isAvatarModalOpen && (
                  <ProfileImageUpload 
                    userId={user?.id || ''} 
                    currentAvatar={(user as any)?.avatar}
                    onClose={() => setIsAvatarModalOpen(false)}
                  />
                )}

                {profileLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wide mb-1.5">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-secondary-50 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-xl px-4 py-2.5 text-sm text-secondary-900 dark:text-white outline-none focus:ring-2 ring-primary-500/30 transition-all"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wide mb-1.5">Bio</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={3}
                        maxLength={300}
                        className="w-full bg-secondary-50 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-xl px-4 py-2.5 text-sm text-secondary-900 dark:text-white outline-none focus:ring-2 ring-primary-500/30 transition-all resize-none"
                        placeholder="Tell people a bit about yourself..."
                      />
                      <p className="text-[11px] text-secondary-400 text-right mt-0.5">{bio.length}/300</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wide mb-1.5">Location</label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="City, Country"
                        className="w-full bg-secondary-50 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-xl px-4 py-2.5 text-sm text-secondary-900 dark:text-white outline-none focus:ring-2 ring-primary-500/30 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wide mb-1.5">Website</label>
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://yoursite.com"
                        className="w-full bg-secondary-50 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-xl px-4 py-2.5 text-sm text-secondary-900 dark:text-white outline-none focus:ring-2 ring-primary-500/30 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wide mb-1.5">LinkedIn</label>
                      <input
                        type="text"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        placeholder="linkedin.com/in/yourprofile"
                        className="w-full bg-secondary-50 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-xl px-4 py-2.5 text-sm text-secondary-900 dark:text-white outline-none focus:ring-2 ring-primary-500/30 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wide mb-1.5">Twitter / X</label>
                      <input
                        type="text"
                        value={twitter}
                        onChange={(e) => setTwitter(e.target.value)}
                        placeholder="@yourhandle"
                        className="w-full bg-secondary-50 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-xl px-4 py-2.5 text-sm text-secondary-900 dark:text-white outline-none focus:ring-2 ring-primary-500/30 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleProfileSave}
                    disabled={savingProfile || profileLoading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-primary-500/20 disabled:opacity-50"
                  >
                    {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </Card>
            )}

            {/* ── SECURITY ── */}
            {tab === 'security' && (
              <Card className="p-6 md:p-8 rounded-2xl bg-white dark:bg-secondary-900 shadow-sm border-0 space-y-6">
                <div className="pb-4 border-b border-secondary-100 dark:border-secondary-800">
                  <h2 className="font-bold text-lg text-secondary-900 dark:text-white">Change Password</h2>
                  <p className="text-sm text-secondary-500 mt-0.5">Make sure to use a strong, unique password</p>
                </div>

                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wide mb-1.5">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-secondary-50 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-xl px-4 py-2.5 pr-10 text-sm text-secondary-900 dark:text-white outline-none focus:ring-2 ring-primary-500/30 transition-all"
                      />
                      <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600 transition-colors">
                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wide mb-1.5">New Password</label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-secondary-50 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-xl px-4 py-2.5 pr-10 text-sm text-secondary-900 dark:text-white outline-none focus:ring-2 ring-primary-500/30 transition-all"
                      />
                      <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600 transition-colors">
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wide mb-1.5">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-secondary-50 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-xl px-4 py-2.5 text-sm text-secondary-900 dark:text-white outline-none focus:ring-2 ring-primary-500/30 transition-all"
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
                    {changingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </Card>
            )}

            {/* ── PRIVACY ── */}
            {tab === 'privacy' && (
              <Card className="p-6 md:p-8 rounded-2xl bg-white dark:bg-secondary-900 shadow-sm border-0 space-y-6">
                <div className="pb-4 border-b border-secondary-100 dark:border-secondary-800">
                  <h2 className="font-bold text-lg text-secondary-900 dark:text-white">Privacy Settings</h2>
                  <p className="text-sm text-secondary-500 mt-0.5">Control who can see your content and profile</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary-50 dark:bg-secondary-800 border border-secondary-100 dark:border-secondary-700">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                        <Globe className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-secondary-900 dark:text-white text-sm">Public Account</p>
                        <p className="text-xs text-secondary-500 mt-0.5">Anyone can see your posts and profile</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setVisibility(visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC')}
                      className={cn(
                        'relative w-12 h-6 rounded-full transition-all duration-300 shrink-0',
                        visibility === 'PUBLIC' ? 'bg-primary-500' : 'bg-secondary-300 dark:bg-secondary-600'
                      )}
                    >
                      <span className={cn(
                        'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300',
                        visibility === 'PUBLIC' ? 'left-7' : 'left-1'
                      )} />
                    </button>
                  </div>

                  <p className="text-xs text-secondary-400 px-1">
                    {visibility === 'PUBLIC'
                      ? 'Your profile and posts are visible to everyone on the platform.'
                      : 'Your profile is private. Only approved followers can see your posts.'}
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleVisibilitySave}
                    disabled={savingProfile}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-50"
                  >
                    {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Save Privacy
                  </button>
                </div>
              </Card>
            )}

            {/* ── NOTIFICATIONS ── */}
            {tab === 'notifications' && (
              <Card className="p-6 md:p-8 rounded-2xl bg-white dark:bg-secondary-900 shadow-sm border-0 space-y-6">
                <div className="pb-4 border-b border-secondary-100 dark:border-secondary-800">
                  <h2 className="font-bold text-lg text-secondary-900 dark:text-white">Notification Preferences</h2>
                  <p className="text-sm text-secondary-500 mt-0.5">Choose when and how you want to be notified</p>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Email Notifications', desc: 'Receive notifications via email', value: emailNotifs, onChange: setEmailNotifs },
                    { label: 'Push Notifications', desc: 'Receive push notifications in browser', value: pushNotifs, onChange: setPushNotifs },
                    { label: 'Connection Requests', desc: 'Notify when someone sends a connection request', value: connectionNotifs, onChange: setConnectionNotifs },
                    { label: 'New Messages', desc: 'Notify when you receive a new message', value: messageNotifs, onChange: setMessageNotifs },
                  ].map(({ label, desc, value, onChange }) => (
                    <div key={label} className="flex items-center justify-between p-4 rounded-2xl bg-secondary-50 dark:bg-secondary-800 border border-secondary-100 dark:border-secondary-700">
                      <div>
                        <p className="font-semibold text-secondary-900 dark:text-white text-sm">{label}</p>
                        <p className="text-xs text-secondary-500 mt-0.5">{desc}</p>
                      </div>
                      <button
                        onClick={() => onChange(!value)}
                        className={cn(
                          'relative w-12 h-6 rounded-full transition-all duration-300 shrink-0',
                          value ? 'bg-primary-500' : 'bg-secondary-300 dark:bg-secondary-600'
                        )}
                      >
                        <span className={cn(
                          'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300',
                          value ? 'left-7' : 'left-1'
                        )} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => toast.success('Notification preferences saved!')}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Save Preferences
                  </button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
