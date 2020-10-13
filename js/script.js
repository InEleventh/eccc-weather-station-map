var stationMap = L.map('stationMap').setView([43.71, -79.41], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
}).addTo(stationMap);

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