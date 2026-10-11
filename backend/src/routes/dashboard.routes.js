const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/dashboard.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('owner', 'admin', 'accountant', 'receptionist'), getDashboard);

module.exports = router;
