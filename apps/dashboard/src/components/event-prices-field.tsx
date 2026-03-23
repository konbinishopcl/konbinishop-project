'use client';

import { DollarSign, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface EventPricesFieldProps {
  prices?: Array<{ name: string; price: number }>;
  onPricesChange: (prices: Array<{ name: string; price: number }>) => void;
  errors?: Array<{
    name?: { message: string };
    price?: { message: string };
  }>;
}

export default function EventPricesField({
  prices = [],
  onPricesChange,
  errors,
}: EventPricesFieldProps) {
  const [localPrices, setLocalPrices] =
    useState<Array<{ name: string; price: number }>>(prices);

  // Sincronizar con el prop prices
  useEffect(() => {
    setLocalPrices(prices);
  }, [prices]);

  // Función única para actualizar precios
  const updatePrices = (newPrices: Array<{ name: string; price: number }>) => {
    setLocalPrices(newPrices);
    onPricesChange(newPrices);
  };

  // Verificar si se puede agregar un nuevo valor
  const canAddNewValue =
    localPrices.length === 0 ||
    localPrices.every(price => price.name.trim() !== '' && price.price > 0);

  const addPrice = () => {
    // Solo agregar si se puede
    if (canAddNewValue) {
      updatePrices([...localPrices, { name: '', price: 0 }]);
    }
  };

  const removePrice = (index: number) => {
    updatePrices(localPrices.filter((_, i) => i !== index));
  };

  const updatePrice = (
    index: number,
    field: 'name' | 'price',
    value: string | number
  ) => {
    const newPrices = [...localPrices];
    newPrices[index] = { ...newPrices[index], [field]: value };
    updatePrices(newPrices);
  };

  // Clases CSS comunes para inputs
  const inputClasses =
    'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex flex-col space-y-1'>
          <h3 className='text-lg font-medium text-gray-900 flex items-center'>
            <DollarSign
              size={20}
              className='mr-2 text-[var(--brand-primary)]'
            />
            Valores
          </h3>
          <p className='text-sm text-gray-600'>
            Define los valores de entrada para el evento
          </p>
        </div>

        <button
          type='button'
          onClick={addPrice}
          disabled={!canAddNewValue}
          className={`flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors border ${
            canAddNewValue
              ? 'border-gray-300 hover:border-red-400 text-[#FF5B49]'
              : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          title={
            canAddNewValue
              ? 'Agregar nuevo valor'
              : 'Completa los campos anteriores primero'
          }
        >
          <Plus size={16} />
          <span>Agregar valor</span>
        </button>
      </div>

      {/* Prices List */}
      {localPrices.length > 0 && (
        <div className='space-y-4'>
          {localPrices.map((field, index) => (
            <div
              key={index}
              className='bg-white border border-gray-200 rounded-lg p-4 relative'
            >
              <div className='flex justify-end -mt-2 -mr-2'>
                <button
                  type='button'
                  onClick={() => removePrice(index)}
                  className='inline-flex items-center justify-center p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-full transition-colors'
                  title='Eliminar precio'
                >
                  <X size={16} />
                </button>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Nombre del precio */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Nombre
                  </label>
                  <input
                    type='text'
                    value={field.name}
                    onChange={e => updatePrice(index, 'name', e.target.value)}
                    className={inputClasses}
                    placeholder='Ej: Entrada General'
                  />
                </div>

                {/* Precio */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Precio (CLP)
                  </label>
                  <input
                    type='number'
                    value={field.price}
                    onChange={e =>
                      updatePrice(index, 'price', Number(e.target.value))
                    }
                    className={inputClasses}
                    placeholder='0'
                    min='0'
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mostrar errores de validación */}
      {errors && (
        <p className='mt-1 text-sm text-red-600'>
          Debes completar todos los campos de precios
        </p>
      )}
    </div>
  );
}
