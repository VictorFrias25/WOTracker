const db = require(`../db`)
const bcrypt = require('bcrypt')
const readline = require('readline')

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const ask = (query) => new Promise((resolve) => rl.question(query, resolve))

async function main() {
    console.log('--- Add New Technician ---')

    try {
        const username = await ask('Enter Username: ')
        if (!username) {
            console.log('Username cannot be empty.')
            process.exit(0)
        }

        const password = await ask('Enter Password: ')
        if (password.length < 8) {
            console.log('Warning: Password is quite short.')
        }

        const confirm = await ask(`Create user "${username}"? (y/n): `)

        if (confirm.toLowerCase() === 'y') {
            const hash = bcrypt.hashSync(password, 10)
            
            const insert = db.prepare(`
                INSERT INTO technicians (username, password_hash) 
                VALUES (?, ?)
            `)

            insert.run(username, hash)
            console.log(`\nSuccess: Technician "${username}" has been added.`)
        } else {
            console.log('\nOperation cancelled.')
        }
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            console.error('\nError: That username already exists.')
        } else {
            console.error('\nAn error occurred:', err.message)
        }
    } finally {
        rl.close()
    }
}

main()