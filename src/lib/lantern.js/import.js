window.LanternImport = function(stor) {
    
    var self = {};


    /**
    * Save an interest to the database for future use in the interface.
    * Allows for dynamically adding new interests over over time.
    */
    function addCategory(slug, title, tag, color, background_color, icon) {
        var doc = new LanternDocument("c:"+slug, stor);
        doc.set("slug", slug);
        doc.set("title", title);
        doc.push("tag", tag);

        if (background_color && color) {

            doc.set("style", {
                "color": color, 
                "background-color": background_color}
            );
        }

        if (icon) {
            doc.set("icon", icon);
        }

        var time = new Date();

        doc.set("$ia", time);
        doc.set("$ua", time);
        doc.set("$ca", time);
        doc.save();
    }

    
    function addVenue(id, title, geo, cat, icon, cats) {
        var venue_doc = new LanternDocument("v:"+id, stor);
        venue_doc.set("title", title);
        venue_doc.set("geo", [geo]);
        
        venue_doc.set("icon", icon);
        venue_doc.set("status", 1);
        venue_doc.push("category", cat);
        venue_doc.set("$ia", new Date());
        venue_doc.save();

        for (var idx in cats) {

        
            var doc = new LanternDocument(["i", venue_doc.id, cats[idx]].join(":"), stor);
            doc.set("status", (Math.random() > 0.1 ? 1 : 0));
            doc.push("parent", venue_doc.id);
            doc.push("category", cats[idx]);

            // simulate verification of data for accuracy
            doc.push("vote",{
                slug: "oxfam",
                title: "OXFAM",
                votes: Math.round(Math.random()*1)
            });

            doc.push("vote",{
                slug: "red-cross",
                title: "Red Cross",
                votes: Math.round(Math.random()*3)
            });


            doc.push("vote",{
                slug: "neighbors",
                title: "Neighbors",
                votes: Math.round(Math.random()*10)
            });


            doc.push("vote",{
                slug: "town",
                title: "Town Officials",
                votes: Math.round(Math.random()*2)
            });


            var time = new Date();
            doc.set("$ia", time);
            doc.set("$ua", time);
            doc.set("$ca", time);
            doc.save();
        }

    }


    //------------------------------------------------------------------------
    self.category = function() {
        //console.log("[import] adding default item categories");
        addCategory("wtr", "Water", "itm", "78aef9", "e9f2fe", "tint");
        addCategory("ful", "Fuel", "itm", "c075c9", "f5e9f6", "gas-pump");
        addCategory("net", "Internet", "itm", "73cc72", "e8f7e8", "globe");
        addCategory("med", "Medical", "itm", "ff844d", "ffebe2", "prescription-bottle-alt");
        addCategory("clo", "Clothing", "itm", "50c1b6", "e3f5f3", "tshirt");
        addCategory("pwr", "Power", "itm", "f45d90", "f2dae2", "plug");
        addCategory("eat", "Food", "itm", "ffcc54", "fff7ef", "utensils");
        addCategory("bed", "Shelter", "itm", "FFB000", "fef7eb", "bed");
        //addCategory("sup", "Support", "itm", "FFB000", "fef7eb", "question-circle");


        //console.log("[import] adding default Marker categories");
        addCategory("dgr", "Dangerous Area", "mrk");
        addCategory("pwo", "Power Outage", "mrk");


        //console.log("[import] adding sub-categories for Markers");
        addCategory("rdb", "Road Debris", "dgr");
        addCategory("fld", "Flooding", "dgr");
        addCategory("lte", "Looting", "dgr");
        addCategory("cst", "Construction", "dgr");
        addCategory("cba", "Closed by Authorities", "dgr");
        addCategory("dst", "Destroyed", "dgr");
    };


    /**
    * Save an arbitrary map location into the database.
    * Allows for tracking population size and resource distribution
    * against meaningful points in a town.
    */
    self.venue = function() {
        //console.log("[import] adding default venues");

        // temporary shelters or forward operating bases
        addVenue("css", "Central City Shelter", "drs4b7s", "tmp", "home", ["bed", "eat"]);
        addVenue("rcm", "Red Cross HQ", "drs4b75", "tmp", "plus-square", ["med", "clo"]);

        // permanent buildings that now offer some safety
        addVenue("aic", "AJ's Cafe", "drs4b77", "bld", "coffee", ["eat", "wtr", "pwr"]);
        addVenue("hsf", "High School Field House", "drs4b79", "bld", "basketball-ball", ["bed", "clo", "net", "wtr"]);
        addVenue("cth", "UCG Hospital", "drs4b73", "bld", "hospital-symbol", ["med"]);
        addVenue("shl", "Shell Station", "drs4b71", "bld", "gas-pump", ["ful", "wtr"]);
        addVenue("mst", "Main Street Theatre", "drs4b41", "bld", "film", ["net", "pwr"]);
        //addVenue("emb", "Embassy", "drs4b46", "sfe", "suitcase", ["sup"]);

        addVenue("wtk", "Water Truck", "drs4b72", "trk", "truck", ["wtr"]);
    };

    self.item = function() {
        // items to be added directly along-side Markers
    };

    self.route = function() {
        //console.log("[import] adding default geo routes"); 
        var doc = new LanternDocument("r:%%", stor);
        doc.set("geo", ['drs4b77e8', 'drs4b77e9']);
        var time = new Date();
        doc.set("$ia", time);
        doc.set("$ua", time);
        doc.set("$ca", time);
        doc.save();
    };


    self.note = function() {
        //console.log("[import] adding default notes");
        var doc = new LanternDocument("n:%%", stor);
        doc.push("tag", "v:test-place");
        var time = new Date();
        doc.set("$ia", time);
        doc.set("$ua", time);
        doc.set("$ca", time);
        doc.save();
    };

    self.all = function() {
        self.category(); // accepted categories for various types of docs
        self.venue(); // items placed in specific Markers
        self.item(); // dummy for consistency, see Marker()
        self.route(); // routes between Markers
        self.note(); // notes related to items or Markers or routes
    };



    //------------------------------------------------------------------------
    return self;
};

    