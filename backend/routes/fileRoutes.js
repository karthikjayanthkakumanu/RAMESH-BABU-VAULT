const express = require('express');
const {
  uploadFiles,
  getFiles,
  searchFiles,
  downloadFile,
  viewFile,
  renameFile,
  moveFile,
  favoriteFile,
  deleteFile,
  restoreFile,
  deletePermanently,
  getStats,
  getActivityLogs,
  bulkOperations,
} = require('../controllers/fileController');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = express.Router();

router.get('/', protect, getFiles);
router.get('/search', protect, searchFiles);
router.get('/stats', protect, getStats);
router.get('/activity', protect, getActivityLogs);

// Admin-only upload
router.post('/upload', protect, authorize('Admin'), upload.array('files'), uploadFiles);
router.post('/bulk', protect, authorize('Admin'), bulkOperations);

// Single file operations
router.get('/:id/download', protect, downloadFile);
router.get('/:id/view', protect, viewFile);
router.put('/:id/favorite', protect, favoriteFile);

// Admin-only edit operations
router.put('/:id/rename', protect, authorize('Admin'), renameFile);
router.put('/:id/move', protect, authorize('Admin'), moveFile);
router.delete('/:id', protect, authorize('Admin'), deleteFile);
router.put('/:id/restore', protect, authorize('Admin'), restoreFile);
router.delete('/:id/permanent', protect, authorize('Admin'), deletePermanently);

module.exports = router;
