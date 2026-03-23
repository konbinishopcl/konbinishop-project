'use client';

import { useRecaptcha } from '@/lib/hooks/useRecaptcha';
import { useSwal } from '@/lib/hooks/useSwal';
import { useUserStore } from '@/lib/stores';
import { StrapiAuth } from '@/lib/strapi';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface LoginFormData {
  email: string;
  password: string;
}

export default function FormLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { verifyRecaptcha, isVerifying } = useRecaptcha();
  const { setUser } = useUserStore();
  const router = useRouter();
  const { showError } = useSwal();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      // Verify reCAPTCHA first
      await verifyRecaptcha('login');

      // Login with Strapi
      await StrapiAuth.login({
        identifier: data.email,
        password: data.password,
      });

      // Validate user role and get complete user data
      const validatedUser = await StrapiAuth.validateUserRole();

      // Store complete validated user data in Zustand store
      setUser(validatedUser);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error al iniciar sesión. Por favor intenta de nuevo.';

      showError('Error al iniciar sesión', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
      <div>
        <input
          {...register('email', {
            required: 'El email es requerido',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Dirección de email inválida',
            },
          })}
          type='email'
          placeholder='Email'
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.email && (
          <p className='mt-1 text-sm text-red-600'>{errors.email.message}</p>
        )}
      </div>

      <div className='relative'>
        <input
          {...register('password', {
            required: 'La contraseña es requerida',
            minLength: {
              value: 6,
              message: 'La contraseña debe tener al menos 6 caracteres',
            },
          })}
          type={showPassword ? 'text' : 'password'}
          placeholder='Contraseña'
          className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.password ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <button
          type='button'
          onClick={() => setShowPassword(!showPassword)}
          className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors'
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
        {errors.password && (
          <p className='mt-1 text-sm text-red-600'>{errors.password.message}</p>
        )}
      </div>

      <button
        type='submit'
        disabled={isLoading || isVerifying}
        className='w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
      >
        {isLoading || isVerifying ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </button>
    </form>
  );
}
