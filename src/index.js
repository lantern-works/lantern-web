window.page = (function() {

    var self = new LanternPage("home");



    //------------------------------------------------------------------------


    self.addHelper("handleCategorySelect", function(cat) {
        self.view.$data.personalizing = true;

        self.view.$data.selected_category = cat;
        self.view.$refs[cat.slug][0].classList.add("active");
        
        var cat_label = cat._id.substr(2, cat._id.length);

        console.log("[home] toggle cat: " + cat_label);
        // do optimistic UI updates and then listen for sync to confirm
        if (self.user.has("tag", cat_label)) {
            self.user.pop("tag", cat_label);
        }
        else {
            self.user.push("tag", cat_label);
        }

        self.user.save()
            .then(function() {
                setTimeout(function() {
                    window.location = "/browse/browse.html#cat="+cat.slug;
                }, 1000);
            })
            .catch(function(err) {
                console.log(err);
            });
    });

    self.addHelper("handleAllCategorySelect", function() {
        window.location = "/browse/browse.html";
    });


    self.addHelper("makeBadgeStyle", function(cat) {
        if (!cat) return;
        var doc = new LanternDocument(cat, self.stor);
        var style = [];
        style.push("background-color: #" + doc.get("style", "color"));
        return style.join("; ");
    });


    //------------------------------------------------------------------------
    self.addData("item_categories", []);
    self.addData("selected_category", null);
    self.addData("personalizing", false);
    self.addData("last_sync_check", new Date());


    //------------------------------------------------------------------------
    self.render()
        .then(function() {
            self.view.$data.page_title = "Home";
        })
        .then(self.connect)
        .then(self.getVenues)
        .then(function(venues) {
            if (venues.length === 0) {
                // if we have zero venues, we probably are missing data
                console.log("[home] importing sample data...");   
                var imp = new LanternImport(self.stor);
                imp.all();
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve(self.getVenues());
                    }, 1000);
                });
            }
            else {
                return venues;
            }
        })
        .then(self.getItems)
        .then(function(items) {
            // draw category grid
            return self.getCategories()
                .then(function(categories) {  
                    categories.forEach(function(cat) {
                        if (cat.has("tag", "itm")) {
                            var data = cat.toJSONFriendly();
                            data.count = 0;

                            items.forEach(function(item) {
                                item.get("category").forEach(function(cat) {

                                    if (item.id[2] == "v" && cat == data.slug) {
                                        data.count++;
                                    }
                                });
                            });

                            self.view.$data.item_categories.push(data);
                        }
                    });
                    self.view.$data.page_loading = false;
                });
        });
        
    return self;
}());