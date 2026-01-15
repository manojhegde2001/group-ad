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
