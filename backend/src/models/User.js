const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

class User {
  static async create(data) {
    const passwordHash = await bcrypt.hash(data.password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (employee_id, username, password_hash, role)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [data.employee_id, data.username, passwordHash, data.role || 'employee']
    );
    return { id: rows[0].id };
  }

  static async findById(id) {
    const { rows } = await pool.query(
      `SELECT u.*, e.last_name, e.first_name, e.email, d.department_name
       FROM users u
       LEFT JOIN employees e ON u.employee_id = e.employee_id
       LEFT JOIN departments d ON e.department_id = d.department_id
       WHERE u.id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  static async findByUsername(username) {
    const { rows } = await pool.query(
      `SELECT u.*, e.last_name, e.first_name, e.email, e.department_id, d.department_name
       FROM users u
       LEFT JOIN employees e ON u.employee_id = e.employee_id
       LEFT JOIN departments d ON e.department_id = d.department_id
       WHERE u.username = $1`,
      [username]
    );
    return rows[0] || null;
  }

  static async findByEmployeeId(employeeId) {
    const { rows } = await pool.query(
      `SELECT u.*, e.last_name, e.first_name, e.email, d.department_name
       FROM users u
       LEFT JOIN employees e ON u.employee_id = e.employee_id
       LEFT JOIN departments d ON e.department_id = d.department_id
       WHERE u.employee_id = $1`,
      [employeeId]
    );
    return rows[0] || null;
  }

  static async validatePassword(user, password) {
    return bcrypt.compare(password, user.password_hash);
  }

  static isLocked(user) {
    if (!user.locked_until) return false;
    return new Date(user.locked_until) > new Date();
  }

  static async incrementLoginAttempts(userId) {
    const { rows } = await pool.query(
      'SELECT login_attempts FROM users WHERE id = $1',
      [userId]
    );
    const attempts = ((rows[0]?.login_attempts) || 0) + 1;

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOCK_DURATION_MS).toISOString();
      await pool.query(
        `UPDATE users SET login_attempts = $1, locked_until = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [attempts, lockedUntil, userId]
      );
    } else {
      await pool.query(
        `UPDATE users SET login_attempts = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [attempts, userId]
      );
    }
    return attempts;
  }

  static async resetLoginAttempts(userId) {
    await pool.query(
      `UPDATE users
       SET login_attempts = 0, locked_until = NULL, last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [userId]
    );
  }

  static async updatePassword(userId, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [passwordHash, userId]
    );
  }

  static async updateRole(userId, role) {
    await pool.query(
      `UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [role, userId]
    );
  }

  static async deactivate(userId) {
    await pool.query(
      `UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [userId]
    );
  }
}

module.exports = User;
