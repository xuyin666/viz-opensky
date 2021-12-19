let worldwideAirplaneGroupLayer = L.featureGroup();
let oldZoom = null;
let currentAjax;
let currentAirplaneMarkers = [];
let radarNode = document.querySelector('.radar');

// create the map and set the boundarys 
let map = L.map('map', {
    minZoom: 1,
    maxBounds: [
        [89, -250],
        [-89, 250]
    ],
    layers: [
        worldwideAirplaneGroupLayer
    ]
})
.on('zoomstart', function() {
    oldZoom = map.getZoom();
})
.on('zoom', function(e) {
    let newZoom = map.getZoom();
    toggleWorldwideLayer(oldZoom, newZoom);
    // console.log(e);
    // map.flyTo(e.target.getCenter(), map.getZoom(), {
    //     animate: true,
    //     duration: 1
    // });
})
.on('moveend', function() {
    // if we have worldwideAirplane, we will limit all the point in degre -180 ~ 180
    // else we should filter all the current airplane in the map maxBounds  
    if (map.hasLayer(worldwideAirplaneGroupLayer))
        wrapMarkers(worldwideAirplaneGroupLayer);
    else 
        filterAirplaneAtCurrentMapBounds();
});


// the view from Paris 
map.setView([48.8566, 2.3522], 2);
// map.setMaxBounds(map.getBounds());



// add tileLayer for all the map
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    // the accessToken get from Mapbox
    accessToken: 'pk.eyJ1Ijoibmljb2xhc3UiLCJhIjoiY2t4Yno4enhzMHNxNjJvbzdpN2ZqcW1veiJ9.D3junYb4Fyksl9eztv4YEQ'
}).addTo(map);

// Overlay day and night regions on a Leaflet Earth map
L.terminator().addTo(map);


// the layer who contains all the airplane 
let airplaneGroupLayer = L.featureGroup().on('click mouseover', 
    function(e) {
        airplaneGroupLayer.eachLayer(function(layer) {
            if (map.hasLayer(layer)) {
                layer.getElement().style.color = '';
            }
        });
        e.layer.getElement().style.color = 'deepskyblue';
    }
);

// if the zoom is too big, we will pass to the airplaneGroupLayer (it's the icon of the airplane)
// else we will pass to the worldwideAirplaneGroupLayer (it's the little circle point)
function toggleWorldwideLayer(oldZoom, newZoom) {
    let thresholdZoom = 7;

    if (oldZoom < newZoom && newZoom >= thresholdZoom) {
        // zooming in and past a threshold (To zoom in is to concentrate or focus on a small detail or point)
        //  - hide worldwide layer
        //  - show aircraft related layers
        if (map.hasLayer(worldwideAirplaneGroupLayer)) {
            worldwideAirplaneGroupLayer.remove();
        }

        if (!map.hasLayer(airplaneGroupLayer)) {
            airplaneGroupLayer.addTo(map);
        }

    } else if (oldZoom > newZoom && newZoom <= thresholdZoom) {
        // zooming out and past a threshold
        // (To zoom out is to adjust the lens of a camera or (of a camera) to adjust its lens so that the image seems to be smaller and farther away)
        //  - show worldwide layer
        //  - hide aircraft related layers
        if (!map.hasLayer(worldwideAirplaneGroupLayer)) {
            worldwideAirplaneGroupLayer.addTo(map);
        } 

        if (map.hasLayer(airplaneGroupLayer)) {
            airplaneGroupLayer.remove();
        }
    }
}

generateAllAirplanes();


// ensure that the point features will be drawn beyond +/-180 longitude
// longitude is vertical
// latitude is horizonal
function wrapMarkers(groupLayer) {
    groupLayer.eachLayer(function(layer) {
        var wrappedLatLng = wrapAroundLatLng(layer.getLatLng());
        layer.setLatLng(wrappedLatLng);
    });
}

function wrapAroundLatLng(latLng) {
    var wrappedLatLng = latLng.clone();
    var mapCenterLng = map.getCenter().lng;
    var wrapAroundDiff = mapCenterLng - wrappedLatLng.lng;
    // ex: if the center lng is 0, the layer lng is -190 degre 
    // the diff is 190, it should be drawn in -190 + 360 = 170
    // if the center lng is 0, the layer lng is 190 degre
    // the diff is -190, it should be drawn in 190 + (-1)* 360 = -170
    if (wrapAroundDiff < -180 || wrapAroundDiff > 180) {
        wrappedLatLng.lng += (Math.round(wrapAroundDiff / 360) * 360);
    }
    return wrappedLatLng;
}

// display only the airplanes in the bounder 
function filterAirplaneAtCurrentMapBounds() {
    
    airplaneGroupLayer.clearLayers();
    let mapBounds = map.getBounds();

    currentAirplaneMarkers.forEach((airplane) => {
        if (mapBounds.contains(airplane.getLatLng())) {
            airplaneGroupLayer.addLayer(airplane);
        }
    });
}

// generate all the airplanes in the page
function generateAllAirplanes() {
    radarNode.classList.remove('off');
    worldwideAirplaneGroupLayer.clearLayers();

    currentAjax = $.ajax({
        url: 'https://opensky-network.org/api/states/all',
        dataType: 'json'
    })
    .done(function(response) {
        radarNode.classList.add('off');

        if (!response.states) return;
    
        let airplaneList = response.states.filter(airplane => {
            if (airplane[5] && airplane[6]){
                return airplane;
            }
        })

        airplaneList.forEach(airplane => {
            // when the view is too zoomed in, we will display the circle rather than airplane
            let simpleCircleMarker;
            if (airplane[8] === true) {
                simpleCircleMarker = L.circleMarker([airplane[6], airplane[5]], {
                    radius: 2, // pixels,
                    interactive: false,
                    stroke: false,
                    fillOpacity: 0.3,
                    fillColor: 'green'
                });
            } else {
                simpleCircleMarker = L.circleMarker([airplane[6], airplane[5]], {
                    radius: 2, // pixels,
                    interactive: false,
                    stroke: false,
                    fillOpacity: 0.3,
                    fillColor: 'blue'
                });
            }
            worldwideAirplaneGroupLayer.addLayer(simpleCircleMarker);

            let myIcon;
            if (airplane[8] === true) {
                // it's an airplane on ground, we will display a green airplane marker 
                myIcon = L.divIcon({
                    className: 'leaflet-marker-icon leaflet-zoom-animated',
                    html: '<i class="fa fa-plane" style="color:green; font-size: 20px; transform:rotate(calc(-45deg + ' + airplane[10] + 'deg)); "></i>'
                });
            } else {
                // it's an airplane in the sky, we will display a yellow airplane marker
                myIcon = L.divIcon({
                    className: 'leaflet-marker-icon leaflet-zoom-animated',
                    html: '<i class="fa fa-plane" style="color:yellow; font-size: 20px; transform:rotate(calc(-45deg + ' + airplane[10] + 'deg)); "></i>'
                });
            }
            
            let arr = [airplane[6], airplane[5]];
            let airplaneMarker  = L.marker(arr, {icon: myIcon});
            currentAirplaneMarkers.push(airplaneMarker);
        });
        filterAirplaneAtCurrentMapBounds();
    })
    .fail(function(error) {
        if (currentAjax) {
            currentAjax = null;
        }
        if (error.statusText === 'stopped early') {
            return;
        }  
        radarNode.classList.add('off');
        console.error(error);
    });
}

