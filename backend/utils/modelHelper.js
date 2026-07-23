const mongoose = require('mongoose');
const { mockModel } = require('./jsonDb');

const getModel = (modelName, schema) => {
  let MongooseModel;
  try {
    MongooseModel = mongoose.model(modelName);
  } catch (e) {
    MongooseModel = mongoose.model(modelName, schema);
  }
  
  const MockModel = mockModel(modelName);

  return new Proxy(MongooseModel, {
    get(target, prop) {
      if (global.useJsonDb) {
        // Redirect Mongoose methods to local JSON storage
        return MockModel[prop] || target[prop];
      }
      return target[prop];
    }
  });
};

module.exports = getModel;
