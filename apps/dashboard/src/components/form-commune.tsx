'use client';

import { useSlugify } from '@/lib/hooks/useSlugify';
import { StrapiAPI } from '@/lib/strapi/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Schema de validación con Zod
const communeSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  slug: z
    .string()
    .min(1, 'El slug es requerido')
    .regex(
      /^[a-z0-9-]+$/,
      'El slug solo puede contener letras minúsculas, números y guiones'
    ),
  region: z
    .string()
    .min(1, 'La región es requerida')
    .regex(
      /^[a-z0-9-]+$/,
      'La región solo puede contener letras minúsculas, números y guiones'
    ),
});

type CommuneFormData = z.infer<typeof communeSchema>;

interface CommuneFormProps {
  commune?: {
    documentId: string;
    name: string;
    slug: string;
    region?: {
      id: number;
      name: string;
    };
  };
  isEditing?: boolean;
  regions: Array<{ id: number; name: string }>;
}

export default function CommuneForm({
  commune,
  isEditing = false,
  regions,
}: CommuneFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CommuneFormData>({
    resolver: zodResolver(communeSchema),
    defaultValues: {
      name: '',
      slug: '',
      region: '',
    },
  });

  const name = watch('name');

  // Use custom slugify hook
  const { slug, isGenerating } = useSlugify({
    title: name || '',
    isEditing,
    initialSlug: commune?.slug || '',
  });

  // Update slug in form when it changes
  useEffect(() => {
    if (slug && slug !== commune?.slug) {
      setValue('slug', slug);
    }
  }, [slug, setValue, commune?.slug]);

  // Set initial values if editing
  useEffect(() => {
    if (commune && isEditing) {
      const regionValue = commune.region?.id?.toString() || '';

      // Usar setValue en lugar de reset para asegurar que se establezcan los valores
      setValue('name', commune.name);
      setValue('slug', commune.slug);
      setValue('region', regionValue);
    }
  }, [commune, isEditing, setValue]);

  const onSubmit = async (data: CommuneFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (isEditing && commune) {
        await StrapiAPI.updateCommune(
          commune.documentId,
          data as unknown as Record<string, unknown>
        );
        router.push(`/dashboard/communes/${commune.documentId}`);
      } else {
        const newCommune = await StrapiAPI.createCommune(
          data as unknown as Record<string, unknown>
        );
        if (
          newCommune &&
          typeof newCommune === 'object' &&
          'documentId' in newCommune
        ) {
          router.push(`/dashboard/communes/${newCommune.documentId}`);
        } else {
          router.push('/dashboard/communes');
        }
      }
      router.refresh();
    } catch (error) {
      console.error('Error saving commune:', error);
      setError('Error al guardar la comuna');
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
          Nombre de la Comuna *
        </label>
        <input
          type='text'
          id='name'
          {...register('name')}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] ${
            errors.name ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder='Ej: Arica'
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
          {...register('slug')}
          className={`w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed ${
            errors.slug ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder='arica'
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

      <div>
        <label
          htmlFor='region'
          className='block text-sm font-medium text-gray-700 mb-2'
        >
          Región *
        </label>
        <select
          id='region'
          {...register('region')}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] ${
            errors.region ? 'border-red-300' : 'border-gray-300'
          }`}
        >
          <option value=''>Selecciona una región</option>
          {regions.map(region => (
            <option key={region.id} value={region.id}>
              {region.name}
            </option>
          ))}
        </select>
        {errors.region && (
          <p className='mt-1 text-sm text-red-600'>{errors.region.message}</p>
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
          className='px-4 py-2 text-sm font-medium text-white bg-[var(--brand-primary)] rounded-lg hover:bg-[var(--brand-primary)]/80 transition-colors disabled:opacity-50 disabled:cursor-notowed'
        >
          {isSubmitting ? (
            <div className='flex items-center'>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
              Guardando...
            </div>
          ) : isEditing ? (
            'Actualizar Comuna'
          ) : (
            'Crear Comuna'
          )}
        </button>
      </div>
    </form>
  );
}
