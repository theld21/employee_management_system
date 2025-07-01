import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import api from '@/utils/api';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import { EditorToolbar } from './EditorToolbar';

interface EditNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  news: {
    _id: string;
    title: string;
    content: string;
    thumbnail?: string;
    tags?: string[];
  };
}

const editorExtensions = [
  StarterKit,
  Link,
  Image,
  Underline,
  Color,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
];

const EditNewsModal: React.FC<EditNewsModalProps> = ({ isOpen, onClose, onSuccess, news }) => {
  const [title, setTitle] = useState(news.title);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentThumbnail, setCurrentThumbnail] = useState(news.thumbnail || '');
  const [previewImage, setPreviewImage] = useState('');
  const [removeThumbnail, setRemoveThumbnail] = useState(false);
  const [tags, setTags] = useState(news.tags?.join(', ') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: editorExtensions,
    content: news.content,
    editorProps: {
      attributes: {
        class: 'min-h-[120px] p-2 border rounded bg-white dark:bg-gray-800 dark:text-white',
      },
    },
  });

  useEffect(() => {
    if (editor && news.content) {
      editor.commands.setContent(news.content);
    }
  }, [editor, news.content]);

  useEffect(() => {
    // Update state when news prop changes
    setTitle(news.title);
    setCurrentThumbnail(news.thumbnail || '');
    setPreviewImage('');
    setSelectedFile(null);
    setRemoveThumbnail(false);
    setTags(news.tags?.join(', ') || '');
  }, [news]);

  // Handle file upload and create preview
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (3MB = 3 * 1024 * 1024 bytes)
    if (file.size > 3 * 1024 * 1024) {
      setError('Kích thước ảnh không được vượt quá 3MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh');
      return;
    }

    setSelectedFile(file);
    setRemoveThumbnail(false);
    setError(null);

    // Create preview URL for new file
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remove current thumbnail
  const handleRemoveCurrentThumbnail = () => {
    setCurrentThumbnail('');
    setRemoveThumbnail(true);
    setSelectedFile(null);
    setPreviewImage('');
    // Reset file input
    const fileInput = document.getElementById('edit-thumbnail-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  // Remove new selected file
  const handleRemoveNewFile = () => {
    setSelectedFile(null);
    setPreviewImage('');
    // Reset file input
    const fileInput = document.getElementById('edit-thumbnail-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Create FormData to send file
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', editor?.getHTML() || '');
      formData.append('tags', tags);

      if (selectedFile) {
        formData.append('thumbnail', selectedFile);
      } else if (removeThumbnail) {
        formData.append('removeThumbnail', 'true');
      }

      await api.put(`/news/${news._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Cập nhật bài viết thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Determine which image to show
  const getDisplayImage = () => {
    if (previewImage) return previewImage; // New selected file preview
    if (currentThumbnail && !removeThumbnail) return currentThumbnail; // Current thumbnail
    return null;
  };

  const displayImage = getDisplayImage();

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[1400px] p-6 dark:bg-gray-900 dark:text-white">
      <h3 className="text-lg font-semibold mb-4">Chỉnh sửa bài viết</h3>
      {error && <div className="mb-2 text-red-500 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tiêu đề</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Nội dung</label>
          <div className="border rounded bg-white dark:bg-gray-800 dark:text-white">
            <EditorToolbar editor={editor} />
            <EditorContent editor={editor} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ảnh đại diện (tối đa 3MB)</label>
          {displayImage && (
            <div className="mb-2">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {previewImage ? 'Ảnh mới sẽ được tải lên:' : 'Ảnh hiện tại:'}
              </div>
              <div className="relative inline-block">
                <img
                  src={displayImage}
                  alt={previewImage ? "New thumbnail preview" : "Current thumbnail"}
                  className="w-32 h-20 object-cover rounded border"
                />
                <button
                  type="button"
                  onClick={previewImage ? handleRemoveNewFile : handleRemoveCurrentThumbnail}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          <input
            id="edit-thumbnail-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <div className="text-xs text-gray-500 mt-1">Chọn ảnh mới để thay thế ảnh hiện tại (nếu có)</div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tags (phân cách bởi dấu phẩy)</label>
          <input
            type="text"
            value={tags}
            onChange={e => setTags(e.target.value)}
            className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-white"
            placeholder="event, thông báo, ..."
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Hủy</button>
          <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-blue-500 text-white font-semibold">
            {loading ? 'Đang cập nhật...' : 'Cập nhật'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditNewsModal; 