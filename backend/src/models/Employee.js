const pool = require('../config/database');

class Employee {
  static async generateEmployeeId() {
    // アトミックなインクリメントで採番
    const { rows } = await pool.query(
      `UPDATE employee_id_sequence SET last_number = last_number + 1 WHERE id = 1 RETURNING last_number`
    );
    return String(rows[0].last_number).padStart(8, '0');
  }

  static async create(data) {
    const employeeId = await this.generateEmployeeId();
    const { rows } = await pool.query(
      `INSERT INTO employees (
        employee_id, last_name, first_name, last_name_kana, first_name_kana,
        department_id, position_id, hire_date, email, phone, birth_date,
        postal_code, prefecture, city, address_line1, address_line2,
        employment_type_id, employment_status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING id`,
      [
        employeeId,
        data.last_name, data.first_name,
        data.last_name_kana, data.first_name_kana,
        data.department_id, data.position_id || null,
        data.hire_date, data.email || null, data.phone || null,
        data.birth_date || null, data.postal_code || null,
        data.prefecture || null, data.city || null,
        data.address_line1 || null, data.address_line2 || null,
        data.employment_type_id, data.employment_status || 'active'
      ]
    );
    return { id: rows[0].id, employee_id: employeeId };
  }

  static async findById(employeeId) {
    const { rows } = await pool.query(
      `SELECT e.*,
              d.department_name,
              p.position_name,
              et.type_name as employment_type_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.department_id
       LEFT JOIN positions p ON e.position_id = p.position_id
       LEFT JOIN employment_types et ON e.employment_type_id = et.type_id
       WHERE e.employee_id = $1`,
      [employeeId]
    );
    return rows[0] || null;
  }

  static async findAll(filters = {}, options = {}) {
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
    let i = 1;

    if (filters.name) {
      const nameLike = `%${filters.name}%`;
      query += ` AND (e.last_name LIKE $${i} OR e.first_name LIKE $${i+1}
                      OR e.last_name_kana LIKE $${i+2} OR e.first_name_kana LIKE $${i+3}
                      OR (e.last_name || e.first_name) LIKE $${i+4}
                      OR (e.last_name_kana || e.first_name_kana) LIKE $${i+5})`;
      params.push(nameLike, nameLike, nameLike, nameLike, nameLike, nameLike);
      i += 6;
    }
    if (filters.department_id) {
      query += ` AND e.department_id = $${i++}`;
      params.push(filters.department_id);
    }
    if (filters.position_id) {
      query += ` AND e.position_id = $${i++}`;
      params.push(filters.position_id);
    }
    if (filters.employment_status && filters.employment_status !== 'all') {
      query += ` AND e.employment_status = $${i++}`;
      params.push(filters.employment_status);
    }
    if (filters.employment_type_id && filters.employment_type_id !== 'all') {
      query += ` AND e.employment_type_id = $${i++}`;
      params.push(filters.employment_type_id);
    }

    const validSortFields = ['last_name_kana', 'employee_id', 'department_id', 'hire_date'];
    const safeSortField = validSortFields.includes(options.sortBy) ? options.sortBy : 'last_name_kana';
    const safeSortOrder = (options.sortOrder || '').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    if (safeSortField === 'last_name_kana') {
      query += ` ORDER BY e.last_name_kana ${safeSortOrder}, e.first_name_kana ${safeSortOrder}`;
    } else {
      query += ` ORDER BY e.${safeSortField} ${safeSortOrder}`;
    }

    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;
    query += ` LIMIT $${i++} OFFSET $${i++}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async count(filters = {}) {
    let query = `SELECT COUNT(*) as total FROM employees e WHERE 1=1`;
    const params = [];
    let i = 1;

    if (filters.name) {
      const nameLike = `%${filters.name}%`;
      query += ` AND (e.last_name LIKE $${i} OR e.first_name LIKE $${i+1}
                      OR e.last_name_kana LIKE $${i+2} OR e.first_name_kana LIKE $${i+3}
                      OR (e.last_name || e.first_name) LIKE $${i+4}
                      OR (e.last_name_kana || e.first_name_kana) LIKE $${i+5})`;
      params.push(nameLike, nameLike, nameLike, nameLike, nameLike, nameLike);
      i += 6;
    }
    if (filters.department_id) {
      query += ` AND e.department_id = $${i++}`;
      params.push(filters.department_id);
    }
    if (filters.position_id) {
      query += ` AND e.position_id = $${i++}`;
      params.push(filters.position_id);
    }
    if (filters.employment_status && filters.employment_status !== 'all') {
      query += ` AND e.employment_status = $${i++}`;
      params.push(filters.employment_status);
    }
    if (filters.employment_type_id && filters.employment_type_id !== 'all') {
      query += ` AND e.employment_type_id = $${i++}`;
      params.push(filters.employment_type_id);
    }

    const { rows } = await pool.query(query, params);
    return parseInt(rows[0].total);
  }

  static async update(employeeId, data) {
    const allowedFields = [
      'last_name', 'first_name', 'last_name_kana', 'first_name_kana',
      'department_id', 'position_id', 'hire_date', 'email', 'phone',
      'birth_date', 'postal_code', 'prefecture', 'city', 'address_line1',
      'address_line2', 'employment_type_id', 'employment_status'
    ];

    const fields = [];
    const params = [];
    let i = 1;

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${i++}`);
        params.push(data[field]);
      }
    }

    if (fields.length === 0) return { changes: 0 };

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(employeeId);

    const result = await pool.query(
      `UPDATE employees SET ${fields.join(', ')} WHERE employee_id = $${i}`,
      params
    );
    return { changes: result.rowCount };
  }

  static async delete(employeeId) {
    const result = await pool.query(
      `UPDATE employees SET employment_status = 'retired', updated_at = CURRENT_TIMESTAMP
       WHERE employee_id = $1`,
      [employeeId]
    );
    return { changes: result.rowCount };
  }

  static async getStatistics() {
    const stats = {};

    const counts = await pool.query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE employment_status = 'active') as active,
        COUNT(*) FILTER (WHERE employment_status = 'retired') as retired
       FROM employees`
    );
    stats.total = parseInt(counts.rows[0].total);
    stats.active = parseInt(counts.rows[0].active);
    stats.retired = parseInt(counts.rows[0].retired);

    const byDept = await pool.query(
      `SELECT d.department_name, COUNT(e.id) as count
       FROM departments d
       LEFT JOIN employees e ON d.department_id = e.department_id AND e.employment_status = 'active'
       GROUP BY d.department_id, d.department_name
       ORDER BY d.sort_order`
    );
    stats.byDepartment = byDept.rows;

    const byType = await pool.query(
      `SELECT et.type_name, COUNT(e.id) as count
       FROM employment_types et
       LEFT JOIN employees e ON et.type_id = e.employment_type_id AND e.employment_status = 'active'
       GROUP BY et.type_id, et.type_name
       ORDER BY et.sort_order`
    );
    stats.byEmploymentType = byType.rows;

    return stats;
  }
}

module.exports = Employee;
