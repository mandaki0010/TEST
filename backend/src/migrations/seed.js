require('dotenv').config();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const departments = [
  { name: '経営企画部', parent: null, sort: 1 },
  { name: '人事部', parent: null, sort: 2 },
  { name: '総務部', parent: null, sort: 3 },
  { name: '経理部', parent: null, sort: 4 },
  { name: '営業部', parent: null, sort: 5 },
  { name: '営業1課', parent: '営業部', sort: 6 },
  { name: '営業2課', parent: '営業部', sort: 7 },
  { name: '開発部', parent: null, sort: 8 },
  { name: '品質管理部', parent: null, sort: 9 },
  { name: 'カスタマーサポート部', parent: null, sort: 10 }
];

const employmentTypes = [
  { name: '正社員', sort: 1 },
  { name: '契約社員', sort: 2 },
  { name: 'パート', sort: 3 },
  { name: 'アルバイト', sort: 4 }
];

const positions = [
  { name: '代表取締役', level: 10, sort: 1 },
  { name: '取締役', level: 9, sort: 2 },
  { name: '部長', level: 8, sort: 3 },
  { name: '副部長', level: 7, sort: 4 },
  { name: '課長', level: 6, sort: 5 },
  { name: '係長', level: 5, sort: 6 },
  { name: '主任', level: 4, sort: 7 },
  { name: '一般', level: 1, sort: 8 }
];

const sampleEmployees = [
  {
    last_name: '山田', first_name: '太郎',
    last_name_kana: 'やまだ', first_name_kana: 'たろう',
    department: '人事部', position: '部長',
    hire_date: '2015-04-01', email: 'yamada.taro@company.co.jp',
    phone: '090-1234-5678', birth_date: '1980-05-15',
    postal_code: '100-0001', prefecture: '東京都',
    city: '千代田区', address_line1: '丸の内1-1-1',
    employment_type: '正社員', is_admin: true
  },
  {
    last_name: '鈴木', first_name: '花子',
    last_name_kana: 'すずき', first_name_kana: 'はなこ',
    department: '開発部', position: '課長',
    hire_date: '2018-04-01', email: 'suzuki.hanako@company.co.jp',
    phone: '090-2345-6789', birth_date: '1985-08-20',
    postal_code: '150-0001', prefecture: '東京都',
    city: '渋谷区', address_line1: '渋谷2-2-2',
    employment_type: '正社員', is_admin: false
  },
  {
    last_name: '佐藤', first_name: '次郎',
    last_name_kana: 'さとう', first_name_kana: 'じろう',
    department: '営業1課', position: '主任',
    hire_date: '2020-04-01', email: 'sato.jiro@company.co.jp',
    phone: '090-3456-7890', birth_date: '1990-03-10',
    postal_code: '160-0001', prefecture: '東京都',
    city: '新宿区', address_line1: '新宿3-3-3',
    employment_type: '正社員', is_admin: false
  },
  {
    last_name: '田中', first_name: '美咲',
    last_name_kana: 'たなか', first_name_kana: 'みさき',
    department: '総務部', position: '一般',
    hire_date: '2022-04-01', email: 'tanaka.misaki@company.co.jp',
    phone: '090-4567-8901', birth_date: '1995-12-25',
    postal_code: '170-0001', prefecture: '東京都',
    city: '豊島区', address_line1: '池袋4-4-4',
    employment_type: '契約社員', is_admin: false
  },
  {
    last_name: '高橋', first_name: '健一',
    last_name_kana: 'たかはし', first_name_kana: 'けんいち',
    department: '経理部', position: '係長',
    hire_date: '2019-10-01', email: 'takahashi.kenichi@company.co.jp',
    phone: '090-5678-9012', birth_date: '1988-07-07',
    postal_code: '180-0001', prefecture: '東京都',
    city: '武蔵野市', address_line1: '吉祥寺5-5-5',
    employment_type: '正社員', is_admin: false
  }
];

async function seed() {
  try {
    // 雇用形態
    for (const et of employmentTypes) {
      await pool.query(
        'INSERT INTO employment_types (type_name, sort_order) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [et.name, et.sort]
      );
    }
    console.log('Employment types seeded');

    // 役職
    for (const pos of positions) {
      await pool.query(
        'INSERT INTO positions (position_name, position_level, sort_order) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [pos.name, pos.level, pos.sort]
      );
    }
    console.log('Positions seeded');

    // 部署（親なし先行）
    for (const dept of departments.filter(d => !d.parent)) {
      await pool.query(
        'INSERT INTO departments (department_name, parent_department_id, sort_order) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [dept.name, null, dept.sort]
      );
    }
    for (const dept of departments.filter(d => d.parent)) {
      const { rows } = await pool.query(
        'SELECT department_id FROM departments WHERE department_name = $1',
        [dept.parent]
      );
      const parentId = rows[0]?.department_id || null;
      await pool.query(
        'INSERT INTO departments (department_name, parent_department_id, sort_order) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [dept.name, parentId, dept.sort]
      );
    }
    console.log('Departments seeded');

    // 社員・ユーザー
    let employeeNumber = 1;
    for (const emp of sampleEmployees) {
      const deptRow = await pool.query('SELECT department_id FROM departments WHERE department_name = $1', [emp.department]);
      const posRow = await pool.query('SELECT position_id FROM positions WHERE position_name = $1', [emp.position]);
      const etRow = await pool.query('SELECT type_id FROM employment_types WHERE type_name = $1', [emp.employment_type]);

      const employeeId = String(employeeNumber).padStart(8, '0');

      await pool.query(
        `INSERT INTO employees (
          employee_id, last_name, first_name, last_name_kana, first_name_kana,
          department_id, position_id, hire_date, email, phone, birth_date,
          postal_code, prefecture, city, address_line1, address_line2,
          employment_type_id, employment_status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'active')
        ON CONFLICT DO NOTHING`,
        [
          employeeId, emp.last_name, emp.first_name, emp.last_name_kana, emp.first_name_kana,
          deptRow.rows[0]?.department_id || 1, posRow.rows[0]?.position_id || null,
          emp.hire_date, emp.email, emp.phone, emp.birth_date,
          emp.postal_code, emp.prefecture, emp.city, emp.address_line1, null,
          etRow.rows[0]?.type_id || 1
        ]
      );

      const passwordHash = await bcrypt.hash('password123', 12);
      const username = emp.email.split('@')[0];
      const role = emp.is_admin ? 'admin' : 'employee';
      await pool.query(
        'INSERT INTO users (employee_id, username, password_hash, role) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
        [employeeId, username, passwordHash, role]
      );

      employeeNumber++;
    }

    await pool.query(
      'UPDATE employee_id_sequence SET last_number = $1 WHERE id = 1',
      [employeeNumber - 1]
    );

    console.log('Sample employees and users seeded');
    console.log('Default password for all users: password123');
    console.log('\nSeed completed successfully!');
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
}

seed();
