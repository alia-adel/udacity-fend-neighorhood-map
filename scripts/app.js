
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
    let marker, lat, lng;
    places.forEach((place) => {
        lat = place.lat;
        lng = place.lng;
        marker = new google.maps.Marker({
            position: { lat, lng },
            map: map,
            animation: google.maps.Animation.DROP,
            title: place.name
        });
        marker.addListener('click', markerOnClick);
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
                }
            }

        });
    }
}

function markerOnClick() {
    if(this) {
        this.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => {
            this.setAnimation(null);
        }, 2000);
    }
}

/**
 * ##### Event listeners #####
 */

/**
 * Hide/Show navigation on hamburger click
 */
document.getElementById("close-nav").addEventListener("click", function () {
    let classNames = document.getElementById("app-nav").className;
    if (classNames.includes('hidden')) {
        document.getElementById("app-nav").className = classNames.replace('hidden', '');
    } else {
        document.getElementById("app-nav").className = `${classNames} hidden `;
    }
});

/**
 * Bounce marker & open Info Window when my place link is clicked
 */
Array.from(document.getElementsByClassName("myplace")).forEach((element) => {
    element.addEventListener("click", function (event) {
        event.preventDefault();
        bounceMarker(this);
    });
});

