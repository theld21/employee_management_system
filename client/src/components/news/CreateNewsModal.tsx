import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import { EditorToolbar } from './EditorToolbar';

interface CreateNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const editorExtensions = [
  StarterKit,
  Link,
  Image,
  Underline,
  Color,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
];

const CreateNewsModal: React.FC<CreateNewsModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: editorExtensions,
    content: '',
    editorProps: {
      attributes: {
        class: 'min-h-[120px] p-2 border rounded bg-white dark:bg-gray-800 dark:text-white',
      },
    },
  });

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
    setError(null);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remove image
  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewImage('');
    // Reset file input
    const fileInput = document.getElementById('thumbnail-upload') as HTMLInputElement;
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
      }

      await api.post('/news', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Reset form
      setTitle('');
      setSelectedFile(null);
      setPreviewImage('');
      setTags('');
      editor?.commands.setContent('');
      // Reset file input
      const fileInput = document.getElementById('thumbnail-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Đăng bài thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[1400px] p-6 dark:bg-gray-900 dark:text-white">
      <h3 className="text-lg font-semibold mb-4">Đăng bài viết mới</h3>
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
          <input
            id="thumbnail-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {previewImage && (
            <div className="mt-2 relative inline-block">
              <img
                src={previewImage}
                alt="Preview"
                className="w-32 h-20 object-cover rounded border"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
              >
                ×
              </button>
            </div>
          )}
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
            {loading ? 'Đang đăng...' : 'Đăng bài'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateNewsModal; 