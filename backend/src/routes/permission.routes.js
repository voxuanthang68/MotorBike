const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/permission.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/me', protect, ctrl.getMyPermissions);
router.get('/', protect, authorize('owner', 'admin'), ctrl.getMatrix);
router.put('/:role', protect, authorize('owner', 'admin'), ctrl.updateRole);

module.exports = router;
