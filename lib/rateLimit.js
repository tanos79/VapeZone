// Rate limiter sederhana in-memory (per instance server).
// Cocok untuk tugas ini; untuk produksi skala besar gunakan store bersama
// (mis. Upstash Redis) karena Vercel bisa menjalankan banyak instance.
const buckets = new Map();

const MAX_KEYS = 10_000;

/**
 * Cek apakah request pada `key` masih di bawah batas.
 * @param {string} key identifier unik, mis. `login:1.2.3.4`
 * @param {number} limit jumlah request maksimum
 * @param {number} windowMs jendela waktu dalam ms
 * @returns {{ ok: boolean, retryAfterSeconds: number }}
 */
export function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const entry = buckets.get(key) ?? { count: 0, resetAt: now + windowMs };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }

  entry.count += 1;

  if (buckets.size > MAX_KEYS) buckets.clear();
  buckets.set(key, entry);

  if (entry.count > limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

/** Ambil IP klien dari header yang umum diset platform hosting. */
export function clientIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
