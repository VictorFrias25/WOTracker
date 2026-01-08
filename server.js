const express = require('express')
const path = require('path')
const fs = require('fs')

const app = express()
const port = 3001

const woFilePath = path.join(__dirname, './db/WODB.json')

app.get('/', (req, res) => res.send('Welcome to WOTracker. nav to /wo'))

//work order route
app.get('/wo', (req, res) => 
    fs.readFile(woFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err)
            return res.status(500).send(`Error reading file`)
        }
        try {
            const woJsonData = JSON.parse(data)
            res.json(woJsonData)
        }
        catch(parseErr) {
            console.error(parseErr)
            res.status(500).send(`Error parsing JSON data`)
        }
    })
)

app.listen(port, () =>
   console.log(`Express server running @ https://localhost:${port}`)
)