const User = require('../models/User');
const { OperationLog } = require('../models/Master');
const { generateToken } = require('../middlewares/auth');
const logger = require('../utils/logger');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findByUsername(username);

    if (!user) {
      logger.warn(`Login attempt with unknown username: ${username}`);
      return res.status(401).json({ error: 'ユーザー名またはパスワードが正しくありません' });
    }
    if (!user.is_active) {
      logger.warn(`Login attempt with inactive account: ${username}`);
      return res.status(401).json({ error: 'アカウントが無効になっています' });
    }
    if (User.isLocked(user)) {
      return res.status(423).json({ error: 'アカウントがロックされています', lockedUntil: new Date(user.locked_until).toISOString() });
    }

    const isValidPassword = await User.validatePassword(user, password);
    if (!isValidPassword) {
      const attempts = await User.incrementLoginAttempts(user.id);
      const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
      const remaining = maxAttempts - attempts;
      if (remaining <= 0) return res.status(423).json({ error: 'ログイン試行回数を超えました。15分後に再度お試しください' });
      return res.status(401).json({ error: 'ユーザー名またはパスワードが正しくありません', remainingAttempts: remaining });
    }

    await User.resetLoginAttempts(user.id);
    const token = generateToken(user);
    OperationLog.create({ user_id: user.id, action: 'LOGIN', target_table: 'users', target_id: user.employee_id, ip_address: req.ip, user_agent: req.headers['user-agent'] });
    logger.info(`User logged in: ${username}`);

    res.json({ message: 'ログインに成功しました', token, user: { id: user.id, employeeId: user.employee_id, username: user.username, role: user.role, lastName: user.last_name, firstName: user.first_name, email: user.email, departmentName: user.department_name } });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'ログイン処理中にエラーが発生しました' });
  }
};

const logout = async (req, res) => {
  try {
    OperationLog.create({ user_id: req.user.id, action: 'LOGOUT', target_table: 'users', target_id: req.user.employeeId, ip_address: req.ip, user_agent: req.headers['user-agent'] });
    logger.info(`User logged out: ${req.user.username}`);
    res.json({ message: 'ログアウトしました' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'ログアウト処理中にエラーが発生しました' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'ユーザーが見つかりません' });
    res.json({ id: user.id, employeeId: user.employee_id, username: user.username, role: user.role, lastName: user.last_name, firstName: user.first_name, email: user.email, departmentName: user.department_name });
  } catch (error) {
    logger.error('Get me error:', error);
    res.status(500).json({ error: 'ユーザー情報の取得中にエラーが発生しました' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'ユーザーが見つかりません' });
    const isValidPassword = await User.validatePassword(user, currentPassword);
    if (!isValidPassword) return res.status(400).json({ error: '現在のパスワードが正しくありません' });
    await User.updatePassword(req.user.id, newPassword);
    OperationLog.create({ user_id: req.user.id, action: 'CHANGE_PASSWORD', target_table: 'users', target_id: req.user.employeeId, ip_address: req.ip, user_agent: req.headers['user-agent'] });
    logger.info(`Password changed for user: ${req.user.username}`);
    res.json({ message: 'パスワードを変更しました' });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ error: 'パスワード変更中にエラーが発生しました' });
  }
};

module.exports = { login, logout, getMe, changePassword };
