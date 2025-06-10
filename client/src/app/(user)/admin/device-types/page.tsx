'use client';

import React from 'react';
import { DeviceTypeList } from '@/components/admin/device-types/DeviceTypeList';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';

export default function DeviceTypesPage() {
  const { user } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
    }
  }, [user, router]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Device Type Management" />
      <DeviceTypeList />
    </div>
  );
} 