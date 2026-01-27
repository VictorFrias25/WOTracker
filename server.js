const express = require('express')
const path = require('path')
const fs = require('fs').promises
const multer = require('multer')
const {parse} = require('csv-parse/sync')
const db = require('./db')
const { error } = require('console')

const app = express()
const port = 3001
const memStorage = multer.memoryStorage()
const upload = multer({ storage: memStorage })
app.use(express.json())
app.use(express.static(path.join(__dirname, './public')))
//const woFilePath = path.join(__dirname, './db/WODB.json')

// let workorderJSON = []

// async function loadWorkorders(){
//     try{
//         const data = await fs.readFile(woFilePath, 'utf-8')
//         workorderJSON = JSON.parse(data)
//     } catch (err){
//         console.error(`Load Error: ${err}`)
//         workorderJSON = []
//     }
// }

// loadWorkorders()

//work order list route
app.get('/api/wo', async (req, res) => {
    try{
        const stmt = db.prepare('SELECT * FROM workorders')
        const workorders = stmt.all()
        res.json(workorders)
    } catch (err){
        console.error(`DB Fetch Error: ${err}`)
        res.status(500).send(`Error fetching workorders from database`)
    }
})

app.post('/api/wo/:wo_number/complete', async (req, res) => {
    const woNum = req.params.wo_number
    const now = new Date().toISOString()
    try{
        const info = db.prepare(`
            UPDATE workorders
            SET status = ?, date_completed = ?
            WHERE wo_number = ?
        `).run('Completed', now, woNum)
        if(info.changes > 0)
            res.sendStatus(200)
        else
            res.status(404).json({error: "workorder not found"})
    } catch (err){
        console.error(`Update Error: ${err}`)
        res.status(500).send(`Error updating workorder`)
    }
})

app.post('/api/wo/:wo_number/archive', async (req, res) => {
    const woNum = req.params.wo_number
    try{
        const info = db.prepare(`
            UPDATE workorders
            SET status = ?
            WHERE wo_number = ?
        `).run('Archived', woNum)
        if(info.changes > 0)
            res.sendStatus(200)
        else
            res.status(404).json({error: "workorder not found"})
    } catch (err){
        console.error(`Update Error: ${err}`)
        res.status(500).send(`Error updating workorder`)
    }
})


app.post('/api/importWOCSV', upload.single('csvFile'), async (req, res) => {
    try{
        if (!req.file)
         return res.status(400).send(`No  file uploaded.`)

        const rawCSV = req.file.buffer.toString(`utf-8`)
        const rawWorkorders = parse(rawCSV, {
            columns: true,
            skip_empty_lines: true,
            from_line: 4,
            trim: true,
            relax_column_count: true
        })

        const cleanedWorkorders = rawWorkorders
            //.filter(row => row.EIncidentID && !row.EIncidentID.includes('EIncident'))
            .filter(row => {
                return row.EIncidentID && !isNaN(row.EIncidentID)
            })
            .map(row => ({
                wo_number: row.EIncidentID,
                username: row.ECustomerID,
                first_name: row.FirstName,
                last_name: row.LastName,
                facility: row.EFacilityIDIncident,
                room: row.RoomIncident,
                date_opened: row.InsertedDT,
                status: row.EStatusID,
                info_description: row.RequestDescription
            }))


        const insert = db.prepare(`
            INSERT OR IGNORE INTO workorders (
                wo_number, username, first_name, last_name,
                facility, room, date_opened, status, info_description
                ) VALUES ( 
                @wo_number, @username, @first_name, @last_name,
                @facility, @room, @date_opened, @status, @info_description 
                )
            `)

            let addedCount = 0
            const insertMany = db.transaction((workorders) => {
                for (const wo of workorders) {
                    const info = insert.run(wo)
                    if(info.changes > 0)
                        addedCount++
                }
            })
            insertMany(cleanedWorkorders)

        res.json({ message: `Import complete. ${addedCount} new workorders added.`, 
        stats: { totalProcessed: cleanedWorkorders.length, totalAdded: addedCount, ignored: cleanedWorkorders.length - addedCount }
        })
    } catch (err) {
        console.error(err)
        res.status(500).send(`Error processing CSV file.`)
    }
})

app.listen(port, () =>
   console.log(`Express server running @ http://localhost:${port}`)
)