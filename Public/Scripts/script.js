const container = document.getElementById('data-container')
const statusFilterSelect = document.getElementById('filter-open')
const uploadCSVbtn = document.getElementById('uploadCSV')
const totalOpenSpan = document.getElementById('total-open')
const facilityFilterSelect = document.getElementById('filter-facility')

let totalOpenCount = 0
let currentFilter = 'Open'
let currentFacilityFilter = 'all'
let currentWOs = []

async function loadWorkorders() {
    const response = await fetch(`/api/wo`)
    currentWOs = await response.json()
    await updateTotalOpenCount()
    await renderList()
}
async function updateTotalOpenCount() {
    totalOpenCount = currentWOs.filter(wo => wo.status === 'Open').length
    totalOpenSpan.textContent = totalOpenCount
}
async function renderList() {
    try {
        container.innerHTML = ''
        const ul = document.createElement('ul')

        const filteredData = currentWOs.filter(wo => {
            const statusMatch = currentFilter === 'all' || wo.status?.toLowerCase() === currentFilter.toLowerCase()
            const facilityMatch = currentFacilityFilter === 'all' || wo.facility === currentFacilityFilter
            const notArchived = wo.status?.toLowerCase() !== 'archived'
            return statusMatch && facilityMatch && notArchived
        })

        filteredData.sort((a, b) => {
            return parseInt(a.wo_number) - parseInt(b.wo_number)
        })

        filteredData.forEach(wo => {
            const li = createWorkOrderElement(wo)
            ul.appendChild(li)
        })

        container.appendChild(ul)

        filteredData.forEach(wo => {
            if (wo.status === 'Completed') {
                JsBarcode(`#barcode-${wo.wo_number}`, wo.wo_number, {
                    format: "CODE128",
                    width: 2,
                    height: 50,
                    displayValue: false,
                    lineColor: "#ffffff",
                    background: "#1e293b"
                })
            }
        })
    } catch (err) {
        console.error("Render error:", err)
    }
}

function createWorkOrderElement(wo) {
    const li = document.createElement('li')
    li.innerHTML = `
        <div class="wo-header">
            <strong>WO #${wo.wo_number}</strong>
            <span class="wo-status ${wo.status === 'Completed' ? 'status-completed' : 'status-open'}">${wo.status}</span>
        </div>
        <div class="wo-details">
            <div class="wo-detail-item">
                <span class="detail-label">Facility:</span>
                <span class="detail-value">${wo.facility}</span>
            </div>
            <div class="wo-detail-item">
                <span class="detail-label">Room:</span>
                <span class="detail-value">${wo.room}</span>
            </div>
            <div class="wo-detail-item">
                <span class="detail-label">Opened by:</span>
                <span class="detail-value">${wo.first_name} ${wo.last_name}</span>
            </div>
            <div class="wo-detail-item">
                <span class="detail-label">Date Opened:</span>
                <span class="detail-value">${wo.date_opened}</span>
            </div>
        </div>
        <div class="wo-description">
            <span class="detail-label">Description:</span>
            <p>${wo.info_description}</p>
        </div>
        ${wo.status === 'Completed' ? `
        <div class="wo-barcode">
            <svg id="barcode-${wo.wo_number}"></svg>
        </div>
        ` : ''}
        <div class="wo-actions">
            ${wo.status !== 'Completed'
                ? `<button class="btn btn-success" onclick="completeWorkOrder('${wo.wo_number}')">Mark Completed</button>`
                : `<button class="btn btn-danger" onclick="archiveWorkOrder('${wo.wo_number}')">Archive</button>`}
        </div>
    `
    return li
}

async function updateStatus(woNumber, newStatus) {
    try {
        const response = await fetch(`/api/wo/${woNumber}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        })

        if (response.ok) {
            console.log(`Updated ${woNumber} successfully.`)
            await loadWorkorders()
        } else {
            const errorData = await response.json()
            alert(`Update failed: ${errorData.error}`)
        }
    } catch (err) {
        console.error('Update error:', err)
    }
}

async function completeWorkOrder(woNumber) {
    try{
        const res = await fetch(`/api/wo/${woNumber}/complete`, {
        method: 'POST'
        })
        if (res.ok) {
            console.log(`Work order ${woNumber} marked as completed.`)
            await loadWorkorders()
        } else {
            const errorData = await res.json()
            alert(`Completion failed: ${errorData.error}`)
        }
    } catch (err){
        console.error('Complete error:', err)
    }
}

async function archiveWorkOrder(woNumber) {
    try{
        const res = await fetch(`/api/wo/${woNumber}/archive`, {
        method: 'POST'
        })
        if (res.ok) {
            console.log(`Work order ${woNumber} archived.`)
            await loadWorkorders()
        } else {
            const errorData = await res.json()
            alert(`Archive failed: ${errorData.error}`)
        }
    } catch (err){
        console.error('Archive error:', err)
    }
}

// async function deleteWorkOrder(woNumber) {
//     if (confirm(`Are you sure you want to remove work order ${woNumber}? This action cannot be undone.`)) {
//         try {
//             const response = await fetch(`/api/wo/${woNumber}`, {
//                 method: 'DELETE',
//                 headers: { 'Content-Type': 'application/json' }
//             })

//             if (response.ok) {
//                 console.log(`Deleted ${woNumber} successfully.`)
//                 await loadWorkorders()
//             } else {
//                 const errorData = await response.json()
//                 alert(`Delete failed: ${errorData.error}`)
//             }
//         } catch (err) {
//             console.error('Delete error:', err)
//             alert('Failed to delete work order')
//         }
//     }
// }

statusFilterSelect.addEventListener('change', (e) => {
    const selectedValue = e.target.value
    if (selectedValue === 'show-open') {
        currentFilter = 'Open'
    } else if (selectedValue === 'show-completed') {
        currentFilter = 'Completed'
    } else if (selectedValue === 'show-all') {
        currentFilter = 'all'
    }
    renderList()
})

facilityFilterSelect.addEventListener('change', (e) => {
    currentFacilityFilter = e.target.value
    renderList()
})

uploadCSVbtn.addEventListener('click', async() => {
    let csvFile = document.querySelector('#csvImport')
    let formData = new FormData()
    formData.append('csvFile', csvFile.files[0])

    let response = await fetch('/api/importWOCSV', {
        method: 'POST',
        body: formData
    })

    let result = await response.json()
    await loadWorkorders()
    alert(result.message)
})


loadWorkorders()