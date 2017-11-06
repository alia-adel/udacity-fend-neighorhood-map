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
 * - Places' names array
 * - Map center position
 * 
 * ## KNOCKOUT MVVM ##
 * ===================
 * - "Place" {function} --> Define knockout Model
 *      - The model holds data for the place 
 * 
 * - "PlacesViewModel" {function} --> Define knockout View Model
 *      - "createPlaceMarker" {function}: params {title, lat, lng}
 *          1- Creates a marker on the map with the given parameters
 * 
 * ## SUPPORTING FUNCTIONS ##
 * ==========================
 * - "initMap" {function}
 *  1- Initialize the map to the center of old Cairo
 *  2- calls "geoCodePlaces" to geocode "oldCairoPlaces" places
 * 
 * - "resetMapToPosition" {function}
 *  1- Resets the map position to the center of old Cairo
 * 
 * - "CenterControl" {function/constructor}
 *  1- Creates a custom control on the map to reset the map to center of old Cairo
 *  
 * - "geoCodePlaces" {function}
 *  1- Loops on "oldCairoPlaces" places inside a Promise
 *  2- After Promise id done, kockout binds a new "PlacesViewModel" view model
 * 
 * - "loadPlacesToPlacesModelArray" {function} 
 *  1- Casts "oldCairoPlaces" into a "Place" model array & returns it
 * 
 * - "loadInfoWindow" {function}
 *  1- Search for the place object in the places area that matches the passed marker location.
 *  2- Loads "info-window" html div into a google map info window on the 
 *     marker passed to the function.
 *     "div "info-window" data is bound to the currently selected place object' fourSquare data" 
 * 
 * - "loadFourSquarePlaceInfo" {function}
 *  1- Using FourSquare venue search api, getting first entry for each place position
 *  2- Load data in "Place" model.
 * 
 * - "updateMarker" {function}
 *  1- Show or Hide the marker from the map based on the received boolean
 */

/**
 * ## CONSTANTS/VARIABLES ##
 */

// Foursquare api authentication
const FS_CLIENT_ID = "RDOSYH0CG0SB2JP25AUKS5OJOUTYWGLJVPAF00GCRB01F5R5";
const FS_CLIENT_SECRET = "YDBA2IU3ZLW2HGH3EXZS1BXNVYPROWP40BQWTXGUCDYNJD3G";
const FS_LOCATION_SEARCH_URL_BASE
    = `https://api.foursquare.com/v2/venues/explore?client_id=${FS_CLIENT_ID}&client_secret=${FS_CLIENT_SECRET}&v=20170801&radius=200&venuePhotos=1&sortByDistance=1&limit=1&ll=`;
const oldCairoPlaces = [{
    "name": "Salah El Din Al Ayouby Citadel"
}, {
    "name": "Abdeen Palace Museum"
}, {
    "name": "Qalawun Complex"
}, {
    "name": "Wekalet El Ghoury"
}, {
    "name": "Coptic Museum"
}, {
    "name": "Sultan Hassan Mosque"
}];
const mapInitialPos = {lat: 30.0298604, lng: 31.261105499999985};

let map;
let myMarkers = [];
let myInfoWindows = new Map();


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
    // Foursquare data
    self.placeFourSquareInfo = ko.observable();
}


/**
 * Description: Map MVVM
 */
function PlacesViewModel() {
    let self = this;
    self.filterText = ko.observable("");
    self.navHidden = ko.observable(true);
    // Observe the currently selected place
    self.selectedPlace = ko.observable();

    /**
     * Description: Read places array & create markers on the map
     */
    self.createPlaceMarker = function (title, lat, lng) {
        let marker, infowindow;

        // Create marker
        marker = new google.maps.Marker({
            position: { lat, lng },
            map: map,
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
    self.myPlacesBkp = self.myPlaces();


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
    self.filterPlaces = function () {
        // Make sure to reload all places
        let tempPlaces = self.myPlacesBkp;
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
        self.myPlaces(self.myPlacesBkp);
        self.filterText("");
        myMarkers.forEach((marker) => {
            updateMarker(marker, true);
        });

        // Closes the currently opened infoWindows
        myInfoWindows.forEach((value) => {
            value.close();
        });

        resetMapToPosition(mapInitialPos.lat, mapInitialPos.lng);

        self.myPlaces().forEach((place) => {
            place.selectedClassName(false);
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
        self.selectedPlace().marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => {
            self.selectedPlace().marker.setAnimation(null);
        }, 2000);

        resetMapToPosition(this.marker.position.lat(), this.marker.position.lng());
        loadInfoWindow(this.marker);

        self.myPlaces().forEach((place) => {
            place.selectedClassName(false);
        });

        this.selectedClassName(true);


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
        center: mapInitialPos,
        streetViewControl: true,
        fullscreenControl: true,
        scaleControl: true,
        zoom: 15
    });

    // Create the DIV to hold the control and call the CenterControl()
    // constructor passing in this DIV.
    let centerControlDiv = document.createElement('div');
    let centerControl = new CenterControl(centerControlDiv, map);

    centerControlDiv.index = 1;
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(centerControlDiv);

    // GeoCode places
    geoCodePlaces();
}

/**
 * Description: Resets the map position to the given latitude & longtitude
 * 
 * @param {float} lat 
 * @param {float} lng 
 */
function resetMapToPosition(lat, lng) {
    map.setCenter(mapInitialPos);
    map.setZoom(15);
}


/**
 * Description: The CenterControl adds a control to the map that recenters the map mapInitialPos
 * This constructor takes the control DIV as an argument.
 * Credits: https://developers.google.com/maps/documentation/javascript/examples/control-custom
 * 
 * @param {Object} controlDiv 
 * @param {Object} map 
 * @constructor
 */      
function CenterControl(controlDiv, map) {
    // Set CSS for the control border.
    let controlUI = document.createElement('div');
    controlUI.style.backgroundColor = '#fff';
    controlUI.style.border = '2px solid #fff';
    controlUI.style.borderRadius = '3px';
    controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    controlUI.style.cursor = 'pointer';
    controlUI.style.marginBottom = '22px';
    controlUI.style.textAlign = 'center';
    controlUI.title = 'Click to recenter the map';
    controlDiv.appendChild(controlUI);

    // Set CSS for the control interior.
    let controlText = document.createElement('div');
    controlText.style.color = 'rgb(25,25,25)';
    controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
    controlText.style.fontSize = '16px';
    controlText.style.lineHeight = '38px';
    controlText.style.paddingLeft = '5px';
    controlText.style.paddingRight = '5px';
    controlText.innerHTML = 'Center Map';
    controlUI.appendChild(controlText);

    // Setup the click event listeners: simply set the map to Chicago.
    controlUI.addEventListener('click', function () {
        map.setCenter(mapInitialPos);
    });
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
            geocoder.geocode({
                address: place.name
            },
                function (results, status) {
                    if (status === google.maps.GeocoderStatus.OK) {
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
 * & opens it on the given marker.
 * 
 * @param {Object} marker 
 * @return {infoPathContent} - {String}
 */
function loadInfoWindow(marker) {
    let content = $('#info-window').html();

    let infowindow = new google.maps.InfoWindow({
        content: content,
        maxWidth: 400
    });

    infowindow.open(map, marker);

    // Track the opened infoWindows
    myInfoWindows.set(marker, infowindow);    
}


/**
 * Description: Get Foursquare text & photos for the given marker
 * https://api.foursquare.com/v2/venues/explore?client_id=CLIENT_ID&client_secret=CLIENT_SECRET&v=20170801&ll=30.0058,31.230999999999995
 * @param {Object} place 
 * @return {Object} - {place}
 */
function loadFourSquarePlaceInfo(place) {
    fetch(`${FS_LOCATION_SEARCH_URL_BASE}${place.location().lat()},${place.location().lng()}`).
        then((response) => {
            if (response.ok) {
                return response.json();
            } else {
                console.log(`Error occured with status: ${response.status}`);
            }
        }).then((response) => {
            let fs_response = response.response;
            // Checking 
            if (fs_response.groups && fs_response.groups.length > 0
                && fs_response.groups[0].items && fs_response.groups[0].items.length > 0) {
                let tempFSObj = {};
                // loading only one item
                let first_item = fs_response.groups[0].items[0];

                // Loading foursquare item qoute & qoute user
                if (first_item.tips && first_item.tips.length > 0) {
                    tempFSObj.qoute = {};
                    tempFSObj.qoute.text = first_item.tips[0].text;

                    if (first_item.tips[0].user && first_item.tips[0].user.firstName) {
                        tempFSObj.qoute.user
                            = `${first_item.tips[0].user.firstName} ${first_item.tips[0].user.lastName}`;
                    }
                }

                // Loading foursquare item venue info
                if (first_item.venue) {
                    tempFSObj.venue = {};
                    if (first_item.venue.name) {
                        tempFSObj.venue.name = first_item.venue.name;
                    }
                    if (first_item.venue.url) {
                        tempFSObj.venue.url = first_item.venue.url;
                    }
                    if (first_item.venue.rating) {
                        tempFSObj.venue.rating = first_item.venue.rating;
                    }
                    if (first_item.venue.ratingColor) {
                        tempFSObj.venue.ratingColor = first_item.venue.ratingColor;
                    }

                    if (first_item.venue.featuredPhotos && first_item.venue.featuredPhotos.items
                        && first_item.venue.featuredPhotos.items.length > 0) {
                        tempFSObj.venue.photo = {};
                        tempFSObj.venue.photo.url =
                            first_item.venue.featuredPhotos.items[0].prefix + "width" +
                            first_item.venue.featuredPhotos.items[0].width +
                            first_item.venue.featuredPhotos.items[0].suffix;
                        if (first_item.venue.featuredPhotos.items[0].user) {
                            tempFSObj.venue.photo.user =
                                first_item.venue.featuredPhotos.items[0].user.firstName + " " +
                                first_item.venue.featuredPhotos.items[0].user.lastName;
                        }
                    }
                }
                place.placeFourSquareInfo(tempFSObj);
            } else {
                place.placeFourSquareInfo(null);
            }
        }).
        catch((error) => {
            console.log(error);
        });

    return place;
}



/**
 * Description: show/hide marker from the map based on addMarker flag
 * 
 * @param {Object} marker 
 * @return {boolean} - {addMarker}
 */
function updateMarker(marker, addMarker) {
    if (marker && addMarker && marker.getMap() == null) {
        marker.setMap(map);
    }

    if (marker && !addMarker) {
        marker.setMap(null);
    }
}
