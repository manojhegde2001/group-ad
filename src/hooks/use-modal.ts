'use client';

import { create } from 'zustand';

type AuthMode = 'login' | 'signup';

interface AuthModalStore {
  isOpen: boolean;
  mode: AuthMode;
  onSuccessCallback?: () => void;
  open: (mode: AuthMode, callback?: () => void) => void;
  openLogin: (callback?: () => void) => void;
  openSignup: (callback?: () => void) => void;
  close: () => void;
  setMode: (mode: AuthMode) => void;
}

export const useAuthModal = create<AuthModalStore>((set) => ({
  isOpen: false,
  mode: 'login',
  onSuccessCallback: undefined,
  
  open: (mode, callback) =>
    set({
      isOpen: true,
      mode,
      onSuccessCallback: callback,
    }),
  
  openLogin: (callback) =>
    set({
      isOpen: true,
      mode: 'login',
      onSuccessCallback: callback,
    }),
  
  openSignup: (callback) =>
    set({
      isOpen: true,
      mode: 'signup',
      onSuccessCallback: callback,
    }),
  
  close: () =>
    set({
      isOpen: false,
      onSuccessCallback: undefined,
    }),
  
  setMode: (mode) => set({ mode }),
}));
