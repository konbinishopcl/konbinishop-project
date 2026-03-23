import HeroForm from '@/components/form-hero';
import { StrapiAPI } from '@/lib/strapi/api';
import { ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

interface Hero {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  date: string;
  expiration_date: string;
  address: string;
  address_number: string;
  venue: string;
  link: string;
  categories?: Array<{
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
}

// Get hero and related data for the form
async function getHeroAndData(documentId: string) {
  try {
    const [
      heroesResponse,
      categoriesResponse,
      regionsResponse,
      communesResponse,
    ] = await Promise.all([
      StrapiAPI.getHeroes(1, 1000), // Get all heroes for filtering
      StrapiAPI.getCategories(1, 1000), // Get all categories
      StrapiAPI.getRegions(1, 1000), // Get all regions
      StrapiAPI.getCommunes(1, 1000), // Get all communes
    ]);

    const heroes = (heroesResponse.data as Hero[]) || [];
    const hero = heroes.find((h: Hero) => h.documentId === documentId);

    const categories =
      (categoriesResponse.data as Array<{ id: number; name: string }>) || [];
    const regions =
      (regionsResponse.data as Array<{ id: number; name: string }>) || [];
    const communes =
      (communesResponse.data as Array<{ id: number; name: string }>) || [];

    // Debug: Log what we're getting from the API
    console.log('=== DEBUG getHeroAndData ===');
    console.log('Heroes response:', heroesResponse);
    console.log('Found hero:', hero);
    console.log('Hero categories:', hero?.categories);
    console.log('Hero categories type:', typeof hero?.categories);
    console.log(
      'Hero categories length:',
      Array.isArray(hero?.categories) ? hero?.categories.length : 'Not an array'
    );
    console.log('Categories response:', categoriesResponse);
    console.log('Regions response:', regionsResponse);
    console.log('Communes response:', communesResponse);

    return { hero, categories, regions, communes };
  } catch {
    return { hero: null, categories: [], regions: [], communes: [] };
  }
}

// Helper function to map Hero to the format expected by HeroForm
function mapHeroForForm(hero: Hero) {
  return {
    id: hero.documentId,
    title: hero.title,
    slug: hero.slug,
    date: hero.date,
    expiration_date: hero.expiration_date || hero.date, // Fallback to date if no expiration_date
    address: hero.address,
    address_number: hero.address_number,
    venue: hero.venue,
    link: hero.link,
    categories:
      hero.categories?.map(cat => ({
        id: cat.id.toString(),
        name: cat.name,
      })) || [],
    region: hero.region
      ? {
          id: hero.region.id.toString(),
          name: hero.region.name,
        }
      : null,
    commune: hero.commune
      ? {
          id: hero.commune.id.toString(),
          name: hero.commune.name,
        }
      : null,
    desktop_image: hero.desktop_image,
    tablet_image: hero.tablet_image,
    mobile_image: hero.mobile_image,
    thumbnail: hero.thumbnail,
  };
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
      description: 'El hero que buscas editar no existe o ha sido eliminado.',
    };
  }

  return {
    title: `Editar ${hero.title} | Hero | Konbini`,
    description: `Edita la sección hero: ${hero.title} en Konbini.`,
    keywords: `konbini, dashboard, admin, editar hero, ${hero.title}, modificar, banner`,
  };
}

export default async function EditHeroPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const { hero, categories, regions, communes } =
    await getHeroAndData(documentId);

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

  return (
    <div className='p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center space-x-4'>
            <Link
              href={`/dashboard/heroes/${hero.documentId}`}
              className='inline-flex items-center text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 underline transition-colors'
            >
              <ArrowLeft size={20} className='mr-2' />
              Volver a Hero
            </Link>
          </div>
          <div className='mt-4'>
            <h1 className='text-3xl font-bold text-gray-900'>Editar Hero</h1>
            <p className='text-gray-600 mt-2'>
              Modifica la información de la sección hero {hero.title}
            </p>
          </div>
        </div>

        {/* Debug Info */}
        <div className='bg-gray-100 rounded-lg border border-gray-200 p-4 mb-6'>
          <h3 className='text-lg font-medium text-gray-900 mb-3'>
            Debug Info - API Response
          </h3>
          <pre className='text-xs bg-white p-4 rounded border overflow-auto max-h-96'>
            {JSON.stringify(hero, null, 2)}
          </pre>
        </div>

        {/* Form */}
        <div className='bg-white rounded-lg border border-gray-200 p-8'>
          <HeroForm
            hero={mapHeroForForm(hero)}
            categories={categories.map(cat => ({
              ...cat,
              id: cat.id.toString(),
            }))}
            regions={regions.map(reg => ({ ...reg, id: reg.id.toString() }))}
            communes={communes.map(com => ({ ...com, id: com.id.toString() }))}
            isEditing={true}
          />
        </div>
      </div>
    </div>
  );
}
