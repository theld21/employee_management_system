import React from 'react';
import { Editor } from '@tiptap/react';

interface EditorToolbarProps {
  editor: Editor | null;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  if (!editor) return null;

  return (
    <div className="border-b p-2 flex flex-wrap gap-2 bg-gray-50 dark:bg-gray-800">
      <button type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        title="Bold"
      >
        <i className="fas fa-bold"></i>
      </button>
      <button type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        title="Italic"
      >
        <i className="fas fa-italic"></i>
      </button>
      <button type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('underline') ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        title="Underline"
      >
        <i className="fas fa-underline"></i>
      </button>
      <button type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('strike') ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        title="Strike"
      >
        <i className="fas fa-strikethrough"></i>
      </button>
      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
      <button type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        title="Heading 1"
      >
        H1
      </button>
      <button type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        title="Heading 2"
      >
        H2
      </button>
      <button type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        title="Heading 3"
      >
        H3
      </button>
      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
      <button type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        title="Bullet List"
      >
        <i className="fas fa-list-ul"></i>
      </button>
      <button type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        title="Ordered List"
      >
        <i className="fas fa-list-ol"></i>
      </button>
      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
      <button type="button"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        title="Align Left"
      >
        <i className="fas fa-align-left"></i>
      </button>
      <button type="button"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        title="Align Center"
      >
        <i className="fas fa-align-center"></i>
      </button>
      <button type="button"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        title="Align Right"
      >
        <i className="fas fa-align-right"></i>
      </button>
      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
      <button type="button"
        onClick={() => {
          const url = window.prompt('Enter the URL');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('link') ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        title="Insert Link"
      >
        <i className="fas fa-link"></i>
      </button>
      <button type="button"
        onClick={() => {
          const url = window.prompt('Enter the image URL');
          if (url) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        }}
        className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        title="Insert Image"
      >
        <i className="fas fa-image"></i>
      </button>
      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
      <button type="button"
        onClick={() => editor.chain().focus().undo().run()}
        className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        title="Undo"
      >
        <i className="fas fa-undo"></i>
      </button>
      <button type="button"
        onClick={() => editor.chain().focus().redo().run()}
        className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        title="Redo"
      >
        <i className="fas fa-redo"></i>
      </button>
    </div>
  );
}; 