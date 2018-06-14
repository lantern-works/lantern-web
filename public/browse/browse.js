__base = "../";

window.page = (function() {

    var self = new LanternPage("browse");

    var category_id = self.getURIParameterByName("cat");

    /**
    * Construct sample documents for demonstration purposes
    */
    function importSampleData() {
        var imp = new LanternImport(self.stor);
        imp.all();
    }


    /*
    * Make sure we have markers to work with
    */
    function loadMarkers() {

        return self.stor.getManyByType("m").then(function(markers) {
            if (markers.length === 0) {
                // if we have zero markers, we probably are missing data
                console.log("[browse] importing sample data...");
                importSampleData();
                setTimeout(loadMarkers, 300);
            }
            else {
                self.stor.getManyByType("c").then(function() {
                    // cache items for future association with markers
                    self.stor.getManyByType("i").then(function(items) {

                        if (category_id) {
                            self.view.$data.page_title = "Places : " + 
                                self.stor.getCached("c:" + category_id).title;
                        }
                        items.forEach(function(item) {
                            if (!category_id || item.has("category", category_id)) {
                                self.view.$data.filtered_markers.push(item.get("parent")[0]);
                            }
                        });

                        self.view.$data.page_loading = false;
                    });
                });

            }
        });
    }


    //------------------------------------------------------------------------
    self.addData("filtered_markers", []);
    self.addData("show_map", null);
    self.addData("geolocation", null);



    //------------------------------------------------------------------------

    self.addHelper("handleItemSelect", function(item, marker) {
        window.location = "/detail/detail.html?mrk=" + marker._id + "&itm=" + item._id;
    });

    self.addHelper("handleMarkerSelect", function(marker) {
        window.location = "/detail/detail.html?mrk=" + marker._id;
    });


    self.addHelper("handleShowMap", function(evt) {
        self.view.$data.show_map = true;

        setTimeout(function() {
            self.renderMap()
                .then(self.askForLocation)
                .then(function(position) {
                    var lat = position.coords.latitude;
                    var lon = position.coords.longitude;
                    self.map.setPosition(lat, lon, 7);
                })
                .catch(function(err) {
                    console.log("[browse] map error", err);
                });
        }, 100);
    });

    self.addHelper("handleShowList", function(evt) {
        self.view.$data.show_map = false;
    });


    self.addHelper("getCategoryName", function(item) {
        var id = "c:" + item.category[0];
        var category = self.stor.getCached(id);
        if (category) {
            return category.title;
        }
    });


    self.addHelper("getDistanceFromMarker", function(marker) {
        var distance = 1 + Math.round(Math.random()*5);
        return distance + "km";
    });

    //------------------------------------------------------------------------
    self.render()
        .then(function() {
            self.view.$data.page_title = "Places";
        })
        .then(self.connect)
        .then(loadMarkers);

    return self; 
}());

