__base = "../";

window.page = (function() {
    var self = new LanternPage("detail");

    var marker_id = self.getURIParameterByName("mrk");
    var item_id = self.getURIParameterByName("itm");

    if (!marker_id) {
        window.location = "/";
        return;
    }

    //------------------------------------------------------------------------
    self.addData("marker", {});
    self.addData("item", {});



    //------------------------------------------------------------------------
    self.addHelper("makeItemStyle", function(item) {
        var category = self.stor.getCached("c:"+item.category[0]);
        var style = "border-color: #" +  category.style["color"];
        if (item._id == self.view.$data.item._id) {
            style += "; border-width: 2px;";
        }
        return style;
    });

    self.addHelper("handleSelectItem", function(item) {
        self.view.$data.item = item;
    });



    //------------------------------------------------------------------------
    self.render()
        .then(self.connect)
        .then(function() {
            self.view.$data.allow_back_button = true;
            return self.stor.getManyByType("c");
        })
        .then(function() {
            return self.stor.getManyByType("i");
        })
        .then(function() {
            console.log("[detail]", marker_id);

            self.stor.get(marker_id).then(function(doc) {
                // make sure we have a most recent timestamp to work with
                if (!doc.has("updated_at")) {
                    if (doc.has("created_at")){
                        doc.set("updated_at", doc.get("created_at"));
                    }
                    else if (doc.has("imported_at")){ 
                        doc.set("updated_at", doc.get("imported_at"));
                    }
                }
                self.view.$data.marker = doc.toJSONFriendly();
                self.view.$data.page_title = doc.get("title");
            })
            .catch(function(err) {
                console.log("[detail] could not get: " + marker_id, err);
            });

            if (item_id) {
                self.stor.get(item_id).then(function(doc) {
                    self.view.$data.item = doc.toJSONFriendly();
                    self.view.$data.page_loading = false;
                })
                .catch(function(err) {
                    console.log("[detail] could not get: " + item_id, err);
                });
            }
            else {
                self.view.$data.page_loading = false;
            }
        });

    return self;
})();
