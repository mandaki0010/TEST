const pool = require('../config/database');

class Department {
  static async findAll() {
    const { rows } = await pool.query(
      `SELECT d.*, pd.department_name as parent_department_name
       FROM departments d
       LEFT JOIN departments pd ON d.parent_department_id = pd.department_id
       ORDER BY d.sort_order`
    );
    return rows;
  }

  static async findById(id) {
    const { rows } = await pool.query(
      'SELECT * FROM departments WHERE department_id = $1',
      [id]
    );
    return rows[0] || null;
  }

  static async getHierarchy() {
    const all = await this.findAll();
    const map = new Map();
    const roots = [];

    all.forEach(dept => map.set(dept.department_id, { ...dept, children: [] }));
    all.forEach(dept => {
      const node = map.get(dept.department_id);
      if (dept.parent_department_id) {
        const parent = map.get(dept.parent_department_id);
        if (parent) parent.children.push(node);
        else roots.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  static async create(data) {
    const { rows } = await pool.query(
      `INSERT INTO departments (department_name, parent_department_id, sort_order)
       VALUES ($1, $2, $3) RETURNING department_id`,
      [data.department_name, data.parent_department_id || null, data.sort_order || 0]
    );
    return { department_id: rows[0].department_id };
  }

  static async update(id, data) {
    await pool.query(
      `UPDATE departments
       SET department_name = $1, parent_department_id = $2, sort_order = $3, updated_at = CURRENT_TIMESTAMP
       WHERE department_id = $4`,
      [data.department_name, data.parent_department_id || null, data.sort_order || 0, id]
    );
  }
}

class Position {
  static async findAll() {
    const { rows } = await pool.query('SELECT * FROM positions ORDER BY sort_order');
    return rows;
  }

  static async findById(id) {
    const { rows } = await pool.query('SELECT * FROM positions WHERE position_id = $1', [id]);
    return rows[0] || null;
  }

  static async create(data) {
    const { rows } = await pool.query(
      `INSERT INTO positions (position_name, position_level, sort_order)
       VALUES ($1, $2, $3) RETURNING position_id`,
      [data.position_name, data.position_level || 0, data.sort_order || 0]
    );
    return { position_id: rows[0].position_id };
  }
}

class EmploymentType {
  static async findAll() {
    const { rows } = await pool.query('SELECT * FROM employment_types ORDER BY sort_order');
    return rows;
  }

  static async findById(id) {
    const { rows } = await pool.query('SELECT * FROM employment_types WHERE type_id = $1', [id]);
    return rows[0] || null;
  }
}

class OperationLog {
  static async create(data) {
    await pool.query(
      `INSERT INTO operation_logs (user_id, action, target_table, target_id, old_value, new_value, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        data.user_id,
        data.action,
        data.target_table,
        data.target_id,
        data.old_value ? JSON.stringify(data.old_value) : null,
        data.new_value ? JSON.stringify(data.new_value) : null,
        data.ip_address,
        data.user_agent
      ]
    );
  }

  static async findByUser(userId, limit = 100) {
    const { rows } = await pool.query(
      `SELECT * FROM operation_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [userId, limit]
    );
    return rows;
  }

  static async findByTarget(targetTable, targetId, limit = 100) {
    const { rows } = await pool.query(
      `SELECT ol.*, u.username
       FROM operation_logs ol
       LEFT JOIN users u ON ol.user_id = u.id
       WHERE ol.target_table = $1 AND ol.target_id = $2
       ORDER BY ol.created_at DESC LIMIT $3`,
      [targetTable, targetId, limit]
    );
    return rows;
  }

  static async findRecent(limit = 100) {
    const { rows } = await pool.query(
      `SELECT ol.*, u.username
       FROM operation_logs ol
       LEFT JOIN users u ON ol.user_id = u.id
       ORDER BY ol.created_at DESC LIMIT $1`,
      [limit]
    );
    return rows;
  }
}

class AccessLog {
  static async create(data) {
    await pool.query(
      `INSERT INTO access_logs (user_id, endpoint, method, status_code, response_time, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [data.user_id, data.endpoint, data.method, data.status_code, data.response_time, data.ip_address, data.user_agent]
    );
  }
}

module.exports = {
  Department,
  Position,
  EmploymentType,
  OperationLog,
  AccessLog
};
