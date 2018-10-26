__base = "../../";

window.page = (function() {

    var self = new LX.Page("notes");


    function getAndMapPosition() {
            return LX.Location.getCurrentPosition().then(function(position) {
                var lat = position.coords.latitude;
                var lon = position.coords.longitude;

                var gp = Geohash.encode(lat, lon, 5);
                self.view.status_message = "Outgoing note tagged with location: " + gp;            
                self.map.setPosition(lat, lon, 4);
                return gp;
            })
            .catch(function(err) {
                console.log(err);
                self.view.status_message = "Unable to find location. Please try again.";
                self.view.is_sending = false;
            });
    }

    function mapNote(note) {
        if (note.has("category", "test")) {
            var geohash = note.get("geo")[0];
            if (geohash) {
                var coords = Geohash.decode(geohash);
                var point = self.map.addPoint(note.get("text"), {lat: coords.lat, lon: coords.lon}, "sticky-note", "6ae1c4", false);
                self.map.fitToMarkers();
            }

        }
    }


    function saveDemoNote(gp) {
        var random = Math.round(Math.random()*100000);
        var doc_id = ["n", gp, random].join(":");
        self.view.status_message = "Saving "+ doc_id+ "..."
        var doc = new LX.Document(doc_id, self.stor);
        doc.push("geo", gp);
        doc.set("text", "hello world " + random);
        doc.push("category", "test");
        doc.set("created_at", new Date());

        return doc.save()
            .then(function() {
                self.view.status_message = "Saved " + doc_id;

                // share location and update lantern location
                var geo = gp.substr(0,4);
                if (!self.user.get("geo") || !self.user.has("geo", geo)) {                        
                    console.log("[ote] updating user location");
                    self.user.push("geo", geo);
                    self.user.save();
                }

                console.log("[ote] my geo:", geo);
                self.sendGeohashToLantern(geo);

                setTimeout(function() {
                    self.view.is_sending = false;
                }, 1000);
            })
    }

    self.addData("is_sending", false);
    self.addData("status_message", "");


    self.addComputed("notes_by_recency", function() {
        return this.n_docs.sort(function(a, b) {
            var time_a = new Date(a.created_at);
            var time_b = new Date(b.created_at);
            if (time_a > time_b) return -1;
            if (time_a < time_b) return 1;
            return 0;
        });
    });


    self.addHelper("removeDemoNote", function(item) {
        var doc = new LX.Document(item, self.stor);
        doc.remove()
    });

    self.addHelper("addDemoNote", function() {
        console.log("[ote] add demo note");
        self.view.is_sending = true;
        self.view.status_message = "Finding location for note...";
        return getAndMapPosition().then(saveDemoNote);
    });

    self.render()
      .then(self.connect)
      .then(function() {
        self.view.page_title = "Notes";
        self.view.page_loading = false;
      })
      .then(self.renderMap)
      .then(self.getNotes)
      .then(function(notes) {
        self.map.setDefaultPosition();
        notes.forEach(mapNote);
      });

    return self;

}());
