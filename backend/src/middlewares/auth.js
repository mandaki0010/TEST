const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

// JWT認証ミドルウェア
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '認証が必要です' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = User.findById(decoded.userId);

    if (!user || !user.is_active) {
      return res.status(401).json({ error: '無効なトークンです' });
    }

    req.user = {
      id: user.id,
      employeeId: user.employee_id,
      username: user.username,
      role: user.role,
      lastName: user.last_name,
      firstName: user.first_name,
      departmentId: user.department_id,
      departmentName: user.department_name
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'セッションが期限切れです。再度ログインしてください' });
    }
    return res.status(401).json({ error: '無効なトークンです' });
  }
};

// 管理者権限チェックミドルウェア
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'この操作には管理者権限が必要です' });
  }
  next();
};

// 自身または管理者のみアクセス可能
const requireSelfOrAdmin = (req, res, next) => {
  const targetEmployeeId = req.params.employeeId || req.body.employee_id;

  if (req.user.role !== 'admin' && req.user.employeeId !== targetEmployeeId) {
    return res.status(403).json({ error: 'アクセス権限がありません' });
  }
  next();
};

// JWTトークン生成
const generateToken = (user) => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '30m';
  return jwt.sign(
    {
      userId: user.id,
      employeeId: user.employee_id,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn }
  );
};

module.exports = {
  authenticate,
  requireAdmin,
  requireSelfOrAdmin,
  generateToken
};
