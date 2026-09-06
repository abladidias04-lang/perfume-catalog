import React from 'react';

export default function PerfumeCard({ perfume }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between">
      <div className="relative w-full pt-[100%] bg-gray-50 overflow-hidden">
        {perfume.image_url ? (
          <img
            src={perfume.image_url}
            alt={perfume.name}
            loading="lazy"
            decoding="async"
            className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-gray-300 text-sm">
            Сурет жоқ
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">
            {perfume.brand}
          </p>
          <h3 className="text-base font-medium text-gray-900 line-clamp-1 mb-2">
            {perfume.name}
          </h3>
          {perfume.description && (
            <p className="text-xs text-gray-500 line-clamp-2 mb-3">
              {perfume.description}
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
          <span className="text-base font-bold text-gray-900">
            {perfume.price ? `${Number(perfume.price).toLocaleString()} ₸` : 'Бағасы көрсетілмеген'}
          </span>
        </div>
      </div>
    </div>
  );
}
