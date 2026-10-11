const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove, updateProfile } = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.get('/', authorize('owner', 'admin'), getAll);
router.get('/:id', authorize('owner', 'admin'), getById);
router.post('/', authorize('owner', 'admin'), create);
router.put('/profile', upload.single('avatar'), updateProfile);
router.put('/:id', authorize('owner', 'admin'), update);
router.delete('/:id', authorize('owner', 'admin'), remove);

module.exports = router;
