const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class JsonTable {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(DATA_DIR, `${name}.json`);
    this.cache = null;
    this._load();
  }

  _load() {
    try {
      if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(this.filePath, JSON.stringify([]), 'utf-8');
        this.cache = [];
      } else {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.cache = raw ? JSON.parse(raw) : [];
      }
    } catch (err) {
      console.error(`Error loading table ${this.name}:`, err);
      this.cache = [];
    }
  }

  _save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.cache, null, 2), 'utf-8');
    } catch (err) {
      console.error(`Error saving table ${this.name}:`, err);
    }
  }

  async findMany(predicate = () => true) {
    if (typeof predicate === 'object') {
      const criteria = predicate;
      return this.cache.filter(item => {
        return Object.entries(criteria).every(([k, v]) => item[k] === v);
      });
    }
    return this.cache.filter(predicate);
  }

  async findOne(predicate) {
    if (typeof predicate === 'object') {
      const criteria = predicate;
      return this.cache.find(item => {
        return Object.entries(criteria).every(([k, v]) => item[k] === v);
      }) || null;
    }
    return this.cache.find(predicate) || null;
  }

  async findById(idKey, idVal) {
    return this.cache.find(item => item[idKey] === idVal) || null;
  }

  async create(record) {
    const item = { ...record };
    this.cache.push(item);
    this._save();
    return item;
  }

  async createMany(records) {
    this.cache.push(...records);
    this._save();
    return records;
  }

  async update(predicate, updates) {
    let target = null;
    if (typeof predicate === 'object') {
      const criteria = predicate;
      target = this.cache.find(item => {
        return Object.entries(criteria).every(([k, v]) => item[k] === v);
      });
    } else if (typeof predicate === 'function') {
      target = this.cache.find(predicate);
    }

    if (!target) return null;
    Object.assign(target, updates);
    this._save();
    return target;
  }

  async delete(predicate) {
    let index = -1;
    if (typeof predicate === 'object') {
      const criteria = predicate;
      index = this.cache.findIndex(item => {
        return Object.entries(criteria).every(([k, v]) => item[k] === v);
      });
    } else if (typeof predicate === 'function') {
      index = this.cache.findIndex(predicate);
    }

    if (index === -1) return false;
    this.cache.splice(index, 1);
    this._save();
    return true;
  }

  async deleteMany(predicate) {
    const initialLen = this.cache.length;
    if (typeof predicate === 'object') {
      const criteria = predicate;
      this.cache = this.cache.filter(item => {
        return !Object.entries(criteria).every(([k, v]) => item[k] === v);
      });
    } else if (typeof predicate === 'function') {
      this.cache = this.cache.filter(item => !predicate(item));
    }
    const deletedCount = initialLen - this.cache.length;
    if (deletedCount > 0) {
      this._save();
    }
    return deletedCount;
  }

  async count(predicate = () => true) {
    const list = await this.findMany(predicate);
    return list.length;
  }
}

const db = {
  users: new JsonTable('users'),
  sessions: new JsonTable('sessions'),
  questions: new JsonTable('questions'),
  candidate_attempts: new JsonTable('candidate_attempts'),
  candidate_answers: new JsonTable('candidate_answers'),
  candidate_events: new JsonTable('candidate_events')
};

module.exports = db;
