/*fetch('/api/wo')
    .then(response => response.json())
    .then(data => {
        const container = document.getElementById('data-container')
        container.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`
    })
    .catch(error => {
        console.error(`Error fetching data:`, error)
        document.getElementById('data-container').textContent = `Failed to load data`
    })*/

fetch('/api/wo')
    .then(response => response.json())
    .then(data => {
        const container = document.getElementById('data-container')
        container.innerHTML = ''

        const ul = document.createElement('ul')

        data.forEach(wo => {
            const li = document.createElement('li')
            li.style.marginBottom = "10px"

            li.innerHTML = `
                <strong>WO #${wo.wo_number}</strong> - Facility ${wo.facility} - Room ${wo.room} Opened by: ${wo.first_name} ${wo.last_name} - Description: ${wo.info_description} - Status: <span>${wo.status}</span>
                <button onclick="updateStatus('${wo.wo_number}', 'Completed')">Mark Completed</button>
            `
            ul.appendChild(li)
        })

        container.appendChild(ul)
    })
    .catch(error => {
        console.error('Error fetching data:', error)
        document.getElementById('data-container').textContent = 'Failed to load data'
    })

async function updateStatus(woNumber, newStatus) {
    try {
        const response = await fetch(`/api/wo/${woNumber}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        })

        if (response.ok) {
            alert(`Work Order ${woNumber} updated!`)
            location.reload()
        } else {
            alert('Failed to update work order')
        }
    } catch (err) {
        console.error('Update error:', err)
    }
}