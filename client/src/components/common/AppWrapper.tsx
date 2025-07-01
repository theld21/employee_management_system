"use client";

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useSidebar } from '@/context/SidebarContext';
import Spinner from '@/components/ui/loading/Spinner';

interface AppWrapperProps {
  children: React.ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  const { isInitialized: authInitialized } = useAuth();
  const { isInitialized: themeInitialized } = useTheme();
  const { isInitialized: sidebarInitialized } = useSidebar();

  // Show loading spinner until all contexts are initialized
  const isFullyInitialized = authInitialized && themeInitialized && sidebarInitialized;

  if (!isFullyInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <Spinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
} 