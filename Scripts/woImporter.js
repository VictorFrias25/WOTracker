const fs = require('fs').promises;
const { parse } = require('csv-parse/sync');

async function appendCsvToJson(csvFilePath, jsonFilePath) {
    try {
        const csvRaw = await fs.readFile(csvFilePath, 'utf-8');

        const newRecords = parse(csvRaw, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        let existingData = [];
        try {
            const jsonRaw = await fs.readFile(jsonFilePath, 'utf-8');
            existingData = JSON.parse(jsonRaw);
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }

        // --- NEW LOGIC: Filter out duplicates ---

        // 1. Create a Set of existing IDs for lightning-fast lookup
        const existingIds = new Set(existingData.map(item => item.wo_number));

        // 2. Only keep records whose ID is NOT in that Set
        const uniqueNewRecords = newRecords.filter(record => !existingIds.has(record.wo_number));

        if (uniqueNewRecords.length === 0) {
            console.log("No new unique records to add.");
            return;
        }

        // 3. Merge only the unique records
        const updatedData = existingData.concat(uniqueNewRecords);


        await fs.writeFile(jsonFilePath, JSON.stringify(updatedData, null, 2), 'utf-8');

        console.log(`Added ${uniqueNewRecords.length} unique records. (Ignored ${newRecords.length - uniqueNewRecords.length} duplicates)`);

    } catch (err) {
        console.error('Error during processing:', err.message);
    }
}


appendCsvToJson('../WOTestingData/reportPCR1526Cleaned.csv', '../db/WODB.json')