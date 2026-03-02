const Employee = require('../models/Employee');
const User = require('../models/User');
const { OperationLog } = require('../models/Master');
const logger = require('../utils/logger');

// 社員一覧取得
const getEmployees = async (req, res) => {
  try {
    const filters = {
      name: req.query.name,
      department_id: req.query.department_id ? parseInt(req.query.department_id) : null,
      position_id: req.query.position_id ? parseInt(req.query.position_id) : null,
      employment_status: req.query.employment_status || 'active',
      employment_type_id: req.query.employment_type_id
    };

    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sortBy: req.query.sortBy || 'last_name_kana',
      sortOrder: req.query.sortOrder || 'ASC'
    };

    const [employees, total] = await Promise.all([
      Employee.findAll(filters, options),
      Employee.count(filters)
    ]);
    const totalPages = Math.ceil(total / options.limit);

    res.json({
      data: employees,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    logger.error('Get employees error:', error);
    res.status(500).json({ error: '社員情報の取得中にエラーが発生しました' });
  }
};

// 社員詳細取得
const getEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({ error: '社員が見つかりません' });
    }

    res.json(employee);
  } catch (error) {
    logger.error('Get employee error:', error);
    res.status(500).json({ error: '社員情報の取得中にエラーが発生しました' });
  }
};

// 社員登録
const createEmployee = async (req, res) => {
  try {
    const data = req.body;

    const result = await Employee.create(data);

    // 操作ログ記録
    OperationLog.create({
      user_id: req.user.id,
      action: 'CREATE',
      target_table: 'employees',
      target_id: result.employee_id,
      new_value: data,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    logger.info(`Employee created: ${result.employee_id} by ${req.user.username}`);

    res.status(201).json({
      message: '社員を登録しました',
      employee_id: result.employee_id
    });
  } catch (error) {
    logger.error('Create employee error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: '登録に失敗しました。重複するデータが存在します' });
    }
    res.status(500).json({ error: '社員登録中にエラーが発生しました' });
  }
};

// 社員更新
const updateEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const data = req.body;

    // 既存データ取得（ログ用）
    const oldEmployee = await Employee.findById(employeeId);

    if (!oldEmployee) {
      return res.status(404).json({ error: '社員が見つかりません' });
    }

    const result = await Employee.update(employeeId, data);

    if (result.changes === 0) {
      return res.status(400).json({ error: '更新するデータがありません' });
    }

    // 操作ログ記録
    OperationLog.create({
      user_id: req.user.id,
      action: 'UPDATE',
      target_table: 'employees',
      target_id: employeeId,
      old_value: oldEmployee,
      new_value: data,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    logger.info(`Employee updated: ${employeeId} by ${req.user.username}`);

    res.json({ message: '社員情報を更新しました' });
  } catch (error) {
    logger.error('Update employee error:', error);
    res.status(500).json({ error: '社員情報の更新中にエラーが発生しました' });
  }
};

// 社員削除（退職処理）
const deleteEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({ error: '社員が見つかりません' });
    }

    if (employee.employment_status === 'retired') {
      return res.status(400).json({ error: 'この社員は既に退職処理されています' });
    }

    await Employee.delete(employeeId);

    // 関連するユーザーアカウントを無効化
    const user = await User.findByEmployeeId(employeeId);
    if (user) {
      await User.deactivate(user.id);
    }

    // 操作ログ記録
    OperationLog.create({
      user_id: req.user.id,
      action: 'DELETE',
      target_table: 'employees',
      target_id: employeeId,
      old_value: employee,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    logger.info(`Employee retired: ${employeeId} by ${req.user.username}`);

    res.json({ message: '退職処理を完了しました' });
  } catch (error) {
    logger.error('Delete employee error:', error);
    res.status(500).json({ error: '退職処理中にエラーが発生しました' });
  }
};

// 統計情報取得
const getStatistics = async (req, res) => {
  try {
    const stats = await Employee.getStatistics();
    res.json(stats);
  } catch (error) {
    logger.error('Get statistics error:', error);
    res.status(500).json({ error: '統計情報の取得中にエラーが発生しました' });
  }
};

// 自分の情報取得
const getMyInfo = async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.employeeId);

    if (!employee) {
      return res.status(404).json({ error: '社員情報が見つかりません' });
    }

    res.json(employee);
  } catch (error) {
    logger.error('Get my info error:', error);
    res.status(500).json({ error: '社員情報の取得中にエラーが発生しました' });
  }
};

// 自分の情報更新
const updateMyInfo = async (req, res) => {
  try {
    const data = req.body;

    // 自分で変更可能なフィールドのみ許可
    const allowedFields = ['email', 'phone', 'postal_code', 'prefecture', 'city', 'address_line1', 'address_line2'];
    const filteredData = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        filteredData[field] = data[field];
      }
    }

    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({ error: '更新するデータがありません' });
    }

    const oldEmployee = await Employee.findById(req.user.employeeId);
    const result = await Employee.update(req.user.employeeId, filteredData);

    if (result.changes === 0) {
      return res.status(400).json({ error: '更新に失敗しました' });
    }

    // 操作ログ記録
    OperationLog.create({
      user_id: req.user.id,
      action: 'UPDATE_SELF',
      target_table: 'employees',
      target_id: req.user.employeeId,
      old_value: oldEmployee,
      new_value: filteredData,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    logger.info(`Employee self-updated: ${req.user.employeeId}`);

    res.json({ message: '情報を更新しました' });
  } catch (error) {
    logger.error('Update my info error:', error);
    res.status(500).json({ error: '情報の更新中にエラーが発生しました' });
  }
};

module.exports = {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getStatistics,
  getMyInfo,
  updateMyInfo
};
