const getModel = require('../utils/modelHelper');
const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema(
  {
    displayName: {
      type: String,
      required: [true, 'Please add a display name'],
      trim: true,
    },
    originalFilename: {
      type: String,
      required: true,
      trim: true,
    },
    filename: {
      type: String,
      required: true,
      unique: true,
    },
    path: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'image', 'document', 'spreadsheet', 'presentation', 'archive', 'video', 'audio', 'text', 'other'],
      default: 'other',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubCategory',
      default: null,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    fileData: {
      type: String, // Base64 encoded file content for permanent storage
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexing for quick searches
FileSchema.index({ displayName: 'text', originalFilename: 'text' });
// Compound index to help search/filter within categories quickly
FileSchema.index({ category: 1, subCategory: 1, isDeleted: 1 });

module.exports = getModel('File', FileSchema);
