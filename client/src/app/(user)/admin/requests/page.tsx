"use client";
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import PendingRequestsList from '@/components/admin/PendingRequestsList';

const AdminRequestsPage = () => {
  const { user } = useAuth();
  const [requestsUpdated, setRequestsUpdated] = useState(false);

  const handleRequestProcessed = () => {
    setRequestsUpdated(!requestsUpdated);
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Manage Attendance Requests" />
      
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-gray-800 dark:bg-gray-900/50">
        <h3 className="mb-5 text-xl font-semibold text-gray-900 dark:text-white">
          Pending Requests {user?.role === 'level1' ? 'for Final Approval' : 'for Review'}
        </h3>
        
        <PendingRequestsList 
          requestsUpdated={requestsUpdated} 
          onRequestProcessed={handleRequestProcessed}
        />
      </div>
    </div>
  );
};

export default AdminRequestsPage; 