'use client';

import { Clock, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import InputDate from './input-date';
import SelectTime from './select-time';

interface EventDatesFieldProps {
  dates?: Array<{ date: string; start_time: string; end_time: string }>;
  onDatesChange: (
    dates: Array<{ date: string; start_time: string; end_time: string }>
  ) => void;
  errors?: Array<{
    date?: { message: string };
    start_time?: { message: string };
    end_time?: { message: string };
  }>;
}

export default function EventDatesField({
  dates = [],
  onDatesChange,
  errors,
}: EventDatesFieldProps) {
  const [localDates, setLocalDates] =
    useState<Array<{ date: string; start_time: string; end_time: string }>>(
      dates
    );

  // Sincronizar con el prop dates
  useEffect(() => {
    // Solo actualizar si los datos son diferentes para evitar loops infinitos
    if (JSON.stringify(dates) !== JSON.stringify(localDates)) {
      setLocalDates(dates);
    }
  }, [dates]);

  // Función única para actualizar fechas
  const updateDates = (
    newDates: Array<{ date: string; start_time: string; end_time: string }>
  ) => {
    setLocalDates(newDates);
    onDatesChange(newDates);
  };

  // Verificar si se puede agregar una nueva fecha
  const canAddNewDate =
    localDates.length === 0 ||
    localDates.every(date => date.date && date.start_time && date.end_time);

  const addDate = () => {
    if (canAddNewDate) {
      updateDates([...localDates, { date: '', start_time: '', end_time: '' }]);
    }
  };

  const removeDate = (index: number) => {
    updateDates(localDates.filter((_, i) => i !== index));
  };

  const updateDate = (
    index: number,
    field: 'date' | 'start_time' | 'end_time',
    value: string
  ) => {
    const newDates = [...localDates];
    newDates[index] = { ...newDates[index], [field]: value };
    updateDates(newDates);
  };

  // Función para obtener la hora de inicio actual de un campo específico
  const getStartTime = (index: number) => {
    return localDates[index]?.start_time || '';
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex flex-col space-y-1'>
          <h3 className='text-lg font-medium text-gray-900 flex items-center'>
            <Clock size={20} className='mr-2 text-[var(--brand-primary)]' />
            Día y hora del evento
          </h3>
          <p className='text-sm text-gray-600'>
            Selecciona el día y la hora del evento
          </p>
        </div>

        <button
          type='button'
          onClick={addDate}
          disabled={!canAddNewDate}
          className='flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors border border-gray-300 hover:border-red-400 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed disabled:hover:border-gray-200'
          style={{ color: !canAddNewDate ? '#9CA3AF' : '#FF5B49' }}
          title={
            !canAddNewDate
              ? 'Completa todas las fechas anteriores para poder agregar más'
              : 'Agregar nueva fecha'
          }
        >
          <Plus size={16} />
          <span>Agregar día</span>
        </button>
      </div>

      {/* Dates List */}
      {localDates.map((field, index) => (
        <div
          key={index}
          className='bg-white border border-gray-200 rounded-lg p-4'
        >
          <div className='flex justify-end -mt-2 -mr-2'>
            <button
              type='button'
              onClick={() => removeDate(index)}
              className='inline-flex items-center justify-center p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors'
              title='Eliminar fecha'
            >
              <X size={16} />
            </button>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {/* Fecha */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Fecha
              </label>
              <InputDate
                value={field.date}
                onChange={date => updateDate(index, 'date', date)}
                placeholder='dd/mm/aaaa'
              />
            </div>

            {/* Hora inicio */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Hora inicio
              </label>
              <SelectTime
                value={field.start_time}
                onChange={time => updateDate(index, 'start_time', time)}
                placeholder='--:--'
              />
            </div>

            {/* Hora término */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Hora término
              </label>
              <SelectTime
                value={field.end_time}
                onChange={time => updateDate(index, 'end_time', time)}
                placeholder='--:--'
                minTime={getStartTime(index)}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Mostrar errores de validación */}
      {errors && (
        <p className='mt-1 text-sm text-red-600'>
          Debes agregar al menos una fecha y debes completar todos los campos de
          fecha y horas.
        </p>
      )}
    </div>
  );
}
