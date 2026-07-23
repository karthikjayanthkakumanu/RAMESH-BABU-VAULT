const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const File = require('../models/File');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get all categories and their subcategories
// @route   GET /api/categories
// @access  Private
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    
    // Add subcategories to each category object
    const categoriesWithSubs = await Promise.all(
      categories.map(async (cat) => {
        const subcategories = await SubCategory.find({ category: cat._id }).sort({ name: 1 });
        return {
          ...cat,
          subcategories,
        };
      })
    );

    res.status(200).json({
      success: true,
      categories: categoriesWithSubs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a custom category (Admin only)
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a category name',
      });
    }

    const exists = await Category.findOne({ name });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'A category with this name already exists',
      });
    }

    const category = await Category.create({
      name,
      description,
      isPredefined: false,
    });

    await ActivityLog.create({
      user: req.user._id,
      action: 'CREATE_CATEGORY',
      details: `Created new category "${name}"`,
    });

    res.status(201).json({
      success: true,
      category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rename a category (Admin only)
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.renameCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Check if new name already exists elsewhere
    if (name && name !== category.name) {
      const exists = await Category.findOne({ name });
      if (exists) {
        return res.status(400).json({
          success: false,
          message: 'Another category already has this name',
        });
      }
      
      const oldName = category.name;
      category.name = name;
      category.slug = name.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
      
      await category.save();

      await ActivityLog.create({
        user: req.user._id,
        action: 'RENAME_CATEGORY',
        details: `Renamed category "${oldName}" to "${name}"`,
      });
    } else if (description !== undefined) {
      category.description = description;
      await category.save();
    }

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a custom subcategory (Admin only)
// @route   POST /api/categories/:catId/subcategories
// @access  Private/Admin
exports.createSubCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    const { catId } = req.params;

    const category = await Category.findById(catId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a subcategory name',
      });
    }

    const exists = await SubCategory.findOne({ name, category: catId });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: `Subcategory "${name}" already exists under category "${category.name}"`,
      });
    }

    const subcategory = await SubCategory.create({
      name,
      category: catId,
      isPredefined: false,
    });

    await ActivityLog.create({
      user: req.user._id,
      action: 'CREATE_SUBCATEGORY',
      details: `Created subcategory "${name}" under category "${category.name}"`,
    });

    res.status(201).json({
      success: true,
      subcategory,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rename a subcategory (Admin only)
// @route   PUT /api/subcategories/:id
// @access  Private/Admin
exports.renameSubCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    const subcategory = await SubCategory.findById(req.params.id).populate('category');

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found',
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a new subcategory name',
      });
    }

    // Check unique within category
    const exists = await SubCategory.findOne({ name, category: subcategory.category._id });
    if (exists && exists._id.toString() !== subcategory._id.toString()) {
      return res.status(400).json({
        success: false,
        message: `Another subcategory named "${name}" already exists under category "${subcategory.category.name}"`,
      });
    }

    const oldName = subcategory.name;
    subcategory.name = name;
    subcategory.slug = name.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
    await subcategory.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'RENAME_SUBCATEGORY',
      details: `Renamed subcategory "${oldName}" to "${name}" under category "${subcategory.category.name}"`,
    });

    res.status(200).json({
      success: true,
      subcategory,
    });
  } catch (error) {
    next(error);
  }
};
