__base = "../../";

window.page = (function() {

    var self = new LX.Page("browse");
    var category_id;

    // geolocation options
    var geo_options = {
        enableHighAccuracy: false, 
        maximumAge        : 30000, 
        timeout           : 27000
    };

    function reflowView() {
        category_id = self.getHashParameterByName("cat");       

        self.view.$data.show_supply_count = [];

        if (category_id) {
            self.view.$data.page_title = "Supplies : " + 
            self.stor.getCached("c:" + category_id).title;
        }
        else {
            self.view.$data.page_title = "Supplies";
        }

        self.view.$data.category = category_id;


        updateFilteredVenues(category_id);


        if (self.getHashParameterByName("v") == "map") {
           showMap();
        }
        else if (self.getHashParameterByName("v") == "list") {
            showList();
        }
        else {
            showFilterMenu();
        }

        self.view.$data.page_loading = false;

    }


    /*
    * requestUserLocation
    *
    * Ensure we have a location-based context for user before we display any list or map results
    */
    function requestUserLocation() {
        var reuse_known_location = true;
        return LX.Location.getCurrentGeohash(reuse_known_location)
            .then(function(geo) {
                // update user document to include general location (not exact for privacy reasons) 
                /*if (!self.user.get("geo") || !self.user.has("geo", geo)) {                        
                    console.log("[rdr] updating user location");
                    self.user.push("geo", geo);
                    self.user.save();
                }*/
                console.log("[rdr] my geo:", geo);
                return reuse_known_location
            })
            .then(LX.Location.getCurrentPosition)
            .catch(function(err) {
                console.log("geolocation unavailable");
                console.log(err);
            });
    }



    function updateFilteredVenues(cat) {
        var venues = [];
        var items = self.stor.getManyCachedByType("i");


      
        self.view.$data.v_docs.forEach(function(venue) {
            var is_match = false;

            if (!cat) {
                // no category filter selected
                is_match = true;
            }
            else {
                items.forEach(function(item) {
                    if (item.hasOwnProperty("parent") && item.parent[0] == venue._id) {
                        if (item.category.indexOf(cat) != -1) {
                            is_match = true;
                        }
                    }
                });
            }


            if (self.view.$data.selected_region && self.view.$data.selected_region != "all") {
                var match_geo = venue.geo[0].substr(0,2);
                if (self.view.$data.selected_region.indexOf(match_geo) == -1) {
                    console.log("ignoring far away venue: " + venue._id);
                    is_match = false;
                }
            }




            var index = self.view.$data.filtered_venues.indexOf(venue._id);

            if (index == -1) {
                if (is_match) {
                    self.view.$data.filtered_venues.push(venue._id);         
                }
            }
            else {
                if (is_match) {
                    // already added              
                }
                else {
                    // remove bad match
                    self.view.$data.filtered_venues.splice(index,1);
                }
            }
        });

        return venues;
    }


    function showFilterMenu() {


        var categories = self.stor.getManyCachedByType("c");
        var items = self.stor.getManyCachedByType("i");
        var venues = self.stor.getManyCachedByType("v");

        var category_map = {};

        // default count for categories
        categories.forEach(function(cat) {
            category_map[cat.slug] = 0;
            cat.count = category_map[cat.slug];
        });

        self.view.$data.show_filters = true; 

        venues.forEach(function(venue) {

            if (self.view.$data.selected_region && self.view.$data.selected_region != "all") {
                var match_geo = venue.geo[0].substr(0,2);
                if (self.view.$data.selected_region.indexOf(match_geo) == -1) {
                    console.log("ignoring far away venue: " + venue._id);
                    return;
                }
            }


            categories.forEach(function(cat) {
                var check_for_doc = self.stor.getCached("i:" + venue._id + ":" + cat.slug);
                if (check_for_doc) {
                    category_map[cat.slug]++;
                }

            });
        });
        categories.forEach(function(cat) {
            cat.count = category_map[cat.slug];
        });

    }

    
    function showMap() {

        self.view.$data.show_map = true;
        self.view.$data.show_list = false;
        self.view.$data.show_filters = false;
        var icon = null;
        var color = null;
        
        if (self.view.$data.category) {
            var cat = self.stor.getCached("c:" + self.view.$data.category);
            icon = cat.icon;
            color = cat.style.color;
        }   

        // give time for map to display in DOM
        // @todo more elegant than brute timer
        setTimeout(function() {
            self.renderMap(self.view.$data.filtered_venues, true, icon, color);


            requestUserLocation().then(function(pos) {
                console.log("[rdr] show map", pos.coords);
                self.map.setOwnLocation({lat:pos.coords.latitude, lng:pos.coords.longitude});
                self.map.setPosition(pos.coords.latitude, pos.coords.longitude, 9);
            })
            .catch(function() {
                console.log("[rdr] default map start since no geolocation available");
                if (self.view.$data.selected_region  && self.view.$data.selected_region != "all") {
                    var coords = LX.Location.getPositionFrom(self.view.$data.selected_region)
                    console.log(coords);
                    self.map.setPosition(coords.lat, coords.lon, 12);
                }
                else {
                    self.map.setDefaultPosition();
                }
            })
        }, 500);
        
    }


    function showList() {
        console.log("[rdr] show list view");
        self.view.$data.show_map = false;
        self.view.$data.show_list = true;
        self.view.$data.show_filters = false;
        self.view.$data.personalizing = false;
    }




    self.addComputed("filtered_venues_by_distance", function() {
        return this.filtered_venues.sort(function(a, b) {
            var dist_a = LX.Location.getDistanceFrom(a.geo[0]);
            var dist_b = LX.Location.getDistanceFrom(b.geo[0]);
            if (dist_a > dist_b) return -1;
            if (dist_a < dist_b) return 1;
            return 0;
        });
    });

    //------------------------------------------------------------------------
        
    // filter view
    self.addData("last_selected_category", null);
    self.addData("selected_category_list", []);
    self.addData("personalizing", false);
    self.addData("last_sync_check", new Date());
    self.addData("show_filters", false);
    self.addData("filtered_venues", []);
    self.addData("show_supply_count", [])

    // map and list view
    self.addData("category", null);
    self.addData("show_map", false);
    self.addData("show_list", false);
    self.addData("primary_button_text", "Browse Supplies")
    self.addData("map_is_ready", false)
    self.addData("supplies_located_count", 0)
    self.addData("my_geo", null);
    self.addData("show_region_dropdown", false);
    self.addData("selected_region", "");
    self.addData("selected_region_name", "")
    self.addData("available_regions", []);



    //------------------------------------------------------------------------

    self.addHelper("handleActionButton", function() {
        console.log("[rdr] toggle page filter");
        if (self.view.$data.show_filters) {
            self.view.$data.show_filters = false;
        }
        else {
            showFilterMenu();
        }
    });

    self.addHelper("handleSelectRegion", function(e) {
        console.log("[rdr] prompt user for region to filter venues and items by");
        self.view.$data.show_region_dropdown = !self.view.$data.show_region_dropdown;
    });


    self.addHelper("showAllRegions", function() {
        self.view.$data.selected_region = "all";
        self.view.$data.selected_region_name = "All Places"
        showFilterMenu();
        console.log("show all regions");
    });

    self.addHelper("showRegion", function(region) {
        self.view.$data.selected_region = region;
        self.view.$data.selected_region_name = "Greater Boston Area";//@todo use real data
        showFilterMenu();

        console.log("[rdr] show region: " + region);
    })

    self.addHelper("handleCategorySelect", function(cat) {
        self.view.$data.personalizing = true;
        
        var cat_label = cat._id.substr(2, cat._id.length);

        if (self.view.$data.selected_category_list.indexOf(cat_label) != -1){
            self.view.$data.personalizing = false;
            return console.log("[rdr] category already added to supply search list");
        } 

        self.view.$data.last_selected_category = cat;
        self.view.$refs[cat.slug][0].classList.add("active");
        self.view.$data.supplies_located_count += cat.count;
        self.view.$data.selected_category_list.push(cat_label);
        setTimeout(function() {
            self.view.$data.show_supply_count.push(cat_label);
            self.view.$data.primary_button_text = "Launch Map";
            self.view.$data.map_is_ready = true;
            self.view.$data.personalizing = false;
        }, 200+(500*Math.random()));
    });

    self.addHelper("handleAllCategorySelect", function() {

        v = self.getHashParameterByName("v");

        var str = "#";
        v = v || "list";
        str+="&v="+v+"&r="+Math.round(Math.random()*10);
        window.location.hash = str;
    });


    self.addHelper("makeBadgeStyle", function(cat) {
        if (!cat) return;
        var doc = new LX.Document(cat, self.stor);
        var style = [];
        style.push("background-color: #" + doc.get("style", "color"));
        return style.join("; ");
    });



    self.addHelper("handleItemSelect", function(item, venue) {
        window.location = "./detail.html#mrk=" + venue._id + "&itm=" + item._id;
    });

    self.addHelper("handleVenueSelect", function(venue) {
        window.location = "./detail.html#mrk=" + venue._id;
    });


    self.addHelper("handleShowMap", function(evt) {

        cat = self.getHashParameterByName("cat");
        var str = window.location.origin + window.location.pathname + "#";
        if (cat) {
            str += "cat=" + cat;
        }
        window.location = str += "&v=map";
    });

    self.addHelper("handleShowList", function(evt) {

        cat = self.getHashParameterByName("cat");
        var str = window.location.origin + window.location.pathname + "#";
        if (cat) {
            str += "cat=" + cat;
        }
        window.location = str += "&v=list";
    });



    self.addHelper("getCategoryName", function(item) {
        var id = "c:" + item.category[0];
        var category = self.stor.getCached(id);
        if (category) {
            return category.title;
        }
    });


    self.addHelper("getDistanceFromVenue", function(my_geo, venue) {
        if (venue.hasOwnProperty("geo") && typeof(venue.geo[0]) == "string") {
            var distance = LX.Location.getDistanceFrom(venue.geo[0]);
            return distance + "km";
        }
        else {
            console.log("[rdr] skip distance calc since venue missing geo", venue._id);
            return;
        }

    });

    //------------------------------------------------------------------------


    self.render()
        .then(function() {
            self.view.$data.page_title = "Supplies";
        })
        .then(self.connect)
        .then(self.getVenues)
        .then(function(venues) {
            if (venues.length == 0 ) {
                window.location = "/";
            }
        })
        .then(self.getUsers)
        .then(self.getEvents)
        .then(function(events) {
            events.forEach(function(event) {
                var geo = event.get("geo")[0];
                if (self.view.$data.available_regions.indexOf(geo) == -1) {
                    self.view.$data.available_regions.push(geo);
                }
            })
        })
        .then(self.getCategories)
        .then(self.getItems)
        .then(reflowView)
        .then(function() {
            window.onhashchange = reflowView;
        })

    return self; 
}());

