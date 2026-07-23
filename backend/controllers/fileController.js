const fs = require('fs');
const path = require('path');
const File = require('../models/File');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const ActivityLog = require('../models/ActivityLog');
const { getFileType } = require('../utils/fileTypeHelper');

// Helper to check duplicate filename in Category/SubCategory
const checkDuplicate = async (category, subCategory, displayName, originalFilename) => {
  const query = {
    category,
    subCategory: subCategory || null,
    isDeleted: false,
    $or: [
      { displayName: displayName.trim() },
      { originalFilename: originalFilename.trim() }
    ]
  };
  return await File.findOne(query);
};

// @desc    Upload multiple files
// @route   POST /api/files/upload
// @access  Private/Admin
exports.uploadFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded',
      });
    }

    const { category, subCategory, displayNames } = req.body;
    
    // Parse displayNames if it is a JSON string
    let parsedDisplayNames = [];
    if (displayNames) {
      try {
        parsedDisplayNames = typeof displayNames === 'string' ? JSON.parse(displayNames) : displayNames;
      } catch (e) {
        parsedDisplayNames = [];
      }
    }

    if (!category) {
      // Clean up uploaded files if validation fails
      req.files.forEach(f => fs.unlinkSync(f.path));
      return res.status(400).json({
        success: false,
        message: 'Please specify a category',
      });
    }

    // Verify category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      req.files.forEach(f => fs.unlinkSync(f.path));
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Verify subcategory if provided
    if (subCategory) {
      const subExists = await SubCategory.findOne({ _id: subCategory, category });
      if (!subExists) {
        req.files.forEach(f => fs.unlinkSync(f.path));
        return res.status(404).json({
          success: false,
          message: 'Subcategory not found under this category',
        });
      }
    }

    const uploadedFilesData = [];

    // Process files and check duplicates
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const customName = parsedDisplayNames[i] || path.parse(file.originalname).name;
      
      const duplicate = await checkDuplicate(category, subCategory, customName, file.originalname);
      if (duplicate) {
        // Clean up all uploaded files
        req.files.forEach(f => {
          if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
        });
        return res.status(400).json({
          success: false,
          message: `Duplicate file detected: A file named "${customName}" or "${file.originalname}" already exists in this folder.`,
        });
      }

      uploadedFilesData.push({
        file,
        customName,
      });
    }

    const savedFiles = [];

    // Save metadata to DB
    for (const item of uploadedFilesData) {
      const { file, customName } = item;
      const type = getFileType(file.mimetype, file.originalname);

      // Read file content and convert to Base64 for permanent storage in DB
      let fileDataBase64 = '';
      if (fs.existsSync(file.path)) {
        fileDataBase64 = fs.readFileSync(file.path).toString('base64');
      }

      const newFile = await File.create({
        displayName: customName.trim(),
        originalFilename: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimeType: file.mimetype,
        fileType: type,
        category,
        subCategory: subCategory || null,
        uploadedBy: req.user._id,
        fileData: fileDataBase64,
      });

      savedFiles.push(newFile);

      // Log activity
      await ActivityLog.create({
        user: req.user._id,
        action: 'UPLOAD_FILE',
        details: `Uploaded file "${newFile.displayName}" in category "${categoryExists.name}"`,
      });
    }

    res.status(201).json({
      success: true,
      message: `${savedFiles.length} file(s) uploaded successfully.`,
      files: savedFiles,
    });
  } catch (error) {
    // Cleanup files in case of error
    if (req.files) {
      req.files.forEach(f => {
        if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
      });
    }
    next(error);
  }
};

// @desc    Get files with sorting, filters, search
// @route   GET /api/files
// @access  Private
exports.getFiles = async (req, res, next) => {
  try {
    const {
      category,
      subCategory,
      fileType,
      isFavorite,
      isDeleted,
      search,
      sortBy,
    } = req.query;

    const query = { isDeleted: isDeleted === 'true' };

    if (category) query.category = category;
    if (subCategory) query.subCategory = subCategory === 'null' ? null : subCategory;
    if (isFavorite === 'true') query.isFavorite = true;
    
    // File type filters
    if (fileType) {
      const types = fileType.split(',');
      query.fileType = { $in: types };
    }

    // Search query within current scope
    if (search) {
      query.$or = [
        { displayName: { $regex: search, $options: 'i' } },
        { originalFilename: { $regex: search, $options: 'i' } },
      ];
    }

    // Sorting
    let sortObj = { createdAt: -1 }; // default newest
    if (sortBy === 'oldest') {
      sortObj = { createdAt: 1 };
    } else if (sortBy === 'name_asc') {
      sortObj = { displayName: 1 };
    } else if (sortBy === 'name_desc') {
      sortObj = { displayName: -1 };
    } else if (sortBy === 'size_asc') {
      sortObj = { size: 1 };
    } else if (sortBy === 'size_desc') {
      sortObj = { size: -1 };
    }

    const files = await File.find(query)
      .populate('category', 'name')
      .populate('subCategory', 'name')
      .populate('uploadedBy', 'name')
      .sort(sortObj);

    res.status(200).json({
      success: true,
      count: files.length,
      files,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Global Search across Categories, Subcategories, Files
// @route   GET /api/files/search
// @access  Private
exports.searchFiles = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(200).json({ success: true, files: [], categories: [], subcategories: [] });
    }

    // Search Categories
    const categories = await Category.find({ name: { $regex: q, $options: 'i' } });
    
    // Search Subcategories
    const subcategories = await SubCategory.find({ name: { $regex: q, $options: 'i' } }).populate('category', 'name');

    // Search Files (that are not deleted)
    const files = await File.find({
      isDeleted: false,
      $or: [
        { displayName: { $regex: q, $options: 'i' } },
        { originalFilename: { $regex: q, $options: 'i' } },
      ],
    })
      .populate('category', 'name')
      .populate('subCategory', 'name')
      .populate('uploadedBy', 'name');

    res.status(200).json({
      success: true,
      files,
      categories,
      subcategories,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download file
// @route   GET /api/files/:id/download
// @access  Private
exports.downloadFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'DOWNLOAD_FILE',
      details: `Downloaded file "${file.displayName}"`,
    });

    if (file.fileData) {
      const fileBuffer = Buffer.from(file.fileData, 'base64');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalFilename)}"`);
      res.setHeader('Content-Type', file.mimeType);
      return res.send(fileBuffer);
    }

    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ success: false, message: 'Physical file not found on disk' });
    }

    res.download(file.path, file.originalFilename);
  } catch (error) {
    next(error);
  }
};

// @desc    View/Preview file
// @route   GET /api/files/:id/view
// @access  Private
exports.viewFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'VIEW_FILE',
      details: `Viewed file "${file.displayName}"`,
    });

    if (file.fileData) {
      const fileBuffer = Buffer.from(file.fileData, 'base64');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalFilename)}"`);
      res.setHeader('Content-Type', file.mimeType);
      return res.send(fileBuffer);
    }

    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ success: false, message: 'Physical file not found on disk' });
    }

    // Set inline content disposition to preview, not download
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalFilename)}"`);
    res.setHeader('Content-Type', file.mimeType);
    res.sendFile(file.path);
  } catch (error) {
    next(error);
  }
};

// @desc    Rename Display Name and/or Filename
// @route   PUT /api/files/:id/rename
// @access  Private/Admin
exports.renameFile = async (req, res, next) => {
  try {
    const { displayName, filename } = req.body;
    if (!displayName && !filename) {
      return res.status(400).json({ success: false, message: 'Please provide a display name or filename to rename' });
    }

    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const oldDisplayName = file.displayName;
    const oldOriginalFilename = file.originalFilename;

    // 1. Handle actual filename renaming if provided
    if (filename) {
      let newFilename = filename.trim();
      const ext = path.extname(file.originalFilename);
      // Ensure it has the correct extension
      if (!newFilename.toLowerCase().endsWith(ext.toLowerCase())) {
        newFilename += ext;
      }

      // Check duplicates for this filename in the same folder
      const duplicate = await File.findOne({
        category: file.category,
        subCategory: file.subCategory,
        originalFilename: newFilename,
        isDeleted: false,
        _id: { $ne: file._id }
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `A file with filename "${newFilename}" already exists in this folder.`,
        });
      }

      // Rename physical file if it exists on disk
      const oldPath = file.path;
      const dir = path.dirname(oldPath);
      const newUniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
      const newPath = path.join(dir, newUniqueName);

      if (fs.existsSync(oldPath)) {
        try {
          fs.renameSync(oldPath, newPath);
          file.path = newPath;
          file.filename = newUniqueName;
        } catch (fsErr) {
          console.warn('Failed to rename physical file:', fsErr.message);
        }
      }

      file.originalFilename = newFilename;
    }

    // 2. Handle display name renaming if provided
    if (displayName) {
      const targetDisplayName = displayName.trim();
      // Check duplicates for display name
      const duplicate = await File.findOne({
        category: file.category,
        subCategory: file.subCategory,
        displayName: targetDisplayName,
        isDeleted: false,
        _id: { $ne: file._id }
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `A file named "${targetDisplayName}" already exists in this folder.`,
        });
      }

      file.displayName = targetDisplayName;
    }

    await file.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'RENAME_FILE',
      details: `Renamed file: Display Name ("${oldDisplayName}" -> "${file.displayName}"), Filename ("${oldOriginalFilename}" -> "${file.originalFilename}")`,
    });

    res.status(200).json({
      success: true,
      file,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Move file to different Category/SubCategory
// @route   PUT /api/files/:id/move
// @access  Private/Admin
exports.moveFile = async (req, res, next) => {
  try {
    const { category, subCategory } = req.body;
    if (!category) {
      return res.status(400).json({ success: false, message: 'Please specify target category' });
    }

    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Check destination
    const targetCategory = await Category.findById(category);
    if (!targetCategory) {
      return res.status(404).json({ success: false, message: 'Target category not found' });
    }

    if (subCategory) {
      const targetSub = await SubCategory.findOne({ _id: subCategory, category });
      if (!targetSub) {
        return res.status(404).json({ success: false, message: 'Target subcategory not found' });
      }
    }

    // Check duplicate in target folder
    const duplicate = await checkDuplicate(category, subCategory, file.displayName, file.originalFilename);
    if (duplicate && duplicate._id.toString() !== file._id.toString()) {
      return res.status(400).json({
        success: false,
        message: `A file with this name already exists in the destination folder.`,
      });
    }

    file.category = category;
    file.subCategory = subCategory || null;
    await file.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'MOVE_FILE',
      details: `Moved file "${file.displayName}" to category "${targetCategory.name}"`,
    });

    res.status(200).json({
      success: true,
      file,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle Favorite File
// @route   PUT /api/files/:id/favorite
// @access  Private
exports.favoriteFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    file.isFavorite = !file.isFavorite;
    await file.save();

    await ActivityLog.create({
      user: req.user._id,
      action: file.isFavorite ? 'FAVORITE_FILE' : 'UNFAVORITE_FILE',
      details: `${file.isFavorite ? 'Favorited' : 'Unfavorited'} file "${file.displayName}"`,
    });

    res.status(200).json({
      success: true,
      file,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Soft Delete (Move to Trash)
// @route   DELETE /api/files/:id
// @access  Private/Admin
exports.deleteFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    file.isDeleted = true;
    file.deletedAt = Date.now();
    await file.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'DELETE_FILE',
      details: `Soft deleted file "${file.displayName}" (moved to trash)`,
    });

    res.status(200).json({
      success: true,
      message: 'File moved to Trash',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Restore file from Trash
// @route   PUT /api/files/:id/restore
// @access  Private/Admin
exports.restoreFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Check duplicate in original category
    const duplicate = await checkDuplicate(file.category, file.subCategory, file.displayName, file.originalFilename);
    if (duplicate && duplicate._id.toString() !== file._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'A file with this name already exists in the destination category. Rename or delete that file first.',
      });
    }

    file.isDeleted = false;
    file.deletedAt = null;
    await file.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'RESTORE_FILE',
      details: `Restored file "${file.displayName}" from Trash`,
    });

    res.status(200).json({
      success: true,
      file,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Permanently Delete Physical File and Metadata
// @route   DELETE /api/files/:id/permanent
// @access  Private/Admin
exports.deletePermanently = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Delete physical file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    const displayName = file.displayName;
    await File.findByIdAndDelete(req.params.id);

    await ActivityLog.create({
      user: req.user._id,
      action: 'PERMANENT_DELETE_FILE',
      details: `Permanently deleted file "${displayName}"`,
    });

    res.status(200).json({
      success: true,
      message: 'File permanently deleted',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get File Statistics
// @route   GET /api/files/stats
// @access  Private
exports.getStats = async (req, res, next) => {
  try {
    const totalCategories = await Category.countDocuments();
    const totalFiles = await File.countDocuments({ isDeleted: false });
    
    // File counts by format (for non-deleted files)
    const pdfCount = await File.countDocuments({ fileType: 'pdf', isDeleted: false });
    const imageCount = await File.countDocuments({ fileType: 'image', isDeleted: false });
    const textCount = await File.countDocuments({ fileType: 'text', isDeleted: false });
    
    const documentCount = await File.countDocuments({ 
      fileType: { $in: ['document', 'spreadsheet', 'presentation'] }, 
      isDeleted: false 
    });

    const otherCount = await File.countDocuments({ 
      fileType: { $in: ['archive', 'video', 'audio', 'other'] }, 
      isDeleted: false 
    });

    // Total storage size calculation
    const storageResult = await File.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: null, totalSize: { $sum: '$size' } } }
    ]);
    const storageUsed = storageResult.length > 0 ? storageResult[0].totalSize : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalCategories,
        totalFiles,
        pdfCount,
        imageCount,
        documentCount,
        textCount,
        otherCount,
        storageUsed, // in bytes
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Audit Logs for Timeline
// @route   GET /api/files/activity
// @access  Private
exports.getActivityLogs = async (req, res, next) => {
  try {
    const logs = await ActivityLog.find()
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      logs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk Operations (Delete, Move, Restore)
// @route   POST /api/files/bulk
// @access  Private/Admin
exports.bulkOperations = async (req, res, next) => {
  try {
    const { fileIds, action, targetCategory, targetSubCategory } = req.body;
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide file IDs' });
    }

    if (action === 'delete') {
      await File.updateMany(
        { _id: { $in: fileIds } },
        { $set: { isDeleted: true, deletedAt: new Date() } }
      );
      
      await ActivityLog.create({
        user: req.user._id,
        action: 'DELETE_FILE',
        details: `Bulk deleted ${fileIds.length} files`,
      });

      return res.status(200).json({ success: true, message: 'Files moved to Trash' });
    } 
    
    if (action === 'restore') {
      await File.updateMany(
        { _id: { $in: fileIds } },
        { $set: { isDeleted: false, deletedAt: null } }
      );

      await ActivityLog.create({
        user: req.user._id,
        action: 'RESTORE_FILE',
        details: `Bulk restored ${fileIds.length} files from Trash`,
      });

      return res.status(200).json({ success: true, message: 'Files restored from Trash' });
    }

    if (action === 'permanent_delete') {
      const files = await File.find({ _id: { $in: fileIds } });
      files.forEach(f => {
        if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
      });

      await File.deleteMany({ _id: { $in: fileIds } });

      await ActivityLog.create({
        user: req.user._id,
        action: 'PERMANENT_DELETE_FILE',
        details: `Bulk permanently deleted ${fileIds.length} files`,
      });

      return res.status(200).json({ success: true, message: 'Files permanently deleted' });
    }

    if (action === 'move') {
      if (!targetCategory) {
        return res.status(400).json({ success: false, message: 'Please specify destination category' });
      }

      const cat = await Category.findById(targetCategory);
      if (!cat) {
        return res.status(404).json({ success: false, message: 'Destination category not found' });
      }

      await File.updateMany(
        { _id: { $in: fileIds } },
        { $set: { category: targetCategory, subCategory: targetSubCategory || null } }
      );

      await ActivityLog.create({
        user: req.user._id,
        action: 'MOVE_FILE',
        details: `Bulk moved ${fileIds.length} files to category "${cat.name}"`,
      });

      return res.status(200).json({ success: true, message: 'Files moved successfully' });
    }

    res.status(400).json({ success: false, message: 'Invalid bulk action specified' });
  } catch (error) {
    next(error);
  }
};
