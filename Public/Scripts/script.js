const dashboardView = document.getElementById('dashboard-view')
const loginView = document.getElementById('login-view')
const container = document.getElementById('data-container')
const filterContainer = document.getElementById('facility-filter-group')
const statusFilterSelect = document.getElementById('filter-open')
const uploadCSVbtn = document.getElementById('uploadCSV')
const totalOpenSpan = document.getElementById('total-open')
const facilityFilterSelect = document.getElementById('filter-facility')
const loginform = document.getElementById('login-form')

let totalOpenCount = 0
let currentFilter = 'Open'
let currentFacilityFilter = 'all'
let currentWOs = []

async function checkAuth() {
    try{
        const response = await fetch('/api/me')
        if(response.ok){
            const user = await response.json()
            console.log(`Authenticated as ${user.username}`)
            loginView.style.display = 'none'
            dashboardView.style.display = 'block'
            await loadWorkorders()
        } else {
            console.log('Not authenticated')
            loginView.style.display = 'block'
            dashboardView.style.display = 'none'
        }
    } catch (err){
        console.error('Auth check error:', err)
    }
}

async function loadWorkorders() {
    const response = await fetch(`/api/wo`)
    currentWOs = await response.json()
    await updateTotalOpenCount()
    await facilityFilterSelectOptions([...new Set(currentWOs.map(wo => wo.facility))])
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

function facilityFilterSelectOptions(facilities) {
    const allOption = document.createElement('option')
    allOption.value = 'all'
    allOption.textContent = 'All Facilities'
    facilityFilterSelect.appendChild(allOption)
    
    facilities.forEach(facility => {
        const option = document.createElement('option')
        option.value = facility
        option.textContent = facility
        facilityFilterSelect.appendChild(option)
    })
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

loginform.addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(loginform)
    const data = Object.fromEntries(formData.entries())

    try{
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        if(response.ok){
            console.log('Login successful')
            loginform.reset()
            await checkAuth()
        } else {
            const errorData = await response.json()
            alert(`Login failed: ${errorData.error}`)
        }
    } catch (err){
        console.error('Login error:', err)
        alert(`An error occurred during login. Please try again.`)
    }
})


//loadWorkorders()
checkAuth()