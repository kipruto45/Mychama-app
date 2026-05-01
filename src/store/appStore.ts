import { create } from 'zustand';
import { Chama, Notification } from '@/types';

interface AppState {
  activeChama: Chama | null;
  activeChamaId: string | null;
  theme: 'light' | 'dark';
  notifications: Notification[];
  unreadNotificationsCount: number;
  
  // Actions
  setActiveChama: (chama: Chama | null) => void;
  setActiveChamaId: (chamaId: string | null) => void;
  toggleTheme: () => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  setUnreadNotificationsCount: (count: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeChama: null,
  activeChamaId: null,
  theme: 'light',
  notifications: [],
  unreadNotificationsCount: 0,
  
  setActiveChama: (activeChama) =>
    set({ activeChama, activeChamaId: activeChama?.id || null }),
  setActiveChamaId: (activeChamaId) => set({ activeChamaId }),
  toggleTheme: () => set((state) => ({ 
    theme: state.theme === 'light' ? 'dark' : 'light' 
  })),
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadNotificationsCount: notification.is_read
      ? state.unreadNotificationsCount
      : state.unreadNotificationsCount + 1,
  })),
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
    ),
    unreadNotificationsCount: Math.max(
      0,
      state.notifications.filter((n) => !n.is_read && n.id !== id).length
    ),
  })),
  setUnreadNotificationsCount: (unreadNotificationsCount) => set({ unreadNotificationsCount }),
}));
