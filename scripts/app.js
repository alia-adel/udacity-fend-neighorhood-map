
/**
 * ##### Variables section #####
 */

var map;
var myMarkers = [];



/**
 * ##### Functions section #####
 */

/**
 * Description: This function will load the map on page load
 */

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 30.040076, lng: 31.265423 },
        zoom: 15
    });

    createMyPlacesMarkers();
}

/**
 * Description: Read places array & create markers on the map
 */
function createMyPlacesMarkers() {
    let marker, lat, lng, infowindow;

    var redStar = {
        path: 'M 125,5 155,90 245,90 175,145 200,230 125,180 50,230 75,145 5,90 95,90 z',
        fillColor: 'red',
        fillOpacity: 1,
        scale: 0.1,
        strokeColor: 'red',
        strokeWeight: 1
      };


    places.forEach((place) => {
        lat = place.lat;
        lng = place.lng;
        marker = new google.maps.Marker({
            position: { lat, lng },
            map: map,
            // icon: redStar,
            animation: google.maps.Animation.DROP,
            title: place.name
        });
        
        marker.addListener('click', function() {            
            bounceMarker(this.position.lat(), this.position.lng());
            let infowindow = new google.maps.InfoWindow({
                content: createInfoWindow(this)
            });
            infowindow.open(map, this);
        });
        myMarkers.push(marker);
        
    });
}

/**
 * Description: let marker bounce
 */
function bounceMarker(lat, lng) {
    let tempMarker;
    if (lat && lng && !lat.isNaN && !lng.isNaN) {
        tempMarker = new google.maps.Marker({
            position: { lat, lng },
        });
        myMarkers.forEach((marker) => {
            if (tempMarker.position && marker.position) {
                if (tempMarker.position.lat() === marker.position.lat()
                    && tempMarker.position.lng() === marker.position.lng()) {
                        //TODO see how can this can be enhanced to remove duplicate lines
                        marker.setAnimation(google.maps.Animation.BOUNCE);
                        setTimeout(() => {
                            marker.setAnimation(null);
                        }, 2000);
                        map.setCenter({lat: marker.position.lat(), lng: marker.position.lng()});
                        map.setZoom(18);
                }
            }

        });
    }
    
}

/**
 * Description: handle on click event on each marker.
 * When clicking the marker the following will happen:
 * - The marker will bounce
 * - The Info Window will open
 */
function markerOnClick() {
    if(this) {
        this.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => {
            this.setAnimation(null);
        }, 2000);        
    }
}

/**
 * Description: Formulates the info Window content
 * @param 
 * @return {infoPathContent} - {String}
 */
function createInfoWindow(marker) {
    return `<div class="infoWindow">
        <h3>${marker.title}</h3>
        <span>Lat: ${marker.position.lat()}</span>
        <span>Lng: ${marker.position.lng()}</span>
    </div>"`;
}

/**
 * ##### Event listeners #####
 */

/**
 * Hide/Show navigation on hamburger click
 */
$('#close-nav').click(() => {    
    if ($('#app-nav').hasClass('hidden')) {
        $('#app-nav').removeClass('hidden');
    } else {
        $('#app-nav').addClass('hidden');
    }
});


/**
 * Bounce marker & open Info Window when my place link is clicked
 */
// $('.myplace').click((event) => {
//     event.preventDefault();
//     bounceMarker(this);
// });

