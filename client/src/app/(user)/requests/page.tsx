"use client";
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import RequestList from '@/components/requests/RequestList';

const RequestsPage = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Vui lòng đăng nhập để truy cập trang này</p>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Quản lý yêu cầu" />
      <RequestList />
    </div>
  );
};

export default RequestsPage; 