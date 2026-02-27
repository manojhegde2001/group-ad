import { Prisma } from "@prisma/client";

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  userType: 'INDIVIDUAL' | 'BUSINESS';
  visibility: 'PUBLIC' | 'PRIVATE';
  category: string;
  companyName?: string;
  turnover?: string;
  companySize?: string;
  industry?: string;
  gstNumber?: string;
}

export interface Post {
  id: string;
  type: 'IMAGE' | 'TEXT';
  content: string;
  images: string[];
  category: string;
  tags: string[];
  visibility: 'PUBLIC' | 'PRIVATE';
  views: number;
  likes: number;
  shares: number;
  author: User;
  createdAt: string;
  updatedAt: string;
}

export interface AuthModalState {
  isOpen: boolean;
  mode: 'login' | 'signup';
  onSuccess?: () => void;
}

export type ProfileUser = Prisma.UserGetPayload<{
  select: {
    id: true;
    email: true;
    name: true;
    username: true;
    avatar: true;
    bio: true;
    phone: true;
    location: true;
    website: true;
    userType: true;
    visibility: true;
    verificationStatus: true;
    verifiedAt: true;
    onboardingStep: true;
    isProfileCompleted: true;
    categoryId: true;
    category: {
      select: {
        id: true;
        name: true;
        slug: true;
        icon: true;
      };
    };
    interests: true;
    companyId: true;
    company: {
      select: {
        id: true;
        name: true;
        slug: true;
        logo: true;
        isVerified: true;
      };
    };
    turnover: true;
    companySize: true;
    industry: true;
    linkedin: true;
    twitter: true;
    facebook: true;
    instagram: true;
    createdAt: true;
    updatedAt: true;
    _count: {
      select: {
        posts: true;
        organizedEvents: true;
        enrollments: true;
      };
    };
  };
}>;

export type PostWithRelations = {
  id: string;
  type: string;
  content: string;
  images: string[];
  tags: string[];
  visibility: string;
  views: number;
  likes: number;
  shares: number;
  userId: string;
  categoryId: string | null;
  companyId: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    userType: string;
    verificationStatus: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  } | null;
  company: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    isVerified: boolean;
  } | null;
  _count: {
    postLikes: number;
    postComments: number;
  };
  isLikedByUser?: boolean;
};


// Event type with relations
export type EventWithRelations = Prisma.EventGetPayload<{
  include: {
    organizer: {
      select: {
        id: true;
        name: true;
        username: true;
        avatar: true;
        userType: true;
        verificationStatus: true;
      };
    };
    category: {
      select: {
        id: true;
        name: true;
        slug: true;
        icon: true;
      };
    };
    company: {
      select: {
        id: true;
        name: true;
        slug: true;
        logo: true;
        isVerified: true;
      };
    };
    _count: {
      select: {
        enrollments: true;
      };
    };
  };
}>;