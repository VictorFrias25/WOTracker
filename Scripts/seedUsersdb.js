const db = require(`../db`)
const bcrypt = require('bcrypt')

const users = [
    { username: 'tech1', password: '!P455W0Rd#' },
    { username: 'tech2', password: '#P@ssw0rd!' }
]

const insert = db.prepare(`
    INSERT OR IGNORE INTO technicians (username, password_hash) 
    VALUES (?, ?)
    `)

for (const user of users) {
    const password_hash = bcrypt.hashSync(user.password, 10)
    insert.run(user.username, password_hash)
}

console.log('Seeded technicians table with default users.')