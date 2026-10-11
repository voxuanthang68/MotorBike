const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/payment.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', ctrl.getAll);
router.get('/summary', authorize('owner', 'admin', 'accountant'), ctrl.getSummary);
router.post('/', authorize('owner', 'admin', 'accountant', 'receptionist'), ctrl.create);

module.exports = router;
