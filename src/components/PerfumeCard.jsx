import React from 'react';

export default function PerfumeCard({ perfume, priceType, onClick }) {
  // Розница болса бағаға 3000 теңге қосып көрсетеді
  const displayPrice = priceType === 'retail' ? perfume.price + 3000 : perfume.price;

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
    >
      <div className="relative w-full aspect-[4/5] bg-gray-50 overflow-hidden">
        {perfume.image_url ? (
          <img
            src={perfume.image_url}
            alt={perfume.name}
            loading="lazy"
            decoding="async"
            className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-gray-300 text-sm">
            Сурет жоқ
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow justify-between">
        <div>
          <div className="flex justify-between items-start mb-1 gap-2">
            <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-black truncate">
              {perfume.brand || 'Брендсіз'}
            </p>
            {perfume.volume && (
              <span className="text-[10px] text-gray-500 font-bold bg-gray-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                {perfume.volume} мл
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-gray-900 line-clamp-2 mb-2 leading-tight">
            {perfume.name}
          </h3>
        </div>

        <div className="pt-2 mt-auto border-t border-gray-50">
          <span className="text-base font-black text-indigo-600">
            {displayPrice ? `${Number(displayPrice).toLocaleString('kk-KZ')} ₸` : 'Бағасы жоқ'}
          </span>
        </div>
      </div>
    </div>
  );
}
