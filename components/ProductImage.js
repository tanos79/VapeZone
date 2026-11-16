"use client";

/**
 * Gambar produk (client component) dengan fallback otomatis ke placeholder
 * bila file gambar tidak ditemukan. Dipisah agar halaman server tetap bisa
 * memakainya (event handler hanya boleh di Client Component).
 */
export default function ProductImage({ pictureName, alt, className = "" }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- gambar produk dari folder publik statis
    <img
      src={`/img/products/${pictureName}`}
      alt={alt}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = "/img/products/placeholder.svg";
      }}
      className={className}
    />
  );
}
