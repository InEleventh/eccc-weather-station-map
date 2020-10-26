async function readCSV(csvFile) {
    var response = await fetch(csvFile)
    var csvData = await response.text()

    var data = Papa.parse(csvData, {
        header: true,
        complete: function (results) {
            //add something if needed
        }
    })

    return data.data
}

async function displayShortest(location) {
    var stations = await readCSV('csv/Station_Inventory_EN.csv')

    stations.sort((a, b) => {
        var distanceA = calcDistance(location, [a['Latitude (Decimal Degrees)'], a['Longitude (Decimal Degrees)']])
        var distanceB = calcDistance(location, [b['Latitude (Decimal Degrees)'], b['Longitude (Decimal Degrees)']])

        if (distanceA < distanceB) {
            return -1
        } else if (distanceB < distanceA) {
            return 1
        } else {
            return 0
        }
    })

    document.getElementById('closest-stations').innerHTML = `Closest Stations to (${location[0].toFixed(2)}, ${location[1].toFixed(2)})`

    var table = document.getElementById('closest')

    var tableLen = table.rows.length
    for (var i = 0; i < tableLen - 1; i++) {
        table.deleteRow(1)
    }

    for (var i = 0; i < 5; i++) {
        var row = table.insertRow()

        var stationID = row.insertCell()
        stationID.innerHTML = stations[i]['Station ID']

        var climateID = row.insertCell()
        climateID.innerHTML = stations[i]['Climate ID']

        var name = row.insertCell()
        name.innerHTML = stations[i]['Name']

        var hourly = row.insertCell()
        hourly.innerHTML = `${stations[i]['HLY First Year']}-${stations[i]['HLY Last Year']}`
        if (stations[i]['HLY First Year'] != ''){
            hourly.innerHTML = hourly.innerHTML + '<br>' + `<button type="button" class="btn btn-primary btn-sm" onclick="location.href='${createStationURL(stations[i]['Station ID'], stations[i]['HLY Last Year'], 1)}'">Download</button>`
        }

        var daily = row.insertCell()
        daily.innerHTML = `${stations[i]['DLY First Year']}-${stations[i]['DLY Last Year']}`
        if (stations[i]['DLY First Year'] != ''){
            daily.innerHTML = daily.innerHTML + '<br>' + `<button type="button" class="btn btn-primary btn-sm" onclick="location.href='${createStationURL(stations[i]['Station ID'], stations[i]['DLY Last Year'], 1)}'">Download</button>`
        }

        var monthly = row.insertCell()
        monthly.innerHTML = `${stations[i]['MLY First Year']}-${stations[i]['MLY Last Year']}`
        if (stations[i]['MLY First Year'] != ''){
            monthly.innerHTML = monthly.innerHTML + '<br>' + `<button type="button" class="btn btn-primary btn-sm" onclick="location.href='${createStationURL(stations[i]['Station ID'], stations[i]['MLY Last Year'], 1)}'">Download</button>`
        }

        var loc = row.insertCell()
        loc.innerHTML = `${stations[i]['Latitude (Decimal Degrees)']}, ${stations[i]['Longitude (Decimal Degrees)']}`

        var distance = row.insertCell()
        distance.innerHTML = (calcDistance(location, [stations[i]['Latitude (Decimal Degrees)'], stations[i]['Longitude (Decimal Degrees)']]) / 1000).toFixed(2)

        var goToButton = row.insertCell()
        goToButton.innerHTML = `<button type="button" class="btn btn-primary btn-sm" onclick="goToLocation([${stations[i]['Latitude (Decimal Degrees)']}, ${stations[i]['Longitude (Decimal Degrees)']}])">Go to</button>`
    }
}

function calcDistance(coor1, coor2) {
    var distance = L.latLng(coor1).distanceTo(coor2)
    return distance
}

function createStationURL(stationID, year, timeframe){
    return `https://climate.weather.gc.ca/climate_data/bulk_data_e.html?format=csv&stationID=${stationID}&Year=${year}&Month=${12}&Day=14&timeframe=${timeframe}&submit=Download+Data`
}

function goToLocation(location) {
    stationMap.flyTo(location, 15)
}

//map------------------------------------------------------------------------------
var stationMap = L.map('stationMap', {
    center: [43.71, -79.41],
    zoom: 10,
    maxBounds: [[84.96, -171.21], [36.74, -44.74]],
    minZoom: 3,
})

var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
}).addTo(stationMap);

var iconOrange = L.icon({
    iconUrl: 'img/icons/marker-icon-2x-orange.png',
    shadowUrl: 'img/icons/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})

var stationMarkers = L.markerClusterGroup({
    removeOutsideVisibleBounds: true,
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: false,
    disableClusteringAtZoom: 13,
    maxClusterRadius: 100,
})

readCSV('csv/Station_Inventory_EN.csv')
    .then(data => {
        for (var item of data) {
            var lat = item['Latitude (Decimal Degrees)']
            var lng = item['Longitude (Decimal Degrees)']
            var name = item['Name']
            var stationID = item['Station ID']
            var climateID = item['Climate ID']
            var hourly = `${item['HLY First Year']}-${item['HLY Last Year']}`
            var daily = `${item['DLY First Year']}-${item['DLY Last Year']}`
            var monthly = `${item['MLY First Year']}-${item['MLY Last Year']}`

            var popText = `<b>${name}</b> <br> 
                Station ID: ${stationID} <br> 
                Climate ID: ${climateID} <br>
                Hourly Record: ${hourly} <br>
                Daily Record: ${daily} <br>
                Monthly Record: ${monthly} <br>`
            var marker = L.marker([lat, lng], { icon: iconOrange }).bindPopup(popText)

            stationMarkers.addLayer(marker)
        }
    })

stationMarkers.addTo(stationMap)

var baseMaps = {
    "OpenStreetMap": osm
}

var mapLayers = {
    "Weather Stations": stationMarkers,
}

L.control.layers(baseMaps, mapLayers).addTo(stationMap)

//map events
stationMap.on('click', e => {
    var popup = L.popup()
    var lat = e.latlng.lat
    var lng = e.latlng.lng

    /* popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + lat.toFixed(2) + ', ' + lng.toFixed(2))
        .openOn(stationMap); */

    displayShortest([lat, lng])
})

stationMap.on('zoomend', () => {
    var zoomLevel = stationMap.getZoom()

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