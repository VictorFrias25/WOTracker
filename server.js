const express = require('express')
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const {parse} = require('csv-parse/sync')

const app = express()
const port = 3001
const memStorage = multer.memoryStorage()
const upload = multer({ storage: memStorage })
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

app.post('/api/importWO', upload.single('csvFile'), async (req, res) => {
    try{
        if (!req.file)
         return res.status(400).send(`No  file uploaded.`)

        const csvRaw = req.file.buffer.toString(`utf-8`)
        const newRecords = parse(csvRaw, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        })

        let existingData = []
        try{
            const jsonRaw = await fs.readFile(woFilePath, `utf-8`)
            existingData = JSON.parse(jsonRaw)
        } catch (error) {
            if (error.code !== 'ENOENT') throw error
        }
        const existingWO = new Set(existingData.map(item => item.wo_number))
        const uniqueNewWO = newRecords.filter(record => !existingWO.has(record.wo_number))

        if(uniqueNewWO.length === 0) 
            return res.json({ message: `No new work orders found.`, added: 0})

        const updatedJSONData = existingData.concat(uniqueNewWO)
        await fs.writeFile(woFilePath, JSON.stringify(updatedJSONData, null, 2), `utf-8`)

        res.json({
            message: `Success, added ${uniqueNewWO.length} new workorders`,
            ignored: newRecords.length - uniqueNewWO.length
        })
    } catch (err) {
        console.error(err)
        res.status(500).send(`Error processing CSV file.`)
    }
})

app.listen(port, () =>
   console.log(`Express server running @ https://localhost:${port}`)
)