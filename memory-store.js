const fs = require('fs');
const path = require('path');

class MemoryStore {
  constructor(filePath) {
    this.filePath = filePath || path.join(process.cwd(), 'data', 'mefamdev.json');
    this.data = {
      staff: [],
      applications: [],
      families: [],
      events: [],
      event_attendance: [],
      absences: [],
      grades: [],
      fund_log: [],
      disbursements: [],
      intake_sheets: [],
      assessments: [],
      announcements: []
    };
    this.ensureDirectory();
    this.load();
  }

  ensureDirectory() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        if (raw) {
          const parsed = JSON.parse(raw);
          this.data = { ...this.data, ...parsed };
        }
      }
    } catch (error) {
      console.warn('Using fresh JSON store because persistence file could not be read:', error.message);
    }
  }

  save() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
  }

  prepare(query) {
    return new QueryBuilder(this, query);
  }

  exec() {
    return this;
  }

  pragma() {
    return this;
  }

  close() {
    this.save();
  }
}

class QueryBuilder {
  constructor(store, query) {
    this.store = store;
    this.query = query.trim();
  }

  get(params) {
    return this.all(params)[0];
  }

  all(params) {
    const table = this.detectTable();
    if (!table) return [];

    const rows = this.getRowsForTable(table);
    const normalizedParams = this.normalizeParams(params);
    const upper = this.query.toUpperCase();

    if (upper.includes('COUNT(*)')) {
      return [{ c: this.filterRows(rows, normalizedParams).length }];
    }

    if (upper.includes('SUM(')) {
      const field = this.extractSumField();
      const total = this.filterRows(rows, normalizedParams).reduce((sum, row) => sum + (Number(row[field]) || 0), 0);
      return [{ total }];
    }

    return this.filterRows(rows, normalizedParams);
  }

  run(...args) {
    const table = this.detectTable();
    if (!table) return { lastInsertRowid: 1, changes: 0 };

    const upper = this.query.toUpperCase();
    const rows = this.getRowsForTable(table);

    if (upper.includes('INSERT')) {
      const values = this.normalizeParams(args[0] !== undefined ? args[0] : args);
      const item = this.buildInsertItem(table, values);
      if (upper.includes('OR IGNORE')) {
        const conflictColumn = this.detectUniqueColumn(table, values);
        if (conflictColumn && rows.some(row => row[conflictColumn] === item[conflictColumn])) {
          return { lastInsertRowid: rows.find(row => row[conflictColumn] === item[conflictColumn]).id, changes: 0 };
        }
      }
      rows.push(item);
      this.store.data[table] = rows;
      this.store.save();
      return { lastInsertRowid: item.id, changes: 1 };
    }

    if (upper.includes('UPDATE')) {
      const setColumns = this.parseSetColumns();
      const whereClause = this.parseWhereConditions();
      const values = this.normalizeParams(args);
      let changed = 0;
      rows.forEach(row => {
        if (this.matchesWhere(row, whereClause, values)) {
          setColumns.forEach((column, index) => {
            row[column] = values[index];
          });
          changed += 1;
        }
      });
      this.store.data[table] = rows;
      this.store.save();
      return { changes: changed };
    }

    if (upper.includes('DELETE')) {
      const whereClause = this.parseWhereConditions();
      const values = this.normalizeParams(args);
      const filtered = rows.filter(row => !this.matchesWhere(row, whereClause, values));
      this.store.data[table] = filtered;
      this.store.save();
      return { changes: rows.length - filtered.length };
    }

    return { lastInsertRowid: 1, changes: 0 };
  }

  detectTable() {
    const match = this.query.match(/from\s+([a-z_]+)/i) || this.query.match(/into\s+([a-z_]+)/i) || this.query.match(/update\s+([a-z_]+)/i) || this.query.match(/delete\s+from\s+([a-z_]+)/i);
    return match ? match[1] : null;
  }

  getRowsForTable(table) {
    if (!Array.isArray(this.store.data[table])) {
      this.store.data[table] = [];
    }
    return this.store.data[table];
  }

  normalizeParams(params) {
    if (params === undefined || params === null) return {};
    if (Array.isArray(params)) return params;
    if (typeof params === 'object') return params;
    return { value: params };
  }

  filterRows(rows, params) {
    const whereClause = this.parseWhereConditions();
    if (!whereClause.length) return rows;
    return rows.filter(row => this.matchesWhere(row, whereClause, params));
  }

  parseWhereConditions() {
    const clauses = [];
    const whereMatch = this.query.match(/where\s+(.+)/i);
    if (!whereMatch) return clauses;

    const fragments = whereMatch[1].split(/\s+and\s+/i).map(part => part.trim()).filter(Boolean);
    fragments.forEach(fragment => {
      const simpleMatch = fragment.match(/([a-z_]+)\s*=\s*(?:'([^']+)'|"([^"]+)"|(\?))/i);
      if (simpleMatch) {
        clauses.push({ column: simpleMatch[1], value: simpleMatch[2] || simpleMatch[3] || simpleMatch[4] });
      }
    });

    return clauses;
  }

  matchesWhere(row, whereClause, params) {
    if (!whereClause.length) return true;
    const values = Array.isArray(params) ? params : [params];
    return whereClause.every((clause, index) => {
      const expected = clause.value === '?' ? values[index] : clause.value;
      return row[clause.column] === expected;
    });
  }

  parseSetColumns() {
    const match = this.query.match(/set\s+(.+?)\s+where/i);
    if (!match) return [];
    return match[1].split(',').map(part => part.trim().split('=')[0].trim());
  }

  detectUniqueColumn(table, values) {
    if (table === 'staff' && values.username !== undefined) return 'username';
    return null;
  }

  buildInsertItem(table, values) {
    const columnsMatch = this.query.match(/insert\s+into\s+[a-z_]+\s*\(([^)]+)\)/i);
    const columns = columnsMatch ? columnsMatch[1].split(',').map(col => col.trim()) : [];

    const item = { id: this.nextId(table) };
    if (Array.isArray(values)) {
      columns.forEach((column, index) => {
        item[column] = values[index];
      });
      return item;
    }

    if (columns.length) {
      columns.forEach(column => {
        if (values[column] !== undefined) item[column] = values[column];
      });
    } else {
      Object.keys(values).forEach(key => {
        item[key] = values[key];
      });
    }

    return item;
  }

  nextId(table) {
    const rows = this.getRowsForTable(table);
    return (rows[rows.length - 1]?.id || 0) + 1;
  }

  extractSumField() {
    const match = this.query.match(/sum\(([^)]+)\)/i);
    return match ? match[1].trim() : 'amount';
  }
}

module.exports = new MemoryStore(process.env.DB_PATH || process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'mefamdev.json'));
