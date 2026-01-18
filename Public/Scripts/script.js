///*fetch('/api/wo')
//    .then(response => response.json())
//    .then(data => {
//        const container = document.getElementById('data-container')
//        container.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`
//    })
//    .catch(error => {
//        console.error(`Error fetching data:`, error)
//        document.getElementById('data-container').textContent = `Failed to load data`
//    })*/
//const openFilterBtn = document.getElementById('show-open')
//const completedFilterBtn = document.getElementById('show-completed')
//const allFilterbtn = document.getElementById('show-all')
//let currentFilter = 'all'

////function openFilter() {
////    currentFilter == 'opened'
////    //location.reload()
////}

////function completeFilter() {
////    currentFilter == 'completed'
////    //location.reload()
////}

////function allFilter() {
////    currentFilter == 'all'
////    //location.reload()
////}


//fetch('/api/wo')
//    .then(response => response.json())
//    .then(data => {
//        const container = document.getElementById('data-container')
//        container.innerHTML = ''

//        const ul = document.createElement('ul')

//        data.forEach(wo => {
//            const li = document.createElement('li')
//            li.style.marginBottom = "10px"

//            //if (wo.status == 'Completed') {
//            //    li.style.display = 'none'
//            //} else {

//            //    li.innerHTML = `
//            //    <strong>WO #${wo.wo_number}</strong> - Facility ${wo.facility} - Room ${wo.room} Opened by: ${wo.first_name} ${wo.last_name} - Description: ${wo.info_description} - Status: <span>${wo.status}</span>
//            //    <button onclick="updateStatus('${wo.wo_number}', 'Completed')">Mark Completed</button>
//            //`
//            //    ul.appendChild(li)
//            //}

//            switch (currentFilter) {
//                case 'all':
//                    li.innerHTML = `
//                <strong>WO #${wo.wo_number}</strong> - Facility ${wo.facility} - Room ${wo.room} Opened by: ${wo.first_name} ${wo.last_name} - Description: ${wo.info_description} - Status: <span>${wo.status}</span>
//                <button onclick="updateStatus('${wo.wo_number}', 'Completed')">Mark Completed</button>
//            `
//                    ul.appendChild(li)
//                    break
//                case 'opened':
//                    if (wo.status == 'Completed') {
//                        li.style.display = 'none'
//                    } else {

//                        li.innerHTML = `
//                <strong>WO #${wo.wo_number}</strong> - Facility ${wo.facility} - Room ${wo.room} Opened by: ${wo.first_name} ${wo.last_name} - Description: ${wo.info_description} - Status: <span>${wo.status}</span>
//                <button onclick="updateStatus('${wo.wo_number}', 'Completed')">Mark Completed</button>
//            `
//                        ul.appendChild(li)
//                    }
//                    break
//                case 'completed':
//                    if (wo.status == 'Open') {
//                        li.style.display = 'none'
//                    } else {

//                        li.innerHTML = `
//                <strong>WO #${wo.wo_number}</strong> - Facility ${wo.facility} - Room ${wo.room} Opened by: ${wo.first_name} ${wo.last_name} - Description: ${wo.info_description} - Status: <span>${wo.status}</span>
//                <button onclick="updateStatus('${wo.wo_number}', 'Completed')">Mark Completed</button>
//            `
//                        ul.appendChild(li)
//                    }
//                    break
//            }

//        })

//        container.appendChild(ul)
//    })
//    .catch(error => {
//        console.error('Error fetching data:', error)
//        document.getElementById('data-container').textContent = 'Failed to load data'
//    })



//async function updateStatus(woNumber, newStatus) {
//    try {
//        const response = await fetch(`/api/wo/${woNumber}`, {
//            method: 'PUT',
//            headers: { 'Content-Type': 'application/json' },
//            body: JSON.stringify({ status: newStatus })
//        })

//        if (response.ok) {
//            alert(`Work Order ${woNumber} updated!`)
//            location.reload()
//        } else {
//            alert('Failed to update work order')
//        }
//    } catch (err) {
//        console.error('Update error:', err)
//    }
//}


//openFilterBtn.addEventListener('click', currentFilter == 'opened')
//completedFilterBtn.addEventListener('click', currentFilter == 'completed')
//allFilterbtn.addEventListener('click', currentFilter == 'all')

const container = document.getElementById('data-container')
const openFilterBtn = document.getElementById('show-open')
const completedFilterBtn = document.getElementById('show-completed')
const allFilterbtn = document.getElementById('show-all')
const uploadCSVbtn = document.getElementById('uploadCSV')

let currentFilter = 'all'


async function renderList() {
    try {
        // const response = await fetch('/api/wo')
        // const data = await response.json()

        // container.innerHTML = ''
        // const ul = document.createElement('ul')

        // const filteredData = data.filter(wo => {
        //     if (currentFilter === 'opened') return wo.status !== 'Completed'
        //     if (currentFilter === 'completed') return wo.status === 'Completed'
        //     return true 
        // })
        const url = currentFilter === 'all'
            ? '/api/wo'
            : `/api/wo?status=${currentFilter}`
        
        const response = await fetch(url)
        const data = await response.json()
        const container = document.createElement('ul')
        data.forEach(wo => {
            const li = document.createElement('li')
            li.innerHTML = `
                <strong>WO #${wo.wo_number}</strong> - Facility ${wo.facility} - Room ${wo.room} Opened by: ${wo.first_name} ${wo.last_name} - Description: ${wo.info_description} - Status: <span>${wo.status}</span>
                ${wo.status !== 'Completed'
                    ? `<button onclick="updateStatus('${wo.wo_number}', 'Completed')">Complete</button>`
                    : ''}
            `
            container.appendChild(li)
        })

        container.appendChild(container)
    } catch (err) {
        console.error("Render error:", err)
    }
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
            renderList()
        } else {
            const errorData = await response.json()
            alert(`Update failed: ${errorData.error}`)
        }
    } catch (err) {
        console.error('Update error:', err)
    }
}

openFilterBtn.addEventListener('click', () => {
    currentFilter = 'Open'
    renderList()
})

completedFilterBtn.addEventListener('click', () => {
    currentFilter = 'Completed'
    renderList()
})

allFilterbtn.addEventListener('click', () => {
    currentFilter = 'all'
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
    renderList()
    alert(result.message)
})


renderList()