'use client';

import React from 'react';
import { AccountList } from '@/components/admin/accounts/AccountList';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';

export default function AccountsPage() {
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
      <PageBreadcrumb pageTitle="Quản lý tài khoản" />
      <AccountList />
    </div>
  );
} 