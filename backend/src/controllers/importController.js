const { parse } = require('csv-parse/sync');
const Employee = require('../models/Employee');
const User = require('../models/User');
const { Department, EmploymentType, Position, OperationLog } = require('../models/Master');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

// CSVアップロード処理
const uploadCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'CSVファイルがアップロードされていません' });
    }

    const content = req.file.buffer.toString('utf-8');

    // BOM除去
    const cleanContent = content.replace(/^\uFEFF/, '');

    let records;
    try {
      records = parse(cleanContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true
      });
    } catch (parseError) {
      return res.status(400).json({ error: 'CSVファイルの形式が不正です', details: parseError.message });
    }

    if (records.length === 0) {
      return res.status(400).json({ error: 'CSVファイルにデータがありません' });
    }

    // マスタデータ取得
    const [departments, employmentTypes, positions] = await Promise.all([
      Department.findAll(),
      EmploymentType.findAll(),
      Position.findAll()
    ]);

    const deptMap = new Map(departments.map(d => [d.department_name, d.department_id]));
    const etMap = new Map(employmentTypes.map(e => [e.type_name, e.type_id]));
    const posMap = new Map(positions.map(p => [p.position_name, p.position_id]));

    const errors = [];
    const validRecords = [];

    // 各行を検証
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2; // ヘッダー行を考慮
      const rowErrors = [];

      // 必須項目チェック
      if (!row['姓']) rowErrors.push('姓は必須です');
      if (!row['名']) rowErrors.push('名は必須です');
      if (!row['姓（ふりがな）']) rowErrors.push('姓（ふりがな）は必須です');
      if (!row['名（ふりがな）']) rowErrors.push('名（ふりがな）は必須です');
      if (!row['所属部署']) rowErrors.push('所属部署は必須です');
      if (!row['入社日']) rowErrors.push('入社日は必須です');
      if (!row['雇用形態']) rowErrors.push('雇用形態は必須です');

      // ふりがなチェック
      if (row['姓（ふりがな）'] && !/^[ぁ-んー]+$/.test(row['姓（ふりがな）'])) {
        rowErrors.push('姓（ふりがな）はひらがなで入力してください');
      }
      if (row['名（ふりがな）'] && !/^[ぁ-んー]+$/.test(row['名（ふりがな）'])) {
        rowErrors.push('名（ふりがな）はひらがなで入力してください');
      }

      // 部署チェック
      const departmentId = deptMap.get(row['所属部署']);
      if (row['所属部署'] && !departmentId) {
        rowErrors.push(`所属部署「${row['所属部署']}」が存在しません`);
      }

      // 雇用形態チェック
      const employmentTypeId = etMap.get(row['雇用形態']);
      if (row['雇用形態'] && !employmentTypeId) {
        rowErrors.push(`雇用形態「${row['雇用形態']}」が存在しません`);
      }

      // 役職チェック（任意）
      let positionId = null;
      if (row['役職']) {
        positionId = posMap.get(row['役職']);
        if (!positionId) {
          rowErrors.push(`役職「${row['役職']}」が存在しません`);
        }
      }

      // 日付形式チェック
      if (row['入社日'] && !/^\d{4}-\d{2}-\d{2}$/.test(row['入社日'])) {
        rowErrors.push('入社日はYYYY-MM-DD形式で入力してください');
      }
      if (row['生年月日'] && !/^\d{4}-\d{2}-\d{2}$/.test(row['生年月日'])) {
        rowErrors.push('生年月日はYYYY-MM-DD形式で入力してください');
      }

      // メールアドレス形式チェック
      if (row['メールアドレス'] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row['メールアドレス'])) {
        rowErrors.push('メールアドレスの形式が不正です');
      }

      // 電話番号形式チェック
      if (row['電話番号'] && !/^[\d-]+$/.test(row['電話番号'])) {
        rowErrors.push('電話番号の形式が不正です');
      }

      // 郵便番号形式チェック
      if (row['郵便番号'] && !/^\d{3}-?\d{4}$/.test(row['郵便番号'])) {
        rowErrors.push('郵便番号の形式が不正です');
      }

      if (rowErrors.length > 0) {
        errors.push({ row: rowNum, errors: rowErrors });
      } else {
        validRecords.push({
          last_name: row['姓'],
          first_name: row['名'],
          last_name_kana: row['姓（ふりがな）'],
          first_name_kana: row['名（ふりがな）'],
          department_id: departmentId,
          position_id: positionId,
          hire_date: row['入社日'],
          email: row['メールアドレス'] || null,
          phone: row['電話番号'] || null,
          birth_date: row['生年月日'] || null,
          postal_code: row['郵便番号'] || null,
          prefecture: row['都道府県'] || null,
          city: row['市区町村'] || null,
          address_line1: row['番地'] || null,
          address_line2: row['建物名'] || null,
          employment_type_id: employmentTypeId,
          employment_status: 'active'
        });
      }
    }

    // エラーがあれば登録を中止
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'CSVファイルにエラーがあります',
        errorCount: errors.length,
        details: errors.slice(0, 20) // 最大20件まで
      });
    }

    // 登録処理
    const results = {
      success: 0,
      failed: 0,
      employees: []
    };

    for (const record of validRecords) {
      try {
        const result = await Employee.create(record);
        results.success++;
        results.employees.push(result.employee_id);

        // ユーザーアカウント作成（メールアドレスがある場合）
        if (record.email) {
          const username = record.email.split('@')[0];
          const defaultPassword = 'password123';
          try {
            await User.create({
              employee_id: result.employee_id,
              username,
              password: defaultPassword,
              role: 'employee'
            });
          } catch (userError) {
            logger.warn(`Failed to create user account for ${result.employee_id}: ${userError.message}`);
          }
        }
      } catch (createError) {
        logger.error(`CSV import error for row: ${createError.message}`);
        results.failed++;
      }
    }

    // 操作ログ記録
    OperationLog.create({
      user_id: req.user.id,
      action: 'CSV_IMPORT',
      target_table: 'employees',
      target_id: null,
      new_value: { successCount: results.success, failedCount: results.failed },
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    logger.info(`CSV import completed: ${results.success} success, ${results.failed} failed by ${req.user.username}`);

    res.json({
      message: 'CSV一括登録が完了しました',
      success: results.success,
      failed: results.failed,
      employees: results.employees
    });
  } catch (error) {
    logger.error('CSV upload error:', error);
    res.status(500).json({ error: 'CSV一括登録中にエラーが発生しました' });
  }
};

// CSVテンプレート取得
const getCSVTemplate = (req, res) => {
  const headers = [
    '姓',
    '名',
    '姓（ふりがな）',
    '名（ふりがな）',
    '所属部署',
    '役職',
    '入社日',
    'メールアドレス',
    '電話番号',
    '生年月日',
    '郵便番号',
    '都道府県',
    '市区町村',
    '番地',
    '建物名',
    '雇用形態'
  ];

  const sampleData = [
    '山田',
    '太郎',
    'やまだ',
    'たろう',
    '開発部',
    '主任',
    '2024-04-01',
    'yamada@example.com',
    '090-1234-5678',
    '1990-01-15',
    '100-0001',
    '東京都',
    '千代田区',
    '丸の内1-1-1',
    '○○ビル3F',
    '正社員'
  ];

  // BOM付きUTF-8
  const bom = '\uFEFF';
  const csv = bom + headers.join(',') + '\n' + sampleData.join(',') + '\n';

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="employee_template.csv"');
  res.send(csv);
};

module.exports = {
  uploadCSV,
  getCSVTemplate
};
