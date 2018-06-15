window.page = (function() {

    var self = new LanternPage("home");



    //------------------------------------------------------------------------


    self.addHelper("handleCategorySelect", function(cat) {
        self.view.$data.personalizing = true;


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

        self.user.save().then(function() {
            setTimeout(function() {
                window.location = "/browse/browse.html?cat="+cat.slug;
            }, 1100);
        });

    });

    self.addHelper("handleAllCategorySelect", function() {
        window.location = "/browse/browse.html";
    });

    self.addHelper("pluralize", function(count) {
        if (count === 0) {
            return 'No Users';
        } 
        else if (count === 1) {
            return '1 User';
        } else {
            return count + ' Users';
        }
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
    self.addData("personalizing", false);



    //------------------------------------------------------------------------
    self.render()
        .then(function() {
            self.view.$data.page_title = "Home";
        })
        .then(self.connect)
        .then(self.getMarkers)
        .then(function(markers) {
            if (markers.length === 0) {
                // if we have zero markers, we probably are missing data
                console.log("[home] importing sample data...");   
                var imp = new LanternImport(self.stor);
                imp.all();
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve(self.getMarkers());
                    }, 1000);
                });
            }
            else {
                return markers;
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
                                    if (cat == data.slug) {
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