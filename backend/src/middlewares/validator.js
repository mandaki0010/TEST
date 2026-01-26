const { body, query, validationResult } = require('express-validator');

// バリデーション結果チェック
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: '入力値が不正です',
      details: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

// ログインバリデーション
const loginValidation = [
  body('username')
    .notEmpty().withMessage('ユーザー名は必須です')
    .isLength({ max: 50 }).withMessage('ユーザー名は50文字以内で入力してください'),
  body('password')
    .notEmpty().withMessage('パスワードは必須です')
];

// パスワード変更バリデーション
const passwordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('現在のパスワードは必須です'),
  body('newPassword')
    .notEmpty().withMessage('新しいパスワードは必須です')
    .isLength({ min: 8 }).withMessage('パスワードは8文字以上で入力してください')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/).withMessage('パスワードは英字、数字、記号を含める必要があります')
];

// 社員登録バリデーション
const employeeValidation = [
  body('last_name')
    .notEmpty().withMessage('姓は必須です')
    .isLength({ max: 20 }).withMessage('姓は20文字以内で入力してください'),
  body('first_name')
    .notEmpty().withMessage('名は必須です')
    .isLength({ max: 20 }).withMessage('名は20文字以内で入力してください'),
  body('last_name_kana')
    .notEmpty().withMessage('姓(ふりがな)は必須です')
    .isLength({ max: 40 }).withMessage('姓(ふりがな)は40文字以内で入力してください')
    .matches(/^[ぁ-んー]+$/).withMessage('姓(ふりがな)はひらがなで入力してください'),
  body('first_name_kana')
    .notEmpty().withMessage('名(ふりがな)は必須です')
    .isLength({ max: 40 }).withMessage('名(ふりがな)は40文字以内で入力してください')
    .matches(/^[ぁ-んー]+$/).withMessage('名(ふりがな)はひらがなで入力してください'),
  body('department_id')
    .notEmpty().withMessage('所属部署は必須です')
    .isInt({ min: 1 }).withMessage('有効な部署を選択してください'),
  body('hire_date')
    .notEmpty().withMessage('入社日は必須です')
    .isISO8601().withMessage('入社日の形式が不正です'),
  body('employment_type_id')
    .notEmpty().withMessage('雇用形態は必須です')
    .isInt({ min: 1 }).withMessage('有効な雇用形態を選択してください'),
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail().withMessage('メールアドレスの形式が不正です')
    .isLength({ max: 100 }).withMessage('メールアドレスは100文字以内で入力してください'),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^[\d-]+$/).withMessage('電話番号の形式が不正です')
    .isLength({ max: 15 }).withMessage('電話番号は15文字以内で入力してください'),
  body('birth_date')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage('生年月日の形式が不正です'),
  body('postal_code')
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^\d{3}-?\d{4}$/).withMessage('郵便番号の形式が不正です'),
  body('employment_status')
    .optional()
    .isIn(['active', 'retired']).withMessage('在籍状況が不正です')
];

// 社員更新バリデーション（オプショナル）
const employeeUpdateValidation = [
  body('last_name')
    .optional()
    .isLength({ max: 20 }).withMessage('姓は20文字以内で入力してください'),
  body('first_name')
    .optional()
    .isLength({ max: 20 }).withMessage('名は20文字以内で入力してください'),
  body('last_name_kana')
    .optional()
    .isLength({ max: 40 }).withMessage('姓(ふりがな)は40文字以内で入力してください')
    .matches(/^[ぁ-んー]+$/).withMessage('姓(ふりがな)はひらがなで入力してください'),
  body('first_name_kana')
    .optional()
    .isLength({ max: 40 }).withMessage('名(ふりがな)は40文字以内で入力してください')
    .matches(/^[ぁ-んー]+$/).withMessage('名(ふりがな)はひらがなで入力してください'),
  body('department_id')
    .optional()
    .isInt({ min: 1 }).withMessage('有効な部署を選択してください'),
  body('hire_date')
    .optional()
    .isISO8601().withMessage('入社日の形式が不正です'),
  body('employment_type_id')
    .optional()
    .isInt({ min: 1 }).withMessage('有効な雇用形態を選択してください'),
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail().withMessage('メールアドレスの形式が不正です')
    .isLength({ max: 100 }).withMessage('メールアドレスは100文字以内で入力してください'),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^[\d-]+$/).withMessage('電話番号の形式が不正です'),
  body('birth_date')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage('生年月日の形式が不正です'),
  body('postal_code')
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^\d{3}-?\d{4}$/).withMessage('郵便番号の形式が不正です'),
  body('employment_status')
    .optional()
    .isIn(['active', 'retired']).withMessage('在籍状況が不正です')
];

// 検索パラメータバリデーション
const searchValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('ページ番号は1以上の整数で指定してください'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('表示件数は1-100の範囲で指定してください'),
  query('sortBy')
    .optional()
    .isIn(['last_name_kana', 'employee_id', 'department_id', 'hire_date']).withMessage('ソート項目が不正です'),
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc']).withMessage('ソート順序が不正です')
];

module.exports = {
  validate,
  loginValidation,
  passwordValidation,
  employeeValidation,
  employeeUpdateValidation,
  searchValidation
};
