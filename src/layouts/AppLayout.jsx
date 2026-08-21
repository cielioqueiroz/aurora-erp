import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v6';
import { Sidebar } from '@/components/navigation/Sidebar';
import { Topbar } from '@/components/navigation/Topbar';
import { CommandPalette } from '@/components/navigation/CommandPalette';
import { DemoBanner } from '@/components/feedback/DemoBanner';
import { AppFooter } from '@/components/layout/AppFooter';

export function AppLayout() {
  const location = useLocation();
  return (
    <NuqsAdapter>
      <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
        <Sidebar />
        <div className="flex h-screen min-w-0 flex-1 flex-col">
          <DemoBanner />
          <Topbar />
          <main className="flex flex-1 flex-col overflow-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="container mx-auto px-6 py-8"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
            <AppFooter />
          </main>
        </div>
        <CommandPalette />
      </div>
    </NuqsAdapter>
  );
}
