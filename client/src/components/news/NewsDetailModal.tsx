import React from 'react';

interface NewsDetailModalProps {
  news: {
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
  };
}

const NewsDetailModal: React.FC<NewsDetailModalProps> = ({ news }) => {
  return (
    <div className="w-full">
      <div className="mb-4 flex items-center gap-4">
        {news.thumbnail && (
          <img src={news.thumbnail} alt={news.title} className="w-32 h-20 object-cover rounded-lg" />
        )}
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-1">{news.title}</h3>
          <div className="text-xs text-gray-400 mb-1">
            {news.createdBy.firstName} {news.createdBy.lastName} - {new Date(news.createdAt).toLocaleString('vi-VN', { hour12: false })}
          </div>
          {news.tags && news.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-1">
              {news.tags.map((tag, idx) => (
                <span key={idx} className="border border-blue-400 text-blue-500 px-2 py-0.5 rounded-full text-xs">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="prose max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: news.content }} />
    </div>
  );
};

export default NewsDetailModal; 