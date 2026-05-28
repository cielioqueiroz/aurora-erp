import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** themeStore — light | dark | system. */
export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'aurora-erp.theme' },
  ),
);
