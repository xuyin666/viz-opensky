let airplaneShadowGroupLayer = L.featureGroup();
let worldwideAirplaneGroupLayer = L.featureGroup();
let oldZoom = null;
let currentAjax = null;

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
.on('zoom', function() {
    let newZoom = map.getZoom();
    toggleWorldwideLayer(oldZoom, newZoom);
    // updateParallaxZOffset(oldZoom, newZoom);
})
.on('moveend', function() {
    wrapMarkers(worldwidePlaneGroupLayer);
    // filterParallaxAircraftAtCurrentMapBounds();
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
    let thresholdZoom = 5;

    if (oldZoom < newZoom && newZoom >= thresholdZoom) {
        // zooming in and past a threshold (To zoom in is to concentrate or focus on a small detail or point)
        //  - hide worldwide layer
        //  - show aircraft related layers
        if (map.hasLayer(worldwideAircraftGroupLayer)) {
            worldwideAircraftGroupLayer.remove();
        }

        if (!map.hasLayer(airplaneGroupLayer)) {
            airplaneGroupLayer.addTo(map);
            airplaneShadowGroupLayer.addTo(map);
        }

    } else if (oldZoom > newZoom && newZoom <= thresholdZoom) {
        // zooming out and past a threshold
        // (To zoom out is to adjust the lens of a camera or (of a camera) to adjust its lens so that the image seems to be smaller and farther away)
        //  - show worldwide layer
        //  - hide aircraft related layers
        if (!map.hasLayer(worldwideAircraftGroupLayer)) {
            worldwideAircraftGroupLayer.addTo(map);
        }

        if (map.hasLayer(airplaneGroupLayer)) {
            airplaneGroupLayer.remove();
            airplaneShadowGroupLayer.remove();
        }
    }
}


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




function getAllAirplane() {
    currentAjax = $.ajax({
        url: 'https://opensky-network.org/api/states/all?lamin=41.2632185&lomin=-5.4534286&lamax=51.268318&lomax=9.8678344',
        dataType: 'json'
    })
    .done(function(response) {
        if (currentAjax) {
            currentAjax = null;
        }

        if (!response.states) {
            return;
        }
        // console.log(response.states);
        // response.states.forEach(airplane => {
        //     console.log("latitude " + airplane[6] + "longitude " + airplane[5]);
        // });

        // console.log("total data length ", response.states.length);
        
        // return all the airplanes with a longtitude and latitude
        let airplaneList = response.states.filter(airplane => {
            if (airplane[5] && airplane[6]){
                return airplane;
            }
        })
        // console.log("useful data length ", airplaneList.length);

        airplaneList.forEach(airplane => {


        var myIcon = L.divIcon({
            className: 'leaflet-marker-icon leaflet-zoom-animated',
            html: '<i class="fa fa-plane my-div-icon" style="font-size: 20px; transform:rotate(calc(-45deg + ' + airplane[10] + 'deg)); "></i>'
        });

        let arr = [airplane[6], airplane[5]]
        L.marker(arr, {icon: myIcon}).addTo(map);
        let myMarker ;

            // var parallaxMarker = L.Marker.parallax(
            // {
            //     lat: aircraft[6],
            //     lng: aircraft[5]
            // }, {
            //     parallaxZoffset: aircraft[13] / 10, // use the altitude for the parallax z-offset value
            //     icon: L.divIcon({
            //     className: 'leaflet-marker-icon leaflet-zoom-animated leaflet-interactive',
            //     html: '<i class="fas fa-plane fa-2x" style="transform:rotate(calc(-45deg + ' + aircraft[10] + 'deg)) scale(' + Math.max(1, aircraft[13] / 10500) + ');" aria-hidden="true"></i>'
            //     })
            // }
            // );
        });


    })
}

getAllAirplane();