const express = require('express');
const {
  getCategories,
  createCategory,
  renameCategory,
  createSubCategory,
  renameSubCategory,
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.get('/', protect, getCategories);
router.post('/', protect, authorize('Admin'), createCategory);
router.put('/:id', protect, authorize('Admin'), renameCategory);
router.post('/:catId/subcategories', protect, authorize('Admin'), createSubCategory);
router.put('/subcategories/:id', protect, authorize('Admin'), renameSubCategory);

module.exports = router;
