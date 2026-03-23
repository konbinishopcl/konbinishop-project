import SpotForm from '@/components/form-spot';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crear Spot | Konbini',
  description:
    'Crea un nuevo spot publicitario en el sistema Konbini. Configura banners promocionales con enlaces y fechas.',
  keywords:
    'konbini, dashboard, admin, crear spot, nuevo banner, publicidad, gestión',
};

export default function CreateSpotPage() {
  return (
    <div className='p-6'>
      <div className='max-w-4xl mx-auto'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Crear Spot</h1>
          <p className='text-gray-600 mt-2'>Crea un nuevo spot publicitario</p>
        </div>

        <div className='bg-white rounded-lg border border-gray-200 p-8'>
          <SpotForm />
        </div>
      </div>
    </div>
  );
}
