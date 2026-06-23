const { getDbMode } = require('../config/db');
const MongoModels = require('../models/schemas');
const { UserStore, ProductStore, DailyEntryStore } = require('./jsonStore');

const dbProvider = {
  User: {
    find: async (query = {}) => {
      if (getDbMode() === 'mongo') return await MongoModels.User.find(query);
      return await UserStore.find(query);
    },
    findOne: async (query = {}) => {
      if (getDbMode() === 'mongo') return await MongoModels.User.findOne(query);
      return await UserStore.findOne(query);
    },
    findById: async (id) => {
      if (getDbMode() === 'mongo') return await MongoModels.User.findById(id);
      return await UserStore.findById(id);
    },
    create: async (data) => {
      if (getDbMode() === 'mongo') return await MongoModels.User.create(data);
      return await UserStore.create(data);
    },
    findByIdAndUpdate: async (id, update) => {
      if (getDbMode() === 'mongo') return await MongoModels.User.findByIdAndUpdate(id, update, { new: true });
      return await UserStore.findByIdAndUpdate(id, update);
    }
  },
  Product: {
    find: async (query = {}) => {
      if (getDbMode() === 'mongo') {
        let mongoQuery = {};
        if (query.name) {
          mongoQuery.name = { $regex: query.name, $options: 'i' };
        }
        if (query.status) {
          mongoQuery.status = query.status;
        }
        return await MongoModels.Product.find(mongoQuery);
      }
      return await ProductStore.find(query);
    },
    findById: async (id) => {
      if (getDbMode() === 'mongo') return await MongoModels.Product.findById(id);
      return await ProductStore.findById(id);
    },
    create: async (data) => {
      if (getDbMode() === 'mongo') return await MongoModels.Product.create(data);
      return await ProductStore.create(data);
    },
    findByIdAndUpdate: async (id, update) => {
      if (getDbMode() === 'mongo') return await MongoModels.Product.findByIdAndUpdate(id, update, { new: true });
      return await ProductStore.findByIdAndUpdate(id, update);
    },
    findByIdAndDelete: async (id) => {
      if (getDbMode() === 'mongo') return await MongoModels.Product.findByIdAndDelete(id);
      return await ProductStore.findByIdAndDelete(id);
    }
  },
  DailyEntry: {
    find: async (query = {}) => {
      if (getDbMode() === 'mongo') {
        let mongoQuery = {};
        if (query.date) {
          const start = new Date(query.date);
          start.setHours(0, 0, 0, 0);
          const end = new Date(query.date);
          end.setHours(23, 59, 59, 999);
          mongoQuery.date = { $gte: start, $lte: end };
        }
        return await MongoModels.DailyEntry.find(mongoQuery).sort({ date: -1 });
      }
      return await DailyEntryStore.find(query);
    },
    findAll: async () => {
      if (getDbMode() === 'mongo') return await MongoModels.DailyEntry.find({}).sort({ date: -1 });
      const fs = require('fs');
      const path = require('path');
      const file = path.join(__dirname, '..', 'data', 'entries.json');
      if (!fs.existsSync(file)) return [];
      try {
        const list = JSON.parse(fs.readFileSync(file, 'utf8'));
        return list.sort((a, b) => new Date(b.date) - new Date(a.date));
      } catch {
        return [];
      }
    },
    findById: async (id) => {
      if (getDbMode() === 'mongo') return await MongoModels.DailyEntry.findById(id);
      return await DailyEntryStore.findById(id);
    },
    create: async (data) => {
      if (getDbMode() === 'mongo') return await MongoModels.DailyEntry.create(data);
      return await DailyEntryStore.create(data);
    },
    findByIdAndUpdate: async (id, update) => {
      if (getDbMode() === 'mongo') return await MongoModels.DailyEntry.findByIdAndUpdate(id, update, { new: true });
      return await DailyEntryStore.findByIdAndUpdate(id, update);
    },
    findByIdAndDelete: async (id) => {
      if (getDbMode() === 'mongo') return await MongoModels.DailyEntry.findByIdAndDelete(id);
      return await DailyEntryStore.findByIdAndDelete(id);
    }
  }
};

module.exports = dbProvider;
