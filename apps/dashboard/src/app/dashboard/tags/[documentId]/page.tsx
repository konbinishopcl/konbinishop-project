import { StrapiAPI } from '@/lib/strapi/api';
import { ArrowLeft, Edit, Hash, Tag } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

interface Tag {
  documentId: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  articles?: Array<{ documentId: string; title: string }>;
}

// Generate metadata for the page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ documentId: string }>;
}): Promise<Metadata> {
  const { documentId } = await params;
  const tag = await StrapiAPI.getTag(documentId);

  if (!tag) {
    return {
      title: 'Etiqueta no encontrada | Konbini',
      description: 'La etiqueta que buscas no existe o ha sido eliminada.',
    };
  }

  return {
    title: `${(tag as Tag).name} | Etiqueta | Konbini`,
    description: `Detalles de la etiqueta ${(tag as Tag).name} en Konbini.`,
    keywords: `konbini, dashboard, admin, etiqueta, ${(tag as Tag).name}, tag, organización`,
  };
}

export default async function TagDetailsPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const tag = await StrapiAPI.getTag(documentId);

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

  const tagData = tag as Tag;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  return (
    <div className='p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <Link
                href='/dashboard/tags'
                className='inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors'
              >
                <ArrowLeft size={20} className='mr-2' />
                Volver a Etiquetas
              </Link>
            </div>
            <div className='flex items-center space-x-3'>
              <Link
                href={`/dashboard/tags/${tagData.documentId}/edit`}
                className='inline-flex items-center px-4 py-2 bg-[var(--brand-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--brand-primary)]/80 transition-colors'
              >
                <Edit size={16} className='mr-2' />
                Editar Etiqueta
              </Link>
            </div>
          </div>
          <div className='mt-4'>
            <h1 className='text-3xl font-bold text-gray-900'>
              Detalles de la Etiqueta
            </h1>
            <p className='text-gray-600 mt-2'>
              Información completa de la etiqueta {tagData.name}
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
                    <Tag
                      size={20}
                      className='mr-2 text-[var(--brand-primary)]'
                    />
                    Información Básica
                  </h3>
                  <div className='space-y-4'>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        ID de Etiqueta:{' '}
                      </span>
                      <span className='text-sm text-gray-900 font-mono'>
                        #{tagData.documentId}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Nombre:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {tagData.name}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Slug:{' '}
                      </span>
                      <span className='slug-text'>{tagData.slug}</span>
                    </div>
                  </div>
                </div>

                {/* System Information */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                    <Hash size={20} className='mr-2 text-green-600' />
                    Información del Sistema
                  </h3>
                  <div className='space-y-4'>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Fecha de Creación:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {formatDate(tagData.createdAt)}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Última Actualización:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {formatDate(tagData.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar (1/3 width) */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-lg border border-gray-200 p-6 h-full'>
              <div className='space-y-6'>
                {/* Articles */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-3 flex items-center'>
                    <Tag size={18} className='mr-2 text-purple-600' />
                    Artículos ({tagData.articles?.length || 0})
                  </h3>
                  {tagData.articles && tagData.articles.length > 0 ? (
                    <p className='text-sm text-gray-600 leading-relaxed'>
                      {tagData.articles.map(
                        (
                          article: { documentId: string; title: string },
                          index: number
                        ) => (
                          <span key={article.documentId}>
                            {article.title}
                            {index < (tagData.articles?.length ?? 0) - 1
                              ? ', '
                              : ''}
                          </span>
                        )
                      )}
                    </p>
                  ) : (
                    <p className='text-sm text-gray-500'>
                      No hay artículos asociados
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
