const db = require(`../db`)

const users = ['Technician1', 'Technician2']

const insert = db.prepare(`
    INSERT OR IGNORE INTO technicians (username)
    VALUES (?)
    `)

for (const user of users)
    insert.run(user)