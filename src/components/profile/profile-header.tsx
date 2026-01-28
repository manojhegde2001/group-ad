import { ProfileUser } from '@/types';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Link as LinkIcon,
  Briefcase,
  Calendar,
  Verified,
  Edit,
  Users,
  Building2
} from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface ProfileHeaderProps {
  user: ProfileUser;
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <div className="bg-card rounded-lg shadow-sm border p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Avatar src={user.avatar || undefined} name={user.name.charAt(0).toUpperCase()} className="w-32 h-32" />
        </div>

        {/* User Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-bold">{user.name}</h1>
                {user.verificationStatus === 'VERIFIED' && (
                  <Verified className="w-6 h-6 text-blue-500" />
                )}
              </div>
              <p className="text-muted-foreground">@{user.username}</p>
            </div>
            <Link href="/profile/edit">
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </Link>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant={user.userType === 'BUSINESS' ? 'outline' : 'solid'}>
              {user.userType}
            </Badge>
            <Badge variant="outline">
              {user.visibility}
            </Badge>
            {user.category && (
              <Badge variant="outline">
                {user.category.icon} {user.category.name}
              </Badge>
            )}
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="text-foreground mb-4">{user.bio}</p>
          )}

          {/* Details */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
            {user.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {user.location}
              </div>
            )}

            {user.website && (
              <a
                href={user.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary"
              >
                <LinkIcon className="w-4 h-4" />
                Website
              </a>
            )}

            {user.company && (
              <div className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {user.company.name}
                {user.company.isVerified && (
                  <Verified className="w-3 h-3 text-blue-500" />
                )}
              </div>
            )}

            {user.industry && (
              <div className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                {user.industry}
              </div>
            )}

            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Joined {formatDate(user.createdAt)}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 text-sm">
            <div>
              <span className="font-semibold">{user._count.posts}</span>
              <span className="text-muted-foreground ml-1">Posts</span>
            </div>
            <div>
              <span className="font-semibold">{user._count.organizedEvents}</span>
              <span className="text-muted-foreground ml-1">Events</span>
            </div>
            <div>
              <span className="font-semibold">{user._count.enrollments}</span>
              <span className="text-muted-foreground ml-1">Enrollments</span>
            </div>
          </div>

          {/* Social Links */}
          {(user.linkedin || user.twitter || user.facebook || user.instagram) && (
            <div className="flex gap-3 mt-4">
              {user.linkedin && (
                <a
                  href={user.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  LinkedIn
                </a>
              )}
              {user.twitter && (
                <a
                  href={user.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  Twitter
                </a>
              )}
              {user.facebook && (
                <a
                  href={user.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  Facebook
                </a>
              )}
              {user.instagram && (
                <a
                  href={user.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  Instagram
                </a>
              )}
            </div>
          )}

          {/* Interests */}
          {user.interests && user.interests.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Interests:</p>
              <div className="flex flex-wrap gap-2">
                {user.interests.map((interest, idx) => (
                  <Badge key={idx} color="secondary" className="text-xs">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}