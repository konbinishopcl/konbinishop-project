import BlogForm from '@/components/form-blog';
import { StrapiAPI } from '@/lib/strapi/api';
import { ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

interface Article {
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
  events: Array<{ id: number; title: string }>;
  articles: Array<{ id: number; title: string }>;
}

// Get article, events and tags for the form
async function getArticleAndData(documentId: string) {
  try {
    const [articlesResponse, eventsResponse, tagsResponse] = await Promise.all([
      StrapiAPI.getArticles(1, 1000), // Get all for filtering
      StrapiAPI.getEvents(1, 1000), // Get all events
      StrapiAPI.getTags(1, 1000), // Get all tags
    ]);

    const articles = (articlesResponse.data as Article[]) || [];
    const article = articles.find((a: Article) => a.documentId === documentId);

    const events =
      (eventsResponse.data as Array<{ id: number; title: string }>) || [];
    const tags =
      (tagsResponse.data as Array<{ id: number; name: string }>) || [];

    return { article, events, tags };
  } catch {
    return { article: null, events: [], tags: [] };
  }
}

// Generate metadata for the page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ documentId: string }>;
}): Promise<Metadata> {
  const { documentId } = await params;
  const { article } = await getArticleAndData(documentId);

  if (!article) {
    return {
      title: 'Artículo no encontrado | Konbini',
      description:
        'El artículo que buscas editar no existe o ha sido eliminado.',
    };
  }

  return {
    title: `Editar ${article.title} | Artículo | Konbini`,
    description: `Edita el artículo: ${article.title} en Konbini.`,
    keywords: `konbini, dashboard, admin, editar artículo, ${article.title}, modificar, contenido`,
  };
}

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const { article, events, tags } = await getArticleAndData(documentId);

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

  return (
    <div className='p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center space-x-4'>
            <Link
              href={`/dashboard/articles/${article.documentId}`}
              className='inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors'
            >
              <ArrowLeft size={20} className='mr-2' />
              Volver a Artículo
            </Link>
          </div>
          <div className='mt-4'>
            <h1 className='text-3xl font-bold text-gray-900'>
              Editar Artículo
            </h1>
            <p className='text-gray-600 mt-2'>
              Modifica la información del artículo {article.title}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className='bg-white rounded-lg border border-gray-200 p-8'>
          <BlogForm
            blog={article}
            events={events}
            tags={tags}
            isEditing={true}
          />
        </div>
      </div>
    </div>
  );
}
