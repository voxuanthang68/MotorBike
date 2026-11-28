const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/payment.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', ctrl.getAll);
router.get('/summary', authorize('owner', 'admin', 'accountant'), ctrl.getSummary);
router.post('/qr-session', ctrl.createQrSession);
router.get('/qr-session/:id', ctrl.getQrSessionStatus);
router.post('/', ctrl.create);

module.exports = router;
