const express = require('express');
const router = express.Router();
const multer = require('multer');
const importController = require('../controllers/importController');
const { authenticate, requireAdmin } = require('../middlewares/auth');

// Multer設定（メモリストレージ）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('CSVファイルのみアップロード可能です'), false);
    }
  }
});

// 全ルートで認証必須
router.use(authenticate);

// CSVテンプレートダウンロード
router.get('/template', importController.getCSVTemplate);

// CSV一括登録（管理者のみ）
router.post('/csv', requireAdmin, upload.single('file'), importController.uploadCSV);

module.exports = router;
