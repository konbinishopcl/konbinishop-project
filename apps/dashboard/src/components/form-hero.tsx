'use client';

import { useSlugify } from '@/lib/hooks/useSlugify';
import { StrapiAPI } from '@/lib/strapi/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import Select from 'react-select';
import Swal from 'sweetalert2';
import { z } from 'zod';
import ImageUploadField from './image-upload-field';
import InputDate from './input-date';

// Zod schema for hero validation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const heroSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  slug: z.string(),
  date: z.string().min(1, 'La fecha del evento es requerida'),
  expiration_date: z.string().min(1, 'La fecha de expiración es requerida'),
  address: z.string().min(1, 'La dirección es requerida'),
  address_number: z.string().min(1, 'El número es requerido'),
  venue: z.string().min(1, 'El lugar es requerido'),
  link: z.string().min(1, 'El enlace es requerido'),
  categories: z
    .array(z.number())
    .min(1, 'Debe seleccionar al menos una categoría'),
  region: z.number().min(1, 'Debe seleccionar una región'),
  commune: z.number().min(1, 'Debe seleccionar una comuna'),
  desktop_image: z
    .any()
    .refine(
      val => val !== null && val !== undefined,
      'La imagen desktop es requerida'
    ),
  tablet_image: z
    .any()
    .refine(
      val => val !== null && val !== undefined,
      'La imagen tablet es requerida'
    ),
  mobile_image: z
    .any()
    .refine(
      val => val !== null && val !== undefined,
      'La imagen mobile es requerida'
    ),
  thumbnail: z
    .any()
    .refine(
      val => val !== null && val !== undefined,
      'La imagen principal es requerida'
    ),
});

type HeroFormData = z.infer<typeof heroSchema>;

interface HeroFormProps {
  hero?: {
    id: string;
    title: string;
    slug: string;
    date: string;
    expiration_date: string;
    address: string;
    address_number: string;
    venue: string;
    link: string;
    categories?: Array<{
      id: string;
      name: string;
    }> | null;
    region?: {
      id: string;
      name: string;
    } | null;
    commune?: {
      id: string;
      name: string;
    } | null;
    desktop_image?: {
      id: number;
      url: string;
      name: string;
    } | null;
    tablet_image?: {
      id: number;
      url: string;
      name: string;
    } | null;
    mobile_image?: {
      id: number;
      url: string;
      name: string;
    } | null;
    thumbnail?: {
      id: number;
      url: string;
      name: string;
    } | null;
  };
  isEditing?: boolean;
  categories: Array<{ id: string; name: string }>;
  regions: Array<{ id: string; name: string }>;
  communes: Array<{ id: string; name: string }>;
}

interface SelectOption {
  value: number;
  label: string;
}

export default function HeroForm({
  hero,
  isEditing = false,
  categories,
  regions,
  communes,
}: HeroFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<SelectOption[]>(
    []
  );
  const [selectedRegion, setSelectedRegion] = useState<SelectOption | null>(
    null
  );
  const [selectedCommune, setSelectedCommune] = useState<SelectOption | null>(
    null
  );
  const router = useRouter();

  const methods = useForm<HeroFormData>({
    defaultValues: {
      title: '',
      slug: '',
      date: '',
      expiration_date: '',
      address: '',
      address_number: '',
      venue: '',
      link: '',
      categories: [],
      region: 0,
      commune: 0,
      desktop_image: null,
      tablet_image: null,
      mobile_image: null,
      thumbnail: null,
    },
  });

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
    initialSlug: hero?.slug || '',
  });

  // Update slug in form when it changes
  useEffect(() => {
    if (slug && slug !== hero?.slug) {
      setValue('slug', slug);
    }
  }, [slug, setValue, hero?.slug]);

  // Set initial values if editing
  useEffect(() => {
    if (hero && isEditing) {
      setValue('title', hero.title);
      setValue('slug', hero.slug);
      setValue('date', hero.date || '');
      setValue('expiration_date', hero.expiration_date || '');
      setValue('address', hero.address);
      setValue('address_number', hero.address_number);
      setValue('venue', hero.venue);
      setValue('link', hero.link || 'https://ejemplo.com');

      // Only set relation fields if they exist
      if (hero.categories && hero.categories.length > 0) {
        const categoryOptions = hero.categories.map(cat => ({
          value: Number(cat.id),
          label: cat.name,
        }));
        setValue(
          'categories',
          hero.categories.map(cat => Number(cat.id))
        );
        setSelectedCategories(categoryOptions);
      } else {
        setValue('categories', []);
        setSelectedCategories([]);
      }
      if (hero.region?.id) {
        setValue('region', Number(hero.region.id));
        setSelectedRegion({
          value: Number(hero.region.id),
          label: hero.region.name,
        });
      }
      if (hero.commune?.id) {
        setValue('commune', Number(hero.commune.id));
        setSelectedCommune({
          value: Number(hero.commune.id),
          label: hero.commune.name,
        });
      }

      setValue('desktop_image', hero.desktop_image || null);
      setValue('tablet_image', hero.tablet_image || null);
      setValue('mobile_image', hero.mobile_image || null);
      setValue('thumbnail', hero.thumbnail || null);
    }
  }, [hero, isEditing, setValue]);

  const onSubmit = async (data: HeroFormData) => {
    try {
      setIsSubmitting(true);

      // Clean up the data before sending to Strapi
      const cleanData = { ...data };

      // Format date to yyyy-MM-dd for API
      if (cleanData.date) {
        const date = new Date(cleanData.date);
        cleanData.date = date.toISOString().split('T')[0]; // Format as yyyy-MM-dd
      }

      // Format expiration_date to yyyy-MM-dd for API
      if (cleanData.expiration_date) {
        const expirationDate = new Date(cleanData.expiration_date);
        cleanData.expiration_date = expirationDate.toISOString().split('T')[0]; // Format as yyyy-MM-dd
      }

      // Remove empty link if it's just whitespace
      if (cleanData.link === '') {
        cleanData.link = '';
      }

      // Format relations for Strapi API
      if (cleanData.categories && cleanData.categories.length > 0) {
        cleanData.categories = cleanData.categories.map(id => id);
      }

      if (cleanData.region) {
        cleanData.region = cleanData.region;
      }

      if (cleanData.commune) {
        cleanData.commune = cleanData.commune;
      }

      // Ensure image fields only send IDs
      if (
        cleanData.desktop_image &&
        typeof cleanData.desktop_image === 'object' &&
        'id' in cleanData.desktop_image
      ) {
        cleanData.desktop_image = (
          cleanData.desktop_image as { id: number }
        ).id;
      }
      if (
        cleanData.tablet_image &&
        typeof cleanData.tablet_image === 'object' &&
        'id' in cleanData.tablet_image
      ) {
        cleanData.tablet_image = (cleanData.tablet_image as { id: number }).id;
      }
      if (
        cleanData.mobile_image &&
        typeof cleanData.mobile_image === 'object' &&
        'id' in cleanData.mobile_image
      ) {
        cleanData.mobile_image = (cleanData.mobile_image as { id: number }).id;
      }
      if (
        cleanData.thumbnail &&
        typeof cleanData.thumbnail === 'object' &&
        'id' in cleanData.thumbnail
      ) {
        cleanData.thumbnail = (cleanData.thumbnail as { id: number }).id;
      }

      if (isEditing && hero) {
        await StrapiAPI.updateHero(
          hero.id.toString(),
          cleanData as unknown as Record<string, unknown>
        );
        router.push(`/dashboard/heroes/${hero.id}`);
      } else {
        const newHero = await StrapiAPI.createHero(
          cleanData as unknown as Record<string, unknown>
        );
        if (newHero && typeof newHero === 'object' && 'id' in newHero) {
          router.push(`/dashboard/heroes/${newHero.id}`);
        } else {
          router.push('/dashboard/heroes');
        }
      }
      router.refresh();
    } catch {
      // Show error with SweetAlert2
      Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: 'Hubo un problema al guardar el hero. Por favor, verifica los datos e intenta nuevamente.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#dc2626',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert arrays to options for react-select
  const categoryOptions: SelectOption[] = categories.map(category => ({
    value: Number(category.id),
    label: category.name,
  }));

  const regionOptions: SelectOption[] = regions.map(region => ({
    value: Number(region.id),
    label: region.name,
  }));

  const communeOptions: SelectOption[] = communes.map(commune => ({
    value: Number(commune.id),
    label: commune.name,
  }));

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
        <div>
          <label
            htmlFor='title'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Título del Hero *
          </label>
          <input
            type='text'
            id='title'
            {...register('title')}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)]'
            placeholder='Ej: Evento Deportivo en Santiago'
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
            {...register('slug')}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed'
            placeholder='evento-deportivo-santiago'
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
            htmlFor='date'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Fecha del Evento *
          </label>
          <InputDate
            value={watch('date') || ''}
            onChange={date => setValue('date', date)}
            placeholder='Selecciona fecha del evento'
          />
          <input type='hidden' {...register('date')} />
          {errors.date && (
            <p className='mt-1 text-sm text-red-600'>{errors.date.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor='venue'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Lugar *
          </label>
          <input
            type='text'
            id='venue'
            {...register('venue')}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            placeholder='Ej: Estadio Nacional'
          />
          {errors.venue && (
            <p className='mt-1 text-sm text-red-600'>{errors.venue.message}</p>
          )}
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label
              htmlFor='address'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Dirección *
            </label>
            <input
              type='text'
              id='address'
              {...register('address')}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='Ej: Av. Grecia'
            />
            {errors.address && (
              <p className='mt-1 text-sm text-red-600'>
                {errors.address.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor='address_number'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Número *
            </label>
            <input
              type='text'
              id='address_number'
              {...register('address_number')}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='Ej: 1234'
            />
            {errors.address_number && (
              <p className='mt-1 text-sm text-red-600'>
                {errors.address_number.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor='link'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Enlace *
          </label>
          <input
            type='url'
            id='link'
            {...register('link')}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            placeholder='https://ejemplo.com'
          />
          {errors.link && (
            <p className='mt-1 text-sm text-red-600'>{errors.link.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor='category'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Categorías *
          </label>
          <Select
            isMulti
            options={categoryOptions}
            value={selectedCategories}
            onChange={selected => {
              const selectedArray = selected || [];
              setSelectedCategories([...selectedArray]);
              setValue(
                'categories',
                selectedArray.map(option => option.value)
              );
            }}
            placeholder='Selecciona categorías...'
            className='w-full'
            classNamePrefix='react-select'
            isClearable
          />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label
              htmlFor='region'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Región *
            </label>
            <Select
              options={regionOptions}
              value={selectedRegion}
              onChange={selected => {
                setSelectedRegion(selected);
                // Reset commune when region changes
                setSelectedCommune(null);
                if (selected) {
                  setValue('region', selected.value);
                  setValue('commune', 0); // Set default value for commune
                } else {
                  setValue('region', 0); // Set default value for region
                  setValue('commune', 0); // Set default value for commune
                }
              }}
              placeholder='Selecciona región...'
              className='w-full'
              classNamePrefix='react-select'
              isClearable
            />
          </div>

          <div>
            <label
              htmlFor='commune'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Comuna *
            </label>
            <Select
              options={communeOptions}
              value={selectedCommune}
              onChange={selected => {
                setSelectedCommune(selected);
                if (selected) {
                  setValue('commune', selected.value);
                } else {
                  setValue('commune', 0);
                }
              }}
              placeholder={
                selectedRegion
                  ? 'Selecciona comuna...'
                  : 'Primero selecciona una región'
              }
              className='w-full'
              classNamePrefix='react-select'
              isClearable
              isDisabled={!selectedRegion}
            />
          </div>
        </div>

        <div className='space-y-4'>
          <h3 className='text-lg font-medium text-gray-900'>Imágenes *</h3>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <div>
              <ImageUploadField
                name='desktop_image'
                label='Imagen Desktop *'
                required={true}
              />
            </div>

            <div>
              <ImageUploadField
                name='tablet_image'
                label='Imagen Tablet *'
                required={true}
              />
            </div>

            <div>
              <ImageUploadField
                name='mobile_image'
                label='Imagen Mobile *'
                required={true}
              />
            </div>

            <div>
              <ImageUploadField
                name='thumbnail'
                label='Imagen Principal (Thumbnail) *'
                required={true}
              />
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor='expiration_date'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Fecha de Expiración *
          </label>
          <InputDate
            value={watch('expiration_date') || ''}
            onChange={date => setValue('expiration_date', date)}
            placeholder='Selecciona fecha de expiración'
          />
          <input type='hidden' {...register('expiration_date')} />
          {errors.expiration_date && (
            <p className='mt-1 text-sm text-red-600'>
              {errors.expiration_date.message}
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
            disabled={
              isSubmitting ||
              !methods.getValues('categories')?.length ||
              !methods.getValues('link')?.trim()
            }
            className='px-4 py-2 text-sm font-medium text-white bg-[var(--brand-primary)] rounded-lg hover:bg-[var(--brand-primary)]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isSubmitting ? (
              <div className='flex items-center'>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                Guardando...
              </div>
            ) : isEditing ? (
              'Actualizar Hero'
            ) : (
              'Crear Hero'
            )}
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
