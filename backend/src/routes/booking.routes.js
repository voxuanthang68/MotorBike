const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/booking.controller');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id/status', authorize('owner', 'admin', 'receptionist', 'support'), ctrl.updateStatus);
router.put('/:id/checkin', authorize('owner', 'admin', 'receptionist', 'technician'), upload.array('images', 10), ctrl.checkIn);
router.put('/:id/checkout', authorize('owner', 'admin', 'receptionist', 'technician'), upload.array('images', 10), ctrl.checkOut);

module.exports = router;
