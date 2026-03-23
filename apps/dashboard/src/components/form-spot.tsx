'use client';

import { StrapiAPI } from '@/lib/strapi/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import ImageUploadField from './image-upload-field';
import InputDate from './input-date';

// Interface for spot form data
interface SpotFormData {
  title: string;
  image: number | { id: number; url: string; name: string } | null;
  link: string;
  expiration_date: string;
}

// Interface for spot props
interface SpotFormProps {
  spot?: {
    id: number;
    documentId: string;
    title: string;
    image?: {
      id: number;
      url: string;
      name: string;
    } | null;
    link?: string;
    expiration_date?: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  };
  isEditing?: boolean;
}

export default function SpotForm({ spot, isEditing = false }: SpotFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const methods = useForm<SpotFormData>({
    defaultValues: {
      title: '',
      image: null,
      link: '',
      expiration_date: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = methods;

  // Set initial values if editing
  useEffect(() => {
    if (spot && isEditing) {
      setValue('title', spot.title);
      setValue('link', spot.link || '');
      setValue('expiration_date', spot.expiration_date || '');
      setValue('image', spot.image || null);
    }
  }, [spot, isEditing, setValue]);

  const onSubmit = async (data: SpotFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Clean up the data before sending to Strapi
      const cleanData = { ...data };

      // Ensure image field only sends ID
      if (
        cleanData.image &&
        typeof cleanData.image === 'object' &&
        'id' in cleanData.image
      ) {
        cleanData.image = (cleanData.image as { id: number }).id;
      }

      if (isEditing && spot) {
        await StrapiAPI.updateSpot(
          spot.documentId.toString(),
          cleanData as unknown as Record<string, unknown>
        );
        router.push(`/dashboard/spots/${spot.documentId}`);
      } else {
        const newSpot = await StrapiAPI.createSpot(
          cleanData as unknown as Record<string, unknown>
        );
        if (newSpot && typeof newSpot === 'object' && 'documentId' in newSpot) {
          router.push(`/dashboard/spots/${newSpot.documentId}`);
        } else {
          router.push('/dashboard/spots');
        }
      }
      router.refresh();
    } catch {
      setError('Error al guardar el spot');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Título *
          </label>
          <input
            type='text'
            id='title'
            {...register('title', { required: 'El título es requerido' })}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)]'
            placeholder='Ej: Promoción de Verano'
          />
          {errors.title && (
            <p className='mt-1 text-sm text-red-600'>{errors.title.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor='link'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Enlace
          </label>
          <input
            type='url'
            id='link'
            {...register('link')}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)]'
            placeholder='https://ejemplo.com'
          />
          {errors.link && (
            <p className='mt-1 text-sm text-red-600'>{errors.link.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor='expiration_date'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Fecha de Expiración
          </label>
          <InputDate
            value={watch('expiration_date') || ''}
            onChange={date => setValue('expiration_date', date)}
            placeholder='dd/mm/aaaa'
          />
          {errors.expiration_date && (
            <p className='mt-1 text-sm text-red-600'>
              {errors.expiration_date.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor='image'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Imagen
          </label>
          <ImageUploadField
            name='image'
            label='Imagen del Spot'
            required={false}
          />
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
            disabled={isSubmitting || !watch('title')?.trim()}
            className='px-4 py-2 text-sm font-medium text-white bg-[var(--brand-primary)] rounded-lg hover:bg-[var(--brand-primary)]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isSubmitting ? (
              <div className='flex items-center'>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                Guardando...
              </div>
            ) : isEditing ? (
              'Actualizar Spot'
            ) : (
              'Crear Spot'
            )}
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
