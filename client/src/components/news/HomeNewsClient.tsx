'use client';

import React, { useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import NewsList from "@/components/news/NewsList";
import CreateNewsModal from "@/components/news/CreateNewsModal";
import { useAuth } from "@/context/AuthContext";

export default function HomeNewsClient() {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const handleSuccess = () => {
    setRefresh(r => r + 1);
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Tin tức" />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full">
          {user?.role === 'admin' && (
            <div className="flex justify-end mb-4">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => setShowCreateModal(true)}
              >
                Đăng bài
              </button>
            </div>
          )}
          <NewsList key={refresh} />
          <CreateNewsModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </div>
  );
} 