const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/vehicle.controller');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, ctrl.getAll);
router.get('/:id', protect, ctrl.getById);
router.post('/', protect, authorize('owner', 'admin', 'receptionist'), upload.array('images', 10), ctrl.create);
router.put('/:id', protect, authorize('owner', 'admin', 'technician'), upload.array('images', 10), ctrl.update);
router.put('/:id/status', protect, authorize('owner', 'admin', 'technician', 'receptionist'), ctrl.updateStatus);
router.delete('/:id', protect, authorize('owner', 'admin'), ctrl.remove);

module.exports = router;
