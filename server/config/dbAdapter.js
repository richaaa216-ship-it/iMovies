const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const {
  seedAdmin,
  seedUser,
  seedMovies,
  seedTheatres,
  seedShows,
  seedReviews,
  seedFavorites
} = require('../data/seedData');

const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');

// In-memory collection storage
const memoryStore = {
  Admin: [],
  User: [],
  Movie: [],
  Theatre: [],
  Show: [],
  Booking: [],
  Transaction: [],
  Favorite: [],
  Review: []
};

let isInitialized = false;

/**
 * Persist memory store to disk safely
 */
function saveToDisk() {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryStore, null, 2), 'utf8');
  } catch (err) {
    console.error('[dbAdapter] Error persisting db.json:', err.message);
  }
}

/**
 * Initialize database from file or seed data
 */
function initDb() {
  if (isInitialized) return;

  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      const loaded = JSON.parse(content);
      Object.keys(memoryStore).forEach((key) => {
        memoryStore[key] = loaded[key] || [];
      });
      console.log('[dbAdapter] Loaded persisted database from disk.');
    }
  } catch (err) {
    console.warn('[dbAdapter] Could not load db.json, initializing fresh store:', err.message);
  }

  // Seed if empty
  if (memoryStore.Admin.length === 0) memoryStore.Admin.push({ ...seedAdmin });
  if (memoryStore.User.length === 0) memoryStore.User.push({ ...seedUser });
  if (memoryStore.Movie.length === 0) memoryStore.Movie.push(...seedMovies.map((m) => ({ ...m })));
  if (memoryStore.Theatre.length === 0) memoryStore.Theatre.push(...seedTheatres.map((t) => ({ ...t })));
  if (memoryStore.Show.length === 0) memoryStore.Show.push(...seedShows.map((s) => ({ ...s })));
  if (memoryStore.Review.length === 0) memoryStore.Review.push(...seedReviews.map((r) => ({ ...r })));
  if (memoryStore.Favorite.length === 0) memoryStore.Favorite.push(...seedFavorites.map((f) => ({ ...f })));

  saveToDisk();
  isInitialized = true;
  console.log('[dbAdapter] In-memory persistence engine initialized with Prime Video catalog.');
}

/**
 * Resolve a nested key like 'tickets.A1.status'
 */
function getNestedValue(obj, keyPath) {
  if (!obj || !keyPath) return undefined;
  if (!keyPath.includes('.')) return obj[keyPath];
  const parts = keyPath.split('.');
  let current = obj;
  for (const p of parts) {
    if (current == null) return undefined;
    current = current[p];
  }
  return current;
}

/**
 * Set a nested key
 */
function setNestedValue(obj, keyPath, val) {
  if (!obj || !keyPath) return;
  const parts = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!current[p] || typeof current[p] !== 'object') {
      current[p] = {};
    }
    current = current[p];
  }
  current[parts[parts.length - 1]] = val;
}

/**
 * Match a single item against Mongo filter
 */
function matchFilter(item, filter = {}) {
  if (!filter || Object.keys(filter).length === 0) return true;

  for (const [key, val] of Object.entries(filter)) {
    if (key === '$or' && Array.isArray(val)) {
      const anyMatch = val.some((sub) => matchFilter(item, sub));
      if (!anyMatch) return false;
      continue;
    }

    if (key === '$and' && Array.isArray(val)) {
      const allMatch = val.every((sub) => matchFilter(item, sub));
      if (!allMatch) return false;
      continue;
    }

    const itemVal = getNestedValue(item, key);

    // Filter value is RegExp or $regex object
    if (val instanceof RegExp) {
      if (itemVal == null || !val.test(String(itemVal))) return false;
      continue;
    }

    if (val && typeof val === 'object' && val.$regex) {
      const regex = new RegExp(val.$regex, val.$options || '');
      if (itemVal == null || !regex.test(String(itemVal))) return false;
      continue;
    }

    // $in operator
    if (val && typeof val === 'object' && Array.isArray(val.$in)) {
      const matches = Array.isArray(itemVal)
        ? itemVal.some((v) => val.$in.includes(v))
        : val.$in.includes(itemVal) || val.$in.includes(String(itemVal));
      if (!matches) return false;
      continue;
    }

    // $nin operator
    if (val && typeof val === 'object' && Array.isArray(val.$nin)) {
      if (val.$nin.includes(itemVal)) return false;
      continue;
    }

    // $ne operator
    if (val && typeof val === 'object' && '$ne' in val) {
      if (String(itemVal) === String(val.$ne)) return false;
      continue;
    }

    // $gte, $lte, $gt, $lt
    if (val && typeof val === 'object' && ('$gt' in val || '$lt' in val || '$gte' in val || '$lte' in val)) {
      const compVal = itemVal instanceof Date ? itemVal.getTime() : itemVal;
      if ('$gt' in val && !(compVal > val.$gt)) return false;
      if ('$gte' in val && !(compVal >= val.$gte)) return false;
      if ('$lt' in val && !(compVal < val.$lt)) return false;
      if ('$lte' in val && !(compVal <= val.$lte)) return false;
      continue;
    }

    // Array contains value or exact equality
    if (Array.isArray(itemVal)) {
      if (!itemVal.includes(val)) return false;
      continue;
    }

    // ID or string comparison
    if (key === '_id' || key === 'id') {
      if (String(itemVal) !== String(val)) return false;
      continue;
    }

    if (itemVal !== val && String(itemVal) !== String(val)) {
      return false;
    }
  }

  return true;
}

/**
 * Apply MongoDB style update ops
 */
function applyUpdate(item, update = {}) {
  if (!update) return item;

  // $set
  if (update.$set) {
    for (const [k, v] of Object.entries(update.$set)) {
      setNestedValue(item, k, v);
    }
  }

  // $unset
  if (update.$unset) {
    for (const k of Object.keys(update.$unset)) {
      if (k.includes('.')) {
        const parts = k.split('.');
        let cur = item;
        for (let i = 0; i < parts.length - 1; i++) {
          if (cur) cur = cur[parts[i]];
        }
        if (cur) delete cur[parts[parts.length - 1]];
      } else {
        delete item[k];
      }
    }
  }

  // $push
  if (update.$push) {
    for (const [k, v] of Object.entries(update.$push)) {
      const arr = getNestedValue(item, k);
      if (Array.isArray(arr)) {
        arr.push(v);
      } else {
        setNestedValue(item, k, [v]);
      }
    }
  }

  // $pull
  if (update.$pull) {
    for (const [k, v] of Object.entries(update.$pull)) {
      const arr = getNestedValue(item, k);
      if (Array.isArray(arr)) {
        const filtered = arr.filter((x) => x !== v && String(x) !== String(v));
        setNestedValue(item, k, filtered);
      }
    }
  }

  // $inc
  if (update.$inc) {
    for (const [k, v] of Object.entries(update.$inc)) {
      const curr = Number(getNestedValue(item, k) || 0);
      setNestedValue(item, k, curr + Number(v));
    }
  }

  // Direct keys that don't start with $
  for (const [k, v] of Object.entries(update)) {
    if (!k.startsWith('$')) {
      setNestedValue(item, k, v);
    }
  }

  item.updatedAt = new Date().toISOString();
  return item;
}

/**
 * Wrap a document to give it Mongoose-like properties and methods
 */
function wrapDocument(doc, collectionName) {
  if (!doc) return null;

  const instance = { ...doc };

  Object.defineProperty(instance, 'save', {
    enumerable: false,
    value: async function () {
      this.updatedAt = new Date().toISOString();
      const list = memoryStore[collectionName];
      const index = list.findIndex((x) => String(x._id) === String(this._id));
      if (index !== -1) {
        list[index] = { ...this };
      } else {
        list.push({ ...this });
      }
      saveToDisk();
      return wrapDocument(this, collectionName);
    }
  });

  Object.defineProperty(instance, 'markModified', {
    enumerable: false,
    value: function () {
      // No-op for JS objects, tickets are directly mutated in memory
    }
  });

  Object.defineProperty(instance, 'toObject', {
    enumerable: false,
    value: function () {
      return { ...this };
    }
  });

  Object.defineProperty(instance, 'toJSON', {
    enumerable: false,
    value: function () {
      return { ...this };
    }
  });

  return instance;
}

/**
 * Generate a valid 24-character hex ObjectId
 */
function generateObjectId() {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const random = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return timestamp + random;
}

/**
 * Query Builder supporting chaining: sort, limit, skip, select, lean, exec, and then()
 */
class QueryBuilder {
  constructor(collectionName, filter = {}, single = false) {
    this.collectionName = collectionName;
    this.filter = filter;
    this.single = single;
    this.sortObj = null;
    this.limitCount = null;
    this.skipCount = 0;
    this.selectFields = null;
    this.isLean = false;
  }

  sort(sortObj) {
    this.sortObj = sortObj;
    return this;
  }

  limit(n) {
    this.limitCount = n;
    return this;
  }

  skip(n) {
    this.skipCount = n;
    return this;
  }

  select(fields) {
    this.selectFields = fields;
    return this;
  }

  lean() {
    this.isLean = true;
    return this;
  }

  async exec() {
    initDb();
    const list = memoryStore[this.collectionName] || [];
    let results = list.filter((item) => matchFilter(item, this.filter));

    // Sorting
    if (this.sortObj) {
      results.sort((a, b) => {
        for (const [key, direction] of Object.entries(this.sortObj)) {
          const valA = getNestedValue(a, key);
          const valB = getNestedValue(b, key);
          const dir = Number(direction) >= 0 ? 1 : -1;
          if (valA < valB) return -1 * dir;
          if (valA > valB) return 1 * dir;
        }
        return 0;
      });
    }

    if (this.skipCount > 0) {
      results = results.slice(this.skipCount);
    }

    if (this.limitCount != null) {
      results = results.slice(0, this.limitCount);
    }

    // Select projection
    if (this.selectFields && typeof this.selectFields === 'string') {
      const fields = this.selectFields.trim().split(/\s+/);
      const isNegative = fields.some((f) => f.startsWith('-'));

      results = results.map((item) => {
        const copy = { ...item };
        if (isNegative) {
          fields.forEach((f) => {
            if (f.startsWith('-')) delete copy[f.substring(1)];
          });
        } else {
          const projected = {};
          fields.forEach((f) => {
            projected[f] = copy[f];
          });
          if (!fields.includes('_id')) delete projected._id;
          return projected;
        }
        return copy;
      });
    }

    if (this.single) {
      const first = results[0] || null;
      return this.isLean ? first : wrapDocument(first, this.collectionName);
    }

    return this.isLean
      ? results.map((r) => ({ ...r }))
      : results.map((r) => wrapDocument(r, this.collectionName));
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }
}

/**
 * Creates an in-memory Model implementing standard Mongoose ODM methods
 */
function createLocalModel(modelName) {
  function ModelConstructor(data) {
    const doc = {
      _id: data._id || generateObjectId(),
      ...data,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString()
    };
    return wrapDocument(doc, modelName);
  }

  ModelConstructor.modelName = modelName;

  ModelConstructor.find = (filter) => new QueryBuilder(modelName, filter, false);
  ModelConstructor.findOne = (filter) => new QueryBuilder(modelName, filter, true);
  ModelConstructor.findById = (id) => new QueryBuilder(modelName, { _id: String(id) }, true);

  ModelConstructor.create = async function (docs) {
    initDb();
    const isArray = Array.isArray(docs);
    const list = isArray ? docs : [docs];
    const created = [];

    for (const d of list) {
      const doc = {
        _id: d._id || generateObjectId(),
        ...d,
        createdAt: d.createdAt || new Date().toISOString(),
        updatedAt: d.updatedAt || new Date().toISOString()
      };
      memoryStore[modelName].push(doc);
      created.push(wrapDocument(doc, modelName));
    }

    saveToDisk();
    return isArray ? created : created[0];
  };

  ModelConstructor.findByIdAndUpdate = async function (id, update, options = {}) {
    initDb();
    const list = memoryStore[modelName] || [];
    const index = list.findIndex((x) => String(x._id) === String(id));
    if (index === -1) return null;

    const updated = applyUpdate(list[index], update);
    list[index] = updated;
    saveToDisk();
    return wrapDocument(updated, modelName);
  };

  ModelConstructor.findOneAndUpdate = async function (filter, update, options = {}) {
    initDb();
    const list = memoryStore[modelName] || [];
    const index = list.findIndex((x) => matchFilter(x, filter));
    if (index === -1) {
      if (options.upsert) {
        const newDoc = {
          _id: generateObjectId(),
          ...filter,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        applyUpdate(newDoc, update);
        list.push(newDoc);
        saveToDisk();
        return wrapDocument(newDoc, modelName);
      }
      return null;
    }

    const updated = applyUpdate(list[index], update);
    list[index] = updated;
    saveToDisk();
    return wrapDocument(updated, modelName);
  };

  ModelConstructor.updateOne = async function (filter, update) {
    initDb();
    const list = memoryStore[modelName] || [];
    const index = list.findIndex((x) => matchFilter(x, filter));
    if (index === -1) return { acknowledged: true, modifiedCount: 0, matchedCount: 0 };

    list[index] = applyUpdate(list[index], update);
    saveToDisk();
    return { acknowledged: true, modifiedCount: 1, matchedCount: 1 };
  };

  ModelConstructor.updateMany = async function (filter, update) {
    initDb();
    const list = memoryStore[modelName] || [];
    let count = 0;
    for (let i = 0; i < list.length; i++) {
      if (matchFilter(list[i], filter)) {
        list[i] = applyUpdate(list[i], update);
        count++;
      }
    }
    if (count > 0) saveToDisk();
    return { acknowledged: true, modifiedCount: count, matchedCount: count };
  };

  ModelConstructor.deleteOne = async function (filter) {
    initDb();
    const list = memoryStore[modelName] || [];
    const index = list.findIndex((x) => matchFilter(x, filter));
    if (index === -1) return { acknowledged: true, deletedCount: 0 };

    list.splice(index, 1);
    saveToDisk();
    return { acknowledged: true, deletedCount: 1 };
  };

  ModelConstructor.deleteMany = async function (filter = {}) {
    initDb();
    if (!filter || Object.keys(filter).length === 0) {
      const count = (memoryStore[modelName] || []).length;
      memoryStore[modelName] = [];
      saveToDisk();
      return { acknowledged: true, deletedCount: count };
    }

    const list = memoryStore[modelName] || [];
    const remaining = list.filter((item) => !matchFilter(item, filter));
    const deletedCount = list.length - remaining.length;
    memoryStore[modelName] = remaining;
    saveToDisk();
    return { acknowledged: true, deletedCount };
  };

  ModelConstructor.findByIdAndDelete = async function (id) {
    initDb();
    const list = memoryStore[modelName] || [];
    const index = list.findIndex((x) => String(x._id) === String(id));
    if (index === -1) return null;
    const [deleted] = list.splice(index, 1);
    saveToDisk();
    return wrapDocument(deleted, modelName);
  };

  ModelConstructor.countDocuments = async function (filter = {}) {
    initDb();
    const list = memoryStore[modelName] || [];
    return list.filter((item) => matchFilter(item, filter)).length;
  };

  ModelConstructor.aggregate = async function (pipeline = []) {
    initDb();
    let results = memoryStore[modelName] || [];

    for (const stage of pipeline) {
      if (stage.$match) {
        results = results.filter((item) => matchFilter(item, stage.$match));
      }
      if (stage.$group) {
        const groups = {};
        const idField = stage.$group._id;
        const totalAmountKey = stage.$group.totalRevenue?.$sum || stage.$group.totalAmount?.$sum;

        results.forEach((item) => {
          let groupId = 'all';
          if (typeof idField === 'string' && idField.startsWith('$')) {
            groupId = item[idField.substring(1)] || 'unknown';
          }

          if (!groups[groupId]) {
            groups[groupId] = { _id: groupId, count: 0, totalRevenue: 0, totalAmount: 0 };
          }
          groups[groupId].count++;

          if (typeof totalAmountKey === 'string' && totalAmountKey.startsWith('$')) {
            const amount = Number(item[totalAmountKey.substring(1)] || 0);
            groups[groupId].totalRevenue += amount;
            groups[groupId].totalAmount += amount;
          }
        });

        results = Object.values(groups);
      }
      if (stage.$sort) {
        results.sort((a, b) => {
          for (const [k, v] of Object.entries(stage.$sort)) {
            const dir = Number(v) >= 0 ? 1 : -1;
            if (a[k] < b[k]) return -1 * dir;
            if (a[k] > b[k]) return 1 * dir;
          }
          return 0;
        });
      }
      if (stage.$limit) {
        results = results.slice(0, stage.$limit);
      }
    }

    return results;
  };

  return ModelConstructor;
}

/**
 * Returns a Proxy that forwards to Mongoose when connected,
 * or to the local in-memory store when MongoDB is offline.
 */
function getModel(modelName, mongooseModel) {
  const localModel = createLocalModel(modelName);

  return new Proxy(mongooseModel, {
    get(target, prop, receiver) {
      const isMongooseConnected = mongoose.connection && mongoose.connection.readyState === 1;

      if (isMongooseConnected) {
        const val = Reflect.get(target, prop, receiver);
        return typeof val === 'function' ? val.bind(target) : val;
      }

      // Delegate to localModel
      const localVal = Reflect.get(localModel, prop);
      if (typeof localVal === 'function') {
        return localVal.bind(localModel);
      }
      if (localVal !== undefined) {
        return localVal;
      }

      // Fallback to target
      const val = Reflect.get(target, prop, receiver);
      return typeof val === 'function' ? val.bind(target) : val;
    },

    construct(target, args) {
      const isMongooseConnected = mongoose.connection && mongoose.connection.readyState === 1;
      if (isMongooseConnected) {
        return new target(...args);
      }
      return new localModel(...args);
    }
  });
}

module.exports = {
  getModel,
  initDb,
  memoryStore,
  saveToDisk
};
