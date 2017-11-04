/**
 * Author: Alia.Adel
 * GitHub: https://github.com/alia-adel/
 * Description: Udacity front end nanodegree neighborhood project
 * Date: November 2017
 * 
 * ### TABLE OF CONTENTS ###
 * ==============================================================
 * 
 * ## CONSTANTS/VARIABLES ##
 * ==========================
 * - FourSquare API IDs
 * - FourSquare API URL
 * - Application saved places
 * 
 * ## KNOCKOUT MVVM ##
 * ===================
 * - "Place" {function} --> Define knockout Model
 *      - The model holds data for the place 
 * 
 * - "PlacesViewModel" {function} --> Define knockout View Model
 * - 
 * ## SUPPORTING FUNCTIONS ##
 * ==========================
 * - "initMap" {function}
 *  1- Initialize the map to the center of old Cairo
 *  2- calls "geoCodePlaces" to geocode "oldCairoPlaces" places
 * 
 * - "geoCodePlaces" {function}
 *  1- Loops on "oldCairoPlaces" places inside a Promise
 *  2- After Promise id done, kockout binds a new "PlacesViewModel" view model
 * 
 * - "loadPlacesToPlacesModelArray" {function} 
 *  1- Casts "oldCairoPlaces" into a "Place" model array & returns it
 * 
 * - "createPlaceMarker" {function}: params {title, lat, lng}
 *  1- Creates a marker on the map with the given parameters
 * 
 */

/**
 * ## CONSTANTS/VARIABLES ##
 */

// Foursquare api authentication
const FS_CLIENT_ID = "RDOSYH0CG0SB2JP25AUKS5OJOUTYWGLJVPAF00GCRB01F5R5";
const FS_CLIENT_SECRET = "YDBA2IU3ZLW2HGH3EXZS1BXNVYPROWP40BQWTXGUCDYNJD3G";
const FS_LOCATION_SEARCH_URL_BASE
    = `https://api.foursquare.com/v2/venues/explore?client_id=${FS_CLIENT_ID}&client_secret=${FS_CLIENT_SECRET}&v=20170801&ll=`;
let oldCairoPlaces = [{
    "name": "Salah El Din Al Ayouby Citadel"
}, {
    "name": "EL Moez Mosque"
}, {
    "name": "Wekalet El Ghoury"
}, {
    "name": "Al-Rifa'i Mosque"
}, {
    "name": "Khan el-Khalili"
}, {
    "name": "Masjid Amr Ibn El Aas"
}, {
    "name": "Ben Ezra Synagogue"
}, {
    "name": "The Hanging Church"
}, {
    "name": "Coptic Museum"
}];

var map;
var myMarkers = [];

/**
 * Description: My Places model
 */
function Place(name = 'UNKNOWN', location) {
    let self = this;
    self.name = name;
    self.location = ko.observable(location);
    self.marker = ko.computed(function () {
        return createPlaceMarker(
            self.name, self.location().lat(), self.location().lng());
    }, self);
    self.selectedClassName = ko.observable(false);
    self.placeInfoVisible = ko.observable(false);
    self.placeInfo = ko.observable("");
}


/**
 * Description: Map MVVM
 */
function PlacesViewModel() {
    let self = this;
    self.filterText = ko.observable("");
    self.navHidden = ko.observable(true);

    // Initial load to myPlaces
    self.myPlaces = ko.observableArray(loadPlacesToPlacesModelArray());

    /**
     * Description: Change navifation visibility status
     */
    self.changeNavigationStatus = function () {
        (self.navHidden()) ? self.navHidden(false) : self.navHidden(true);
    }

    /**
     * Description: When user filters on places
     *      1- Remove the unmatched results from myPlaces' array
     *      2- Remove their markers from the map
     */
    self.updatePlaces = function () {
        // Make sure to reload all places
        let tempPlaces = loadPlacesToPlacesModelArray();
        let updatePlaces = [];

        // loop on places to see if any of the names matches partially the filter text
        for (let i = 0; i < tempPlaces.length; i++) {
            if (tempPlaces[i].name.trim().toLocaleLowerCase().includes(
                self.filterText().trim().toLocaleLowerCase())) {
                // In case place matches, keep it in a side array
                updatePlaces.push(tempPlaces[i]);
                // In case the place matches re-add the marker on the map if not there
                updateMarker(tempPlaces[i].marker(), true);
            } else {
                // In case the place doesnt match remove its marker from the map
                updateMarker(tempPlaces[i].marker(), false);
            }

            // Update myPlaces observable array with the update places matching the filter text
            if (updatePlaces.length > 0) {
                self.myPlaces(updatePlaces);
            }
        }
    }

    /**
     * Description: Resets back list of places & markers
     */
    self.resetPlaces = function () {
        self.myPlaces(loadPlacesToPlacesModelArray());
        self.filterText("");
        myMarkers.forEach((marker) => {
            createMyPlacesMarkers(marker, true);
        });
    }

    /**
     * Description: One function to trigger all actions needed when clicking on a place
     * in the list, i.e.:
     * - Set the map center to the place's position
     * - set the list item as selected
     * - Display Foursquare info related to the selected place
     */
    self.triggerPlaceClickActions = function () {
        map.setCenter({ lat: this.marker().position.lat(), lng: this.marker().position.lng() });
        map.setZoom(18);

        self.myPlaces().forEach((place) => {
            place.selectedClassName(false);
        });

        this.selectedClassName(true);

        this.placeInfoVisible(true);
        this.placeInfo(getFourSquarePlaceInfo(this));
    }
}


/**
 * ##### Functions section #####
 */

/**
 * Description: Get Foursquare text & photos for the given marker
 */
function getFourSquarePlaceInfo(place) {
    fetch(`${FS_LOCATION_SEARCH_URL_BASE}${place.marker().position.lat()},${place.marker().position.lng()}`).
        then((response) => {
            if (response.ok) {
                return response.json();
            } else {
                console.log(`Error occured with status: ${response.status}`);
            }
        }).then((response) => {
            let fs_response = response.response;
            if (fs_response.groups && fs_response.groups.length > 0
                && fs_response.groups[0].items && fs_response.groups[0].items.length > 0) {
                let first_item = fs_response.groups[0].items[0];
                if (first_item.tips && first_item.tips.length > 0) {
                    place.placeInfo(first_item.tips[0].text);
                }
            }

        }).
        catch((error) => {
            console.log(error);
        });

}


/**
 * Description: This function will load the map on page load
 */
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 30.040076, lng: 31.265423 },
        streetViewControl: true,
        zoom: 15
    });

    // GeoCode places
    geoCodePlaces();
}


/**
 * Description: Geocoding places using Google JavaScript API documentation examples
 * https://developers.google.com/maps/documentation/javascript/examples/geocoding-simple
 *          1- Constructs a Google Geocoder object
 *          2- Create a Promise to track when all places are geocoded
 *              - Loop on "oldCairoPlaces" variable & geocode each of its places
 *              - call Promise.resolve() when all places were geocoded
 *          3- Once resolved create a new knouckout model view & bind it
 */
function geoCodePlaces() {
    var geocoder = new google.maps.Geocoder();

    new Promise((resolve, reject) => {
        let counter = oldCairoPlaces.length;
        oldCairoPlaces.forEach((place) => {
            geocoder.geocode(
                { 'address': place.name },
                function (results, status) {
                    if (status === 'OK') {
                        place.location = results[0].geometry.location;
                        counter--;
                        if (counter === 0) {
                            resolve('OK');
                        }
                    } else {
                        console.log(`Geocode was not successful for ${place.name} for the following reason: ${status}`);
                    }
                }
            );
        });
    }).then((result) => {
        if (result === 'OK') {
            // Once the places lat/lng are retrieved bind MVVM
            ko.applyBindings(new PlacesViewModel());
        } else {
            throw Error(`Geocode was not successful for the following reason: ${result}`);
        }
    }).catch((error) => {
        console.log(`Error while trying to Geocode places with error code: ${error}`);
    });

}


/**
 * Desrciption: Casts "oldCairoPlaces" into a "Place" array & returns it
 * @returns {Array} - "Place" array
 */
function loadPlacesToPlacesModelArray() {
    // Editable data
    let placesTemp = [];
    oldCairoPlaces.forEach((place) => {
        placesTemp.push(new Place(place.name, place.location));
    });

    return placesTemp;
}


/**
 * Description: Read places array & create markers on the map
 */
function createPlaceMarker(title, lat, lng) {
    let marker, infowindow;

    var redStar = {
        path: 'M 125,5 155,90 245,90 175,145 200,230 125,180 50,230 75,145 5,90 95,90 z',
        fillColor: 'red',
        fillOpacity: 1,
        scale: 0.1,
        strokeColor: 'red',
        strokeWeight: 1
    };

    // Create marker
    marker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
        // icon: redStar,
        animation: google.maps.Animation.DROP,
        title: title
    });

    marker.addListener('click', function () {
        this.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => {
            marker.setAnimation(null);
        }, 2000);
        map.setCenter({ lat: this.position.lat(), lng: this.position.lng() });

        let infowindow = new google.maps.InfoWindow({
            content: createInfoWindow(this)
        });
        infowindow.open(map, this);
    });

    myMarkers.push(marker);

    return marker;
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
 * Description: filter markers on the map based on 
 * //TODO not working
 */
function updateMarker(marker, addMarker) {
    if (marker && addMarker && marker.getMap() == null) {
        marker.setMap(map);
    }

    if (marker && !addMarker) {
        marker.setMap(null);
    }
}
