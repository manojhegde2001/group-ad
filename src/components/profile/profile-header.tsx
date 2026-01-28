'use client'
import { ProfileUser } from '@/types';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import {
  MapPin,
  Briefcase,
  Calendar,
  Verified,
  Building2,
  Mail,
  Phone,
  Pencil,
  Globe
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';
import ProfileImageUpload from './profile-image-upload';

interface ProfileHeaderProps {
  user: ProfileUser;
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <>
      <div className="bg-white dark:bg-secondary-800 rounded-2xl shadow-lg border border-secondary-200 dark:border-secondary-700 overflow-hidden mb-6">
        
        {/* Compact Cover Photo */}
        <div className="relative h-32 sm:h-40 bg-gradient-to-br from-primary-600 via-primary-500 to-purple-600">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-300 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000" />
          </div>
        </div>

        {/* Main Content - More Compact */}
        <div className="relative px-4 sm:px-6 lg:px-8 pb-6">
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 -mt-16 sm:-mt-20">
            
            {/* Larger Avatar with Next.js Image */}
            <div className="flex-shrink-0 self-center sm:self-start">
              <div className="relative">
                {user.avatar && !imageError ? (
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={160}
                    height={160}
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white dark:border-secondary-800 shadow-xl ring-4 ring-primary-100 dark:ring-primary-900/50 object-cover"
                    onError={() => setImageError(true)}
                    priority
                  />
                ) : (
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white dark:border-secondary-800 shadow-xl ring-4 ring-primary-100 dark:ring-primary-900/50 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                    <span className="text-4xl sm:text-5xl font-bold text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="absolute bottom-0 right-0 p-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 border-3 border-white dark:border-secondary-800"
                  aria-label="Edit profile picture"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* User Information - Condensed */}
            <div className="flex-1 sm:pt-4">
              
              {/* Name & Badges */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 dark:text-white">
                    {user.name}
                  </h1>
                  {user.verificationStatus === 'VERIFIED' && (
                    <Verified className="w-6 h-6 text-blue-500 fill-blue-500" />
                  )}
                </div>
                
                <p className="text-base text-secondary-600 dark:text-secondary-400 mb-3">
                  @{user.username}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Badge 
                    variant={user.userType === 'BUSINESS' ? 'solid' : 'outline'}
                    className="capitalize text-xs font-semibold px-3 py-1"
                  >
                    {user.userType.toLowerCase()}
                  </Badge>
                  
                  {user.category && (
                    <Badge variant="outline" className="text-xs font-semibold px-3 py-1">
                      <span className="mr-1">{user.category.icon}</span>
                      {user.category.name}
                    </Badge>
                  )}
                  
                  {user.company && (
                    <Badge variant="outline" className="text-xs font-semibold px-3 py-1">
                      <Building2 className="w-3.5 h-3.5 mr-1" />
                      {user.company.name}
                      {user.company.isVerified && (
                        <Verified className="w-3.5 h-3.5 ml-1 text-blue-500 fill-blue-500" />
                      )}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Bio - Shorter */}
              {user.bio && (
                <p className="text-sm text-secondary-700 dark:text-secondary-300 leading-relaxed mb-3 line-clamp-2">
                  {user.bio}
                </p>
              )}

              {/* Compact Stats - Inline */}
              <div className="flex gap-6 mb-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-primary-700 dark:text-primary-400">
                    {user._count.posts}
                  </div>
                  <div className="text-xs font-medium text-secondary-600 dark:text-secondary-500">
                    Posts
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-700 dark:text-purple-400">
                    {user._count.organizedEvents}
                  </div>
                  <div className="text-xs font-medium text-secondary-600 dark:text-secondary-500">
                    Events
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-xl font-bold text-pink-700 dark:text-pink-400">
                    {user._count.enrollments}
                  </div>
                  <div className="text-xs font-medium text-secondary-600 dark:text-secondary-500">
                    Enrolled
                  </div>
                </div>
              </div>

              {/* Compact Contact Info */}
              <div className="flex flex-wrap gap-3 text-xs text-secondary-600 dark:text-secondary-400">
                {user.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{user.email}</span>
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{user.location}</span>
                  </div>
                )}
                {user.industry && (
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{user.industry}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Joined {formatDate(user.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section - Social & Interests */}
          <div className="mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-700 flex flex-col sm:flex-row gap-3 justify-between items-start">
            
            {/* Social Links - Smaller */}
            {(user.linkedin || user.twitter || user.facebook || user.instagram || user.website) && (
              <div className="flex flex-wrap gap-2">
                {user.linkedin && (
                  <a
                    href={user.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all"
                  >
                    LinkedIn
                  </a>
                )}
                {user.twitter && (
                  <a
                    href={user.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-500 hover:bg-sky-600 text-white transition-all"
                  >
                    Twitter
                  </a>
                )}
                {user.facebook && (
                  <a
                    href={user.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all"
                  >
                    Facebook
                  </a>
                )}
                {user.instagram && (
                  <a
                    href={user.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all"
                  >
                    Instagram
                  </a>
                )}
                {user.website && (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-secondary-600 hover:bg-secondary-700 text-white transition-all flex items-center gap-1"
                  >
                    <Globe className="w-3 h-3" />
                    Website
                  </a>
                )}
              </div>
            )}

            {/* Interests - Compact */}
            {user.interests && user.interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {user.interests.slice(0, 3).map((interest, idx) => (
                  <Badge 
                    key={idx} 
                    variant="outline"
                    className="text-xs px-2 py-0.5"
                  >
                    {interest}
                  </Badge>
                ))}
                {user.interests.length > 3 && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    +{user.interests.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showUploadModal && (
        <ProfileImageUpload
          userId={user.id}
          currentAvatar={user.avatar}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </>
  );
}
