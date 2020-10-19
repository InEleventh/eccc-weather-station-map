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
        
        var distance = row.insertCell()
        distance.innerHTML = calcDistance(location, [stations[i]['Latitude (Decimal Degrees)'], stations[i]['Longitude (Decimal Degrees)']]).toFixed(5)

    }
}

function calcDistance(coor1, coor2) {
    var a = coor1[0] - coor2[0]
    var b = coor1[1] - coor2[1]
    var distDeg = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2))
    var distMeters = distDeg * 111139
    return distDeg
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


var stationMarkers = L.markerClusterGroup({
    removeOutsideVisibleBounds: true,
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: false,
    disableClusteringAtZoom: 12,
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
            var marker = L.marker([lat, lng]).bindPopup(popText)

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
    //console.log(zoomLevel)
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
