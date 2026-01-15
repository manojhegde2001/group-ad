'use client';

import { create } from 'zustand';

interface AuthModalStore {
  isOpen: boolean;
  mode: 'login' | 'signup';
  onSuccessCallback?: () => void;
  openLogin: (onSuccess?: () => void) => void;
  openSignup: (onSuccess?: () => void) => void;
  close: () => void;
  setMode: (mode: 'login' | 'signup') => void;
}

export const useAuthModal = create<AuthModalStore>((set) => ({
  isOpen: false,
  mode: 'login',
  onSuccessCallback: undefined,
  openLogin: (onSuccess) => set({ isOpen: true, mode: 'login', onSuccessCallback: onSuccess }),
  openSignup: (onSuccess) => set({ isOpen: true, mode: 'signup', onSuccessCallback: onSuccess }),
  close: () => set({ isOpen: false, onSuccessCallback: undefined }),
  setMode: (mode) => set({ mode }),
}));
