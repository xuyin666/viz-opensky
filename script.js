// the view from Paris 
let map = L.map('map').setView([48.8566, 2.3522], 5);
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    // the accessToken get from Mapbox
    accessToken: 'pk.eyJ1Ijoibmljb2xhc3UiLCJhIjoiY2t4Yno4enhzMHNxNjJvbzdpN2ZqcW1veiJ9.D3junYb4Fyksl9eztv4YEQ'
}).addTo(map);


// var myIcon = L.divIcon({
//     className: 'leaflet-marker-icon leaflet-zoom-animated',
//     html: '<i class="fa fa-plane my-div-icon" style="font-size: 20px; "></i>'
// });
// Paris
// L.marker([48.8566, 2.3522], {icon: myIcon}).addTo(map);
// Lyon
// L.marker([45.7640, 4.8357], {icon: myIcon}).addTo(map);

let currentAjax = null;

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