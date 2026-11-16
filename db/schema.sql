-- Skema database VapeZone (PostgreSQL)
-- Dieksekusi otomatis oleh scripts/seed.js (idempotent).

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(30)  NOT NULL UNIQUE,
  name          VARCHAR(60)  NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  role          VARCHAR(10)  NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  brand      VARCHAR(60)  NOT NULL,
  category   VARCHAR(20)  NOT NULL DEFAULT 'aksesoris'
             CHECK (category IN ('device', 'liquid', 'coil', 'battery', 'aksesoris')),
  price      INTEGER      NOT NULL CHECK (price >= 0),
  stock      INTEGER      NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER     NOT NULL REFERENCES users(id),
  product_id INTEGER     NOT NULL REFERENCES products(id),
  quantity   INTEGER     NOT NULL CHECK (quantity > 0),
  unit_price INTEGER     NOT NULL CHECK (unit_price >= 0),
  total      INTEGER     NOT NULL CHECK (total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales (created_at);
CREATE INDEX IF NOT EXISTS idx_sales_product    ON sales (product_id);

CREATE TABLE IF NOT EXISTS activity_logs (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER      NULL REFERENCES users(id) ON DELETE SET NULL,
  username   VARCHAR(30)  NOT NULL DEFAULT '-',
  action     VARCHAR(40)  NOT NULL,
  detail     TEXT         NOT NULL DEFAULT '',
  ip         VARCHAR(64)  NOT NULL DEFAULT '-',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logs_created_at ON activity_logs (created_at DESC);
