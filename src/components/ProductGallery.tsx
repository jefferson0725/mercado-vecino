"use client";

import { useState } from "react";
import Image from "next/image";

export function ProductGallery({
  images,
  name,
  grayscale,
}: {
  images: string[];
  name: string;
  grayscale: boolean;
}) {
  const [selected, setSelected] = useState(0);

  if (images.length === 0) return null;

  return (
    <div className="mt-4">
      <Image
        src={images[selected]}
        alt={name}
        width={800}
        height={800}
        sizes="(min-width: 768px) 736px, 100vw"
        priority
        className={`max-h-[70vh] w-full rounded-2xl border border-neutral-200 bg-neutral-100 object-contain ${
          grayscale ? "grayscale" : ""
        }`}
      />
      {images.length > 1 && (
        <div className="mt-3 flex gap-2">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              aria-label={`Ver foto ${i + 1}`}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                selected === i
                  ? "border-primary"
                  : "border-neutral-200 opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={src}
                alt={`${name} foto ${i + 1}`}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
