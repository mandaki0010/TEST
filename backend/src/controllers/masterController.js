const { Department, Position, EmploymentType, OperationLog } = require('../models/Master');
const logger = require('../utils/logger');

// 部署一覧取得
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll();
    res.json(departments);
  } catch (error) {
    logger.error('Get departments error:', error);
    res.status(500).json({ error: '部署情報の取得中にエラーが発生しました' });
  }
};

// 部署階層取得
const getDepartmentHierarchy = async (req, res) => {
  try {
    const hierarchy = await Department.getHierarchy();
    res.json(hierarchy);
  } catch (error) {
    logger.error('Get department hierarchy error:', error);
    res.status(500).json({ error: '組織階層の取得中にエラーが発生しました' });
  }
};

// 部署登録
const createDepartment = async (req, res) => {
  try {
    const { department_name, parent_department_id, sort_order } = req.body;

    if (!department_name) {
      return res.status(400).json({ error: '部署名は必須です' });
    }

    const result = await Department.create({
      department_name,
      parent_department_id,
      sort_order
    });

    OperationLog.create({
      user_id: req.user.id,
      action: 'CREATE',
      target_table: 'departments',
      target_id: String(result.department_id),
      new_value: req.body,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    logger.info(`Department created: ${department_name} by ${req.user.username}`);

    res.status(201).json({
      message: '部署を登録しました',
      department_id: result.department_id
    });
  } catch (error) {
    logger.error('Create department error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'この部署名は既に使用されています' });
    }
    res.status(500).json({ error: '部署登録中にエラーが発生しました' });
  }
};

// 部署更新
const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { department_name, parent_department_id, sort_order } = req.body;

    const existing = await Department.findById(id);
    if (!existing) {
      return res.status(404).json({ error: '部署が見つかりません' });
    }

    await Department.update(id, {
      department_name: department_name || existing.department_name,
      parent_department_id,
      sort_order: sort_order ?? existing.sort_order
    });

    OperationLog.create({
      user_id: req.user.id,
      action: 'UPDATE',
      target_table: 'departments',
      target_id: id,
      old_value: existing,
      new_value: req.body,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    logger.info(`Department updated: ${id} by ${req.user.username}`);

    res.json({ message: '部署情報を更新しました' });
  } catch (error) {
    logger.error('Update department error:', error);
    res.status(500).json({ error: '部署更新中にエラーが発生しました' });
  }
};

// 役職一覧取得
const getPositions = async (req, res) => {
  try {
    const positions = await Position.findAll();
    res.json(positions);
  } catch (error) {
    logger.error('Get positions error:', error);
    res.status(500).json({ error: '役職情報の取得中にエラーが発生しました' });
  }
};

// 雇用形態一覧取得
const getEmploymentTypes = async (req, res) => {
  try {
    const types = await EmploymentType.findAll();
    res.json(types);
  } catch (error) {
    logger.error('Get employment types error:', error);
    res.status(500).json({ error: '雇用形態情報の取得中にエラーが発生しました' });
  }
};

// 操作ログ取得
const getOperationLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = await OperationLog.findRecent(limit);
    res.json(logs);
  } catch (error) {
    logger.error('Get operation logs error:', error);
    res.status(500).json({ error: '操作ログの取得中にエラーが発生しました' });
  }
};

module.exports = {
  getDepartments,
  getDepartmentHierarchy,
  createDepartment,
  updateDepartment,
  getPositions,
  getEmploymentTypes,
  getOperationLogs
};
