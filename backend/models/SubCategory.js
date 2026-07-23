const getModel = require('../utils/modelHelper');
const mongoose = require('mongoose');

const SubCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a subcategory name'],
      trim: true,
    },
    slug: {
      type: String,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    isPredefined: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure subcategory names are unique within a category
SubCategorySchema.index({ name: 1, category: 1 }, { unique: true });

// Create subcategory slug from name before saving
SubCategorySchema.pre('save', function (next) {
  this.slug = this.name
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
  next();
});

module.exports = getModel('SubCategory', SubCategorySchema);
