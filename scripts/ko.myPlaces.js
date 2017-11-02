/**
 * Description: Knockout MVVM for my Places
 */

/**
 * My Places model
 */
function MyPlace(name = 'UNKNOWN', lat, lng) {
    let self = this;
    self.name = name;
    self.lat = lat;
    self.lng = lng;
    self.bounceMarker = function() {
        bounceMarker(this.lat, this.lng);
    }
}

function MyPlacesViewModel() {
    let self = this;
    // Editable data
    let myPlacesTemp = [];
    places.forEach((place) => {
        myPlacesTemp.push(new MyPlace(place.name, place.lat, place.lng));
    });

    self.myPlaces = ko.observableArray(myPlacesTemp);
}

ko.applyBindings(new MyPlacesViewModel());