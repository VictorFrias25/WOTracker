const express = require('express')
const path = require('path')
const fs = require('fs')

const app = express()
const port = 3001
app.use(express.json())
app.use(express.static(path.join(__dirname, './public')))
const woFilePath = path.join(__dirname, './db/WODB.json')

//app.get('/', (req, res) => res.send('Welcome to WOTracker. nav to /wo'))

//work order list route
app.get('/api/wo', (req, res) => 
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

//work order status change route
app.put('/api/wo/:wo_number', (req, res) => {
    fs.readFile(woFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err)
            return res.status(500).send(`Error reading file`)
        }
        try {
            const woJsonData = JSON.parse(data)
            const woNum = req.params.wo_number
            const updatedData = req.body

            const woIndex = woJsonData.findIndex(item => item.wo_number === woNum)

            if (woIndex !== -1) {
                woJsonData[woIndex] = { ...woJsonData[woIndex], ...updatedData }
                fs.writeFileSync(woFilePath, JSON.stringify(woJsonData, null, 2))
                res.json(woJsonData[woIndex])
            } else {
                res.status(404).json({ error: `Work order not found` })
            }
        } catch (parseErr) {
            console.error(parseErr)
            res.status(500).send(`Error parsing JSON data`)
        }
    })
})

app.listen(port, () =>
   console.log(`Express server running @ https://localhost:${port}`)
)