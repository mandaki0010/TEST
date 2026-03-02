require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const { AccessLog } = require('./models/Master');

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const masterRoutes = require('./routes/master');
const importRoutes = require('./routes/import');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 3001;

// セキュリティヘッダー
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS設定
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// レートリミット（ログイン）
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 10, // 最大10回
  message: { error: 'ログイン試行回数が多すぎます。しばらく待ってから再度お試しください' },
  standardHeaders: true,
  legacyHeaders: false
});

// レートリミット（API全体）
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分
  max: 100, // 最大100回
  message: { error: 'リクエストが多すぎます。しばらく待ってから再度お試しください' },
  standardHeaders: true,
  legacyHeaders: false
});

// ボディパーサー
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// アクセスログミドルウェア
app.use((req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;

    // APIエンドポイントのみログ記録
    if (req.path.startsWith('/api/')) {
      try {
        AccessLog.create({
          user_id: req.user?.id || null,
          endpoint: req.path,
          method: req.method,
          status_code: res.statusCode,
          response_time: responseTime,
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        });
      } catch (error) {
        // ログ記録エラーは無視
      }

      logger.info(`${req.method} ${req.path} ${res.statusCode} ${responseTime}ms`);
    }
  });

  next();
});

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ルート設定
app.use('/api/auth', loginLimiter, authRoutes);
app.use('/api/employees', apiLimiter, employeeRoutes);
app.use('/api/master', apiLimiter, masterRoutes);
app.use('/api/import', apiLimiter, importRoutes);
app.use('/api/reports', apiLimiter, reportRoutes);

// 404ハンドラー（APIのみ）
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'エンドポイントが見つかりません' });
});

// フロントエンド静的ファイルの配信
const frontendPath = path.join(__dirname, '../../public');
app.use(express.static(frontendPath));

// React SPA ルーティング（全ての非APIリクエストをindex.htmlへ）
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// エラーハンドラー
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);

  // Multerエラー
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'ファイルサイズが大きすぎます（最大5MB）' });
  }

  if (err.message === 'CSVファイルのみアップロード可能です') {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: '内部サーバーエラーが発生しました' });
});

// サーバー起動
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
