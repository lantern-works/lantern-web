window.page = (function() {

    var vu; // our view object that will be created after render
    var self = new LX.Page("search");


    //------------------------------------------------------------------------

    /**
    * Array.hasObjectWithKey
    * 
    * Allows user to avoid duplicates when adding objects to an array
    */
    Array.prototype.hasObjectWithKey = function(key, value) {
        var matched = false;
        this.forEach(function(item) {
            if (item.hasOwnProperty(key) && item[key] == value) {
                matched = true;
            }
        });
        return matched;
    }

    Array.prototype.getIndexForObjectWithKey = function(key, value) {
        for (var idx in this) {
            var item = this[idx];
            if (item.hasOwnProperty(key) && item[key] == value) {
               return idx;
            }
        }
    }

    function renderDropdownMenu(events) {
        events.forEach(function(event) {
            var geo = event.get("geo")[0];
            if (!vu.events.hasObjectWithKey("geohash", geo)) {
                var title = event.get("title") || "Event"; // @todo use reverse location search to save title in document itself
                vu.events.push({"title": title, "geohash": geo});
            }
        });
    }

    function selectEvent(event) {
        //console.log("[rdr] show event: ", event.title, event.geohash);
        vu.show_supply_count = [];
        matched = [];
        vu.categories.forEach(function(category) {
            category.count = 0;
        });
        vu.selected_event = event;
        vu.coverage.of = 0;
        vu.coverage.found = 0;
    }

    function renderFilterGrid(categories) {
        //console.log("[rdr] render filter grid");
        categories.forEach(function(cat) {
            cat.set("count", 0); // default count for categories
            vu.categories.push(cat.toJSONFriendly());
        });
    }


    function isItemInRange(item, category, geofilter) {
        // require category match
        if (item.category.indexOf(category) == -1) {
            return;
        }
        // try for location match
        if (geofilter) {
            var venue = self.stor.getCached(item.parent[0]);
            var geohash = venue["geo"][0];
            if (geohash.indexOf(geofilter) == -1) {
                //console.log("ignoring far away venue: " + venue._id, geohash);
                return false;
            }
        }
        return true;
    }


    function findMatchesForCategory(category, geofilter) {
        var venues = self.stor.getManyCachedByType("v"); 
        var index = vu.categories.getIndexForObjectWithKey("slug", category);

        // zero out count for item
        vu.categories[index].count = 0;

        // @todo optimize this query
        vu.i_docs.forEach(function(item) {
            if (isItemInRange(item, category, geofilter)) {
                    
                var is_valid_date = true;

                var parents = item.parent;
                parents.forEach(function(parent) {
                    if (parent[0] == "e") {
                        // check if status for event is active so we don't match to supplies from past events
                        var event_doc = self.stor.getCached(parent);
                        if (event_doc.status && event_doc.status == 3) {
                            // completed / archived event
                            is_valid_date = false;
                        }
                    }
                });

                if (!is_valid_date) {
                    //return console.log("item is in range but from previous event date: " + item._id);
                }

                // @todo handle out-of-stock items
                //console.log("item is in range: " + item._id);

                vu.categories[index].count++;
            }
        });

        return vu.categories[index].count;
    }

    function continueToBrowse() {
        var hash_str = "#";
        var view_type = self.getHashParameterByName("v") || "list";
        hash_str+="&v="+view_type+"&r="+Math.round(Math.random()*10);
        if (vu.selected_event && vu.selected_event.geohash) {
            hash_str+="&g=" + vu.selected_event.geohash.substr(0,3);
        }
        if (vu.coverage.found > 0) {
            hash_str+="&cat="+vu.show_supply_count.join(",");
        }

        window.location = "./browse.html" + hash_str;
    }
    

    //------------------------------------------------------------------------
    self.addData("searching", false);
    self.addData("prompt_report_needs", false);
    self.addData("show_supply_count", []);
    self.addData("categories", []);

    // selected event from drop-down menu
    self.addData("events", []);
    self.addData("selected_event", null);
    self.addData("show_event_dropdown", false);

    // filter search to selected categories
    self.addData("last_selected_category", null);
    self.addData("coverage", {found: 0, of: 0});
    self.addData("selected_category_list", []);

    //------------------------------------------------------------------------
   
    // Drop-down menu
    
    self.addHelper("handleSelectEvent", function(e) {
        vu.show_event_dropdown = !vu.show_event_dropdown;
    });


    self.addHelper("showAllEvents", function(e) {
        selectEvent({
            "title": e.target.innerHTML,
            "geohash": null
        });
    });


    self.addHelper("showEvent", function(event) {
        selectEvent(event);
    });


    self.addHelper("handleContinueButton", continueToBrowse);

    self.addHelper("handleSubmitReportButton", function() {
        continueToBrowse();

    });

    self.addHelper("handleReportNeedsButton", function() {
        vu.prompt_report_needs = true;

    });

    self.addHelper("handleReportNeedsClose", function() {
        vu.prompt_report_needs = false;
    })


    //------------------------------------------------------------------------
    
    // Category filter grid

    var matched = [];

    self.addHelper("handleCategorySelect", function(cat) {
        var cat_label, match_count;
        
        cat_label = cat._id.substr(2, cat._id.length);

        if (vu.show_supply_count.indexOf(cat_label) != -1) {
            return;
        }

        vu.searching = true;
        vu.last_selected_category = cat;
        vu.$refs[cat.slug][0].classList.add("active");

        var geofilter = (vu.selected_event && vu.selected_event.geohash ? vu.selected_event.geohash : "").substr(0,3);

        //console.log("[rdr] category selected in location", cat_label, geofilter);



        match_count = findMatchesForCategory(cat_label, geofilter);
        vu.show_supply_count.push(cat_label);
        vu.searching = false;

        matched.push((match_count > 0));
        
        vu.coverage.found = 0;
        matched.forEach(function(match) {
            if (match) {
                vu.coverage.found++;
            }
        });

        vu.coverage.of =  matched.length;
    });

    self.addComputed("supplies_located_count", function() {
        var total = 0;
        vu.categories.forEach(function(doc) {
            total += doc.count;
        });
        return total;
    })


    self.addHelper("makeBadgeStyle", function(cat) {
        if (!cat) return;
        var doc = new LX.Document(cat, self.stor);
        var style = [];
        style.push("background-color: #" + doc.get("style", "color"));
        return style.join("; ");
    });



    //------------------------------------------------------------------------
    self.render()
        .then(function() {
            vu = self.view;
            vu.page_title = "Supplies";
        })
        .then(function() {
            vu.page_loading = false;
        })
        .then(self.connect)
        .then(self.getItems)
        .then(self.getCategories)
        .then(renderFilterGrid)
        .then(self.getUsers)
        .then(self.getEvents)
        .then(renderDropdownMenu)
        .then(self.getVenues)


    return self;

}());