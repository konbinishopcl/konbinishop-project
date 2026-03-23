import CategoryForm from '@/components/form-category';
import { ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Crear Categoría | Konbini',
  description:
    'Crea una nueva categoría en el sistema Konbini. Organiza y clasifica contenido con descripciones únicas.',
  keywords:
    'konbini, dashboard, admin, crear categoría, nueva categoría, organización, clasificación',
};

export default async function CreateCategoryPage() {
  return (
    <div className='p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center space-x-4'>
            <Link
              href='/dashboard/categories'
              className='inline-flex items-center text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 hover:underline transition-colors'
            >
              <ArrowLeft size={20} className='mr-2' />
              Volver a Categorías
            </Link>
          </div>
          <div className='mt-4'>
            <h1 className='text-3xl font-bold text-gray-900'>
              Crear Nueva Categoría
            </h1>
            <p className='text-gray-600 mt-2'>
              Completa la información para crear una nueva categoría
            </p>
          </div>
        </div>

        {/* Form */}
        <div className='bg-white rounded-lg border border-gray-200 p-8'>
          <CategoryForm />
        </div>
      </div>
    </div>
  );
}
