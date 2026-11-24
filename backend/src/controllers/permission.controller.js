const Permission = require('../models/Permission');

const ROLES = ['owner', 'admin', 'technician', 'support', 'accountant', 'receptionist', 'customer'];
const MODULES = ['dashboard', 'vehicles', 'bookings', 'contracts', 'customers', 'payments', 'reports', 'maintenance', 'tickets', 'users', 'settings'];

const DEFAULTS = {
  owner: { view: true, create: true, update: true, delete: true },
  admin: { view: true, create: true, update: true, delete: true },
  technician: { view: false, create: false, update: false, delete: false },
  support: { view: false, create: false, update: false, delete: false },
  accountant: { view: false, create: false, update: false, delete: false },
  receptionist: { view: false, create: false, update: false, delete: false },
  customer: { view: false, create: false, update: false, delete: false },
};

const enable = (role, modules, actions = ['view']) => {
  modules.forEach(module => actions.forEach(action => { DEFAULTS[role][`${module}.${action}`] = true; }));
};
// Staff defaults: keep the current business flow while allowing owners/admins to customize it later.
enable('technician', ['vehicles', 'maintenance'], ['view', 'create', 'update']);
enable('support', ['bookings', 'tickets', 'customers'], ['view', 'create', 'update']);
enable('accountant', ['dashboard', 'payments', 'reports'], ['view', 'update']);
enable('receptionist', ['dashboard', 'vehicles', 'bookings', 'contracts', 'customers', 'payments'], ['view', 'create', 'update']);

function defaultPermission(role, module) {
  if (['owner', 'admin'].includes(role)) return { ...DEFAULTS[role] };
  const result = { view: false, create: false, update: false, delete: false };
  ['view', 'create', 'update', 'delete'].forEach(action => { result[action] = Boolean(DEFAULTS[role][`${module}.${action}`]); });
  return result;
}

exports.getMatrix = async (req, res) => {
  try {
    const existing = await Permission.find().lean();
    const map = new Map(existing.map(item => [`${item.role}.${item.module}`, item]));
    const data = ROLES.map(role => ({
      role,
      permissions: MODULES.map(module => ({ module, ...(map.get(`${role}.${module}`) || defaultPermission(role, module)) })),
    }));
    res.json({ success: true, roles: ROLES, modules: MODULES, data });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getMyPermissions = async (req, res) => {
  try {
    const existing = await Permission.find({ role: req.user.role }).lean();
    const map = new Map(existing.map(item => [item.module, item]));
    const permissions = Object.fromEntries(MODULES.map(module => [module, map.get(module) || defaultPermission(req.user.role, module)]));
    res.json({ success: true, role: req.user.role, permissions });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.updateRole = async (req, res) => {
  try {
    const { role } = req.params;
    if (!ROLES.includes(role)) return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ.' });
    const permissions = req.body.permissions || {};
    await Promise.all(MODULES.map(module => Permission.findOneAndUpdate(
      { role, module },
      { role, module, view: Boolean(permissions[module]?.view), create: Boolean(permissions[module]?.create), update: Boolean(permissions[module]?.update), delete: Boolean(permissions[module]?.delete) },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )));
    res.json({ success: true, message: 'Đã lưu ma trận phân quyền.' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.ROLES = ROLES;
exports.MODULES = MODULES;
