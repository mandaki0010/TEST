const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticate, requireAdmin, requireSelfOrAdmin } = require('../middlewares/auth');
const {
  employeeValidation,
  employeeUpdateValidation,
  searchValidation,
  validate
} = require('../middlewares/validator');

// 全ルートで認証必須
router.use(authenticate);

// マイページ（自分の情報）
router.get('/me', employeeController.getMyInfo);
router.put('/me', employeeController.updateMyInfo);

// 統計情報
router.get('/statistics', employeeController.getStatistics);

// 社員一覧（検索）
router.get('/', searchValidation, validate, employeeController.getEmployees);

// 社員詳細
router.get('/:employeeId', employeeController.getEmployee);

// 社員登録（管理者のみ）
router.post('/', requireAdmin, employeeValidation, validate, employeeController.createEmployee);

// 社員更新（管理者のみ）
router.put('/:employeeId', requireAdmin, employeeUpdateValidation, validate, employeeController.updateEmployee);

// 社員削除/退職処理（管理者のみ）
router.delete('/:employeeId', requireAdmin, employeeController.deleteEmployee);

module.exports = router;
