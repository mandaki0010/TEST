require('dotenv').config();
const db = require('../config/database');

const migrations = `
-- 部署マスタテーブル
CREATE TABLE IF NOT EXISTS departments (
  department_id INTEGER PRIMARY KEY AUTOINCREMENT,
  department_name TEXT NOT NULL UNIQUE,
  parent_department_id INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_department_id) REFERENCES departments(department_id)
);

-- 雇用形態マスタテーブル
CREATE TABLE IF NOT EXISTS employment_types (
  type_id INTEGER PRIMARY KEY AUTOINCREMENT,
  type_name TEXT NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 役職マスタテーブル
CREATE TABLE IF NOT EXISTS positions (
  position_id INTEGER PRIMARY KEY AUTOINCREMENT,
  position_name TEXT NOT NULL UNIQUE,
  position_level INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 社員テーブル
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id TEXT NOT NULL UNIQUE,
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name_kana TEXT NOT NULL,
  first_name_kana TEXT NOT NULL,
  department_id INTEGER NOT NULL,
  position_id INTEGER,
  hire_date DATE NOT NULL,
  email TEXT,
  phone TEXT,
  birth_date DATE,
  postal_code TEXT,
  prefecture TEXT,
  city TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  employment_type_id INTEGER NOT NULL,
  employment_status TEXT NOT NULL DEFAULT 'active' CHECK(employment_status IN ('active', 'retired')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(department_id),
  FOREIGN KEY (position_id) REFERENCES positions(position_id),
  FOREIGN KEY (employment_type_id) REFERENCES employment_types(type_id)
);

-- ユーザーテーブル（認証用）
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK(role IN ('admin', 'employee')),
  is_active INTEGER DEFAULT 1,
  login_attempts INTEGER DEFAULT 0,
  locked_until DATETIME,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
);

-- 操作ログテーブル
CREATE TABLE IF NOT EXISTS operation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  target_table TEXT,
  target_id TEXT,
  old_value TEXT,
  new_value TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- アクセスログテーブル
CREATE TABLE IF NOT EXISTS access_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 社員番号採番テーブル
CREATE TABLE IF NOT EXISTS employee_id_sequence (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_number INTEGER NOT NULL DEFAULT 0
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_employees_kana ON employees(last_name_kana, first_name_kana);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(employment_status);
CREATE INDEX IF NOT EXISTS idx_employees_hire_date ON employees(hire_date);
CREATE INDEX IF NOT EXISTS idx_operation_logs_user ON operation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_created ON operation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_access_logs_created ON access_logs(created_at);

-- 採番テーブル初期化
INSERT OR IGNORE INTO employee_id_sequence (id, last_number) VALUES (1, 0);
`;

try {
  db.exec(migrations);
  console.log('Migration completed successfully!');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
}
