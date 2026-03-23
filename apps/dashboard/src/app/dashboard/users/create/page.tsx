import { ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Crear Usuario | Konbini',
  description: 'Crea un nuevo usuario en el sistema Konbini.',
  keywords: 'konbini, dashboard, admin, crear usuario, nuevo, registro',
};

export default function CreateUserPage() {
  return (
    <div className='p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center space-x-4'>
            <Link
              href='/dashboard/users'
              className='inline-flex items-center text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 hover:underline transition-colors'
            >
              <ArrowLeft size={20} className='mr-2' />
              Volver a Usuarios
            </Link>
          </div>
          <div className='mt-4'>
            <h1 className='text-3xl font-bold text-gray-900'>
              Crear Nuevo Usuario
            </h1>
            <p className='text-gray-600 mt-2'>
              Registra un nuevo usuario en el sistema
            </p>
          </div>
        </div>

        {/* Form */}
        <div className='bg-white rounded-lg border border-gray-200 p-8'>
          <div className='text-center py-8'>
            <p className='text-gray-500'>
              Formulario de creación de usuario en desarrollo...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
