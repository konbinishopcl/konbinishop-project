import type { Metadata } from 'next';
import FormLogin from '@/components/form-login';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Login - Konbini Dashboard',
  description: 'Sign in to your Konbini Dashboard account',
};

export default function LoginPage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col'>
      {/* Main content - centered */}
      <main className='flex-1 flex flex-col items-center justify-center px-6 py-12'>
        <div className='w-full max-w-md'>
          {/* Logo centered above form */}
          <div className='text-center mb-8'>
            <div className='flex items-center justify-center mb-4'>
              <Image
                src='/logo.svg'
                alt='Konbini Logo'
                width={120}
                height={75}
                priority
                className='h-auto'
              />
            </div>
          </div>

          {/* Auth card container */}
          <div className='bg-white rounded-2xl shadow-xl p-8'>
            <div className='text-center mb-8'>
              <h1 className='text-2xl font-bold text-gray-900 mb-2'>
                Bienvenido de vuelta
              </h1>
              <p className='text-gray-600'>
                Inicia sesión en tu cuenta para continuar
              </p>
            </div>

            <FormLogin />
          </div>

          {/* Footer */}
          <div className='mt-8 text-center'>
            <p className='text-sm text-gray-500'>
              © 2024 Konbini Dashboard. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
