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
  const [thumbnail, setThumbnail] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/news', {
        title,
        content: editor?.getHTML() || '',
        thumbnail,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      setTitle('');
      setThumbnail('');
      setTags('');
      editor?.commands.setContent('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Đăng bài thất bại');
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
          <label className="block text-sm font-medium mb-1">Ảnh đại diện (URL)</label>
          <input
            type="text"
            value={thumbnail}
            onChange={e => setThumbnail(e.target.value)}
            className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-white"
          />
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