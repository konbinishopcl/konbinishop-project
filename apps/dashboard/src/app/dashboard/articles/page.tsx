import ServerPagination from '@/components/server-pagination';
import { StrapiAPI } from '@/lib/strapi/api';
import { Edit, Eye, FileText, Plus } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

// Interface for article data from Strapi
interface Article {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image?: {
    id: number;
    url: string;
    name: string;
  } | null;
  tags: Array<{ id: number; name: string }>;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  events?: Array<{ id: number; title: string }>;
  articles?: Array<{ id: number; title: string }>;
}

// Get articles from Strapi API
async function getArticles(
  page: number = 1,
  pageSize: number = 25
): Promise<{
  articles: Article[];
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
}> {
  try {
    const response = await StrapiAPI.getArticles(page, pageSize);
    return {
      articles: (response.data as Article[]) || [],
      pagination: response.meta.pagination,
    };
  } catch (error) {
    throw error;
  }
}

export const metadata: Metadata = {
  title: 'Artículos | Konbini',
  description:
    'Administra todos los artículos. Crea, edita y gestiona contenido con imágenes y etiquetas.',
  keywords: 'konbini, dashboard, admin, artículos, contenido, gestión',
};

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = page ? parseInt(page) : 1;

  let articles: Article[] = [];
  let pagination = { page: 1, pageSize: 25, pageCount: 1, total: 0 };
  let error: string | null = null;

  try {
    const result = await getArticles(currentPage, 25);
    articles = result.articles;
    pagination = result.pagination;
  } catch {
    error = 'Error al cargar los artículos';
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className='p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>Artículos</h1>
              <p className='text-gray-600 mt-2'>
                Gestiona los artículos • Ordenados por fecha de publicación
              </p>
            </div>
            <Link
              href='/dashboard/articles/create'
              className='inline-flex items-center px-4 py-2 bg-[var(--brand-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--brand-primary)]/80 transition-colors'
            >
              <Plus size={16} className='mr-2' />
              Nuevo Artículo
            </Link>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <div className='flex items-center space-x-2'>
              <div className='text-red-400'>
                <svg
                  className='h-5 w-5'
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
              <p className='text-sm text-red-600'>{error}</p>
            </div>
          </div>
        )}

        {/* Articles table */}
        <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Imagen
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Título
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Extracto
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Tags
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Estado
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Fecha de Publicación
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {articles.map(article => (
                  <tr key={article.documentId}>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      {article.image ? (
                        <div className='w-16 h-16 bg-gray-100 rounded-full overflow-hidden border border-gray-200'>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              article.image.url.startsWith('http')
                                ? article.image.url
                                : `${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}${article.image.url.startsWith('/') ? article.image.url : `/${article.image.url}`}`
                            }
                            alt={article.image.name || 'Imagen del artículo'}
                            className='w-full h-full object-cover'
                          />
                        </div>
                      ) : (
                        <div className='w-16 h-16 bg-gray-100 rounded-full border border-gray-200 flex items-center justify-center'>
                          <FileText size={20} className='text-gray-400' />
                        </div>
                      )}
                    </td>
                    <td className='px-6 py-4'>
                      <div className='max-w-xs'>
                        <Link
                          href={`/dashboard/articles/${article.documentId}`}
                          className='text-sm font-medium text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 underline transition-colors line-clamp-2'
                        >
                          {article.title}
                        </Link>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='max-w-xs'>
                        <p className='text-sm text-gray-900 line-clamp-2'>
                          {article.excerpt || 'Sin extracto'}
                        </p>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex flex-wrap gap-1'>
                        {article.tags && article.tags.length > 0 ? (
                          article.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag.id}
                              className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                            >
                              {tag.name}
                            </span>
                          ))
                        ) : (
                          <span className='text-sm text-gray-500'>
                            Sin tags
                          </span>
                        )}
                        {article.tags && article.tags.length > 3 && (
                          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
                            +{article.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          article.publishedAt
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {article.publishedAt ? 'Publicado' : 'Borrador'}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-500'>
                        {article.publishedAt
                          ? formatDate(article.publishedAt)
                          : formatDate(article.createdAt)}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                      <div className='flex items-center space-x-2'>
                        <Link
                          href={`/dashboard/articles/${article.documentId}`}
                          className='inline-flex items-center justify-center p-2 text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 hover:bg-[var(--brand-primary)]/10 rounded-lg transition-colors'
                          title='Ver artículo'
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          href={`/dashboard/articles/${article.documentId}/edit`}
                          className='inline-flex items-center justify-center p-2 text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 hover:bg-[var(--brand-primary)]/10 rounded-lg transition-colors'
                          title='Editar artículo'
                        >
                          <Edit size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {articles.length === 0 && !error && (
            <div className='text-center py-12'>
              <div className='text-gray-400 mb-4'>
                <FileText className='mx-auto h-12 w-12' />
              </div>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                No hay artículos
              </h3>
              <p className='text-gray-500 mb-6'>
                Comienza creando tu primer artículo.
              </p>
              <Link
                href='/dashboard/articles/create'
                className='inline-flex items-center px-4 py-2 bg-[var(--brand-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--brand-primary)]/80 transition-colors'
              >
                <Plus size={16} className='mr-2' />
                Crear Artículo
              </Link>
            </div>
          )}
        </div>

        {/* Pagination */}
        {articles.length > 0 && (
          <div className='mt-6'>
            <ServerPagination
              currentPage={pagination.page}
              totalPages={pagination.pageCount}
              totalItems={pagination.total}
              itemsPerPage={pagination.pageSize}
              baseUrl='/dashboard/articles'
            />
          </div>
        )}
      </div>
    </div>
  );
}
