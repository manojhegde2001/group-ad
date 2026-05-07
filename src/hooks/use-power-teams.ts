'use client';

import { create } from 'zustand';

interface PowerTeamModalStore {
    isOpen: boolean;
    manageMembersOpen: boolean;
    editTeamOpen: boolean;
    activeTeam: any;
    open: () => void;
    close: () => void;
    openManageMembers: (team: any) => void;
    closeManageMembers: () => void;
    openEditTeam: (team: any) => void;
    closeEditTeam: () => void;
    onCreated?: (team: any) => void;
    setOnCreated: (cb: (team: any) => void) => void;
    notifyCreated: (team: any) => void;
}

export const usePowerTeamModal = create<PowerTeamModalStore>((set, get) => ({
    isOpen: false,
    manageMembersOpen: false,
    editTeamOpen: false,
    activeTeam: null,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    openManageMembers: (team) => set({ manageMembersOpen: true, activeTeam: team }),
    closeManageMembers: () => set({ manageMembersOpen: false, activeTeam: null }),
    openEditTeam: (team) => set({ editTeamOpen: true, activeTeam: team }),
    closeEditTeam: () => set({ editTeamOpen: false, activeTeam: null }),
    onCreated: undefined,
    setOnCreated: (cb) => set({ onCreated: cb }),
    notifyCreated: (team) => {
        set({ isOpen: false });
        get().onCreated?.(team);
    },
}));
