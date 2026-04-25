const pool = require('../utils/db');
const { encryptText, decryptText } = require('../utils/secureStorage');

const DEFAULT_OWNER = 'webui';
let initialized = false;

const normalizeItem = (item = {}) => ({
  email: String(item.email || '').trim(),
  password: String(item.password || ''),
  client_id: String(item.client_id || '').trim(),
  refresh_token: String(item.refresh_token || ''),
  note: String(item.note || ''),
  tokenStatus: String(item.tokenStatus || '未检测'),
});

const initTable = async () => {
  if (initialized) return;

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

  initialized = true;
};

const listAccounts = async (ownerId = DEFAULT_OWNER) => {
  await initTable();
  const [rows] = await pool.query(
    `SELECT email, password_enc, client_id, refresh_token_enc, note, token_status
     FROM mail_accounts
     WHERE owner_id = ? AND is_deleted = 0
     ORDER BY updated_at DESC`,
    [ownerId]
  );

  return rows.map((row) => ({
    email: row.email,
    password: decryptText(row.password_enc),
    client_id: row.client_id,
    refresh_token: decryptText(row.refresh_token_enc),
    note: row.note || '',
    tokenStatus: row.token_status || '未检测',
  }));
};

const replaceAccounts = async (list = [], ownerId = DEFAULT_OWNER) => {
  await initTable();
  const cleanList = list.map(normalizeItem).filter((item) => item.email);

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
    return cleanList.length;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

module.exports = {
  listAccounts,
  replaceAccounts,
};
