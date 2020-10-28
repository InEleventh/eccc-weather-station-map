async function readCSV(csvFile) {
    let response = await fetch(csvFile)
    let csvData = await response.text()

    let data = Papa.parse(csvData, {
        header: true,
        complete: function (results) {
            //add something if needed
        }
    })

    return data.data
}

async function displayShortest(location) {
    let stations = await readCSV('csv/Station_Inventory_EN.csv')

    stations.sort((a, b) => {
        const distanceA = calcDistance(location, [a['Latitude (Decimal Degrees)'], a['Longitude (Decimal Degrees)']])
        const distanceB = calcDistance(location, [b['Latitude (Decimal Degrees)'], b['Longitude (Decimal Degrees)']])

        if (distanceA < distanceB) {
            return -1
        } else if (distanceB < distanceA) {
            return 1
        } else {
            return 0
        }
    })

    document.getElementById('closest-stations').innerHTML = `Closest Stations to (${location[0].toFixed(2)}, ${location[1].toFixed(2)})`

    const table = document.getElementById('closest').tBodies[0]

    const tableLen = table.rows.length
    for (let i = 0; i < tableLen; i++) {
        table.deleteRow(0)
    }

    for (let i = 0; i < 5; i++) {
        let row = table.insertRow()

        let stationID = row.insertCell()
        stationID.innerHTML = stations[i]['Station ID']

        let climateID = row.insertCell()
        climateID.innerHTML = stations[i]['Climate ID']

        let name = row.insertCell()
        name.innerHTML = stations[i]['Name']

        let hourly = row.insertCell()
        hourly.innerHTML = `${stations[i]['HLY First Year']}-${stations[i]['HLY Last Year']}`
        if (stations[i]['HLY First Year'] === 'asdf') { //fix later
            hourly.innerHTML = hourly.innerHTML + '<br>' + `<button type="button" class="btn btn-primary btn-sm" onclick="location.href='${createStationURL(stations[i]['Station ID'], stations[i]['HLY Last Year'], 1, 1)}'">Download</button>`
        }

        let daily = row.insertCell()
        daily.innerHTML = `${stations[i]['DLY First Year']}-${stations[i]['DLY Last Year']}`
        if (stations[i]['DLY First Year'] === 'asdf') { //fix later
            daily.innerHTML = daily.innerHTML + '<br>' + `<button type="button" class="btn btn-primary btn-sm" onclick="downloadStationData(${stations[i]['Station ID']}, ${stations[i]['DLY First Year']}, ${stations[i]['DLY Last Year']}, ${2})">Download</button>`
        }

        let monthly = row.insertCell()
        monthly.innerHTML = `${stations[i]['MLY First Year']}-${stations[i]['MLY Last Year']}`
        if (stations[i]['MLY First Year'] != '') {
            monthly.innerHTML = monthly.innerHTML + '<br>' + `<button type="button" class="btn btn-primary btn-sm" onclick="downloadStationData(${stations[i]['Station ID']}, ${stations[i]['MLY First Year']}, ${stations[i]['MLY Last Year']}, ${3})">Download</button>`
        }

        let loc = row.insertCell()
        loc.innerHTML = `${stations[i]['Latitude (Decimal Degrees)']}, ${stations[i]['Longitude (Decimal Degrees)']} <br> <button type="button" class="btn btn-primary btn-sm" onclick="goToLocation([${stations[i]['Latitude (Decimal Degrees)']}, ${stations[i]['Longitude (Decimal Degrees)']}])">Go to</button>`

        let distance = row.insertCell()
        distance.innerHTML = (calcDistance(location, [stations[i]['Latitude (Decimal Degrees)'], stations[i]['Longitude (Decimal Degrees)']]) / 1000).toFixed(2)
    }
}

function calcDistance(coor1, coor2) {
    let distance = L.latLng(coor1).distanceTo(coor2)
    return distance
}

function createStationURL(stationID, year, month, timeframe) {
    return `https://climate.weather.gc.ca/climate_data/bulk_data_e.html?format=csv&stationID=${stationID}&Year=${year}&Month=${month}&Day=14&timeframe=${timeframe}&submit=Download+Data`
}

function goToLocation(location) {
    stationMap.flyTo(location, 15)
    document.getElementById('stationMap').scrollIntoView()
}

function downloadStationData(stationID, firstYear, lastYear, timeframe) {
    if (timeframe === 3) {
        var link = createStationURL(stationID, lastYear, 1, timeframe)
        window.open(link)
    } else if (timeframe === 2) {
        for (var year = firstYear; year <= lastYear; year++) {
            var link = createStationURL(stationID, year, 1, timeframe)
            window.open(link)
        }
    } else if (timeframe === 1) {
        for (var year = firstYear; year <= lastYear; year++) {
            for (var month = 1; month <= 12; month++) {
                var link = createStationURL(stationID, year, month, timeframe)
                window.open(link)
            }
        }
    }
}

async function test() {
    var proxyUrl = 'https://cors-anywhere.herokuapp.com/'
    var all = []

    for (var year = 2018; year <= 2020; year++) {
        var url = `https://climate.weather.gc.ca/climate_data/bulk_data_e.html?format=csv&stationID=54239&Year=${year}&Month=5&Day=14&timeframe=2&submit=Download+Data`
        var response = await fetch(proxyUrl + url)
        var csvData = await response.text()
        var data = Papa.parse(csvData, {
            header: true,
            complete: function (results) {
                //add something if needed
            }
        })
        var array = data.data
        array.pop()
        all = all.concat(array)
    }
    var newCSV = Papa.unparse(all)
    console.log(newCSV)

    var link = document.createElement('a')
    link.href = 'data:attachment/csv,' + encodeURI(newCSV)
    link.target = '_blank'
    link.download = 'test.csv'
    link.click()
}

async function downloadData(stationID, firstYear, lastYear, timeframe) {
    var proxyUrl = 'https://cors-anywhere.herokuapp.com/'
    var all = []
    var fileName = stationID
    var timeName = ''

    if (timeframe === 3) {
        var url = createStationURL(stationID, firstYear, 12, timeframe)
        var response = await fetch(proxyUrl + url)
        var csvData = await response.text()
        var data = Papa.parse(csvData, {
            header: true,
            complete: function (results) {
                //add something if needed
            }
        })
        var array = data.data
        array.pop()
        all = all.concat(array)
        timeName = 'monthly'
    } else if (timeframe === 2) {
        for (var year = firstYear; year <= lastYear; year++) {
            var url = createStationURL(stationID, year, 1, timeframe)
            var response = await fetch(proxyUrl + url)
            var csvData = await response.text()
            var data = Papa.parse(csvData, {
                header: true,
                complete: function (results) {
                    //add something if needed
                }
            })
            var array = data.data
            array.pop()
            all = all.concat(array)
        }
        timeName = 'daily'
    } else if (timeframe === 1) {
        for (var year = firstYear; year <= lastYear; year++) {
            for (var month = 1; month <= 12; month++) {
                var url = createStationURL(stationID, year, month, timeframe)
            }
            var response = await fetch(proxyUrl + url)
            var csvData = await response.text()
            var data = Papa.parse(csvData, {
                header: true,
                complete: function (results) {
                    //add something if needed
                }
            })
            var array = data.data
            array.pop()
            all = all.concat(array)
        }
        timeName = 'hourly'
    }

    var newCSV = Papa.unparse(all)
    var link = document.createElement('a')
    link.href = 'data:attachment/csv,' + encodeURI(newCSV)
    link.target = '_blank'
    link.download = `${fileName} ${timeName} ${firstYear}-${lastYear}.csv`
    link.click()
}

//map------------------------------------------------------------------------------
const stationMap = L.map('stationMap', {
    center: [43.71, -79.41],
    zoom: 10,
    maxBounds: [[84.96, -171.21], [36.74, -44.74]],
    minZoom: 3,
})

const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
}).addTo(stationMap);

const iconOrange = L.icon({
    iconUrl: 'img/icons/marker-icon-2x-orange.png',
    shadowUrl: 'img/icons/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})

const stationMarkers = L.markerClusterGroup({
    removeOutsideVisibleBounds: true,
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: false,
    disableClusteringAtZoom: 13,
    maxClusterRadius: 100,
})

readCSV('csv/Station_Inventory_EN.csv')
    .then(data => {
        for (var item of data) {
            const lat = item['Latitude (Decimal Degrees)']
            const lng = item['Longitude (Decimal Degrees)']
            const hourly = `${item['HLY First Year']}-${item['HLY Last Year']}`
            const daily = `${item['DLY First Year']}-${item['DLY Last Year']}`
            const monthly = `${item['MLY First Year']}-${item['MLY Last Year']}`

            let popText = `<b>${item['Name']}</b> <br> 
                Station ID: ${item['Station ID']} <br> 
                Climate ID: ${item['Climate ID']} <br>
                Hourly Record: ${hourly} <br>
                Daily Record: ${daily} <br>
                Monthly Record: ${monthly} <br>`
            let marker = L.marker([lat, lng], { icon: iconOrange }).bindPopup(popText)

            stationMarkers.addLayer(marker)
        }
    })

stationMarkers.addTo(stationMap)

let baseMaps = {
    "OpenStreetMap": osm
}

let mapLayers = {
    "Weather Stations": stationMarkers,
}

L.control.layers(baseMaps, mapLayers).addTo(stationMap)

//map events
stationMap.on('click', e => {
    let popup = L.popup()
    const lat = e.latlng.lat
    const lng = e.latlng.lng

    /* popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + lat.toFixed(2) + ', ' + lng.toFixed(2))
        .openOn(stationMap); */

    displayShortest([lat, lng])
})

stationMap.on('zoomend', () => {
    const zoomLevel = stationMap.getZoom()

    /* if (zoomLevel < 6 && stationMap.hasLayer(stationMarkers)){
        stationMap.removeLayer(stationMarkers)
    }
    if (zoomLevel >= 6 && !stationMap.hasLayer(stationMarkers)) {
        stationMap.addLayer(stationMarkers)
    } */
})

function placeMarkersInBounds() {
    var mapBounds = stationMap.getBounds()
    markers = jsonLayer.getLayers()
    for (var i = 0; i < markers.length; i++) {
        var m = markers[i]
        var visable = mapBounds.contains(m.getLatLng())
        if (visable) {
            stationMap.addLayer(m)
        } else {
            stationMap.removeLayer(m)
        }
    }
    console.log(test)
}