'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Clock, ChevronDown } from 'lucide-react';

interface SelectTimeProps {
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
  className?: string;
  minTime?: string; // Para filtrar horas mínimas
}

export default function SelectTime({
  value,
  onChange,
  placeholder = '--:--',
  className = '',
  minTime,
}: SelectTimeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState(value);
  const selectRef = useRef<HTMLDivElement>(null);

  // Generate time options with 30-minute intervals, filtered by minTime
  const timeOptions = useMemo(() => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        // Si hay minTime, solo incluir opciones mayores (no iguales)
        if (!minTime || timeString > minTime) {
          options.push(timeString);
        }
      }
    }
    return options;
  }, [minTime]); // Se regenera cuando cambie minTime

  // Update selected time when prop value changes
  useEffect(() => {
    if (value) {
      setSelectedTime(value);
    }
  }, [value]);

  // Regenerar opciones cuando cambie minTime
  useEffect(() => {
    // Si el tiempo seleccionado es menor o igual a minTime, resetearlo
    if (minTime && selectedTime && selectedTime <= minTime) {
      setSelectedTime('');
      onChange('');
    }
  }, [minTime, selectedTime, onChange]);

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    onChange(time);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
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
    <div className='relative' ref={selectRef}>
      <div
        className={`w-full px-3 py-2 pr-10 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer flex items-center justify-between ${className}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedTime ? 'text-gray-900' : 'text-gray-500'}>
          {selectedTime || placeholder}
        </span>
        <ChevronDown size={16} className='text-gray-400' />
      </div>

      {isOpen && (
        <div className='absolute top-full left-0 z-50 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg'>
          {timeOptions.map(time => (
            <div
              key={time}
              className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                selectedTime === time
                  ? 'bg-blue-100 text-blue-900'
                  : 'text-gray-900'
              }`}
              onClick={() => handleTimeSelect(time)}
            >
              {time}
            </div>
          ))}
        </div>
      )}

      <Clock
        size={16}
        className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none'
      />
    </div>
  );
}
