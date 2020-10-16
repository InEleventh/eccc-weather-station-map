async function readCSV(csvFile) {
    var response = await fetch(csvFile)
    var csvData = await response.text()

    var data = Papa.parse(csvData, {
        header: true,
        complete: function (results) {
            //add something if needed
        }
    })

    return data
}

//map
var stationMap = L.map('stationMap', {
    center: [43.71, -79.41],
    zoom: 10,
    maxBounds: [[84.96, -171.21], [36.74, -44.74]],
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
stationMarkers.addTo(stationMap)

var jsonLayer = L.geoJson([], {
    onEachFeature: function (feature, layer) {
        var name = feature.properties.Name
        var stationID = feature.properties['Station ID']

        layer.bindPopup(`StationID: ${stationID} <br> Name: ${name}`)
    }
})

var baseMaps = {
    "OpenStreetMap": osm
}

var mapLayers = {
    "Weather Stations": stationMarkers,
    'Stations 2': jsonLayer
}

L.control.layers(baseMaps, mapLayers).addTo(stationMap)

fetch('json/stations.geojson')
    .then(response => response.json())
    .then(function (json) {
        jsonLayer.addData(json)

        var layers = jsonLayer.getLayers()
        for (var i = 0; i < layers.length; i++) {
            stationMarkers.addLayer(layers[i])
        }

    })


function onMapClick(e) {
    var popup = L.popup()
    var lat = e.latlng.lat
    var lng = e.latlng.lng
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + lat.toFixed(2) + ', ' + lng.toFixed(2))
        .openOn(stationMap);
}

stationMap.on('click', onMapClick)


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
