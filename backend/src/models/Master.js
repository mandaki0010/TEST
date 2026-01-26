const db = require('../config/database');

class Department {
  static findAll() {
    return db.prepare(`
      SELECT d.*, pd.department_name as parent_department_name
      FROM departments d
      LEFT JOIN departments pd ON d.parent_department_id = pd.department_id
      ORDER BY d.sort_order
    `).all();
  }

  static findById(id) {
    return db.prepare('SELECT * FROM departments WHERE department_id = ?').get(id);
  }

  static getHierarchy() {
    const all = this.findAll();
    const map = new Map();
    const roots = [];

    // Create map
    all.forEach(dept => {
      map.set(dept.department_id, { ...dept, children: [] });
    });

    // Build tree
    all.forEach(dept => {
      const node = map.get(dept.department_id);
      if (dept.parent_department_id) {
        const parent = map.get(dept.parent_department_id);
        if (parent) {
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  static create(data) {
    const stmt = db.prepare(`
      INSERT INTO departments (department_name, parent_department_id, sort_order)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(data.department_name, data.parent_department_id || null, data.sort_order || 0);
    return { department_id: result.lastInsertRowid };
  }

  static update(id, data) {
    const stmt = db.prepare(`
      UPDATE departments
      SET department_name = ?, parent_department_id = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
      WHERE department_id = ?
    `);
    return stmt.run(data.department_name, data.parent_department_id || null, data.sort_order || 0, id);
  }
}

class Position {
  static findAll() {
    return db.prepare('SELECT * FROM positions ORDER BY sort_order').all();
  }

  static findById(id) {
    return db.prepare('SELECT * FROM positions WHERE position_id = ?').get(id);
  }

  static create(data) {
    const stmt = db.prepare(`
      INSERT INTO positions (position_name, position_level, sort_order)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(data.position_name, data.position_level || 0, data.sort_order || 0);
    return { position_id: result.lastInsertRowid };
  }
}

class EmploymentType {
  static findAll() {
    return db.prepare('SELECT * FROM employment_types ORDER BY sort_order').all();
  }

  static findById(id) {
    return db.prepare('SELECT * FROM employment_types WHERE type_id = ?').get(id);
  }
}

class OperationLog {
  static create(data) {
    const stmt = db.prepare(`
      INSERT INTO operation_logs (user_id, action, target_table, target_id, old_value, new_value, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      data.user_id,
      data.action,
      data.target_table,
      data.target_id,
      data.old_value ? JSON.stringify(data.old_value) : null,
      data.new_value ? JSON.stringify(data.new_value) : null,
      data.ip_address,
      data.user_agent
    );
  }

  static findByUser(userId, limit = 100) {
    return db.prepare(`
      SELECT * FROM operation_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?
    `).all(userId, limit);
  }

  static findByTarget(targetTable, targetId, limit = 100) {
    return db.prepare(`
      SELECT ol.*, u.username
      FROM operation_logs ol
      LEFT JOIN users u ON ol.user_id = u.id
      WHERE ol.target_table = ? AND ol.target_id = ?
      ORDER BY ol.created_at DESC LIMIT ?
    `).all(targetTable, targetId, limit);
  }

  static findRecent(limit = 100) {
    return db.prepare(`
      SELECT ol.*, u.username
      FROM operation_logs ol
      LEFT JOIN users u ON ol.user_id = u.id
      ORDER BY ol.created_at DESC LIMIT ?
    `).all(limit);
  }
}

class AccessLog {
  static create(data) {
    const stmt = db.prepare(`
      INSERT INTO access_logs (user_id, endpoint, method, status_code, response_time, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      data.user_id,
      data.endpoint,
      data.method,
      data.status_code,
      data.response_time,
      data.ip_address,
      data.user_agent
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
