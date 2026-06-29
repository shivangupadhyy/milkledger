const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const getFilePath = (collection) => path.join(DATA_DIR, `${collection}.json`);

const readData = (collection) => {
  const file = getFilePath(collection);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const content = fs.readFileSync(file, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`Error reading ${collection}.json:`, err);
    return [];
  }
};

const writeData = (collection, data) => {
  const file = getFilePath(collection);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

const UserStore = {
  find: async (query = {}) => {
    const list = readData('users');
    return list.filter(item => {
      return Object.keys(query).every(key => {
        if (key === 'email' && typeof item[key] === 'string' && typeof query[key] === 'string') {
          return item[key].toLowerCase() === query[key].toLowerCase();
        }
        return item[key] === query[key];
      });
    });
  },
  findOne: async (query = {}) => {
    const list = readData('users');
    return list.find(item => {
      return Object.keys(query).every(key => {
        if (key === 'email' && typeof item[key] === 'string' && typeof query[key] === 'string') {
          return item[key].toLowerCase() === query[key].toLowerCase();
        }
        return item[key] === query[key];
      });
    }) || null;
  },
  findById: async (id) => {
    const list = readData('users');
    return list.find(item => item._id === id) || null;
  },
  create: async (data) => {
    const list = readData('users');
    const newUser = {
      _id: uuidv4(),
      createdAt: new Date().toISOString(),
      ...data
    };
    list.push(newUser);
    writeData('users', list);
    return newUser;
  },
  findByIdAndUpdate: async (id, update) => {
    const list = readData('users');
    const index = list.findIndex(item => item._id === id);
    if (index === -1) return null;
    list[index] = { ...list[index], ...update, updatedAt: new Date().toISOString() };
    writeData('users', list);
    return list[index];
  }
};

const ProductStore = {
  find: async (query = {}) => {
    const list = readData('products');
    return list.filter(item => {
      return Object.keys(query).every(key => {
        if (key === 'status') return item[key] === query[key];
        if (typeof query[key] === 'string' && typeof item[key] === 'string') {
          return item[key].toLowerCase().includes(query[key].toLowerCase());
        }
        return item[key] === query[key];
      });
    });
  },
  findById: async (id) => {
    const list = readData('products');
    return list.find(item => item._id === id) || null;
  },
  create: async (data) => {
    const list = readData('products');
    const newProduct = {
      _id: uuidv4(),
      status: 'Active',
      createdAt: new Date().toISOString(),
      ...data
    };
    list.push(newProduct);
    writeData('products', list);
    return newProduct;
  },
  findByIdAndUpdate: async (id, update) => {
    const list = readData('products');
    const index = list.findIndex(item => item._id === id);
    if (index === -1) return null;
    list[index] = { ...list[index], ...update, updatedAt: new Date().toISOString() };
    writeData('products', list);
    return list[index];
  },
  findByIdAndDelete: async (id) => {
    const list = readData('products');
    const index = list.findIndex(item => item._id === id);
    if (index === -1) return null;
    const deleted = list[index];
    const newList = list.filter(item => item._id !== id);
    writeData('products', newList);
    return deleted;
  }
};

const DailyEntryStore = {
  find: async (query = {}) => {
    let list = readData('entries');
    return list.filter(item => {
      return Object.keys(query).every(key => {
        if (key === 'date') {
          return item.date.split('T')[0] === query.date.split('T')[0];
        }
        return item[key] === query[key];
      });
    });
  },
  findById: async (id) => {
    const list = readData('entries');
    return list.find(item => item._id === id) || null;
  },
  create: async (data) => {
    const list = readData('entries');
    const newEntry = {
      _id: uuidv4(),
      createdAt: new Date().toISOString(),
      ...data
    };
    list.push(newEntry);
    writeData('entries', list);
    return newEntry;
  },
  findByIdAndUpdate: async (id, update) => {
    const list = readData('entries');
    const index = list.findIndex(item => item._id === id);
    if (index === -1) return null;
    list[index] = { ...list[index], ...update, updatedAt: new Date().toISOString() };
    writeData('entries', list);
    return list[index];
  },
  findByIdAndDelete: async (id) => {
    const list = readData('entries');
    const index = list.findIndex(item => item._id === id);
    if (index === -1) return null;
    const deleted = list[index];
    const newList = list.filter(item => item._id !== id);
    writeData('entries', newList);
    return deleted;
  }
};

module.exports = { UserStore, ProductStore, DailyEntryStore };
