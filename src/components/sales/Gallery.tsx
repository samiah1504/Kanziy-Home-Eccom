'use client';

import { useState } from 'react';

export default function Gallery({
  images,
  alt,
  rounded = true,
}: {
  images: string[];
  alt: string;
  rounded?: boolean;
}) {
  const [active, setActive] = useState(0);
  if (images.length === 0) {
    return (
      <div className={`flex aspect-square items-center justify-center bg-warmgrey text-gray-400 ${rounded ? 'rounded-lg' : ''}`}>
        Product image
      </div>
    );
  }
  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[active]}
        alt={alt}
        className={`aspect-square w-full object-cover ${rounded ? 'rounded-lg' : ''}`}
        loading="eager"
      />
      {images.length > 1 && (
        // Thumbnails wrap onto new rows (5 per row) instead of scrolling
        // sideways, so adding more photos never pushes them off-screen.
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`aspect-square w-full overflow-hidden rounded-md border-2 ${i === active ? 'border-gold' : 'border-transparent'}`}
              aria-label={`View image ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
