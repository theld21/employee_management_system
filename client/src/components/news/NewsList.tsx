'use client';

import React, { useEffect, useState } from 'react';
import api from '@/utils/api';
import { Modal } from '@/components/ui/modal';
import NewsDetailModal from './NewsDetailModal';
import EditNewsModal from './EditNewsModal';
import { useAuth } from '@/context/AuthContext';

interface NewsItem {
  _id: string;
  title: string;
  content: string;
  thumbnail?: string;
  tags?: string[];
  isNew?: boolean;
  createdBy: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface Pagination {
  page: number;
  totalPages: number;
  total: number;
}

const NewsList: React.FC = () => {
  const { user } = useAuth();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [pageSize, setPageSize] = useState(5);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const fetchNews = async (page = 1, limit = pageSize, searchQuery = search) => {
    setLoading(true);
    try {
      const res = await api.get(`/news?page=${page}&limit=${limit}` + (searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''));
      setNews(res.data.news);
      setPagination(res.data.pagination);
    } catch (err) {
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(1, pageSize, search);
    // eslint-disable-next-line
  }, [pageSize, search]);

  const handlePageChange = (page: number) => {
    fetchNews(page, pageSize, search);
  };

  const handleShowDetail = (item: NewsItem) => {
    setSelectedNews(item);
    setShowDetailModal(true);
  };

  const handleEdit = (e: React.MouseEvent, item: NewsItem) => {
    e.stopPropagation();
    setSelectedNews(item);
    setShowEditModal(true);
  };

  const handleDelete = async (e: React.MouseEvent, item: NewsItem) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      try {
        await api.delete(`/news/${item._id}`);
        fetchNews(pagination.page, pageSize, search);
      } catch (err) {
        alert('Xóa bài viết thất bại');
      }
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => {
      setSearch(e.target.value);
    }, 500));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tin tức</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchInput}
              onChange={handleSearchChange}
              className="w-64 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <svg
              className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <select
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
          <span className="text-sm text-gray-500 dark:text-gray-400">của {pagination.total} bài</span>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {news.map((item) => (
              <div key={item._id} className="flex gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2" onClick={() => handleShowDetail(item)}>
                <div className="w-36 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center relative">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-gray-400">No Image</span>
                  )}
                  {item.isNew && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">New</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-base line-clamp-1 text-gray-900 dark:text-white">{item.title}</span>
                    {user?.role === 'admin' && (
                      <div className="flex gap-2 ml-auto" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleEdit(e, item)}
                          className="p-1 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Sửa bài viết"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, item)}
                          className="p-1 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                          title="Xóa bài viết"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="text-gray-500 dark:text-gray-300 text-sm line-clamp-1 mb-1">{item.content.replace(/<[^>]+>/g, '').slice(0, 120)}...</div>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-1">
                      {item.tags.map((tag, idx) => (
                        <span key={idx} className="border border-blue-400 text-blue-500 px-2 py-0.5 rounded-full text-xs">{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    {item.createdBy.firstName} {item.createdBy.lastName} - {new Date(item.createdAt).toLocaleString('vi-VN', { hour12: false })}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Pagination UI */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-2 pb-2">
            <div className="flex items-center justify-center space-x-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={pagination.page === 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              >
                <span className="sr-only">Trang đầu</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="11 17 6 12 11 7"></polyline>
                  <polyline points="18 17 13 12 18 7"></polyline>
                </svg>
              </button>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              >
                <span className="sr-only">Trang trước</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <span className="mx-2 inline-flex text-sm font-medium text-gray-700 dark:text-gray-300">
                Trang {pagination.page} của {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              >
                <span className="sr-only">Trang tiếp</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.page === pagination.totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              >
                <span className="sr-only">Trang cuối</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="13 17 18 12 13 7"></polyline>
                  <polyline points="6 17 11 12 6 7"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
      {/* Modal chi tiết bài viết */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} className="max-w-2xl p-6 dark:bg-gray-900 dark:text-white">
        {selectedNews && <NewsDetailModal news={selectedNews} />}
      </Modal>
      {/* Modal chỉnh sửa bài viết */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} className="max-w-[1400px] p-6 dark:bg-gray-900 dark:text-white">
        {selectedNews && (
          <EditNewsModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSuccess={() => {
              setShowEditModal(false);
              fetchNews(pagination.page, pageSize, search);
            }}
            news={selectedNews}
          />
        )}
      </Modal>
    </div>
  );
};

export default NewsList; 