'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect } from 'react';
import StarterKit from '@tiptap/starter-kit';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Link from '@tiptap/extension-link';
import Typography from '@tiptap/extension-typography';
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Strikethrough as StrikeIcon,
  List as BulletListIcon,
  ListOrdered as OrderedListIcon,
} from 'lucide-react';

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  variant?: 'basic' | 'advanced';
  className?: string;
}

export default function TipTapEditor({
  content,
  onChange,
  placeholder = 'Escribe aquí...',
  variant = 'basic',
  className = '',
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions:
      variant === 'basic'
        ? [
            StarterKit.configure({
              heading: false,
              bulletList: false,
              orderedList: false,
              blockquote: false,
              codeBlock: false,
              horizontalRule: false,
            }),
            Bold,
            Italic,
            Underline,
            Strike,
          ]
        : [
            StarterKit.configure({
              heading: {
                levels: [2, 3, 4, 5, 6], // Sin h1
              },
            }),
            Bold,
            Italic,
            Underline,
            Strike,
            BulletList,
            OrderedList,
            ListItem,
            Link.configure({
              openOnClick: false,
              HTMLAttributes: {
                class: 'text-blue-600 underline cursor-pointer',
              },
            }),
            Typography,
          ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
    immediatelyRender: false,
  });

  // Sincronizar el contenido cuando cambie la prop content
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({
    onClick,
    isActive,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type='button'
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={`p-2 rounded hover:bg-gray-100 transition-colors ${
        isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
      }`}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <div
      className={`border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${className}`}
    >
      {/* Toolbar */}
      <div className='flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50'>
        {/* Basic formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title='Negrita'
        >
          <BoldIcon className='w-4 h-4' />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title='Cursiva'
        >
          <ItalicIcon className='w-4 h-4' />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title='Subrayado'
        >
          <UnderlineIcon className='w-4 h-4' />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title='Tachado'
        >
          <StrikeIcon className='w-4 h-4' />
        </ToolbarButton>

        {/* Advanced formatting (only for advanced variant) */}
        {variant === 'advanced' && (
          <>
            <div className='w-px h-6 bg-gray-300 mx-2'></div>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              title='Lista con viñetas'
            >
              <BulletListIcon className='w-4 h-4' />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              title='Lista numerada'
            >
              <OrderedListIcon className='w-4 h-4' />
            </ToolbarButton>

            {/* Heading buttons */}
            <div className='w-px h-6 bg-gray-300 mx-2'></div>

            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              isActive={editor.isActive('heading', { level: 2 })}
              title='Título 2'
            >
              H2
            </ToolbarButton>

            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              isActive={editor.isActive('heading', { level: 3 })}
              title='Título 3'
            >
              H3
            </ToolbarButton>

            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 4 }).run()
              }
              isActive={editor.isActive('heading', { level: 4 })}
              title='Título 4'
            >
              H4
            </ToolbarButton>
          </>
        )}
      </div>

      {/* Editor content */}
      <div className='p-3 min-h-[120px]'>
        <EditorContent
          editor={editor}
          className='min-h-[100px] prose prose-sm max-w-none'
        />
        {!content && (
          <div className='text-gray-400 pointer-events-none absolute top-0 left-0 p-3'>
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}
