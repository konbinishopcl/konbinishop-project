import { StrapiAPI } from '@/lib/strapi/api';
import {
  ArrowLeft,
  Calendar,
  Edit,
  FileText,
  Hash,
  Image as ImageIcon,
  Tag,
} from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

interface Article {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: Array<{ id: number; name: string }>;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  events?: Array<{ documentId: string; name: string }>;
  image?: {
    id: number;
    url: string;
    name: string;
  };
}

// Get article and tags from Strapi API
async function getArticleAndTags(documentId: string): Promise<{
  article: Article | null;
  tags: Array<{ id: number; name: string }>;
}> {
  try {
    // Get all articles and tags for filtering
    const [articlesResponse, tagsResponse] = await Promise.all([
      StrapiAPI.getArticles(1, 1000), // Get all for filtering
      StrapiAPI.getTags(1, 1000), // Get all tags for mapping
    ]);

    const articles = (articlesResponse.data as Article[]) || [];
    const article = articles.find((a: Article) => a.documentId === documentId);
    const tags =
      (tagsResponse.data as Array<{ id: number; name: string }>) || [];

    return { article: article || null, tags };
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
  const { article } = await getArticleAndTags(documentId);

  if (!article) {
    return {
      title: 'Artículo no encontrado | Konbini',
      description: 'El artículo que buscas no existe o ha sido eliminado.',
    };
  }

  return {
    title: `${article.title} | Artículo | Konbini`,
    description: article.excerpt || `Artículo: ${article.title} en Konbini.`,
    keywords: `konbini, dashboard, admin, artículo, ${article.title}, contenido`,
  };
}

export default async function ArticleDetailsPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const { article, tags } = await getArticleAndTags(documentId);

  if (!article) {
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
              Artículo no encontrado
            </h3>
            <p className='text-gray-500 mb-6'>
              El artículo que buscas no existe o ha sido eliminado.
            </p>
            <Link
              href='/dashboard/articles'
              className='inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors'
            >
              <ArrowLeft size={16} className='mr-2' />
              Volver a Artículos
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

  // Helper function to get tag names from IDs
  const getTagNames = (tagIds: number[]) => {
    return tagIds
      .map(id => tags.find(tag => tag.id === id)?.name)
      .filter(Boolean) as string[];
  };

  return (
    <div className='p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <Link
                href='/dashboard/articles'
                className='inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors'
              >
                <ArrowLeft size={20} className='mr-2' />
                Volver a Artículos
              </Link>
            </div>
            <div className='flex items-center space-x-3'>
              <Link
                href={`/dashboard/articles/${article.documentId}/edit`}
                className='inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors'
              >
                <Edit size={16} className='mr-2' />
                Editar Artículo
              </Link>
            </div>
          </div>
          <div className='mt-4'>
            <h1 className='text-3xl font-bold text-gray-900'>
              Detalles del Artículo
            </h1>
            <p className='text-gray-600 mt-2'>
              Información completa del artículo {article.title}
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
                    <FileText size={20} className='mr-2 text-blue-600' />
                    Información Básica
                  </h3>
                  <div className='space-y-4'>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        ID del Artículo:{' '}
                      </span>
                      <span className='text-sm text-gray-900 font-mono'>
                        #{article.documentId}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Título:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {article.title}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Slug:{' '}
                      </span>
                      <span className='slug-text'>{article.slug}</span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Extracto:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {article.excerpt || 'Sin extracto'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                    <FileText size={20} className='mr-2 text-green-600' />
                    Contenido
                  </h3>
                  <div className='bg-gray-50 p-4 rounded-lg'>
                    <p className='text-sm text-gray-900 whitespace-pre-wrap'>
                      {article.content}
                    </p>
                  </div>
                </div>

                {/* System Information */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                    <Hash size={20} className='mr-2 text-purple-600' />
                    Información del Sistema
                  </h3>
                  <div className='space-y-4'>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Estado:{' '}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          article.publishedAt
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {article.publishedAt ? 'Publicado' : 'Borrador'}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Fecha de Creación:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {formatDate(article.createdAt)}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Última Actualización:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {formatDate(article.updatedAt)}
                      </span>
                    </div>
                    {article.publishedAt && (
                      <div>
                        <span className='text-sm font-medium text-gray-500'>
                          Fecha de Publicación:{' '}
                        </span>
                        <span className='text-sm text-gray-900'>
                          {formatDate(article.publishedAt)}
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
                {/* Image */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-3 flex items-center'>
                    <ImageIcon size={18} className='mr-2 text-blue-600' />
                    Imagen
                  </h3>
                  {article.image ? (
                    <div className='space-y-2'>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          article.image.url.startsWith('http')
                            ? article.image.url
                            : `${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/${article.image.url.startsWith('/') ? article.image.url.substring(1) : article.image.url}`
                        }
                        alt={article.image.name}
                        className='w-full h-32 object-cover rounded-lg'
                      />
                      <p className='text-sm text-gray-600'>
                        {article.image.name}
                      </p>
                    </div>
                  ) : (
                    <p className='text-sm text-gray-500'>
                      No hay imagen asociada
                    </p>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-3 flex items-center'>
                    <Tag size={18} className='mr-2 text-green-600' />
                    Tags ({article.tags?.length || 0})
                  </h3>
                  {article.tags && article.tags.length > 0 ? (
                    <div className='flex flex-wrap gap-1'>
                      {getTagNames(article.tags.map(tag => tag.id)).map(
                        (tagName, index) => (
                          <span
                            key={index}
                            className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'
                          >
                            {tagName}
                          </span>
                        )
                      )}
                    </div>
                  ) : (
                    <p className='text-sm text-gray-500'>
                      No hay tags asociados
                    </p>
                  )}
                </div>

                {/* Events */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-3 flex items-center'>
                    <Calendar size={18} className='mr-2 text-orange-600' />
                    Eventos ({article.events?.length || 0})
                  </h3>
                  {article.events && article.events.length > 0 ? (
                    <p className='text-sm text-gray-600 leading-relaxed'>
                      {article.events.map((event, index) => (
                        <span key={event.documentId}>
                          {event.name}
                          {index < (article.events?.length ?? 0) - 1
                            ? ', '
                            : ''}
                        </span>
                      ))}
                    </p>
                  ) : (
                    <p className='text-sm text-gray-500'>
                      No hay eventos asociados
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
