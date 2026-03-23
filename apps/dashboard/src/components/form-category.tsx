'use client';

import { useSlugify } from '@/lib/hooks/useSlugify';
import { StrapiAPI } from '@/lib/strapi/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
}

interface CategoryFormProps {
  category?: {
    id: number;
    documentId: string;
    name: string;
    slug: string;
    description: string;
  };
  isEditing?: boolean;
}

export default function CategoryForm({
  category,
  isEditing = false,
}: CategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CategoryFormData>();

  const name = watch('name');

  // Use custom slugify hook
  const { slug, isGenerating } = useSlugify({
    title: name || '',
    isEditing,
    initialSlug: category?.slug || '',
  });

  // Update slug in form when it changes
  useEffect(() => {
    if (slug && slug !== category?.slug) {
      setValue('slug', slug);
    }
  }, [slug, setValue, category?.slug]);

  // Set initial values if editing
  useEffect(() => {
    if (category && isEditing) {
      setValue('name', category.name);
      setValue('slug', category.slug);
      setValue('description', category.description);
    }
  }, [category, isEditing, setValue]);

  const onSubmit = async (data: CategoryFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (isEditing && category) {
        await StrapiAPI.updateCategory(
          category.documentId.toString(),
          data as unknown as Record<string, unknown>
        );
        router.push(`/dashboard/categories/${category.documentId}`);
      } else {
        const newCategory = await StrapiAPI.createCategory(
          data as unknown as Record<string, unknown>
        );
        if (
          newCategory &&
          typeof newCategory === 'object' &&
          'data' in newCategory &&
          newCategory.data &&
          typeof newCategory.data === 'object' &&
          'id' in newCategory.data
        ) {
          router.push(`/dashboard/categories/${newCategory.data.documentId}`);
        } else {
          router.push('/dashboard/categories');
        }
      }
      router.refresh();
    } catch (error) {
      console.error('Error saving category:', error);
      setError('Error al guardar la categoría');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
      {error && (
        <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
          <p className='text-sm text-red-600'>{error}</p>
        </div>
      )}

      <div>
        <label
          htmlFor='name'
          className='block text-sm font-medium text-gray-700 mb-2'
        >
          Nombre de la Categoría *
        </label>
        <input
          type='text'
          id='name'
          {...register('name', {
            required: 'El nombre es requerido',
            minLength: {
              value: 2,
              message: 'El nombre debe tener al menos 2 caracteres',
            },
          })}
          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          placeholder='Ej: Deportes'
        />
        {errors.name && (
          <p className='mt-1 text-sm text-red-600'>{errors.name.message}</p>
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
          placeholder='deportes'
          readOnly
        />
        {errors.slug && (
          <p className='mt-1 text-sm text-red-600'>{errors.slug.message}</p>
        )}
        <p className='mt-1 text-sm text-gray-500'>
          {isGenerating ? (
            <span className='text-blue-600'>Generando slug...</span>
          ) : (
            'El slug se genera automáticamente desde el nombre'
          )}
        </p>
      </div>

      <div>
        <label
          htmlFor='description'
          className='block text-sm font-medium text-gray-700 mb-2'
        >
          Descripción
        </label>
        <textarea
          id='description'
          rows={4}
          {...register('description')}
          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          placeholder='Describe brevemente la categoría...'
        />
        {errors.description && (
          <p className='mt-1 text-sm text-red-600'>
            {errors.description.message}
          </p>
        )}
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
            'Actualizar Categoría'
          ) : (
            'Crear Categoría'
          )}
        </button>
      </div>
    </form>
  );
}
