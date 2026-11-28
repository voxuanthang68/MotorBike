const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/booking.controller');
const { protect, optionalProtect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Check vehicle availability without creating booking (customer or guest)
router.post('/check-availability', optionalProtect, ctrl.checkAvailability);
// Create booking (customer or guest)
router.post('/', optionalProtect, ctrl.create);

router.use(protect);
router.post('/checkout', ctrl.checkout);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.put('/:id/status', authorize('owner', 'admin', 'receptionist', 'support'), ctrl.updateStatus);
router.put('/:id/checkin', authorize('owner', 'admin', 'receptionist', 'technician'), upload.array('images', 10), ctrl.checkIn);
router.put('/:id/checkout', authorize('owner', 'admin', 'receptionist', 'technician'), upload.array('images', 10), ctrl.checkOut);

module.exports = router;
