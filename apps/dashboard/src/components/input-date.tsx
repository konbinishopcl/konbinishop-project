'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

interface InputDateProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
}

export default function InputDate({
  value,
  onChange,
  placeholder = 'dd/mm/aaaa',
  className = '',
}: InputDateProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Update display value when prop value changes
  useEffect(() => {
    if (value) {
      setDisplayValue(value);
    }
  }, [value]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDateSelect = (value: any) => {
    if (value instanceof Date) {
      const formattedDate = value.toISOString().split('T')[0];
      onChange(formattedDate);
      setDisplayValue(formattedDate);
      setIsOpen(false);
    }
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('es-ES');
    } catch {
      return dateString;
    }
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className='relative' ref={calendarRef}>
      <input
        type='text'
        value={formatDisplayDate(displayValue)}
        placeholder={placeholder}
        readOnly
        className={`w-full px-3 py-2 pr-10 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer ${className}`}
        onClick={() => setIsOpen(!isOpen)}
      />

      {isOpen && (
        <div className='absolute top-full left-0 z-50 shadow-lg border border-gray-200 rounded-lg bg-white'>
          <ReactCalendar
            onChange={handleDateSelect}
            value={displayValue ? new Date(displayValue) : null}
            minDate={new Date()}
            locale='es-ES'
            formatDay={(locale, date) => date.getDate().toString()}
          />
        </div>
      )}

      <Calendar
        size={16}
        className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none'
      />
    </div>
  );
}
