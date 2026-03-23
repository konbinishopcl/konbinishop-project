import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  number: number | string;
  title: string;
  description?: string;
}

export default function StatsCard({
  icon: Icon,
  number,
  title,
  description,
}: StatsCardProps) {
  return (
    <div className='bg-white p-6 rounded-lg border border-gray-200 flex-1'>
      <div className='flex items-start space-x-4'>
        <div
          className='p-2 rounded-lg'
          style={{ backgroundColor: 'rgba(255, 91, 73, 0.1)' }}
        >
          <Icon className='w-6 h-6' style={{ color: '#FF5B49' }} />
        </div>
        <div className='flex-1'>
          <p className='text-4xl font-bold text-gray-900 mb-1'>{number}</p>
          <p className='text-sm font-medium text-gray-600 mb-1'>{title}</p>
          {description && (
            <p
              className='text-xs text-gray-500'
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
