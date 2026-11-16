const isDev = process.env.NODE_ENV === "development";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cache Components dimatikan agar halaman yang memakai cookies()/db
  // dirender dinamis dengan cara klasik (lebih mudah dipahami & dijelaskan).
  cacheComponents: false,
  poweredByHeader: false, // sembunyikan header X-Powered-By
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        // Security headers global untuk semua response.
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY", // cegah klikjacking
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff", // cegah MIME sniffing
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload", // aktif penuh di HTTPS (Vercel)
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // 'unsafe-inline' diperlukan Next.js untuk inline bootstrap script;
              // XSS utama dicegah React yang otomatis escape semua output.
              // 'unsafe-eval' hanya untuk development (fitur debugging React).
              isDev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data:",
              "font-src 'self'",
              "connect-src 'self'",
              // iframe Google Maps di halaman /tentang (port about.php)
              "frame-src https://www.google.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
