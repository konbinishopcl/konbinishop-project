import HeroForm from '@/components/form-hero';
import { StrapiAPI } from '@/lib/strapi/api';
import { ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

// Get categories for the form
async function getCategories() {
  try {
    const response = await StrapiAPI.getCategories(1, 1000); // Get all categories
    return (response.data as Array<{ id: number; name: string }>) || [];
  } catch {
    return [];
  }
}

// Get regions for the form
async function getRegions() {
  try {
    const response = await StrapiAPI.getRegions(1, 1000); // Get all regions
    return (response.data as Array<{ id: number; name: string }>) || [];
  } catch {
    return [];
  }
}

// Get communes for the form
async function getCommunes() {
  try {
    const response = await StrapiAPI.getCommunes(1, 1000); // Get all communes
    return (response.data as Array<{ id: number; name: string }>) || [];
  } catch {
    return [];
  }
}

export const metadata: Metadata = {
  title: 'Crear Hero | Konbini',
  description:
    'Crea una nueva sección hero en el sistema Konbini. Configura banners principales con imágenes y enlaces.',
  keywords:
    'konbini, dashboard, admin, crear hero, nuevo banner, sección principal, gestión',
};

export default async function CreateHeroPage() {
  let categories: Array<{ id: number; name: string }> = [];
  let regions: Array<{ id: number; name: string }> = [];
  let communes: Array<{ id: number; name: string }> = [];

  try {
    [categories, regions, communes] = await Promise.all([
      getCategories(),
      getRegions(),
      getCommunes(),
    ]);
  } catch {
    // Fallback to empty arrays if API calls fail
  }

  return (
    <div className='p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center space-x-4'>
            <Link
              href='/dashboard/heroes'
              className='inline-flex items-center text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 underline transition-colors'
            >
              <ArrowLeft size={20} className='mr-2' />
              Volver a Heroes
            </Link>
          </div>
          <div className='mt-4'>
            <h1 className='text-3xl font-bold text-gray-900'>
              Crear Nuevo Hero
            </h1>
            <p className='text-gray-600 mt-2'>
              Completa la información para crear una nueva sección hero
            </p>
          </div>
        </div>

        {/* Form */}
        <div className='bg-white rounded-lg border border-gray-200 p-8'>
          <HeroForm
            categories={categories.map(cat => ({
              ...cat,
              id: cat.id.toString(),
            }))}
            regions={regions.map(reg => ({ ...reg, id: reg.id.toString() }))}
            communes={communes.map(com => ({ ...com, id: com.id.toString() }))}
          />
        </div>
      </div>
    </div>
  );
}
