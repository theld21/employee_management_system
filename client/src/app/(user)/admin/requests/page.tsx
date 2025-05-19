"use client";
import React, { useState } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import PendingRequestsList from '@/components/admin/PendingRequestsList';

const AdminRequestsPage = () => {
  const [requestsUpdated, setRequestsUpdated] = useState(false);

  const handleRequestProcessed = () => {
    setRequestsUpdated(!requestsUpdated);
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Manage Requests" />
        <PendingRequestsList 
          requestsUpdated={requestsUpdated} 
          onRequestProcessed={handleRequestProcessed}
        />
    </div>
  );
};

export default AdminRequestsPage; 