import Link from 'next/link';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface ServerPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  baseUrl: string;
}

export default function ServerPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  baseUrl,
}: ServerPaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      if (currentPage <= 3) {
        // Near start
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near end
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className='bg-white rounded-lg border border-gray-200 p-4'>
      <div className='flex items-center justify-between'>
        {/* Items info */}
        <div className='text-sm text-gray-700'>
          Mostrando <span className='font-medium'>{startItem}</span> a{' '}
          <span className='font-medium'>{endItem}</span> de{' '}
          <span className='font-medium'>{totalItems}</span> resultados
        </div>

        {/* Pagination controls */}
        <div className='flex items-center space-x-2'>
          {/* Previous button */}
          {currentPage > 1 ? (
            <Link
              href={`${baseUrl}?page=${currentPage - 1}`}
              className='inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors'
            >
              <ChevronLeft size={16} className='mr-1' />
              Anterior
            </Link>
          ) : (
            <span className='inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed'>
              <ChevronLeft size={16} className='mr-1' />
              Anterior
            </span>
          )}

          {/* Page numbers */}
          <div className='flex items-center space-x-1'>
            {getPageNumbers().map((page, index) => (
              <div key={index}>
                {page === '...' ? (
                  <span className='px-3 py-2 text-sm text-gray-500'>
                    <MoreHorizontal size={16} />
                  </span>
                ) : (
                  <Link
                    href={`${baseUrl}?page=${page}`}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      page === currentPage
                        ? 'bg-[var(--brand-primary)] text-white border border-[var(--brand-primary)]'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                  >
                    {page}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Next button */}
          {currentPage < totalPages ? (
            <Link
              href={`${baseUrl}?page=${currentPage + 1}`}
              className='inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors'
            >
              Siguiente
              <ChevronRight size={16} className='ml-1' />
            </Link>
          ) : (
            <span className='inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed'>
              Siguiente
              <ChevronRight size={16} className='ml-1' />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
