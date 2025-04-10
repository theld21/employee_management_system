'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarIcon, ClockIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const navigation = [
  { name: 'Calendar', href: '/', icon: CalendarIcon },
  { name: 'Check-in/out', href: '/checkin', icon: ClockIcon },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-white shadow-lg">
      <div className="flex h-16 items-center justify-center border-b">
        <h1 className="text-xl font-bold text-gray-900">Time Management</h1>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'group flex items-center rounded-md px-2 py-2 text-sm font-medium',
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon
                className={clsx(
                  'mr-3 h-6 w-6 flex-shrink-0',
                  isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
} 