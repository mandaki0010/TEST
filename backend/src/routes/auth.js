const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const { loginValidation, passwordValidation, validate } = require('../middlewares/validator');

// ログイン
router.post('/login', loginValidation, validate, authController.login);

// ログアウト
router.post('/logout', authenticate, authController.logout);

// 現在のユーザー情報取得
router.get('/me', authenticate, authController.getMe);

// パスワード変更
router.put('/password', authenticate, passwordValidation, validate, authController.changePassword);

module.exports = router;
