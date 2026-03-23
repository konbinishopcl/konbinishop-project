'use client';

import { useSlugify } from '@/lib/hooks/useSlugify';
import { StrapiAPI } from '@/lib/strapi/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { Image, Info, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import Select from 'react-select';
import Swal from 'sweetalert2';
import { z } from 'zod';
import EventDatesField from './event-dates-field';
import EventPricesField from './event-prices-field';
import EventSocialLinksField from './event-social-links-field';
import EventVideosField from './event-videos-field';
import ImageUploadField from './image-upload-field';
import TipTapEditor from './tiptap-editor';

// Esquema de validación con Zod - Solo campos realmente obligatorios
const eventFormSchema = z.object({
  // Información básica
  title: z
    .string()
    .min(1, 'El título es requerido')
    .max(100, 'El título no puede exceder 100 caracteres'),
  slug: z.string().optional(), // Se genera automáticamente, no se valida
  company: z.string().min(1, 'La empresa es requerida'),
  categories: z
    .array(z.number())
    .min(1, 'Debe seleccionar al menos una categoría'),
  user: z.number().min(1, 'El usuario es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  about: z.string().min(1, 'La información sobre el evento es requerida'),
  ticket_url: z
    .string()
    .url('Debe ser una URL válida')
    .optional()
    .or(z.literal('')),

  // Ubicación
  address: z.string().min(1, 'La dirección es requerida'),
  address_number: z.string().min(1, 'El número de dirección es requerido'),
  commune: z.number().min(1, 'La comuna es requerida'),
  region: z.number().min(1, 'La región es requerida'),

  // Prices
  prices: z
    .array(
      z.object({
        name: z.string().min(1, 'El nombre del precio es requerido'),
        price: z.number().min(1, 'El precio debe ser mayor a 0'),
      })
    )
    .optional(),

  // Dates
  dates: z
    .array(
      z.object({
        date: z.string().min(1, 'La fecha es requerida'),
        start_time: z.string().min(1, 'La hora de inicio es requerida'),
        end_time: z.string().min(1, 'La hora de término es requerida'),
      })
    )
    .min(1, 'Debes agregar al menos una fecha'),

  // Social Links
  socialLinks: z
    .array(
      z.object({
        link: z.string().min(1, 'La URL es requerida'),
      })
    )
    .optional(),

  // Videos
  videos: z
    .array(
      z.object({
        link: z.string().min(1, 'La URL es requerida'),
      })
    )
    .optional(),

  // Images
  banner: z
    .any()
    .refine(val => val && (typeof val === 'object' ? val.id : val), {
      message: 'El banner es requerido',
    }),
  poster: z
    .any()
    .refine(val => val && (typeof val === 'object' ? val.id : val), {
      message: 'El poster es requerido',
    }),
  gallery: z.any().refine(val => Array.isArray(val) && val.length > 0, {
    message: 'La galería debe tener al menos una imagen',
  }),
});

type EventFormData = z.infer<typeof eventFormSchema>;

interface EventFormProps {
  event?: {
    id: number;
    documentId: string;
    title: string;
    slug: string;
    company: string;
    description: string;
    about: string;

    prices: Array<{
      name: string;
      price: number;
    }>;
    dates: Array<{
      date: string;
      start_time: string;
      end_time: string;
    }>;
    address: string;
    address_number: string;
    ticket_url: string;
    socialLinks: Array<{
      link: string;
    }>;
    videos: Array<{
      link: string;
    }>;
    categories: Array<{
      id: number;
      name: string;
    }>;
    user?: {
      id: number;
      username: string;
      firstname?: string;
      lastname?: string;
    };
    commune: {
      id: number;
      name: string;
    };
    region: {
      id: number;
      name: string;
    };
    banner?: {
      id: number;
      url: string;
      name: string;
    };
    poster?: {
      id: number;
      url: string;
      name: string;
    };
    gallery?: Array<{
      id: number;
      url: string;
      name: string;
    }>;
  };
  isEditing?: boolean;
}

interface SelectOption {
  value: number;
  label: string;
}

export default function EventForm({
  event,
  isEditing = false,
}: EventFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SelectOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<SelectOption | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<SelectOption | null>(
    null
  );
  const [selectedCommune, setSelectedCommune] = useState<SelectOption | null>(
    null
  );

  // State for API data
  const [categories, setCategories] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [users, setUsers] = useState<
    Array<{
      id: number;
      username: string;
      firstname?: string;
      lastname?: string;
    }>
  >([]);
  const [regions, setRegions] = useState<Array<{ id: number; name: string }>>(
    []
  );
  const [communes, setCommunes] = useState<
    Array<{ id: number; name: string; region: number }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  const methods = useForm({
    resolver: zodResolver(eventFormSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      company: '',
      description: '',
      about: '',
      address: '',
      address_number: '',
      ticket_url: '',
      categories: [],
      user: undefined,
      region: 0,
      commune: 0,
      prices: [],
      socialLinks: [],
      videos: [],
      banner: null,
      poster: null,
      gallery: [],
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
    initialSlug: event?.slug || '',
  });

  // Update slug in form when it changes
  useEffect(() => {
    if (slug && slug !== event?.slug) {
      setValue('slug', slug);
    }
  }, [slug, setValue, event?.slug]);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesRes, usersRes, regionsRes, communesRes] =
          await Promise.all([
            StrapiAPI.getCategories(1, 1000),
            StrapiAPI.getUsers(),
            StrapiAPI.getRegions(1, 1000),
            StrapiAPI.getCommunes(1, 1000),
          ]);

        setCategories(
          (categoriesRes.data as Array<{ id: number; name: string }>) || []
        );

        setUsers(
          (usersRes.data as Array<{
            id: number;
            username: string;
            firstname?: string;
            lastname?: string;
          }>) || []
        );

        setRegions(
          (regionsRes.data as Array<{ id: number; name: string }>) || []
        );

        setCommunes(
          (communesRes.data as Array<{
            id: number;
            name: string;
            region: number;
          }>) || []
        );
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Set form values when data is loaded and event exists
  useEffect(() => {
    if (event && isEditing) {
      // Set form values as soon as the required data is available
      if (categories.length > 0) {
        setValue(
          'categories',
          event.categories.map(cat => cat.id)
        );
        // Update selectedCategory state to match form value
        const selectedCats = categories
          .filter(cat => event.categories.some(ec => ec.id === cat.id))
          .map(cat => ({ value: cat.id, label: cat.name }));
        setSelectedCategory(selectedCats);
      }
      if (users.length > 0) {
        setValue('user', event.user?.id || 0);
        // Update selectedUser state to match form value
        const selectedUser = users.find(u => u.id === event.user?.id);
        if (selectedUser) {
          setSelectedUser({
            value: selectedUser.id,
            label:
              `${selectedUser.firstname || ''} ${selectedUser.lastname || ''}`.trim() ||
              selectedUser.username,
          });
        }
      }
      if (regions.length > 0) {
        setValue('region', event.region.id);
        // Update selectedRegion state to match form value
        const selectedRegion = regions.find(r => r.id === event.region.id);
        if (selectedRegion) {
          setSelectedRegion({
            value: selectedRegion.id,
            label: selectedRegion.name,
          });
        }
      }
      if (communes.length > 0) {
        setValue('commune', event.commune.id);
        // Update selectedCommune state to match form value
        const selectedCommune = communes.find(c => c.id === event.commune.id);
        if (selectedCommune) {
          setSelectedCommune({
            value: selectedCommune.id,
            label: selectedCommune.name,
          });
        }
      }
    }
  }, [event, isEditing, categories, users, regions, communes, setValue]);

  // Handle select changes
  const handleCategoryChange = (options: readonly SelectOption[]) => {
    setSelectedCategory([...options]);
    setValue(
      'categories',
      options.map(opt => opt.value)
    );
  };

  const handleUserChange = (option: SelectOption | null) => {
    setSelectedUser(option);
    setValue('user', option?.value || 0);
  };

  const handleRegionChange = (option: SelectOption | null) => {
    setSelectedRegion(option);
    setValue('region', option?.value || 0);
  };

  const handleCommuneChange = (option: SelectOption | null) => {
    setSelectedCommune(option);
    setValue('commune', option?.value || 0);
  };

  // Set initial form values when event changes
  useEffect(() => {
    if (event && isEditing) {
      setValue('title', event.title);
      setValue('company', event.company);
      setValue('description', event.description);
      setValue('about', event.about);
      setValue('address', event.address);
      setValue('address_number', event.address_number);
      setValue('ticket_url', event.ticket_url);
      setValue('prices', event.prices || []);
      setValue('dates', event.dates || []);
      setValue('socialLinks', event.socialLinks || []);
      setValue('videos', event.videos || []);
      setValue('banner', event.banner || null);
      setValue('poster', event.poster || null);
      setValue('gallery', event.gallery || []);
    }
  }, [event, isEditing, setValue]);

  // Sincronizar valores seleccionados con el formulario
  useEffect(() => {
    if (selectedRegion) {
      setValue('region', selectedRegion.value);
    }
  }, [selectedRegion, setValue]);

  useEffect(() => {
    if (selectedCommune) {
      setValue('commune', selectedCommune.value);
    }
  }, [selectedCommune, setValue]);

  // Sincronizar categories y usuario con el formulario
  // useEffect(() => {
  //   if (selectedCategory.length > 0) {
  //     setValue(
  //       'category',
  //       options.map(opt => opt.value)
  //     );
  //   }
  // }, [selectedCategory, setValue]);

  // useEffect(() => {
  //   if (selectedUser) {
  //     setValue('user', selectedUser.value);
  //   }
  // }, [selectedUser, setValue]);

  // const handlePricesChange = useCallback(
  //   (prices: Array<{ name: string; price: number }>) => {
  //     setValue('prices', prices);
  //   },
  //   [setValue]
  // );

  const onSubmit = async (data: EventFormData) => {
    try {
      setIsSubmitting(true);

      // Transformar formato de tiempo de HH:mm a HH:mm:ss.SSS antes de enviar
      const transformedDates = data.dates?.map(date => ({
        ...date,
        start_time:
          date.start_time && !date.start_time.includes(':00.000')
            ? `${date.start_time}:00.000`
            : date.start_time,
        end_time:
          date.end_time && !date.end_time.includes(':00.000')
            ? `${date.end_time}:00.000`
            : date.end_time,
      }));

      // Transformar imágenes para enviar solo los IDs
      const transformedBanner = data.banner?.id || null;
      const transformedPoster = data.poster?.id || null;
      const transformedGallery =
        data.gallery?.map((image: { id: number }) => image.id) || [];

      const eventData = {
        title: data.title,
        slug: data.slug,
        company: data.company,
        categories: data.categories,
        user: data.user,
        description: data.description,
        about: data.about,
        address: data.address,
        address_number: data.address_number,
        region: data.region,
        commune: data.commune,
        ticket_url: data.ticket_url,
        prices: data.prices,
        dates: transformedDates,
        socialLinks: data.socialLinks,
        videos: data.videos,
        banner: transformedBanner,
        poster: transformedPoster,
        gallery: transformedGallery,
      };

      if (isEditing && event) {
        await StrapiAPI.updateEvent(event.documentId.toString(), eventData);
        router.push(`/dashboard/events/${event.documentId}`);
      } else {
        const response = await StrapiAPI.createEvent(eventData);

        // Verificar diferentes estructuras de respuesta
        const documentId =
          response?.data?.documentId ||
          response?.data?.id ||
          response?.documentId;

        if (documentId) {
          await router.push(`/dashboard/events/${documentId}`);
        } else {
          await router.push('/dashboard/events');
        }
      }
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Error al guardar el evento',
        text: 'Ha ocurrido un problema al intentar guardar el evento. Por favor, inténtalo de nuevo.',
        confirmButtonText: 'Entendido',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert data to options for react-select
  const categoryOptions: SelectOption[] = categories.map(cat => ({
    value: cat.id,
    label: cat.name,
  }));

  const userOptions: SelectOption[] = users.map(user => ({
    value: user.id,
    label:
      user.firstname && user.lastname
        ? `${user.firstname} ${user.lastname}`
        : user.username,
  }));

  const regionOptions: SelectOption[] = regions.map(reg => ({
    value: reg.id,
    label: reg.name,
  }));

  const communeOptions: SelectOption[] = communes.map(com => ({
    value: com.id,
    label: com.name,
  }));

  // Verificar si los datos están disponibles

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className='flex flex-col gap-6'
        noValidate
      >
        {/* Basic Information Section */}
        <div className='bg-white border border-gray-200 rounded-lg p-6 space-y-6'>
          <h2 className='text-xl font-semibold text-gray-900 flex items-center'>
            <Info size={20} className='mr-2 text-[var(--brand-primary)]' />
            Información Básica
          </h2>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <label
                htmlFor='title'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Título del Evento *
              </label>
              <input
                type='text'
                id='title'
                {...register('title', {
                  required: 'El título es requerido',
                  maxLength: {
                    value: 100,
                    message: 'El título no puede exceder 100 caracteres',
                  },
                })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder='Ej: Festival de Música 2025'
              />
              {errors.title && (
                <p className='mt-1 text-sm text-red-600'>
                  {errors.title.message?.toString()}
                </p>
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
                placeholder='festival-musica-2025'
                readOnly
              />
              {errors.slug && (
                <p className='mt-1 text-sm text-red-600'>
                  {errors.slug.message?.toString()}
                </p>
              )}
              <p className='mt-1 text-sm text-gray-500'>
                {isGenerating ? (
                  <span className='text-blue-600'>Generando slug...</span>
                ) : (
                  'El slug se genera automáticamente desde el título'
                )}
              </p>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <label
                htmlFor='company'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Empresa
              </label>
              <input
                type='text'
                id='company'
                {...register('company')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.company
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300'
                }`}
                placeholder='Nombre de la empresa organizadora'
              />
              {errors.company && (
                <p className='mt-1 text-sm text-red-600'>
                  {errors.company.message?.toString()}
                </p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Usuario *
              </label>
              <Select
                options={userOptions}
                value={selectedUser}
                onChange={handleUserChange}
                placeholder={
                  isLoading
                    ? 'Cargando usuarios...'
                    : 'Selecciona un usuario...'
                }
                className='w-full'
                classNamePrefix='react-select'
                isClearable
              />
              <p className='mt-1 text-xs text-gray-500'>
                Relaciona este evento con un usuario específico
              </p>
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Categorías *
            </label>

            <Select
              options={categoryOptions}
              value={selectedCategory}
              onChange={handleCategoryChange}
              placeholder={
                isLoading
                  ? 'Cargando categorías...'
                  : 'Selecciona categorías...'
              }
              className={`w-full ${errors.categories ? 'border-red-300' : ''}`}
              classNamePrefix='react-select'
              isMulti
            />
            {errors.categories && (
              <p className='mt-1 text-sm text-red-600'>
                {errors.categories.message?.toString()}
              </p>
            )}
            {!isLoading && categories.length === 0 && (
              <p className='mt-1 text-xs text-gray-500'>
                No hay categorías disponibles
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor='description'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Descripción *
            </label>
            <TipTapEditor
              content={watch('description') || ''}
              onChange={content => setValue('description', content)}
              placeholder='Describe brevemente el evento...'
              variant='basic'
              className={errors.description ? 'border-red-300 bg-red-50' : ''}
            />
            {errors.description && (
              <p className='mt-1 text-sm text-red-600'>
                {errors.description.message?.toString()}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor='about'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Acerca del Evento
            </label>
            <TipTapEditor
              content={watch('about') || ''}
              onChange={content => setValue('about', content)}
              placeholder='Información detallada sobre el evento...'
              variant='advanced'
              className={errors.about ? 'border-red-300 bg-red-50' : ''}
            />
            {errors.about && (
              <p className='mt-1 text-sm text-red-600'>
                {errors.about.message?.toString()}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor='ticket_url'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              URL donde comprar los tickets
            </label>
            <input
              type='url'
              id='ticket_url'
              {...register('ticket_url')}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.ticket_url
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
              placeholder='https://...'
            />
            {errors.ticket_url && (
              <p className='mt-1 text-sm text-red-600'>
                {errors.ticket_url.message?.toString()}
              </p>
            )}
          </div>
        </div>

        {/* Location Section */}
        <div className='bg-white border border-gray-200 rounded-lg p-6 space-y-6'>
          <h2 className='text-xl font-semibold text-gray-900 flex items-center'>
            <MapPin size={20} className='mr-2 text-[var(--brand-primary)]' />
            Ubicación
          </h2>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.address
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300'
                }`}
                placeholder='Ej: Av. Providencia'
              />
              {errors.address && (
                <p className='mt-1 text-sm text-red-600'>
                  {errors.address.message?.toString()}
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.address_number
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300'
                }`}
                placeholder='Ej: 1234'
              />
              {errors.address_number && (
                <p className='mt-1 text-sm text-red-600'>
                  {errors.address_number.message?.toString()}
                </p>
              )}
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Región *
              </label>
              <Select
                options={regionOptions}
                value={selectedRegion}
                onChange={handleRegionChange}
                placeholder={
                  isLoading
                    ? 'Cargando regiones...'
                    : 'Selecciona una región...'
                }
                className={`w-full ${errors.region ? 'border-red-300' : ''}`}
                classNamePrefix='react-select'
              />
              {errors.region && (
                <p className='mt-1 text-sm text-red-600'>
                  {errors.region.message?.toString()}
                </p>
              )}
              {!isLoading && regions.length === 0 && (
                <p className='mt-1 text-xs text-gray-500'>
                  No hay regiones disponibles
                </p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Comuna *
              </label>
              <Select
                options={communeOptions}
                value={selectedCommune}
                onChange={handleCommuneChange}
                placeholder={
                  !selectedRegion
                    ? 'Selecciona una región primero'
                    : isLoading
                      ? 'Cargando comunas...'
                      : 'Selecciona una comuna...'
                }
                className={`w-full ${errors.commune ? 'border-red-300' : ''}`}
                classNamePrefix='react-select'
                isDisabled={!selectedRegion}
                isClearable
              />
              {errors.commune && (
                <p className='mt-1 text-sm text-red-600'>
                  {errors.commune.message?.toString()}
                </p>
              )}
              {!selectedRegion && (
                <p className='mt-1 text-xs text-gray-500'>
                  Selecciona una región primero
                </p>
              )}
              {selectedRegion && !isLoading && communes.length === 0 && (
                <p className='mt-1 text-xs text-gray-500'>
                  No hay comunas disponibles para esta región
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Prices Section */}
        <div className='bg-white border border-gray-200 rounded-lg p-6 space-y-6'>
          {/* <pre>{JSON.stringify(watch('prices'), null, 2)}</pre>
          <pre>Errores: {JSON.stringify(errors.prices, null, 2)}</pre> */}
          <EventPricesField
            prices={watch('prices')}
            onPricesChange={prices => setValue('prices', prices)}
            errors={
              errors.prices as Array<{
                name?: { message: string };
                price?: { message: string };
              }>
            }
          />
        </div>

        {/* Dates Section */}
        <div className='bg-white border border-gray-200 rounded-lg p-6 space-y-6'>
          {/* <pre>{JSON.stringify(watch('dates'), null, 2)}</pre>
          <pre>Errores: {JSON.stringify(errors.dates, null, 2)}</pre> */}
          <EventDatesField
            dates={watch('dates')}
            onDatesChange={dates => setValue('dates', dates)}
            errors={
              errors.dates as Array<{
                date?: { message: string };
                start_time?: { message: string };
                end_time?: { message: string };
              }>
            }
          />
        </div>

        {/* Social Links Section */}
        <div className='bg-white border border-gray-200 rounded-lg p-6 space-y-6'>
          {/* <pre>{JSON.stringify(watch('socialLinks'), null, 2)}</pre>
          <pre>Errores: {JSON.stringify(errors.socialLinks, null, 2)}</pre> */}
          <EventSocialLinksField
            socialLinks={watch('socialLinks')}
            onSocialLinksChange={socialLinks =>
              setValue('socialLinks', socialLinks)
            }
            errors={errors.socialLinks as Array<{ link?: { message: string } }>}
          />
        </div>

        {/* Videos Section */}
        <div className='bg-white border border-gray-200 rounded-lg p-6 space-y-6'>
          <EventVideosField
            videos={watch('videos')}
            onVideosChange={videos => setValue('videos', videos)}
            errors={errors.videos as Array<{ link?: { message: string } }>}
          />
        </div>

        {/* Media Section */}
        <div className='bg-white border border-gray-200 rounded-lg p-6 space-y-6'>
          <h2 className='text-xl font-semibold text-gray-900 flex items-center'>
            <Image size={20} className='mr-2 text-[var(--brand-primary)]' />
            Medios
            <span className='text-red-500 ml-1'>*</span>
          </h2>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <ImageUploadField
              name='banner'
              label='Banner del Evento *'
              multiple={false}
              required={true}
              errors={errors.banner}
            />

            <ImageUploadField
              name='poster'
              label='Poster del Evento *'
              multiple={false}
              required={true}
              errors={errors.poster}
            />
          </div>

          <ImageUploadField
            name='gallery'
            label='Galería de Imágenes *'
            multiple={true}
            required={true}
            errors={errors.gallery}
          />
        </div>

        {/* Submit Buttons */}
        <div className='bg-white border border-gray-200 rounded-lg p-6'>
          <div className='flex items-center justify-end space-x-4'>
            <button
              type='button'
              onClick={() => router.back()}
              className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
            >
              Cancelar
            </button>
            <button
              type='submit'
              className='px-4 py-2 text-sm font-medium text-white bg-[var(--brand-primary)] rounded-lg hover:bg-[var(--brand-primary)]/80 transition-colors'
            >
              {isSubmitting ? (
                <div className='flex items-center'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                  Guardando...
                </div>
              ) : isEditing ? (
                'Actualizar Evento'
              ) : (
                'Crear Evento'
              )}
            </button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
