import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import TagForm from '@/components/form-tag';
import { StrapiAPI } from '@/lib/strapi/api';
import { Metadata } from 'next';

interface Tag {
  documentId: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

// Get tag from Strapi API
async function getTag(documentId: string): Promise<Tag | null> {
  try {
    const tag = await StrapiAPI.getTag(documentId);
    return tag as Tag;
  } catch (error) {
    console.error('Error fetching tag:', error);
    return null;
  }
}

// Generate metadata for the page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ documentId: string }>;
}): Promise<Metadata> {
  const { documentId } = await params;
  const tag = await getTag(documentId);

  if (!tag) {
    return {
      title: 'Etiqueta no encontrada | Konbini',
      description:
        'La etiqueta que buscas editar no existe o ha sido eliminada.',
    };
  }

  return {
    title: `Editar ${tag.name} | Etiqueta | Konbini`,
    description: `Edita la etiqueta ${tag.name} en Konbini.`,
    keywords: `konbini, dashboard, admin, editar etiqueta, ${tag.name}, modificar, tag`,
  };
}

export default async function EditTagPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const tag = await getTag(documentId);

  if (!tag) {
    return (
      <div className='p-6'>
        <div className='max-w-4xl mx-auto'>
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
              Etiqueta no encontrada
            </h3>
            <p className='text-gray-500 mb-6'>
              La etiqueta que buscas no existe o ha sido eliminada.
            </p>
            <Link
              href='/dashboard/tags'
              className='inline-flex items-center px-4 py-2 bg-[var(--brand-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--brand-primary)]/80 transition-colors'
            >
              <ArrowLeft size={16} className='mr-2' />
              Volver a Etiquetas
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
              href={`/dashboard/tags/${tag.documentId}`}
              className='inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors'
            >
              <ArrowLeft size={20} className='mr-2' />
              Volver a Detalles
            </Link>
          </div>
          <div className='mt-4'>
            <h1 className='text-3xl font-bold text-gray-900'>
              Editar Etiqueta
            </h1>
            <p className='text-gray-600 mt-2'>
              Modifica la información de la etiqueta {tag.name}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className='bg-white rounded-lg border border-gray-200 p-8'>
          <TagForm tag={tag} isEditing={true} />
        </div>
      </div>
    </div>
  );
}
