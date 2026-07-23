const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbDir = path.join(__dirname, '../uploads/database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const readData = (model) => {
  const filePath = path.join(dbDir, `${model.toLowerCase()}s.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return [];
  }
};

const writeData = (model, data) => {
  const filePath = path.join(dbDir, `${model.toLowerCase()}s.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

// Helper to match Mongoose query conditions
const matchQuery = (item, query) => {
  if (!query || Object.keys(query).length === 0) return true;

  for (let key in query) {
    const val = query[key];

    // Handle $or array
    if (key === '$or' && Array.isArray(val)) {
      let orMatch = false;
      for (let subQuery of val) {
        if (matchQuery(item, subQuery)) {
          orMatch = true;
          break;
        }
      }
      if (!orMatch) return false;
      continue;
    }

    // Handle $in array
    if (val && typeof val === 'object' && val.$in) {
      if (!val.$in.includes(item[key])) return false;
      continue;
    }

    // Handle Regex
    if (val && typeof val === 'object' && val.$regex) {
      const regex = new RegExp(val.$regex, val.$options || '');
      if (!regex.test(item[key])) return false;
      continue;
    }

    // Handle standard exact match
    let itemVal = item[key];
    if (itemVal === undefined && val === false) {
      itemVal = false;
    }

    if (itemVal !== val) {
      // Handle MongoDB ID strings comparison
      if (itemVal && typeof itemVal === 'object' && itemVal._id) {
        if (itemVal._id.toString() !== val) return false;
      } else {
        return false;
      }
    }
  }
  return true;
};

// Add helper instance methods and save method for mock documents
const wrapDocument = (modelName, doc) => {
  if (!doc) return null;

  // Create an object with the document data and ensure _id exists
  const wrapped = {
    ...doc,
    _id: doc._id || doc.id,
  };

  // Add user helper instance methods
  if (modelName === 'User') {
    wrapped.matchPassword = async function (password) {
      return await bcrypt.compare(password, this.password);
    };
  }

  // Add the .save() method to mock Mongoose document save
  wrapped.save = async function () {
    const items = readData(modelName);
    const index = items.findIndex(item => item.id === this.id || item._id === this._id);

    // Copy current state (excluding custom instance methods)
    const cleanItem = { ...this };
    delete cleanItem.save;
    delete cleanItem.matchPassword;
    cleanItem.updatedAt = new Date().toISOString();

    if (index !== -1) {
      items[index] = cleanItem;
    } else {
      items.push(cleanItem);
    }
    writeData(modelName, items);
    return this;
  };

  return wrapped;
};

const mockModel = (modelName) => {
  return {
    find: function (query = {}) {
      let items = readData(modelName);
      items = items.filter(item => matchQuery(item, query));
      
      // Support population / sorting / lean chain simulation
      const chain = {
        populate: function(field) {
          if (!field) return this;
          let refModel = '';
          if (field === 'category') refModel = 'Category';
          else if (field === 'subCategory') refModel = 'SubCategory';
          else if (field === 'uploadedBy') refModel = 'User';

          if (refModel) {
            const refItems = readData(refModel);
            items = items.map(item => {
              const refId = item[field];
              if (refId && typeof refId === 'string') {
                const matchedRef = refItems.find(r => r.id === refId || r._id === refId);
                if (matchedRef) {
                  return {
                    ...item,
                    [field]: wrapDocument(refModel, matchedRef)
                  };
                }
              }
              return item;
            });
          }
          return this;
        },
        sort: function(sortOption) {
          if (!sortOption) return this;
          const sortKey = Object.keys(sortOption)[0];
          const sortDir = sortOption[sortKey];
          items.sort((a, b) => {
            let valA = a[sortKey];
            let valB = b[sortKey];
            if (valA && typeof valA === 'object' && valA.name) valA = valA.name;
            if (valB && typeof valB === 'object' && valB.name) valB = valB.name;
            if (valA < valB) return sortDir;
            if (valA > valB) return -sortDir;
            return 0;
          });
          return this;
        },
        limit: function(num) {
          items = items.slice(0, num);
          return this;
        },
        lean: function() { return this; },
        then: function(resolve) {
          resolve(items.map(item => wrapDocument(modelName, item)));
        }
      };

      chain[Symbol.toStringTag] = 'Promise';
      chain.then = (onFulfilled) => Promise.resolve(items.map(item => wrapDocument(modelName, item))).then(onFulfilled);
      return chain;
    },

    findOne: function (query = {}) {
      const items = readData(modelName);
      let matched = items.find(item => matchQuery(item, query));
      
      const chain = {
        populate: function(field) {
          if (!matched || !field) return this;
          let refModel = '';
          if (field === 'category') refModel = 'Category';
          else if (field === 'subCategory') refModel = 'SubCategory';
          else if (field === 'uploadedBy') refModel = 'User';

          if (refModel) {
            const refItems = readData(refModel);
            const refId = matched[field];
            if (refId && typeof refId === 'string') {
              const matchedRef = refItems.find(r => r.id === refId || r._id === refId);
              if (matchedRef) {
                matched = {
                  ...matched,
                  [field]: wrapDocument(refModel, matchedRef)
                };
              }
            }
          }
          return this;
        },
        select: function() { return this; },
        lean: function() { return this; },
        then: function(resolve) {
          resolve(wrapDocument(modelName, matched));
        }
      };

      chain[Symbol.toStringTag] = 'Promise';
      chain.then = (onFulfilled) => {
        const result = wrapDocument(modelName, matched);
        return Promise.resolve(result).then(onFulfilled);
      };
      return chain;
    },

    findById: function (id) {
      const items = readData(modelName);
      let matched = items.find(item => item.id === id || item._id === id);
      
      const chain = {
        populate: function(field) {
          if (!matched || !field) return this;
          let refModel = '';
          if (field === 'category') refModel = 'Category';
          else if (field === 'subCategory') refModel = 'SubCategory';
          else if (field === 'uploadedBy') refModel = 'User';

          if (refModel) {
            const refItems = readData(refModel);
            const refId = matched[field];
            if (refId && typeof refId === 'string') {
              const matchedRef = refItems.find(r => r.id === refId || r._id === refId);
              if (matchedRef) {
                matched = {
                  ...matched,
                  [field]: wrapDocument(refModel, matchedRef)
                };
              }
            }
          }
          return this;
        },
        select: function() { return this; },
        lean: function() { return this; },
        then: function(resolve) {
          resolve(wrapDocument(modelName, matched));
        }
      };

      chain[Symbol.toStringTag] = 'Promise';
      chain.then = (onFulfilled) => {
        const result = wrapDocument(modelName, matched);
        return Promise.resolve(result).then(onFulfilled);
      };
      return chain;
    },

    create: async function (data) {
      const items = readData(modelName);
      const newId = generateId();
      
      let item = {
        id: newId,
        _id: newId,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Hash password if this is a user model creation
      if (modelName === 'User' && item.password) {
        const salt = await bcrypt.genSalt(10);
        item.password = await bcrypt.hash(item.password, salt);
      }

      items.push(item);
      writeData(modelName, items);
      
      return wrapDocument(modelName, item);
    },

    findByIdAndDelete: async function (id) {
      let items = readData(modelName);
      const itemToDelete = items.find(item => item.id === id || item._id === id);
      items = items.filter(item => item.id !== id && item._id !== id);
      writeData(modelName, items);
      return itemToDelete;
    },

    updateMany: async function (query, update) {
      let items = readData(modelName);
      let count = 0;
      const updatedItems = items.map(item => {
        if (matchQuery(item, query)) {
          count++;
          let setValues = update.$set || update;
          return { ...item, ...setValues };
        }
        return item;
      });
      writeData(modelName, updatedItems);
      return { nModified: count };
    },

    deleteMany: async function (query) {
      let items = readData(modelName);
      const itemsToKeep = items.filter(item => !matchQuery(item, query));
      const deletedCount = items.length - itemsToKeep.length;
      writeData(modelName, itemsToKeep);
      return { deletedCount };
    },

    countDocuments: async function (query = {}) {
      const items = readData(modelName);
      return items.filter(item => matchQuery(item, query)).length;
    },

    aggregate: async function (pipeline) {
      // Mock stats aggregation
      const items = readData(modelName);
      const nonDeleted = items.filter(i => !i.isDeleted);
      const totalSize = nonDeleted.reduce((sum, item) => sum + (item.size || 0), 0);
      return [{ totalSize }];
    }
  };
};

module.exports = { mockModel };
