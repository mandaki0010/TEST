const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterController');
const { authenticate, requireAdmin } = require('../middlewares/auth');

// 全ルートで認証必須
router.use(authenticate);

// 部署一覧
router.get('/departments', masterController.getDepartments);

// 部署階層
router.get('/departments/hierarchy', masterController.getDepartmentHierarchy);

// 部署登録（管理者のみ）
router.post('/departments', requireAdmin, masterController.createDepartment);

// 部署更新（管理者のみ）
router.put('/departments/:id', requireAdmin, masterController.updateDepartment);

// 役職一覧
router.get('/positions', masterController.getPositions);

// 雇用形態一覧
router.get('/employment-types', masterController.getEmploymentTypes);

// 操作ログ（管理者のみ）
router.get('/logs', requireAdmin, masterController.getOperationLogs);

module.exports = router;
