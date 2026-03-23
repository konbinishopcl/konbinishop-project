import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { StrapiAPI } from '@/lib/strapi/api';
import BlogForm from '@/components/form-blog';
import { Metadata } from 'next';

// Get events for the form
async function getEvents() {
  try {
    const response = await StrapiAPI.getEvents(1, 1000); // Get all events
    return (response.data as Array<{ id: number; title: string }>) || [];
  } catch {
    return [];
  }
}

// Get tags for the form
async function getTags() {
  try {
    const response = await StrapiAPI.getTags(1, 1000); // Get all tags
    return (response.data as Array<{ id: number; name: string }>) || [];
  } catch {
    return [];
  }
}

export const metadata: Metadata = {
  title: 'Crear Artículo | Konbini',
  description:
    'Crea un nuevo artículo en el sistema Konbini. Escribe contenido, agrega imágenes y etiquetas.',
  keywords: 'konbini, dashboard, admin, crear artículo, contenido, gestión',
};

export default async function CreateArticlePage() {
  const [events, tags] = await Promise.all([getEvents(), getTags()]);

  return (
    <div className='p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center space-x-4'>
            <Link
              href='/dashboard/articles'
              className='inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors'
            >
              <ArrowLeft size={20} className='mr-2' />
              Volver a Artículos
            </Link>
          </div>
          <div className='mt-4'>
            <h1 className='text-3xl font-bold text-gray-900'>
              Crear Nuevo Artículo
            </h1>
            <p className='text-gray-600 mt-2'>
              Completa la información para crear un nuevo artículo
            </p>
          </div>
        </div>

        {/* Form */}
        <div className='bg-white rounded-lg border border-gray-200 p-8'>
          <BlogForm events={events} tags={tags} />
        </div>
      </div>
    </div>
  );
}
