const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const Employee = require('../models/Employee');
const { Department, Position, OperationLog } = require('../models/Master');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

// 日本語フォントパス（システムフォントを使用）
const fontPath = '/usr/share/fonts/truetype/fonts-japanese-gothic.ttf';
const fallbackFontPath = path.join(__dirname, '../../assets/fonts/NotoSansJP-Regular.ttf');

// 社員名簿出力（Excel）
const exportEmployeeListExcel = (req, res) => {
  try {
    const filters = {
      name: req.query.name,
      department_id: req.query.department_id ? parseInt(req.query.department_id) : null,
      employment_status: req.query.employment_status || 'active'
    };

    const employees = Employee.findAll(filters, { limit: 1000, sortBy: 'last_name_kana' });

    const data = employees.map(emp => ({
      '社員番号': emp.employee_id,
      '氏名': `${emp.last_name} ${emp.first_name}`,
      'ふりがな': `${emp.last_name_kana} ${emp.first_name_kana}`,
      '所属部署': emp.department_name || '',
      '役職': emp.position_name || '',
      '入社日': emp.hire_date || '',
      'メールアドレス': emp.email || '',
      '電話番号': emp.phone || '',
      '雇用形態': emp.employment_type_name || '',
      '在籍状況': emp.employment_status === 'active' ? '在籍中' : '退職'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '社員名簿');

    // 列幅設定
    ws['!cols'] = [
      { wch: 10 }, // 社員番号
      { wch: 15 }, // 氏名
      { wch: 15 }, // ふりがな
      { wch: 15 }, // 所属部署
      { wch: 10 }, // 役職
      { wch: 12 }, // 入社日
      { wch: 25 }, // メールアドレス
      { wch: 15 }, // 電話番号
      { wch: 10 }, // 雇用形態
      { wch: 8 }   // 在籍状況
    ];

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    OperationLog.create({
      user_id: req.user.id,
      action: 'EXPORT',
      target_table: 'employees',
      target_id: 'employee_list_excel',
      new_value: { count: employees.length },
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="employee_list.xlsx"');
    res.send(buffer);
  } catch (error) {
    logger.error('Export employee list Excel error:', error);
    res.status(500).json({ error: '帳票出力中にエラーが発生しました' });
  }
};

// 社員名簿出力（PDF）
const exportEmployeeListPDF = (req, res) => {
  try {
    const filters = {
      name: req.query.name,
      department_id: req.query.department_id ? parseInt(req.query.department_id) : null,
      employment_status: req.query.employment_status || 'active'
    };

    const employees = Employee.findAll(filters, { limit: 500, sortBy: 'last_name_kana' });

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="employee_list.pdf"');

    doc.pipe(res);

    // タイトル
    doc.fontSize(18).text('Employee List', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString('ja-JP')}`, { align: 'right' });
    doc.moveDown();

    // テーブルヘッダー
    const headers = ['ID', 'Name', 'Department', 'Position', 'Hire Date'];
    const colWidths = [60, 120, 100, 80, 80];
    let y = doc.y;

    doc.fontSize(9).font('Helvetica-Bold');
    let x = 50;
    headers.forEach((header, i) => {
      doc.text(header, x, y, { width: colWidths[i] });
      x += colWidths[i];
    });

    doc.moveDown();
    doc.font('Helvetica');

    // データ行
    employees.forEach(emp => {
      y = doc.y;

      if (y > 750) {
        doc.addPage();
        y = 50;
      }

      x = 50;
      const row = [
        emp.employee_id,
        `${emp.last_name} ${emp.first_name}`,
        emp.department_name || '-',
        emp.position_name || '-',
        emp.hire_date || '-'
      ];

      row.forEach((cell, i) => {
        doc.text(String(cell).substring(0, 20), x, y, { width: colWidths[i] });
        x += colWidths[i];
      });

      doc.moveDown(0.5);
    });

    // フッター
    doc.moveDown(2);
    doc.fontSize(8).text(`Total: ${employees.length} employees`, { align: 'right' });

    doc.end();

    OperationLog.create({
      user_id: req.user.id,
      action: 'EXPORT',
      target_table: 'employees',
      target_id: 'employee_list_pdf',
      new_value: { count: employees.length },
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });
  } catch (error) {
    logger.error('Export employee list PDF error:', error);
    res.status(500).json({ error: '帳票出力中にエラーが発生しました' });
  }
};

// 部署別名簿出力（Excel）
const exportDepartmentListExcel = (req, res) => {
  try {
    const departments = Department.findAll();
    const wb = XLSX.utils.book_new();

    departments.forEach(dept => {
      const employees = Employee.findAll(
        { department_id: dept.department_id, employment_status: 'active' },
        { limit: 500, sortBy: 'last_name_kana' }
      );

      if (employees.length === 0) return;

      const data = employees.map(emp => ({
        '社員番号': emp.employee_id,
        '氏名': `${emp.last_name} ${emp.first_name}`,
        '役職': emp.position_name || '',
        '入社日': emp.hire_date || '',
        'メールアドレス': emp.email || '',
        '電話番号': emp.phone || ''
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      // シート名は31文字以内、特殊文字除去
      const sheetName = dept.department_name.substring(0, 31).replace(/[\\/*?:\[\]]/g, '');
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    OperationLog.create({
      user_id: req.user.id,
      action: 'EXPORT',
      target_table: 'employees',
      target_id: 'department_list_excel',
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="department_list.xlsx"');
    res.send(buffer);
  } catch (error) {
    logger.error('Export department list Excel error:', error);
    res.status(500).json({ error: '帳票出力中にエラーが発生しました' });
  }
};

// 組織図出力（PDF）
const exportOrganizationChartPDF = (req, res) => {
  try {
    const hierarchy = Department.getHierarchy();
    const positions = Position.findAll();

    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="organization_chart.pdf"');

    doc.pipe(res);

    // タイトル
    doc.fontSize(20).text('Organization Chart', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString('ja-JP')}`, { align: 'right' });
    doc.moveDown(2);

    // 組織図描画
    const drawDepartment = (dept, level = 0, x = 60, y = doc.y) => {
      const boxWidth = 150;
      const boxHeight = 30;
      const padding = 10;

      // 部署ボックス
      doc.rect(x, y, boxWidth, boxHeight).stroke();
      doc.fontSize(10).text(dept.department_name, x + 5, y + 10, { width: boxWidth - 10 });

      // 所属人数を取得
      const count = Employee.count({ department_id: dept.department_id, employment_status: 'active' });
      doc.fontSize(8).text(`(${count})`, x + boxWidth - 30, y + 10);

      let nextY = y + boxHeight + 20;

      // 子部署を描画
      if (dept.children && dept.children.length > 0) {
        dept.children.forEach((child, index) => {
          drawDepartment(child, level + 1, x + 40, nextY);
          nextY += 50;
        });
      }

      return nextY;
    };

    let currentY = doc.y;
    hierarchy.forEach(dept => {
      if (currentY > 450) {
        doc.addPage();
        currentY = 50;
      }
      currentY = drawDepartment(dept, 0, 60, currentY);
    });

    doc.end();

    OperationLog.create({
      user_id: req.user.id,
      action: 'EXPORT',
      target_table: 'departments',
      target_id: 'organization_chart_pdf',
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });
  } catch (error) {
    logger.error('Export organization chart PDF error:', error);
    res.status(500).json({ error: '帳票出力中にエラーが発生しました' });
  }
};

// 在籍者リスト出力（Excel）
const exportActiveEmployeesExcel = (req, res) => {
  try {
    const employees = Employee.findAll(
      { employment_status: 'active' },
      { limit: 1000, sortBy: 'last_name_kana' }
    );

    const data = employees.map(emp => ({
      '社員番号': emp.employee_id,
      '氏名': `${emp.last_name} ${emp.first_name}`,
      'ふりがな': `${emp.last_name_kana} ${emp.first_name_kana}`,
      '所属部署': emp.department_name || '',
      '役職': emp.position_name || '',
      '入社日': emp.hire_date || '',
      'メールアドレス': emp.email || '',
      '電話番号': emp.phone || '',
      '雇用形態': emp.employment_type_name || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '在籍者リスト');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    OperationLog.create({
      user_id: req.user.id,
      action: 'EXPORT',
      target_table: 'employees',
      target_id: 'active_employees_excel',
      new_value: { count: employees.length },
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="active_employees.xlsx"');
    res.send(buffer);
  } catch (error) {
    logger.error('Export active employees Excel error:', error);
    res.status(500).json({ error: '帳票出力中にエラーが発生しました' });
  }
};

module.exports = {
  exportEmployeeListExcel,
  exportEmployeeListPDF,
  exportDepartmentListExcel,
  exportOrganizationChartPDF,
  exportActiveEmployeesExcel
};
