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
    = `https://api.foursquare.com/v2/venues/explore?client_id=${FS_CLIENT_ID}&client_secret=${FS_CLIENT_SECRET}&v=20170801&radius=200&venuePhotos=1&sortByDistance=1&limit=1&ll=`;
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
 * Description: Place model
 */
function Place(name = 'UNKNOWN', place = undefined) {
    let self = this;
    self.name = name;
    self.place = place
    self.location = ko.computed(function () {
        return self.place.geometry.location;
    }, self);
    self.selectedClassName = ko.observable(false);
    self.placeInfoVisible = ko.observable(false);
    // Foursquare data
    self.placeFourSquareInfo = ko.observable({});
}


/**
 * Description: Map MVVM
 */
function PlacesViewModel() {
    let self = this;
    self.filterText = ko.observable("");
    self.navHidden = ko.observable(true);
    // Observe the currently selected place
    self.selectedPlace = ko.observable({});


    /**
     * Description: Read places array & create markers on the map
     */
    self.createPlaceMarker = function (title, lat, lng) {
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
            // Search for the marker place & set it as selected
            let place = self.getMarkerPlace(this);
            if (place) {
                self.selectedPlace(place);
                loadInfoWindow(this);
            } else {
                console.log('Error loading a place for the clicked marker');
            }
        });

        myMarkers.push(marker);

        return marker;
    }



    // Initial load to myPlaces
    self.myPlaces = ko.observableArray(loadPlacesToPlacesModelArray());


    // Initial Load Place FourSquare info
    self.myPlaces().forEach((place) => {
        place.marker = self.createPlaceMarker(place.name, place.location().lat(), place.location().lng());
        place.placeFourSquareInfo(loadFourSquarePlaceInfo(place));
    });


    /**
     * Description: Get the place object based on the given marker
     */
    self.getMarkerPlace = function (marker) {
        let foundPlace;
        self.myPlaces().forEach((place) => {
            if (marker.position.lat() === place.location().lat()
                && marker.position.lng() === place.location().lng()) {
                    foundPlace = place;          
            }
        });
        return foundPlace;
    }



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
                updateMarker(tempPlaces[i].marker, true);
            } else {
                // In case the place doesnt match remove its marker from the map
                updateMarker(tempPlaces[i].marker, false);
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
            updateMarker(marker, true);
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
        self.selectedPlace(this);

        self.myPlaces().forEach((place) => {
            place.selectedClassName(false);
        });

        this.selectedClassName(true);

        map.setCenter({ lat: this.marker.position.lat(), lng: this.marker.position.lng() });
        map.setZoom(18);

        loadInfoWindow(this.marker);
    }
}

/**
 * #### end of Kockout View Model ####
 */


/**
 * ##### Functions section #####
 */

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
                        place.place = results[0];
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
        console.log(`Error: ${error}`);
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
        placesTemp.push(new Place(place.name, place.place));
    });

    return placesTemp;
}


/**
 * Description: Formulates the info Window content
 * & opens it
 * @param 
 * @return {infoPathContent} - {String}
 */
function loadInfoWindow(marker) {
    let content = $('#info-window').html();

    let infowindow = new google.maps.InfoWindow({
        content: content,
        maxWidth: 300
    });

    infowindow.open(map, marker);
}


/**
 * Description: Get Foursquare text & photos for the given marker
 * https://api.foursquare.com/v2/venues/explore?client_id=RDOSYH0CG0SB2JP25AUKS5OJOUTYWGLJVPAF00GCRB01F5R5&client_secret=YDBA2IU3ZLW2HGH3EXZS1BXNVYPROWP40BQWTXGUCDYNJD3G&v=20170801&ll=30.0058,31.230999999999995
 */
function loadFourSquarePlaceInfo(place) {
    let placeInfo = {};
    fetch(`${FS_LOCATION_SEARCH_URL_BASE}${place.marker.position.lat()},${place.marker.position.lng()}`).
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
                    let qoute = {};
                    qoute.text = first_item.tips[0].text;
                    if (first_item.tips[0].user) {
                        qoute.user
                            = `${first_item.tips[0].user.firstName} ${first_item.tips[0].user.lastName}`;
                    }
                    placeInfo.qoute = qoute;
                }

                if (first_item.venue) {
                    placeInfo.venue = {};
                    placeInfo.venue.name = first_item.venue.name;
                    placeInfo.venue.url = first_item.venue.url;
                    placeInfo.venue.rating = first_item.venue.rating;
                    placeInfo.venue.ratingColor = first_item.venue.ratingColor;

                    if (first_item.venue.featuredPhotos && first_item.venue.featuredPhotos.items
                        && first_item.venue.featuredPhotos.items.length > 0) {
                        placeInfo.venue.photo = {};
                        placeInfo.venue.photo.url =
                            first_item.venue.featuredPhotos.items[0].prefix +
                            first_item.venue.featuredPhotos.items[0].width + "x"
                        first_item.venue.featuredPhotos.items[0].height +
                            first_item.venue.featuredPhotos.items[0].suffix;
                        if (first_item.venue.featuredPhotos.items[0].user) {
                            placeInfo.venue.photo.user =
                                first_item.venue.featuredPhotos.items[0].user.firstName + " " +
                                first_item.venue.featuredPhotos.items[0].user.lastName;
                        }

                    }
                }

            }
        }).
        catch((error) => {
            console.log(error);
        });
    return placeInfo;

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
