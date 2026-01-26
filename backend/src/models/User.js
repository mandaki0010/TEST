const db = require('../config/database');
const bcrypt = require('bcryptjs');

const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

class User {
  static async create(data) {
    const passwordHash = await bcrypt.hash(data.password, 12);

    const stmt = db.prepare(`
      INSERT INTO users (employee_id, username, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.employee_id,
      data.username,
      passwordHash,
      data.role || 'employee'
    );

    return { id: result.lastInsertRowid };
  }

  static findById(id) {
    const stmt = db.prepare(`
      SELECT u.*, e.last_name, e.first_name, e.email, d.department_name
      FROM users u
      LEFT JOIN employees e ON u.employee_id = e.employee_id
      LEFT JOIN departments d ON e.department_id = d.department_id
      WHERE u.id = ?
    `);
    return stmt.get(id);
  }

  static findByUsername(username) {
    const stmt = db.prepare(`
      SELECT u.*, e.last_name, e.first_name, e.email, e.department_id, d.department_name
      FROM users u
      LEFT JOIN employees e ON u.employee_id = e.employee_id
      LEFT JOIN departments d ON e.department_id = d.department_id
      WHERE u.username = ?
    `);
    return stmt.get(username);
  }

  static findByEmployeeId(employeeId) {
    const stmt = db.prepare(`
      SELECT u.*, e.last_name, e.first_name, e.email, d.department_name
      FROM users u
      LEFT JOIN employees e ON u.employee_id = e.employee_id
      LEFT JOIN departments d ON e.department_id = d.department_id
      WHERE u.employee_id = ?
    `);
    return stmt.get(employeeId);
  }

  static async validatePassword(user, password) {
    return bcrypt.compare(password, user.password_hash);
  }

  static isLocked(user) {
    if (!user.locked_until) return false;
    return new Date(user.locked_until) > new Date();
  }

  static incrementLoginAttempts(userId) {
    const user = db.prepare('SELECT login_attempts FROM users WHERE id = ?').get(userId);
    const attempts = (user?.login_attempts || 0) + 1;

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOCK_DURATION_MS).toISOString();
      db.prepare(`
        UPDATE users SET login_attempts = ?, locked_until = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(attempts, lockedUntil, userId);
    } else {
      db.prepare(`
        UPDATE users SET login_attempts = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(attempts, userId);
    }

    return attempts;
  }

  static resetLoginAttempts(userId) {
    db.prepare(`
      UPDATE users
      SET login_attempts = 0, locked_until = NULL, last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(userId);
  }

  static async updatePassword(userId, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    db.prepare(`
      UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(passwordHash, userId);
  }

  static updateRole(userId, role) {
    db.prepare(`
      UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(role, userId);
  }

  static deactivate(userId) {
    db.prepare(`
      UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(userId);
  }
}

module.exports = User;
