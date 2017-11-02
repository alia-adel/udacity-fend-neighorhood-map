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
}

function MyPlacesViewModel() {
    let self = this;
    // Editable data
    let myPlacesTemp = [];
    places.forEach((place) => {
        myPlacesTemp.push(new MyPlace(place.name, place.lat, place.lng));
    });

    self.myPlaces = ko.observableArray(myPlacesTemp);

    self.filtertext = ko.observable("");

    // When user filters on places, remove the un matches results from myPlaces array
    self.updatePlaces = function () {
        let filteredPlaces = [];
        myPlacesTemp = places;
        self.myPlaces = ko.observableArray(places);
        myPlacesTemp.forEach((place, index) => {
            // console.log(`Place to match: ${place.name.toLocaleLowerCase()}
            //     Filtered Text: ${self.filtertext().toLocaleLowerCase()}
            //     $regex val: ${new RegExp(self.filtertext().toLocaleLowerCase()).exec(place.name.toLocaleLowerCase())}
            //     Do they match?
            //     ${new RegExp(self.filtertext().trim().toLocaleLowerCase()).exec(place.name.toLocaleLowerCase()) 
            //         == self.filtertext().trim().toLocaleLowerCase()}`);
            if (new RegExp(self.filtertext().toLocaleLowerCase()).exec(place.name.toLocaleLowerCase())
                != self.filtertext().toLocaleLowerCase()) {
                for (let i = 0; i < self.myPlaces().length; i++) {
                    // console.log(`Place name: ${place.name}
                    //     My place name: ${self.myPlaces()[i].name}`);
                    if (place.name == self.myPlaces()[i].name) {
                        self.myPlaces = ko.observable(self.myPlaces().splice(i, 1));
                        break;
                    }
                }

            }
        })

    }

    // Revert back the places
    self.resetPlaces = function () {
        console.log('reset in progress');
        myPlacesTemp = [];
        places.forEach((place) => {
            myPlacesTemp.push(new MyPlace(place.name, place.lat, place.lng));
        });
        self.myPlaces = ko.observableArray(myPlacesTemp);
        self.filtertext = ko.observable("");

    }

    // When list item is clicked the bounceMarker function is called
    self.bounceMarker = function () {
        bounceMarker(this.lat, this.lng);
    }
}

ko.applyBindings(new MyPlacesViewModel());