import Image from 'next/image';

export default function HomePage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center'>
      <div className='text-center'>
        {/* Logo principal */}
        <div className='mb-8'>
          <Image
            src='/logo.svg'
            alt='Konbini Logo'
            width={188}
            height={116}
            priority
          />
        </div>
      </div>
    </div>
  );
}
