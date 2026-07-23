const getModel = require('../utils/modelHelper');
const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN',
      'LOGOUT',
      'UPLOAD_FILE',
      'DOWNLOAD_FILE',
      'VIEW_FILE',
      'RENAME_FILE',
      'MOVE_FILE',
      'DELETE_FILE',
      'RESTORE_FILE',
      'PERMANENT_DELETE_FILE',
      'FAVORITE_FILE',
      'UNFAVORITE_FILE',
      'CREATE_CATEGORY',
      'RENAME_CATEGORY',
      'CREATE_SUBCATEGORY',
      'RENAME_SUBCATEGORY',
      'CREATE_USER',
      'DELETE_USER',
    ],
  },
  details: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = getModel('ActivityLog', ActivityLogSchema);
