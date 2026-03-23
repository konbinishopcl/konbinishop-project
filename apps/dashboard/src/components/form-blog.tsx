'use client';

import { useSlugify } from '@/lib/hooks/useSlugify';
import { StrapiAPI } from '@/lib/strapi/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import Select from 'react-select';
import ImageUploadField from './image-upload-field';
import TipTapEditor from './tiptap-editor';

interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image?: {
    id: number;
    url: string;
    name: string;
  } | null;
  tags: number[];
  events: number[];
}

interface BlogFormProps {
  blog?: {
    documentId: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    image?: {
      id: number;
      url: string;
      name: string;
    } | null;
    tags: Array<{ id: number; name: string }>;
    events: Array<{ id: number; title: string }>;
  };
  isEditing?: boolean;
  events: Array<{ id: number; title: string }>;
  tags: Array<{ id: number; name: string }>;
}

interface SelectOption {
  value: number;
  label: string;
}

export default function BlogForm({
  blog,
  isEditing = false,
  events,
  tags,
}: BlogFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<SelectOption[]>([]);
  const [selectedTags, setSelectedTags] = useState<SelectOption[]>([]);
  const router = useRouter();

  const methods = useForm<BlogFormData>();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = methods;

  const title = watch('title');

  // Use custom slugify hook
  const { slug, isGenerating } = useSlugify({
    title: title || '',
    isEditing,
    initialSlug: blog?.slug || '',
  });

  // Update slug in form when it changes
  useEffect(() => {
    if (slug && slug !== blog?.slug) {
      setValue('slug', slug);
    }
  }, [slug, setValue, blog?.slug]);

  // Set initial values if editing
  useEffect(() => {
    if (blog && isEditing) {
      setValue('title', blog.title);
      setValue('slug', blog.slug);
      setValue('excerpt', blog.excerpt);
      setValue('content', blog.content);
      setValue('image', blog.image);
      setValue('tags', blog.tags?.map(t => t.id) || []);
      setValue('events', blog.events?.map(e => e.id) || []);

      // Set selected options for multiselects
      if (blog.tags && tags.length > 0) {
        const selected = tags
          .filter(tag => blog.tags.some(bt => bt.id === tag.id))
          .map(tag => ({ value: tag.id, label: tag.name }));
        setSelectedTags(selected);
      }

      if (blog.events && events.length > 0) {
        const selected = events
          .filter(event => blog.events.some(be => be.id === event.id))
          .map(event => ({ value: event.id, label: event.title }));
        setSelectedEvents(selected);
      }
    }
  }, [blog, isEditing, setValue, events, tags]);

  // Handle event selection change
  const handleEventChange = (
    selectedOptions: readonly SelectOption[] | null
  ) => {
    const selected = selectedOptions || [];
    setSelectedEvents([...selected]);
    setValue(
      'events',
      selected.map(option => option.value)
    );
  };

  const onSubmit = async (data: BlogFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (isEditing && blog) {
        await StrapiAPI.updateArticle(
          blog.documentId.toString(),
          data as unknown as Record<string, unknown>
        );
        router.push(`/dashboard/articles/${blog.documentId}`);
      } else {
        const newBlog = await StrapiAPI.createArticle(
          data as unknown as Record<string, unknown>
        );
        if (newBlog && typeof newBlog === 'object' && 'id' in newBlog) {
          router.push(`/dashboard/articles/${newBlog.documentId}`);
        } else {
          router.push('/dashboard/articles');
        }
      }
      router.refresh();
    } catch (error) {
      console.error('Error saving article:', error);
      setError('Error al guardar el artículo');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert arrays to options for react-select
  const eventOptions: SelectOption[] = events.map(event => ({
    value: event.id,
    label: event.title,
  }));

  const tagOptions: SelectOption[] = tags.map(tag => ({
    value: tag.id,
    label: tag.name,
  }));

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
        {error && (
          <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
            <p className='text-sm text-red-600'>{error}</p>
          </div>
        )}

        <div>
          <label
            htmlFor='title'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Título del Artículo *
          </label>
          <input
            type='text'
            id='title'
            {...register('title', {
              required: 'El título es requerido',
              minLength: {
                value: 3,
                message: 'El título debe tener al menos 3 caracteres',
              },
            })}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            placeholder='Ej: Guía completa de eventos deportivos'
          />
          {errors.title && (
            <p className='mt-1 text-sm text-red-600'>{errors.title.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor='slug'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Slug *
          </label>
          <input
            type='text'
            id='slug'
            {...register('slug', {
              required: 'El slug es requerido',
              pattern: {
                value: /^[a-z0-9-]+$/,
                message:
                  'El slug solo puede contener letras minúsculas, números y guiones',
              },
            })}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed'
            placeholder='guia-completa-eventos-deportivos'
            readOnly
          />
          {errors.slug && (
            <p className='mt-1 text-sm text-red-600'>{errors.slug.message}</p>
          )}
          <p className='mt-1 text-sm text-gray-500'>
            {isGenerating ? (
              <span className='text-blue-600'>Generando slug...</span>
            ) : (
              'El slug se genera automáticamente desde el título'
            )}
          </p>
        </div>

        <div>
          <label
            htmlFor='excerpt'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Extracto
          </label>
          <textarea
            id='excerpt'
            rows={3}
            {...register('excerpt')}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            placeholder='Breve resumen del artículo...'
          />
          {errors.excerpt && (
            <p className='mt-1 text-sm text-red-600'>
              {errors.excerpt.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor='content'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Contenido *
          </label>
          <TipTapEditor
            content={watch('content') || ''}
            onChange={content => setValue('content', content)}
            placeholder='Escribe el contenido completo del artículo...'
            variant='advanced'
            className='w-full'
          />
          {errors.content && (
            <p className='mt-1 text-sm text-red-600'>
              {errors.content.message}
            </p>
          )}
        </div>

        <div>
          <ImageUploadField
            name='image'
            label='Imagen del Artículo'
            required={false}
          />
        </div>

        <div>
          {/* <pre>{JSON.stringify(tagOptions, null, 2)}</pre> */}
          <label
            htmlFor='tags'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Tags
          </label>
          <Select
            isMulti
            options={tagOptions}
            value={selectedTags}
            onChange={selected => {
              const selectedArray = selected || [];
              setSelectedTags([...selectedArray]);
              setValue(
                'tags',
                selectedArray.map(option => option.value)
              );
            }}
            placeholder='Selecciona tags...'
            className='w-full'
            classNamePrefix='react-select'
          />
          <p className='mt-1 text-sm text-gray-500'>
            Separa los tags con comas
          </p>
        </div>

        <div>
          {/* <pre>{JSON.stringify(events, null, 2)}</pre> */}
          <label
            htmlFor='events'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Eventos
          </label>
          <Select
            isMulti
            options={eventOptions}
            value={selectedEvents}
            onChange={handleEventChange}
            placeholder='Selecciona eventos relacionados...'
            className='w-full'
            classNamePrefix='react-select'
          />
          <p className='mt-1 text-sm text-gray-500'>
            Selecciona los eventos relacionados con este blog
          </p>
        </div>

        <div className='flex items-center justify-end space-x-4 pt-6'>
          <button
            type='button'
            onClick={() => router.back()}
            className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
          >
            Cancelar
          </button>
          <button
            type='submit'
            disabled={isSubmitting}
            className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isSubmitting ? (
              <div className='flex items-center'>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                Guardando...
              </div>
            ) : isEditing ? (
              'Actualizar Artículo'
            ) : (
              'Crear Artículo'
            )}
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
