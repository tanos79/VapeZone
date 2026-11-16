-- Tabel tambahan untuk panel internal VapeZone (dibuat idempotent).
-- Tabel users, products, product_category, orders, dst. sudah ada di
-- database vapezone_deni milik toko; skrip ini hanya menambah tabel
-- penjualan kasir dan log aktivitas yang belum ada.

CREATE TABLE IF NOT EXISTS sales (
  id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL,
  product_id BIGINT       NOT NULL,
  quantity   INT          NOT NULL CHECK (quantity > 0),
  unit_price INT          NOT NULL CHECK (unit_price >= 0),
  total      INT          NOT NULL CHECK (total >= 0),
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sales_created_at (created_at),
  INDEX idx_sales_product (product_id),
  CONSTRAINT fk_sales_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_sales_product FOREIGN KEY (product_id) REFERENCES products (id)
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id         BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NULL,
  username   VARCHAR(30) NOT NULL DEFAULT '-',
  action     VARCHAR(40) NOT NULL,
  detail     TEXT        NOT NULL,
  ip         VARCHAR(64) NOT NULL DEFAULT '-',
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_logs_created_at (created_at DESC)
);
