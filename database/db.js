require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

function getSsl() {
  const url = process.env.DATABASE_URL || '';
  if (!url || url.includes('localhost') || url.includes('127.0.0.1')) return false;
  return { rejectUnauthorized: false };
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: getSsl(),
});

function formatDates(obj) {
  if (!obj) return null;
  const out = { ...obj };
  for (const key of Object.keys(out)) {
    if (out[key] instanceof Date) out[key] = out[key].toISOString().slice(0, 10);
  }
  return out;
}

const db = {
  async get(sql, params = []) {
    const { rows } = await pool.query(sql, params);
    return formatDates(rows[0] || null);
  },

  async all(sql, params = []) {
    const { rows } = await pool.query(sql, params);
    return rows.map(formatDates);
  },

  async run(sql, params = []) {
    const { rows } = await pool.query(sql, params);
    return rows[0] || {};
  },

  async init() {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    const statements = schema.split(';').map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      await pool.query(stmt);
    }
  },
};

module.exports = db;
