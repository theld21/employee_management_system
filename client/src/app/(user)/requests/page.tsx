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
        <p>Please login to access this page</p>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Requests Management" />
      <RequestList />
    </div>
  );
};

export default RequestsPage; 