const db = require('../config/database');

class Employee {
  static generateEmployeeId() {
    const row = db.prepare('SELECT last_number FROM employee_id_sequence WHERE id = 1').get();
    const nextNumber = (row?.last_number || 0) + 1;
    db.prepare('UPDATE employee_id_sequence SET last_number = ? WHERE id = 1').run(nextNumber);
    return String(nextNumber).padStart(8, '0');
  }

  static create(data) {
    const employeeId = this.generateEmployeeId();
    const stmt = db.prepare(`
      INSERT INTO employees (
        employee_id, last_name, first_name, last_name_kana, first_name_kana,
        department_id, position_id, hire_date, email, phone, birth_date,
        postal_code, prefecture, city, address_line1, address_line2,
        employment_type_id, employment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      employeeId,
      data.last_name, data.first_name,
      data.last_name_kana, data.first_name_kana,
      data.department_id, data.position_id || null,
      data.hire_date, data.email || null, data.phone || null,
      data.birth_date || null, data.postal_code || null,
      data.prefecture || null, data.city || null,
      data.address_line1 || null, data.address_line2 || null,
      data.employment_type_id, data.employment_status || 'active'
    );

    return { id: result.lastInsertRowid, employee_id: employeeId };
  }

  static findById(employeeId) {
    const stmt = db.prepare(`
      SELECT e.*,
             d.department_name,
             p.position_name,
             et.type_name as employment_type_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.department_id
      LEFT JOIN positions p ON e.position_id = p.position_id
      LEFT JOIN employment_types et ON e.employment_type_id = et.type_id
      WHERE e.employee_id = ?
    `);
    return stmt.get(employeeId);
  }

  static findAll(filters = {}, options = {}) {
    let query = `
      SELECT e.*,
             d.department_name,
             p.position_name,
             et.type_name as employment_type_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.department_id
      LEFT JOIN positions p ON e.position_id = p.position_id
      LEFT JOIN employment_types et ON e.employment_type_id = et.type_id
      WHERE 1=1
    `;
    const params = [];

    // 検索条件
    if (filters.name) {
      query += ` AND (e.last_name LIKE ? OR e.first_name LIKE ?
                      OR e.last_name_kana LIKE ? OR e.first_name_kana LIKE ?
                      OR (e.last_name || e.first_name) LIKE ?
                      OR (e.last_name_kana || e.first_name_kana) LIKE ?)`;
      const nameLike = `%${filters.name}%`;
      params.push(nameLike, nameLike, nameLike, nameLike, nameLike, nameLike);
    }

    if (filters.department_id) {
      query += ` AND e.department_id = ?`;
      params.push(filters.department_id);
    }

    if (filters.position_id) {
      query += ` AND e.position_id = ?`;
      params.push(filters.position_id);
    }

    if (filters.employment_status && filters.employment_status !== 'all') {
      query += ` AND e.employment_status = ?`;
      params.push(filters.employment_status);
    }

    if (filters.employment_type_id && filters.employment_type_id !== 'all') {
      query += ` AND e.employment_type_id = ?`;
      params.push(filters.employment_type_id);
    }

    // ソート
    const sortField = options.sortBy || 'last_name_kana';
    const sortOrder = options.sortOrder || 'ASC';
    const validSortFields = ['last_name_kana', 'employee_id', 'department_id', 'hire_date'];
    const safeSortField = validSortFields.includes(sortField) ? sortField : 'last_name_kana';
    const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    if (safeSortField === 'last_name_kana') {
      query += ` ORDER BY e.last_name_kana ${safeSortOrder}, e.first_name_kana ${safeSortOrder}`;
    } else {
      query += ` ORDER BY e.${safeSortField} ${safeSortOrder}`;
    }

    // ページネーション
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  static count(filters = {}) {
    let query = `SELECT COUNT(*) as total FROM employees e WHERE 1=1`;
    const params = [];

    if (filters.name) {
      query += ` AND (e.last_name LIKE ? OR e.first_name LIKE ?
                      OR e.last_name_kana LIKE ? OR e.first_name_kana LIKE ?
                      OR (e.last_name || e.first_name) LIKE ?
                      OR (e.last_name_kana || e.first_name_kana) LIKE ?)`;
      const nameLike = `%${filters.name}%`;
      params.push(nameLike, nameLike, nameLike, nameLike, nameLike, nameLike);
    }

    if (filters.department_id) {
      query += ` AND e.department_id = ?`;
      params.push(filters.department_id);
    }

    if (filters.position_id) {
      query += ` AND e.position_id = ?`;
      params.push(filters.position_id);
    }

    if (filters.employment_status && filters.employment_status !== 'all') {
      query += ` AND e.employment_status = ?`;
      params.push(filters.employment_status);
    }

    if (filters.employment_type_id && filters.employment_type_id !== 'all') {
      query += ` AND e.employment_type_id = ?`;
      params.push(filters.employment_type_id);
    }

    const stmt = db.prepare(query);
    const result = stmt.get(...params);
    return result.total;
  }

  static update(employeeId, data) {
    const fields = [];
    const params = [];

    const allowedFields = [
      'last_name', 'first_name', 'last_name_kana', 'first_name_kana',
      'department_id', 'position_id', 'hire_date', 'email', 'phone',
      'birth_date', 'postal_code', 'prefecture', 'city', 'address_line1',
      'address_line2', 'employment_type_id', 'employment_status'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (fields.length === 0) return { changes: 0 };

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(employeeId);

    const stmt = db.prepare(`
      UPDATE employees SET ${fields.join(', ')} WHERE employee_id = ?
    `);

    const result = stmt.run(...params);
    return { changes: result.changes };
  }

  static delete(employeeId) {
    // 論理削除（退職処理）
    const stmt = db.prepare(`
      UPDATE employees
      SET employment_status = 'retired', updated_at = CURRENT_TIMESTAMP
      WHERE employee_id = ?
    `);
    const result = stmt.run(employeeId);
    return { changes: result.changes };
  }

  static getStatistics() {
    const stats = {};

    // 総社員数
    stats.total = db.prepare('SELECT COUNT(*) as count FROM employees').get().count;
    stats.active = db.prepare("SELECT COUNT(*) as count FROM employees WHERE employment_status = 'active'").get().count;
    stats.retired = db.prepare("SELECT COUNT(*) as count FROM employees WHERE employment_status = 'retired'").get().count;

    // 部署別
    stats.byDepartment = db.prepare(`
      SELECT d.department_name, COUNT(e.id) as count
      FROM departments d
      LEFT JOIN employees e ON d.department_id = e.department_id AND e.employment_status = 'active'
      GROUP BY d.department_id
      ORDER BY d.sort_order
    `).all();

    // 雇用形態別
    stats.byEmploymentType = db.prepare(`
      SELECT et.type_name, COUNT(e.id) as count
      FROM employment_types et
      LEFT JOIN employees e ON et.type_id = e.employment_type_id AND e.employment_status = 'active'
      GROUP BY et.type_id
      ORDER BY et.sort_order
    `).all();

    return stats;
  }
}

module.exports = Employee;
