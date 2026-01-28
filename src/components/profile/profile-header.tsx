'use client';

import { Avatar, Button, Badge } from 'rizzui';
import { Camera, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { User } from '@prisma/client';
import { useState } from 'react';
import ProfileImageUpload from './profile-image-upload';

interface ProfileHeaderProps {
  user: User;
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
  const [showImageUpload, setShowImageUpload] = useState(false);
console.log(user,'yser')
  return (
    <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Avatar Section */}
        <div className="relative group">
          <Avatar
            src={user.avatar || undefined}
            name={user.name}
            size="xl"
            customSize="120"
            className="ring-4 ring-secondary-100 dark:ring-secondary-700"
          />
          <button
            onClick={() => setShowImageUpload(true)}
            className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* User Info Section */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
                  {user.name}
                </h1>
                <Badge variant="flat" color={user.userType === 'BUSINESS' ? 'info' : 'success'}>
                  {user.userType}
                </Badge>
              </div>
              <p className="text-secondary-600 dark:text-secondary-400 mt-1">
                @{user.username}
              </p>
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="text-secondary-700 dark:text-secondary-300 mt-4 leading-relaxed">
              {user.bio}
            </p>
          )}

          {/* Meta Information */}
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-secondary-600 dark:text-secondary-400">
            {user.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>{user.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            </div>
            {user.website && (
              <a
                href={user.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Website</span>
              </a>
            )}
          </div>

          {/* Profile Completion */}
          {!user.isProfileCompleted && (
            <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Complete your profile to get the most out of the platform
              </p>
            </div>
          )}
        </div>
      </div>

      {showImageUpload && (
        <ProfileImageUpload
          userId={user.id}
          currentAvatar={user.avatar}
          onClose={() => setShowImageUpload(false)}
        />
      )}
    </div>
  );
}
