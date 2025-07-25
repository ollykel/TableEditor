-- Users
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(256) NOT NULL,
  username VARCHAR(256) NOT NULL,
  password_hashed CHAR(60) NOT NULL,
  UNIQUE(email),
  UNIQUE(username)
);

-- Stores table metadata --
CREATE TABLE tables (
  id BIGSERIAL PRIMARY KEY,
  owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(256) NOT NULL,
  width INTEGER NOT NULL CHECK (width > 0),
  height INTEGER NOT NULL CHECK (height > 0)
);

-- Stores individual text cells per table --
CREATE TABLE table_cells (
  table_id BIGINT NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  row_num INTEGER NOT NULL CHECK (row_num >= 0),
  column_num INTEGER NOT NULL CHECK (column_num >= 0),
  text TEXT NOT NULL,
  PRIMARY KEY (table_id, row_num, column_num)
);

-- Stores many-to-many relationship between users and shared tables --
CREATE TABLE table_shares (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  table_id BIGINT NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, table_id)
);
