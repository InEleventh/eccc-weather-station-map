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
    for (var i=0; i< tableLen-1; i++){
        table.deleteRow(1)
    }

    for (var i=0; i< 5; i++){
        var row = table.insertRow()
        
        var id = row.insertCell()
        id.innerHTML = stations[i]['Station ID']
        
        var name = row.insertCell()
        name.innerHTML = stations[i]['Name']
        
        var loc = row.insertCell()
        loc.innerHTML = `(${stations[i]['Latitude (Decimal Degrees)']}, ${stations[i]['Longitude (Decimal Degrees)']})`

        var firstYear = row.insertCell()
        firstYear.innerHTML = stations[i]['First Year']

        var lastYear = row.insertCell()
        lastYear.innerHTML = stations[i]['Last Year']
        
        var distance = row.insertCell()
        distance.innerHTML = calcDistance(location, [stations[i]['Latitude (Decimal Degrees)'], stations[i]['Longitude (Decimal Degrees)']]).toFixed(2)

        var goToButton = row.insertCell()
        goToButton.innerHTML = `<button type="button" class="btn btn-primary" onclick="goToLocation([${stations[i]['Latitude (Decimal Degrees)']}, ${stations[i]['Longitude (Decimal Degrees)']}])">Go to</button>`

    }
}

function calcDistance(coor1, coor2) {
    var distance = L.latLng(coor1).distanceTo(coor2)
    return distance
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
    maxClusterRadius: 150,
})

readCSV('csv/Station_Inventory_EN.csv')
    .then(data => {
        for (var item of data) {
            var lat = item['Latitude (Decimal Degrees)']
            var lng = item['Longitude (Decimal Degrees)']
            var name = item['Name']
            var id = item['Station ID']

            var popText = `StationID: ${id} <br> Name: ${name}`
            var marker = L.marker([lat, lng], {icon: iconOrange}).bindPopup(popText)

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
stationMap.on('click', e =>{
    var popup = L.popup()
    var lat = e.latlng.lat
    var lng = e.latlng.lng
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + lat.toFixed(2) + ', ' + lng.toFixed(2))
        .openOn(stationMap);

    displayShortest([lat, lng])
})

stationMap.on('zoomend', () =>{
    var zoomLevel = stationMap.getZoom()
    
    if (zoomLevel < 6 && stationMap.hasLayer(stationMarkers)){
        stationMap.removeLayer(stationMarkers)
    }
    if (zoomLevel >= 6 && !stationMap.hasLayer(stationMarkers)) {
        stationMap.addLayer(stationMarkers)
    }
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
