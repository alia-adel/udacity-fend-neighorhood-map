/**
 * Description: My Places model
 */
function MyPlace(name = 'UNKNOWN', lat, lng) {
    let self = this;
    self.name = name;
    self.lat = lat;
    self.lng = lng;
    self.selectedClassName = ko.observable(false);
}


/**
 * Description: Map MVVM
 */
function MyPlacesViewModel() {
    let self = this;
    self.filterText = ko.observable("");

    // Initial load to myPlaces
    self.myPlaces = ko.observableArray(loadPlacesToModelArray());

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
                updateMarker(tempPlaces[i].lat, tempPlaces[i].lng, true);
            } else {
                // In case the place doesnt match remove its marker from the map
                updateMarker(tempPlaces[i].lat, tempPlaces[i].lng, false);
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
            createMyPlacesMarkers(marker.lat, marker.lng, true);
        });
    }

    /**
     * Description: One function to trigger all actions needed when clicking on a place
     * in the list, i.e.:
     * - Bounce the marker on the map & open info window
     * - set the list item as selected
     */
    self.triggerPlaceClickActions = function () {
        bounceMarker(this.lat, this.lng);

        self.myPlaces().forEach((place) => {
            place.selectedClassName(false);
        });
        this.selectedClassName(true);
    }
}

/**
 * Desrciption: Reads places array & returns
 * a new array filled with "MyPlace" models.
 */
function loadPlacesToModelArray() {
    // Editable data
    let myPlacesTemp = [];
    places.forEach((place) => {
        myPlacesTemp.push(new MyPlace(place.name, place.lat, place.lng));
    });

    return myPlacesTemp;
}

/**
 * Description: filter markers on the map based on 
 * //TODO not working
 */
function updateMarker(lat, lng, addMarker) {
    console.log(`lat: ${lat}, lng: ${lng}, addMarker: ${addMarker}`);
    myMarkers.forEach((marker) => {
        
        console.log(`Now matching lat & lng:
        Do lat match ${marker.getPosition().lat()}? ${Object.is(marker.getPosition().lat(), lat)}
        Do lng match ${marker.getPosition().lng()}? ${Object.is(marker.getPosition().lng(), lng)} `);

        if (Object.is(marker.getPosition().lat(), lat)
            && Object.is(marker.getPosition().lng(), lng)) {
                
            console.log(`Marker Map obj before set: ${marker.getMap()}
            Is map === null ${marker.getMap() === null}`);
            if (addMarker && marker.getMap() === null) {
                marker.setMap(map);
            } else if(!addMarker){
                marker.setMap(null);
            }
            console.log(`Marker Map obj after set: ${marker.getMap()}`);
        }
    });
}

ko.applyBindings(new MyPlacesViewModel());