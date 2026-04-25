const fs = require('fs/promises');
const path = require('path');
const pool = require('../utils/db');
const logger = require('../utils/logger');
const { encryptText, decryptText } = require('../utils/secureStorage');

const DEFAULT_OWNER = 'webui';
const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE_STORE_PATH = path.join(DATA_DIR, 'mail_accounts.json');

let initialized = false;
let storageMode = 'db';

const normalizeItem = (item = {}) => ({
  email: String(item.email || '').trim(),
  password: String(item.password || ''),
  client_id: String(item.client_id || '').trim(),
  refresh_token: String(item.refresh_token || ''),
  note: String(item.note || ''),
  tokenStatus: String(item.tokenStatus || '未检测'),
});

const ensureFileStore = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(FILE_STORE_PATH);
  } catch (_error) {
    await fs.writeFile(FILE_STORE_PATH, '[]', 'utf8');
  }
};

const readFileRows = async () => {
  await ensureFileStore();
  const content = await fs.readFile(FILE_STORE_PATH, 'utf8');
  try {
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [];
  } catch (_error) {
    return [];
  }
};

const writeFileRows = async (rows) => {
  await ensureFileStore();
  await fs.writeFile(FILE_STORE_PATH, JSON.stringify(rows, null, 2), 'utf8');
};

const initTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS mail_accounts (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      owner_id VARCHAR(64) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password_enc TEXT NOT NULL,
      client_id VARCHAR(255) NOT NULL,
      refresh_token_enc LONGTEXT NOT NULL,
      note VARCHAR(500) DEFAULT '',
      token_status VARCHAR(32) DEFAULT '未检测',
      is_deleted TINYINT(1) DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_owner_email (owner_id, email),
      KEY idx_owner_updated (owner_id, updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

const ensureStorage = async () => {
  if (initialized) return;

  try {
    await initTable();
    storageMode = 'db';
    logger.info('Account storage initialized with MySQL');
  } catch (error) {
    storageMode = 'file';
    await ensureFileStore();
    logger.warn(`MySQL unavailable for account storage, fallback to file store: ${error.message}`);
  }

  initialized = true;
};

const mapRowsToAccounts = (rows) => rows.map((row) => ({
  email: row.email,
  password: decryptText(row.password_enc),
  client_id: row.client_id,
  refresh_token: decryptText(row.refresh_token_enc),
  note: row.note || '',
  tokenStatus: row.token_status || '未检测',
}));

const listAccountsByDb = async (ownerId) => {
  const [rows] = await pool.query(
    `SELECT email, password_enc, client_id, refresh_token_enc, note, token_status
     FROM mail_accounts
     WHERE owner_id = ? AND is_deleted = 0
     ORDER BY updated_at DESC`,
    [ownerId]
  );
  return mapRowsToAccounts(rows);
};

const listAccountsByFile = async (ownerId) => {
  const rows = await readFileRows();
  const filtered = rows.filter((row) => row.owner_id === ownerId && !row.is_deleted);
  return mapRowsToAccounts(filtered);
};

const replaceAccountsByDb = async (cleanList, ownerId) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('UPDATE mail_accounts SET is_deleted = 1 WHERE owner_id = ?', [ownerId]);

    for (const item of cleanList) {
      await conn.query(
        `INSERT INTO mail_accounts (owner_id, email, password_enc, client_id, refresh_token_enc, note, token_status, is_deleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)
         ON DUPLICATE KEY UPDATE
           password_enc = VALUES(password_enc),
           client_id = VALUES(client_id),
           refresh_token_enc = VALUES(refresh_token_enc),
           note = VALUES(note),
           token_status = VALUES(token_status),
           is_deleted = 0`,
        [
          ownerId,
          item.email,
          encryptText(item.password),
          item.client_id,
          encryptText(item.refresh_token),
          item.note,
          item.tokenStatus,
        ]
      );
    }

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const replaceAccountsByFile = async (cleanList, ownerId) => {
  const rows = await readFileRows();
  const remainRows = rows.filter((row) => row.owner_id !== ownerId);
  const nextRows = cleanList.map((item) => ({
    owner_id: ownerId,
    email: item.email,
    password_enc: encryptText(item.password),
    client_id: item.client_id,
    refresh_token_enc: encryptText(item.refresh_token),
    note: item.note,
    token_status: item.tokenStatus,
    is_deleted: 0,
    updated_at: new Date().toISOString(),
  }));
  await writeFileRows(remainRows.concat(nextRows));
};

const listAccounts = async (ownerId = DEFAULT_OWNER) => {
  await ensureStorage();
  return storageMode === 'db' ? listAccountsByDb(ownerId) : listAccountsByFile(ownerId);
};

const replaceAccounts = async (list = [], ownerId = DEFAULT_OWNER) => {
  await ensureStorage();
  const cleanList = list.map(normalizeItem).filter((item) => item.email);
  if (storageMode === 'db') {
    await replaceAccountsByDb(cleanList, ownerId);
  } else {
    await replaceAccountsByFile(cleanList, ownerId);
  }
  return cleanList.length;
};

const getStorageMode = () => storageMode;

module.exports = {
  listAccounts,
  replaceAccounts,
  getStorageMode,
};
