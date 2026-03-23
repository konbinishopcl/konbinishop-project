import { StrapiAPI } from '@/lib/strapi/api';
import {
  ArrowLeft,
  Edit,
  Hash,
  Image as ImageIcon,
  MapPin,
  Tag,
} from 'lucide-react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

interface Hero {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  date: string;
  address: string;
  address_number: string;
  venue: string;
  link?: string;
  category?: Array<{
    id: number;
    name: string;
  }> | null;
  region?: {
    id: number;
    name: string;
  } | null;
  commune?: {
    id: number;
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
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

// Helper function to safely construct image URLs
function getImageUrl(image: { url: string } | null | undefined): string {
  if (!image || !image.url) {
    return '/placeholder-image.jpg'; // Fallback image
  }

  // If it's already a full URL, return it
  if (image.url.startsWith('http')) {
    return image.url;
  }

  // If it's a relative path, construct the full URL
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
  const cleanUrl = image.url.startsWith('/') ? image.url : `/${image.url}`;

  try {
    return `${baseUrl}${cleanUrl}`;
  } catch (error) {
    console.error('Error constructing image URL:', error);
    return '/placeholder-image.jpg'; // Fallback on error
  }
}

// Get hero and related data from Strapi API
async function getHeroAndData(id: string): Promise<{
  hero: Hero | null;
  categories: Array<{ id: number; name: string }>;
  regions: Array<{ id: number; name: string }>;
  communes: Array<{ id: number; name: string }>;
}> {
  try {
    // Get all heroes and related data for filtering
    const [
      heroesResponse,
      categoriesResponse,
      regionsResponse,
      communesResponse,
    ] = await Promise.all([
      StrapiAPI.getHeroes(1, 1000), // Get all for filtering
      StrapiAPI.getCategories(1, 1000), // Get all categories
      StrapiAPI.getRegions(1, 1000), // Get all regions
      StrapiAPI.getCommunes(1, 1000), // Get all communes
    ]);

    const heroes = (heroesResponse.data as Hero[]) || [];
    const hero = heroes.find((h: Hero) => h.documentId === id);
    const categories =
      (categoriesResponse.data as Array<{ id: number; name: string }>) || [];
    const regions =
      (regionsResponse.data as Array<{ id: number; name: string }>) || [];
    const communes =
      (communesResponse.data as Array<{ id: number; name: string }>) || [];

    return { hero: hero || null, categories, regions, communes };
  } catch (error) {
    throw error;
  }
}

// Generate metadata for the page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ documentId: string }>;
}): Promise<Metadata> {
  const { documentId } = await params;
  const { hero } = await getHeroAndData(documentId);

  if (!hero) {
    return {
      title: 'Hero no encontrado | Konbini',
      description: 'El hero que buscas no existe o ha sido eliminado.',
    };
  }

  return {
    title: `${hero.title} | Hero | Konbini`,
    description: `Detalles de la sección hero: ${hero.title} en Konbini.`,
    keywords: `konbini, dashboard, admin, hero, ${hero.title}, banner, sección principal`,
  };
}

export default async function HeroDetailsPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const { hero, regions, communes } = await getHeroAndData(documentId);

  if (!hero) {
    return (
      <div className='p-6'>
        <div className='max-w-6xl mx-auto'>
          <div className='text-center py-12'>
            <div className='text-red-400 mb-4'>
              <svg
                className='mx-auto h-12 w-12'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
            </div>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Hero no encontrado
            </h3>
            <p className='text-gray-500 mb-6'>
              El hero que buscas no existe o ha sido eliminado.
            </p>
            <Link
              href='/dashboard/heroes'
              className='inline-flex items-center px-4 py-2 bg-[var(--brand-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--brand-primary)]/80 transition-colors'
            >
              <ArrowLeft size={16} className='mr-2' />
              Volver a Heroes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper function to get region name from ID
  const getRegionName = (regionId?: number) => {
    if (!regionId) return null;
    return regions.find(region => region.id === regionId)?.name;
  };

  // Helper function to get commune name from ID
  const getCommuneName = (communeId?: number) => {
    if (!communeId) return null;
    return communes.find(commune => commune.id === communeId)?.name;
  };

  return (
    <div className='p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <Link
                href='/dashboard/heroes'
                className='inline-flex items-center text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 underline transition-colors'
              >
                <ArrowLeft size={20} className='mr-2' />
                Volver a Heroes
              </Link>
            </div>
            <div className='flex items-center space-x-3'>
              <Link
                href={`/dashboard/heroes/${hero.documentId}/edit`}
                className='inline-flex items-center px-4 py-2 bg-[var(--brand-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--brand-primary)]/80 transition-colors'
              >
                <Edit size={16} className='mr-2' />
                Editar Hero
              </Link>
            </div>
          </div>
          <div className='mt-4'>
            <h1 className='text-3xl font-bold text-gray-900'>
              Detalles del Hero
            </h1>
            <p className='text-gray-600 mt-2'>
              Información completa de la sección hero {hero.title}
            </p>
          </div>
        </div>

        {/* Two Column Layout with Separate Cards */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Left Column - Main Information (2/3 width) */}
          <div className='lg:col-span-2'>
            <div className='bg-white rounded-lg border border-gray-200 p-8 h-full'>
              <div className='space-y-8'>
                {/* Basic Information */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                    <ImageIcon
                      size={20}
                      className='mr-2 text-[var(--brand-primary)]'
                    />
                    Información Básica
                  </h3>
                  <div className='space-y-4'>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        ID del Hero:{' '}
                      </span>
                      <span className='text-sm text-gray-900 font-mono'>
                        #{hero.documentId}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Título:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {hero.title}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Slug:{' '}
                      </span>
                      <span className='slug-text'>{hero.slug}</span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Fecha:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {formatDate(hero.date)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                    <MapPin
                      size={20}
                      className='mr-2 text-[var(--brand-primary)]'
                    />
                    Información de Ubicación
                  </h3>
                  <div className='space-y-4'>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Lugar:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {hero.venue}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Dirección:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {hero.address} {hero.address_number}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Región:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {getRegionName(hero.region?.id) || 'No especificada'}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Comuna:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {getCommuneName(hero.commune?.id) || 'No especificada'}
                      </span>
                    </div>
                    {hero.link && (
                      <div>
                        <span className='text-sm font-medium text-gray-500'>
                          Enlace:{' '}
                        </span>
                        <a
                          href={hero.link}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-sm text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 underline'
                        >
                          {hero.link}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* System Information */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                    <Hash
                      size={20}
                      className='mr-2 text-[var(--brand-primary)]'
                    />
                    Información del Sistema
                  </h3>
                  <div className='space-y-4'>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Estado:{' '}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          hero.publishedAt
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {hero.publishedAt ? 'Publicado' : 'Borrador'}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Fecha de Creación:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {formatDate(hero.createdAt)}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Última Actualización:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {formatDate(hero.updatedAt)}
                      </span>
                    </div>
                    {hero.publishedAt && (
                      <div>
                        <span className='text-sm font-medium text-gray-500'>
                          Fecha de Publicación:{' '}
                        </span>
                        <span className='text-sm text-gray-900'>
                          {formatDate(hero.publishedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar (1/3 width) */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-lg border border-gray-200 p-6 h-full'>
              <div className='space-y-6'>
                {/* Thumbnail */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-3 flex items-center'>
                    <ImageIcon
                      size={18}
                      className='mr-2 text-[var(--brand-primary)]'
                    />
                    Imagen Principal
                  </h3>
                  {hero.thumbnail ? (
                    <div className='space-y-2'>
                      <Image
                        src={getImageUrl(hero.thumbnail)}
                        alt={hero.thumbnail.name}
                        width={320}
                        height={128}
                        className='w-full h-32 object-cover rounded-lg'
                      />
                      <p className='text-sm text-gray-600'>
                        {hero.thumbnail.name}
                      </p>
                    </div>
                  ) : (
                    <p className='text-sm text-gray-500'>
                      No hay imagen principal
                    </p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-3 flex items-center'>
                    <Tag
                      size={18}
                      className='mr-2 text-[var(--brand-primary)]'
                    />
                    Categorías
                  </h3>
                  {hero.category && hero.category.length > 0 ? (
                    <div className='flex flex-wrap gap-2'>
                      {hero.category.map(cat => (
                        <span
                          key={cat.id}
                          className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                        >
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className='text-sm text-gray-500'>
                      No hay categorías asociadas
                    </p>
                  )}
                </div>

                {/* Images */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-3 flex items-center'>
                    <ImageIcon
                      size={18}
                      className='mr-2 text-[var(--brand-primary)]'
                    />
                    Imágenes Responsivas
                  </h3>
                  <div className='space-y-3'>
                    {hero.desktop_image ? (
                      <div className='text-sm'>
                        <span className='font-medium text-gray-700'>
                          Desktop:{' '}
                        </span>
                        <span className='text-gray-600'>
                          {hero.desktop_image.name}
                        </span>
                      </div>
                    ) : (
                      <div className='text-sm text-red-500'>
                        ❌ Desktop faltante
                      </div>
                    )}
                    {hero.tablet_image ? (
                      <div className='text-sm'>
                        <span className='font-medium text-gray-700'>
                          Tablet:{' '}
                        </span>
                        <span className='text-gray-600'>
                          {hero.tablet_image.name}
                        </span>
                      </div>
                    ) : (
                      <div className='text-sm text-red-500'>
                        ❌ Tablet faltante
                      </div>
                    )}
                    {hero.mobile_image ? (
                      <div className='text-sm'>
                        <span className='font-medium text-gray-700'>
                          Mobile:{' '}
                        </span>
                        <span className='text-gray-600'>
                          {hero.mobile_image.name}
                        </span>
                      </div>
                    ) : (
                      <div className='text-sm text-red-500'>
                        ❌ Mobile faltante
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
