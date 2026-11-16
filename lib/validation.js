import { z } from "zod";

// ===================== Skema validasi input (zod) =====================
// Semua input dari user divalidasi di sisi server sebelum dipakai.
// React juga otomatis escape output sehingga XSS termitigasi.
// Batas menyesuaikan skema database vapezone_deni (username varchar(16), name varchar(50)).

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username minimal 3 karakter")
  .max(16, "Username maksimal 16 karakter")
  .regex(/^[a-zA-Z0-9_.]+$/, "Username hanya boleh huruf, angka, titik, underscore");

const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .max(72, "Password maksimal 72 karakter")
  .regex(/[a-zA-Z]/, "Password harus mengandung huruf")
  .regex(/[0-9]/, "Password harus mengandung angka");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(50),
  email: z.string().trim().email("Format email tidak valid").max(191),
  username: usernameSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Email atau username wajib diisi").max(191),
  password: z.string().min(1, "Password wajib diisi").max(72),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "Nama produk minimal 2 karakter").max(191),
  categoryId: z.coerce
    .number()
    .int("Kategori tidak valid")
    .positive("Pilih kategori"),
  price: z.coerce
    .number("Harga harus berupa angka")
    .min(1000, "Harga minimal Rp 1.000")
    .max(99_999_999, "Harga terlalu besar"),
  stock: z.coerce
    .number()
    .int("Stok harus bilangan bulat")
    .min(0, "Stok tidak boleh negatif")
    .max(1_000_000, "Stok terlalu besar"),
  description: z.string().trim().max(191).optional().default(""),
  // Kolom tambahan (padanan form tambah/edit produk aplikasi lama).
  // Opsional supaya pemanggil lama (JSON) tetap valid tanpa field ini.
  sku: z.string().trim().max(32, "SKU maksimal 32 karakter").optional().default(""),
  productUnit: z
    .string()
    .trim()
    .min(1, "Satuan tidak boleh kosong")
    .max(32, "Satuan maksimal 32 karakter")
    .optional()
    .default("pcs"),
  isAvailable: z.coerce
    .number()
    .int()
    .min(0)
    .max(1)
    .optional()
    .default(1),
});

export const saleSchema = z.object({
  productId: z.coerce.number().int().positive("Produk tidak valid"),
  quantity: z.coerce
    .number()
    .int("Jumlah harus bilangan bulat")
    .min(1, "Jumlah minimal 1")
    .max(999, "Jumlah maksimal 999"),
});

export const roleSchema = z.object({
  role: z.enum(["admin", "customer"]),
});

/** Parse body JSON + validasi; kembalikan { ok, data } atau { ok, error }. */
export async function parseBody(request, schema) {
  let raw;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, error: "Body harus berupa JSON yang valid" };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    return { ok: false, error: first?.message || "Input tidak valid" };
  }
  return { ok: true, data: result.data };
}
