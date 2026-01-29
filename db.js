const Database = require('better-sqlite3')
const db = new Database('./db/workorders.db', { verbose: console.log })

db.exec(`
CREATE TABLE IF NOT EXISTS workorders (
    wo_number TEXT PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    facility TEXT,
    room TEXT,
    date_opened TEXT,
    status TEXT,
    info_description TEXT,
    date_completed TEXT DEFAULT NULL,
    technician_id INTEGER DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS technicians (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    password_hash TEXT
);
`)

module.exports = db