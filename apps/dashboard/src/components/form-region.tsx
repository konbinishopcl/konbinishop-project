'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { StrapiAPI } from '@/lib/strapi/api';
import { useSlugify } from '@/lib/hooks/useSlugify';

interface RegionFormData {
  name: string;
  slug: string;
}

interface RegionFormProps {
  region?: {
    documentId: string;
    name: string;
    slug: string;
  };
  isEditing?: boolean;
}

export default function RegionForm({
  region,
  isEditing = false,
}: RegionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RegionFormData>();

  const name = watch('name');

  // Use custom slugify hook
  const { slug, isGenerating } = useSlugify({
    title: name || '',
    isEditing,
    initialSlug: region?.slug || '',
  });

  // Update slug in form when it changes
  useEffect(() => {
    if (slug && slug !== region?.slug) {
      setValue('slug', slug);
    }
  }, [slug, setValue, region?.slug]);

  // Set initial values if editing
  useEffect(() => {
    if (region && isEditing) {
      setValue('name', region.name);
      setValue('slug', region.slug);
    }
  }, [region, isEditing, setValue]);

  const onSubmit = async (data: RegionFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (isEditing && region) {
        await StrapiAPI.updateRegion(
          region.documentId,
          data as unknown as Record<string, unknown>
        );
        // Redirect to region details after update
        router.push(`/dashboard/regions/${region.documentId}`);
      } else {
        const newRegion = await StrapiAPI.createRegion(
          data as unknown as Record<string, unknown>
        );
        // Redirect to new region details after creation
        if (
          newRegion &&
          typeof newRegion === 'object' &&
          'documentId' in newRegion
        ) {
          router.push(`/dashboard/regions/${newRegion.documentId}`);
        } else {
          router.push('/dashboard/regions');
        }
      }

      router.refresh();
    } catch (error) {
      console.error('Error saving region:', error);
      setError('Error al guardar la región');
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
          Nombre de la Región *
        </label>
        <input
          type='text'
          id='name'
          {...register('name')}
          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)]'
          placeholder='Ej: Región Metropolitana'
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
          placeholder='region-metropolitana'
          readOnly
        />
        {errors.slug && (
          <p className='mt-1 text-sm text-red-600'>{errors.slug.message}</p>
        )}
        <p className='mt-1 text-sm text-gray-500'>
          {isGenerating ? (
            <span className='text-[var(--brand-primary)]'>
              Generando slug...
            </span>
          ) : (
            'El slug se genera automáticamente desde el nombre'
          )}
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
          className='px-4 py-2 text-sm font-medium text-white bg-[var(--brand-primary)] rounded-lg hover:bg-[var(--brand-primary)]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isSubmitting ? (
            <div className='flex items-center'>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
              Guardando...
            </div>
          ) : isEditing ? (
            'Actualizar Región'
          ) : (
            'Crear Región'
          )}
        </button>
      </div>
    </form>
  );
}
