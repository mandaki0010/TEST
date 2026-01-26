const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middlewares/auth');

// 全ルートで認証必須
router.use(authenticate);

// 社員名簿（Excel）
router.get('/employees/excel', reportController.exportEmployeeListExcel);

// 社員名簿（PDF）
router.get('/employees/pdf', reportController.exportEmployeeListPDF);

// 部署別名簿（Excel）
router.get('/departments/excel', reportController.exportDepartmentListExcel);

// 組織図（PDF）
router.get('/organization/pdf', reportController.exportOrganizationChartPDF);

// 在籍者リスト（Excel）
router.get('/active/excel', reportController.exportActiveEmployeesExcel);

module.exports = router;
