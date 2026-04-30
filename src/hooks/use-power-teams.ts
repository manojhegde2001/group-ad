'use client';

import { create } from 'zustand';

interface PowerTeamModalStore {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    onCreated?: (team: any) => void;
    setOnCreated: (cb: (team: any) => void) => void;
    notifyCreated: (team: any) => void;
}

export const usePowerTeamModal = create<PowerTeamModalStore>((set, get) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    onCreated: undefined,
    setOnCreated: (cb) => set({ onCreated: cb }),
    notifyCreated: (team) => {
        set({ isOpen: false });
        get().onCreated?.(team);
    },
}));
