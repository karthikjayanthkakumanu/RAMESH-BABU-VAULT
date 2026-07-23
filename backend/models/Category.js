const getModel = require('../utils/modelHelper');
const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a category name'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      default: '',
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

// Create category slug from name before saving
CategorySchema.pre('save', function (next) {
  this.slug = this.name
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
  next();
});

module.exports = getModel('Category', CategorySchema);
