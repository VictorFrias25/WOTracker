const express = require('express')
const path = require('path')
const fs = require('fs').promises
const multer = require('multer')
const {parse} = require('csv-parse/sync')
const { error } = require('console')

const app = express()
const port = 3001
const memStorage = multer.memoryStorage()
const upload = multer({ storage: memStorage })
app.use(express.json())
app.use(express.static(path.join(__dirname, './public')))
const woFilePath = path.join(__dirname, './db/WODB.json')

let workorderJSON = []

async function loadWorkorders(){
    try{
        const data = await fs.readFile(woFilePath, 'utf-8')
        workorderJSON = JSON.parse(data)
    } catch (err){
        console.error(`Load Error: ${err}`)
        workorderJSON = []
    }
}

loadWorkorders()

//work order list route
app.get('/api/wo', async (req, res) => {
    try{
        // const data = await fs.readFile(woFilePath, 'utf-8')
        // let woJsonData = JSON.parse(data)
        const statusFilter = req.query.status ? String(req.query.status).toLowerCase() : null
        let resultData = workorderJSON
        if(statusFilter){
            resultData = resultData.filter(wo =>
                wo.status?.toLowerCase() === statusFilter
            )
        }
        res.json(resultData)
    } catch (err) {
        console.error(`Read Error: ${err}`)
        res.status(500).send(`Error reading or parsing JSON data`)
    }
}
)   

app.put('/api/wo/:wo_number', async (req, res) => {
    try{
        // const data = await fs.readFile(woFilePath, 'utf-8')
        // let woJSONData = JSON.parse(data)

        const woNum = req.params.wo_number
        const updatedData = req.body

        const woIndex = workorderJSON.findIndex(item => String(item.wo_number) === String(woNum))

        if(woIndex !== -1){
            workorderJSON[woIndex] = { ...workorderJSON[woIndex], ...updatedData}
            await fs.writeFile(woFilePath, JSON.stringify(workorderJSON, null, 2), "utf-8")
            res.json(workorderJSON[woIndex])
        } else {
            res.status(404).json({error: "workorder not found"})
        }
    } catch (err){
        console.error(`Update Error: ${err}`)
        res.status(500).send(`Error updating workorder`)
    }
})

app.delete('/api/wo/:wo_number', async (req, res) => {
    try{
        const woNum = req.params.wo_number
        const woIndex = workorderJSON.findIndex(item => String(item.wo_number) === String(woNum))

        if(woIndex !== -1){
            const deletedWO = workorderJSON.splice(woIndex, 1)
            await fs.writeFile(woFilePath, JSON.stringify(workorderJSON, null, 2), "utf-8")
            res.json({message: `Work order ${woNum} deleted successfully`, deleted: deletedWO[0]})
        } else {
            res.status(404).json({error: "workorder not found"})
        }
    } catch (err){
        console.error(`Delete Error: ${err}`)
        res.status(500).send(`Error deleting workorder`)
    }
})

//work order status change route
// app.put('/api/wo/:wo_number', (req, res) => {
//     fs.readFile(woFilePath, 'utf8', (err, data) => {
//         if (err) {
//             console.error(err)
//             return res.status(500).send(`Error reading file`)
//         }
//         try {
//             const woJsonData = JSON.parse(data)
//             const woNum = req.params.wo_number
//             const updatedData = req.body

//             const woIndex = woJsonData.findIndex(item => item.wo_number === woNum)

//             if (woIndex !== -1) {
//                 woJsonData[woIndex] = { ...woJsonData[woIndex], ...updatedData }
//                 fs.writeFileSync(woFilePath, JSON.stringify(woJsonData, null, 2))
//                 res.json(woJsonData[woIndex])
//             } else {
//                 res.status(404).json({ error: `Work order not found` })
//             }
//         } catch (parseErr) {
//             console.error(parseErr)
//             res.status(500).send(`Error parsing JSON data`)
//         }
//     })
// })

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


        const deDuplicatingWOs = Array.from(
            new Map(cleanedWorkorders.map(item => [String(item.wo_number), item])).values())

        // let existingData = []
        // try{
        //     const jsonRaw = await fs.readFile(woFilePath, `utf-8`)
        //     existingData = JSON.parse(jsonRaw)
        // } catch (error) {
        //     if (error.code !== 'ENOENT') throw error
        // }
        const existingWO = new Set(workorderJSON.map(item => String(item.wo_number)))
        const uniqueNewWO = deDuplicatingWOs.filter(record => !existingWO.has(String(record.wo_number)))

        if(uniqueNewWO.length === 0) 
            return res.json({ message: `No new work orders found.`, added: 0})

        workorderJSON = workorderJSON.concat(uniqueNewWO)
        await fs.writeFile(woFilePath, JSON.stringify(workorderJSON, null, 2), `utf-8`)

        res.json({
            message: `Success, added ${uniqueNewWO.length} new workorders`,
            stats: {
                recieved: cleanedWorkorders.length,
                added: uniqueNewWO.length,
                ignored: cleanedWorkorders.length - uniqueNewWO.length
            }
        })
    } catch (err) {
        console.error(err)
        res.status(500).send(`Error processing CSV file.`)
    }
})

app.listen(port, () =>
   console.log(`Express server running @ http://localhost:${port}`)
)