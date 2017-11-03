

// https://api.foursquare.com/v2/venues/explore?client_id=RDOSYH0CG0SB2JP25AUKS5OJOUTYWGLJVPAF00GCRB01F5R5&client_secret=YDBA2IU3ZLW2HGH3EXZS1BXNVYPROWP40BQWTXGUCDYNJD3G&ll=30.029865,31.2589168&v=20170801

/**
 * ##### Variables section #####
 */

// Foursquare api authentication
const FS_CLIENT_ID = "RDOSYH0CG0SB2JP25AUKS5OJOUTYWGLJVPAF00GCRB01F5R5";
const FS_CLIENT_SECRET = "YDBA2IU3ZLW2HGH3EXZS1BXNVYPROWP40BQWTXGUCDYNJD3G";
const FS_LOCATION_SEARCH_URL_BASE
    = `https://api.foursquare.com/v2/venues/explore?client_id=${FS_CLIENT_ID}&client_secret=${FS_CLIENT_SECRET}&v=20170801&ll=`;


var map;
var myMarkers = [];

/**
 * Description: My Places model
 */
function MyPlace(name = 'UNKNOWN', marker) {
    let self = this;
    self.name = name;
    self.marker = marker;
    self.selectedClassName = ko.observable(false);
    self.placeInfoVisible = ko.observable(false);
    self.placeInfo = ko.observable("");
}


/**
 * Description: Map MVVM
 */
function MyPlacesViewModel() {
    let self = this;
    self.filterText = ko.observable("");
    self.navHidden = ko.observable(true);

    // Initial load to myPlaces
    self.myPlaces = ko.observableArray(loadPlacesToModelArray());

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
        let tempPlaces = loadPlacesToModelArray();
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
        self.myPlaces(loadPlacesToModelArray());
        self.filterText("");
        myMarkers.forEach((marker) => {
            createMyPlacesMarkers(marker, true);
        });
    }

    /**
     * Description: One function to trigger all actions needed when clicking on a place
     * in the list, i.e.:
     * - Bounce the marker on the map & open info window
     * - set the list item as selected
     */
    self.triggerPlaceClickActions = function () {
        bounceMarker(this.marker);

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
    fetch(`${FS_LOCATION_SEARCH_URL_BASE}${place.marker.position.lat()},${place.marker.position.lng()}`).
        then((response) => {
            console.log(response);
            if (response.ok) {
                return response.json();
            } else {
                console.log(`Error occured 
                ${response.status}`);
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
        zoom: 15
    });

    // Bind MVVM
    ko.applyBindings(new MyPlacesViewModel());
}

/**
 * Description: Read places array & create markers on the map
 */
function createMyPlaceMarker(title, lat, lng) {
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
        bounceMarker(this);
        let infowindow = new google.maps.InfoWindow({
            content: createInfoWindow(this)
        });
        infowindow.open(map, this);
    });

    myMarkers.push(marker);

    return marker;
}

/**
 * Description: let marker bounce
 */
function bounceMarker(marker) {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(() => {
        marker.setAnimation(null);
    }, 2000);
    map.setCenter({ lat: marker.position.lat(), lng: marker.position.lng() });
    map.setZoom(18);
}

/**
 * Description: handle on click event on each marker.
 * When clicking the marker the following will happen:
 * - The marker will bounce
 * - The Info Window will open
 */
function markerOnClick() {
    if (this) {
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
 * Desrciption: Reads places array & returns
 * a new array filled with "MyPlace" models.
 */
function loadPlacesToModelArray() {
    // Editable data
    let myPlacesTemp = [];
    myMarkers = [];
    places.forEach((place) => {
        myPlacesTemp.push(new MyPlace(place.name,
            createMyPlaceMarker(place.name, place.lat, place.lng)));
    });

    return myPlacesTemp;
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
