__base = "../";

window.LanternDocument = (function(id,stor) {
 

    // used to preserve keyspace when storing and sending low-bandwidth
    var REG = {
        
        // private metadata won't relay over LoRa
        created_at: "$ca",   // creation date
        updated_at: "$ua",   // doc update date
        received_at: "$ra",  // doc received at (from radio)
        sent_at: "$sa",      // doc sent (with radio)
        imported_at: "$ia", // doc imported from disk, do not send over radio

        // public data for all sync and broadcast
        title: "tt",        // title or name of object
        slug: "sg",         // slug for object
        text: "tx",         // text or label for object
        icon: "ic",         // icon to describe object
        status: "st",       // level or quantity
        owner: "ou",        // user array
        editor: "eu",       // user array
        geo: "gp",          // geohash array
        radius: "rd",       // geographic radius
        category: "ct",     // category tag
        tag: "tg",          // other tags
        style: "sl",        // css styles,
        parent: "pt",       // parent document reference
        child: "cd",        // child document reference,
        vote: "vt"          // votes for accuracy of data    

    };


    // so we can get back keys by value in REG
    function getKeyByValue( obj, value ) {
        for( var prop in obj ) {
            if( obj.hasOwnProperty( prop ) ) {
                 if( obj[ prop ] == value )
                     return prop;
            }
        }
    }

    function hex8(val) {
        val &= 0xFF;
        var hex = val.toString(16).toUpperCase();
        return ("00" + hex).slice(-2);
    }


    //------------------------------------------------------------------------
    
    var self = {
        data: {}
    };

    self.has = function(k,s) {

        var key = (REG[k] ? REG[k] : k);

        var val = self.data[key]; 


        // easy access for nested keys one level down
        if (s && val) {
            if (val instanceof Array) {
                return val.indexOf(s) != -1;
            }
            else {
                return val.hasOwnProperty(s);
            }
        }
        else {
            return self.data.hasOwnProperty(key);
        }
    };

    self.get = function(k,s) {

        var key = (REG[k] ? REG[k] : k);
        var val = self.data[key]; 

        // easy access for nested keys one level down
        if (s) {
            if (typeof(val) == "object" && val.hasOwnProperty(s)) {
                return val[s];
            }
            else {
                return;
            }
        }
        else {
            return val;
        }
    };

    self.set = function(k, s, val) {

        var key = (REG[k] ? REG[k] : k);

        // support one level of nested keys
        if (val === undefined) {
            val = s;
            self.data[key] = val;
        }
        else {
            self.data[key] = self.data[key] || {};
            self.data[key][s] = val;
        }
    };

    self.push = function(k,val) {
        var key = (REG[k] ? REG[k] : k);
        self.data[key] = self.data[key] || [];
        if (!self.has(k, val)) {
            self.data[key].push(val);
        }
    };

    self.pop = function(k,val) {

        var key = (REG[k] ? REG[k] : k);

        if (val === undefined) {
            delete self.data[key];
        }
        else {
            self.data[key] = self.data[key] || [];
            var index = self.data[key].indexOf(val);
            self.data[key].splice(index,1);
        }
    };

    self.save = function() {

        if (self.has("created_at")) {
            self.set("updated_at", new Date());
        }
        
        return stor.upsert(self.id, function(doc) {
            for (var idx in self.data) {
                doc[idx] = self.data[idx];
            }

            if (!self.has("created_at")) {
                self.set("created_at", new Date());
            }
            console.log("[doc] saved " + self.id);
            return doc;
        })
        .catch(function(err) {
            if(err.name === "conflict") {
                console.log("[doc] conflicted: " + doc._id, err);
            }
            else {
                console.log("[doc] err", err);
            }

        });
    };


    self.remove = function() {
        return stor.remove(self.id);
    };

    /**
    * Constructs JSON object preserving key register
    */
    self.toJSON = function() {
        var new_doc = {};
        for (var idx in self.data) {
            new_doc[idx] = self.data[idx];
        }
        return new_doc;
    };

    /**
    * Constructs JSON but converts keys into human-readable format by register
    */
    self.toJSONFriendly = function() {
        var new_doc = {};
        for (var idx in self.data) {
            var key = getKeyByValue(REG, idx);
            if (key) {
                new_doc[key] = self.data[idx];
            }
            else {
                new_doc[idx] = self.data[idx];
            }
        }
        return new_doc;
    };


    //------------------------------------------------------------------------

    if (!id) {
         throw new Error("LanternDocument missing required ID");
    }


    if (typeof(id) == "object") {
        var doc = id;   
        self.id = doc._id;
        for (var idx in doc) {
            self.set(idx, doc[idx]);
        }
    }
    else {
        self.id = id;
    }

    // random identifiers for new docs to avoid sync conflicts
    self.id = self.id.replace("%%", Math.round(Math.random() * 1000));

    return self;
});
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
        addCategory("sup", "Supply", "mrk");
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
        addVenue("hsf", "High School Field House", "drs4b79", "sfe", "basketball-ball", ["bed", "clo", "net", "wtr"]);
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
        self.marker(); // items placed in specific Markers
        self.item(); // dummy for consistency, see Marker()
        self.route(); // routes between Markers
        self.note(); // notes related to items or Markers or routes
    };



    //------------------------------------------------------------------------
    return self;
};

    
window.LanternPage = (function(id) {

    // view options
    var opts = {
        data: {
            cloud_connected: null,
            lantern_connected: null,
            lantern_name: "",
            page_title: "",
            page_tag: "",
            page_loading: true,
            is_syncing: false,
            allow_back_button: false,
            user: null
        },
        methods: {
            handleGoBack: function() {
                window.history.go(-1);
            }

        }
    };

    // geolocation options
    var geo_options = {
        enableHighAccuracy: false, 
        maximumAge        : 30000, 
        timeout           : 27000
    };

    var self = {
        stor: null,
        user: null,
        view: null,
        map: null
    };


    // initialize arrays for each type of doc
    // only these document types will ever be accepted by the system
    (["v", "i", "c", "r", "n", "u", "d"]).forEach(function(type) {
        opts.data[type+"_docs"] = [];
    });

    //------------------------------------------------------------------------

    /**
    * Get anonymous user identifier retained in local storage per browser
    */
    function getUserId() {
        var uid = window.localStorage.getItem("lantern-profile");
        if (!uid) {
            uid = Math.round(Math.random()*1000000);
            window.localStorage.setItem("lantern-profile", uid);
        }
        return uid;
    }

    /**
    * Register new user in the database 
    */
    function registerUser() {
        console.log("[user] create");
        var doc = new LanternDocument("u:"+getUserId(), self.stor);
        doc.set("title", "User");
        doc.save();
        return doc;
    }

    /**
    * Get user from database 
    */
    function getUser() {
        return self.stor.get("u:"+getUserId()).then(function(doc) {
            //console.log("[user] found", doc.get("_id"));
            self.view.$data.user = doc.toJSONFriendly();
            return doc;
        });
    }



    /**
    * Make sure we have an anonymized user identifier to work with always
    */ 
    function getOrCreateUser() {
        return getUser()
            .catch(function(result) {
                return registerUser();
            });
    }


    /**
    * Display a sync icon in footer momentarily
    */
    function showSyncIcon(doc) {
        setTimeout(function() {
            if (self.view.$data.is_syncing) return;
            self.view.$data.is_syncing = true;
            console.log(doc);
            // display title of doc where possible
            if (doc && doc.hasOwnProperty("tt")) {
                self.view.$data.is_syncing = doc.tt;
            }
            setTimeout(function() {
                self.view.$data.is_syncing = false;
            }, 4000);
        }, 50);
    }

    /**
    * Get name of the lantern we're connected to and save for view
    **/
    function loadLanternName() {
        fetch(self.stor.lantern_uri + "/api/name").then(function(response) {
            return response.json();
        }).then(function(json) {
            self.view.$data.lantern_name = json.name;
        })
        .catch(function(err) {
            console.log(err);
        });
    }


    function sync(continuous) {

        self.view.$data.cloud_connected = self.stor.cloud_connected;
        self.view.$data.lantern_connected = self.stor.lantern_connceted;

        if (self.stor.lantern_connected) {
            loadLanternName();
        }


        if (window.location.host == "lantern.global") {
            self.view.$data.cloud_connected = true;
            self.stor.syncWithCloud(continuous, function(status) {
                self.view.$data.cloud_connected = true;
            }, function(changed_doc) {
                // showSyncIcon();
            });
        }
        else {


            self.stor.syncWithCloud(continuous, function(status) {
                self.view.$data.cloud_connected = status;
            },function(changed_doc) {
                showSyncIcon(changed_doc);

            });

            self.stor.syncWithLantern(continuous, function(status) {
                self.view.$data.lantern_connected = status;
                if (status == true) {
                    loadLanternName();
                }

            },function(changed_doc) {
                // don't display sync message for map cache
                if (!changed_doc.dataUrl) {
                    showSyncIcon(changed_doc);
                }
            });
        }
    }

    /**
    * Update interface based on user's changing geolocation
    */
    function onLocationChange(position) {
        if (!position || !position.coords) return;
        console.log("[page] my geo", position.coords.latitude, position.coords.longitude);
        self.map.setOwnLocation({lat:position.coords.latitude, lng:position.coords.longitude});
    }

    //------------------------------------------------------------------------
    /** 
    * Define helper for user interactions
    **/
    self.addHelper = function(name, fn) {
        opts.methods[name] = fn;
    };
    
    /** 
    * Define data for vue templates
    **/
    self.addData = function(name, val) {
        opts.data[name] = val;
    };

    /** 
    * Mount vue to our top-level document object
    **/
    self.render = function() {
        self.view = new Vue(opts);
        self.view.$mount(["#", id, "-page"].join(""));
        return Promise.resolve();
    };

    /**
    * Add in data from PouchDB and identify network status
    */
    self.connect = function() {
        self.stor = new LanternStor(opts.data, self.getBaseURI());
        return self.stor.setup()
            .then(getOrCreateUser)
            .then(function(user) {
                // make sure we have an anonymous user all the time
                self.user = user;
                var cached = self.stor.getCached(user.id);
                self.view.$data.user = cached;
                // device wifi or local testing
                sync(true);
            });
    };


    self.getVenues = function() {
        return self.stor.getManyByType("v");
    };

    self.getItems = function() {
        return self.stor.getManyByType("i");
    };


    self.getCategories = function() {
        return self.stor.getManyByType("c");
    };

    self.getUsers = function() {
        return self.stor.getManyByType("u");
    };

    self.getDevices = function() {
        return self.stor.getManyByType("d");
    };

    self.getRoutes = function() {
        return self.stor.getManyByType("r");
    };





    /**
    * Display the map for the user based on approx. location
    */
    self.renderMap = function(venues, show_tooltip, icon, color) {

        venues = venues || [];

        return new Promise(function(resolve, reject) {

            if (self.map) {
                return resolve();
            }

            // show my own location on the map
            var wpid = navigator.geolocation.watchPosition(onLocationChange, function(err) {
                console.log("[page] geo err", err);
            }, geo_options);


            var venue_options = {};
            self.getItems().then(function(items) {
                
                items.forEach(function(item){
                    var m = item.get("parent")[0];
                    var c_doc = "c:"+item.get("category")[0];
                    venue_options[m] = venue_options[m] || [];
                    venue_options[m].push(self.stor.getCached(c_doc));
                });
            
                self.map = new LanternMapManager();
                // add venues to map

                venues.forEach(function(v_id) {
                    var coords = [];
                    var venue = self.stor.getCached(v_id);
                    
                    for (var idx in venue.geo) {
                        try {
                            var c = Geohash.decode(venue.geo[idx]);
                            coords.push(c);
                        }
                        catch(e) {
                            console.error("[page] invalid geohash " + venue.geo + " for: " + v_id);
                        }
                    }

                    if (coords.length == 1) {
                        // point
                        var final_icon = icon || venue_options[venue._id][0].icon;
                        var final_color = color || venue_options[venue._id][0].style.color;
                        var pt = self.map.addPoint(venue.title, coords[0], final_icon, final_color);
                       

                        if (show_tooltip) {
                            
                            pt.on("click", function(e) {
                                window.location = "/detail/detail.html#mrk=" + v_id;
                            });

                            pt.openTooltip();
                        }

                    }
                    else if (coords.length == 2) {
                        // draw a shape
                        self.map.addPolygon(venue.title, coords);
                    }
                });
                resolve(self.map);

            });
        });

    };
    
    self.askForLocation = function() {
        return new Promise(function(resolve, reject) {
            console.log("[page] asking for location");
           
            navigator.geolocation.getCurrentPosition(function(position) {
                resolve(position);
            }, function(err) {
                reject(err);
            }, geo_options);
          
        });
    };




    /**
    * Points to the right server for processing requests
    */
    self.getBaseURI = function() {
        return "https://" + (window.location.host == "localhost:3000" ? 
            "localhost" :  window.location.host);
    };

    
    /**
    * Get a query parameter value
    */
    self.getHashParameterByName = function(name, url) {
        if (!url) url = window.location.hash;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[#&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    };    

    /**
    * Extract a category object from meaningful input such as a tag
    */
    self.addHelper("getCategory", function(arg) {
        if (!arg) {
            return;
        }
        var obj;
        if (typeof(arg) == "string") {
            obj = self.stor.getCached(arg);
        }
        else if (arg.hasOwnProperty("category")) {
            obj = self.stor.getCached(obj.category[0]);
        }
        else if (typeof(arg[0]) == "string") {
            obj = self.stor.getCached("c:"+arg[0]);
        }
        else if (arg.hasOwnProperty("style")) {
            obj = arg;
        }
        else {
            console.log("cannot make category style for", arg);
        }
        return obj;
    });

    /**
    * Extract background and stroke colors from database
    */
    self.addHelper("makeCategoryStyle", function(cat) {
        if (!cat) return;
        var doc = new LanternDocument(cat, self.stor);
        var style = ["color: #" + doc.get("style","color")];
        style.push("background-color: #" + doc.get("style", "background-color"));
        style.push("border-color: #" + doc.get("style", "color"));
        return style.join("; ");
    });
    
    /**
    * Extract icon from database
    */
    self.addHelper("makeCategoryIconClass", function(category) {
        if (!category) return;
        return "fas fa-" + (category.icon || "circle") + " fa-lg";
    });


    /**
    * Display proper pluralization for users
    */

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

    //------------------------------------------------------------------------
    /**
    * Setup universal template variables
    */
    opts.data.showNavMenu = false;

    /**
    * Setup global view helpers
    */
    opts.methods.toggleNavigation = function(el) {
        self.view.$data.showNavMenu = !self.view.$data.showNavMenu;

        if (self.view.$data.showNavMenu) {
            self.getUsers();
        }
    };



    //------------------------------------------------------------------------
    return self;
});


if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register('/sw.js', {
        scope: "/"
    }).then(function(registration) {
        // success
        console.log("[sw] registered service worker");
    }).catch(function(e) {
        // failed
        console.log("[sw] err", e);
    });
}
window.LanternStor = (function($data, uri) {

    var cloud_uri = "https://lantern.global/db/lantern/";
    var did_sync_maps = false;
    uri = uri.replace(":3000", "");

    var self = {
        cache: {},        
        browser_db: null,
        lantern_db: new PouchDB(uri + "/db/lantern/", {
            skip_setup: true,
            withCredentials: false        
        }),
        lantern_maps_db: new PouchDB( uri + "/db/lantern-maps/", {
            skip_setup: true,
            withCredentials: false        
        }),
        cloud_db: new PouchDB(cloud_uri, {
            skip_setup: true,
            withCredentials: false        
        }),
        cloud_connected: null,
        lantern_connected: null,
        lantern_uri: uri,
        db: null
    };

    try {
        self.browser_db = new PouchDB("lantern");
    }
    catch(e) {
        // browser refuses to use local storage...
        console.log("[stor] skip in-browser storage since browser refuses");
    }

    //------------------------------------------------------------------------


    function getIndexForDoc(id,type) {
        if (!$data[type+"_docs"]) return;

        var doc_id_list = $data[type+"_docs"].map(function(compare_doc) {
            return compare_doc._id;
        });
        var index = doc_id_list.indexOf(id);
        return index;
    }

    function removeFromCache(doc_id) {
        var type = doc_id.split(":")[0];
        var index = getIndexForDoc(doc_id,type);
        if (!index) return;
        //console.log("[stor] remove from cache", doc_id, index);
        $data[type+"_docs"].splice(index, 1);
        self.cache[doc_id] = null;
    }

    function addToCache(doc) {

        var type = doc.id.split(":")[0];
        var obj = doc.toJSONFriendly();
        if (obj._deleted == true) {
            return;
        }
        //console.log("[stor] cache doc:", obj);
        var type_key = type+"_docs";
        if (!$data.hasOwnProperty(type_key)) {
            $data[type_key] = [];
        }
        $data[type_key].push(obj);
        index = getIndexForDoc(doc.id, type);
        self.cache[doc.id] = {
            id: doc.id, 
            type: type,
            index: index
        };
    }

    function replaceInCache(doc) {
        var type = doc.id.split(":")[0];
        var index = getIndexForDoc(doc.id,type);
        //console.log("[stor] replace cache doc:", obj._id, type, index);
        // replace in cache
        var obj = doc.toJSONFriendly();
        $data[type+"_docs"].splice(index, 1, obj);
        self.cache[doc.id].index = index;
    }


    function refreshDocInCache(doc) {
        var type = doc.id.split(":")[0];
        var obj = doc.toJSONFriendly();
        var index;
        // is the document already cached?
        if (self.cache[doc.id]) {
            index = getIndexForDoc(doc.id,type);
            if (obj._deleted) {
                removeFromCache(doc.id);
            }
            else {
                replaceInCache(doc);
            }
        }
        else {
            // insert new to cache
            addToCache(doc);
        }
    }

    function lanternOrCloud() {
        return self.cloud_db.info().then(function() {
            self.db = self.cloud_db;
            self.cloud_connected = true;
            return self.db;
        })
        .catch(function() {
            return self.lantern_db.info().then(function() {
                self.db = self.lantern_db;
                self.lantern_connected = true;
                return self.db;
            });
        });
    }

    function pickDatabase() {
        //console.log("[stor] picking database");
        if (self.db) return Promise.resolve(self.db);

        return new Promise(function(resolve, reject) {

            // fall-back for older devices that might not know how to handle indexDB
            var timer = setTimeout(function() {
                console.log("timed out looking for local db. use remote storage...");
                if (!self.db) {
                    return lanternOrCloud();
                }
            }, 1000);

            if (!self.browser_db) {
                return lanternOrCloud().then(resolve);
            }

            self.browser_db.info()
                .then(function (result) {
                    clearTimeout(timer);
                    self.db = self.browser_db;
                    resolve(self.db);
                }).catch(function(err) {
                    clearTimeout(timer);
                    
                    if (err.status == 500) {
                        if (err.reason == "Failed to open indexedDB, are you in private browsing mode?") {
                            // may be in private browsing mode
                            // attempt in-memory stor
                            // some browsers may not allow us to stor data locally
                            console.log("may be in private browsing mode. using remote storage...");
                            lanternOrCloud().then(resolve);
                        }
                        else if (err.reason == "QuotaExceededError") {
                            console.log(err);
                            console.log("quota exceeded for local storage. using remote storage...");
                            lanternOrCloud().then(resolve);
                        }
                    }
                    else {
                        clearTimeout(timer);
                        reject(err);
                    }
                });
        });
    }

    /**
    * Slowly backs off and slows down attempts to connect
    */


    //------------------------------------------------------------------------

    self.setup = function() {
        return pickDatabase()
            .then(function(db) {
                console.log("[stor] using database:", db.name);
            });
    };

    self.get = function() {
        //console.log("[stor] get: " + arguments[0]);
        return self.db.get.apply(self.db, arguments)
            .then(function(data) {
                var doc = new LanternDocument(data, self);
                refreshDocInCache(doc);
                return doc;
            });
    };


    self.getManyByType = function(type) {
        var params = {
            startkey: type+':', 
            endkey: type + ":\ufff0", 
            include_docs: true
        };
        return self.db.allDocs(params)
            .then(function(result) {

                //console.log("[stor] loading type: " + type + " (" + result.rows.length + ")");

                return Promise.all(result.rows.map(function(result) {

                    var doc = new LanternDocument(result.doc, self);
                    refreshDocInCache(doc);
                    return doc;
                }));
            });
    };


    self.remove = function() {
        var doc_id = arguments[0];
        var type = doc_id.split(":")[0];
        console.log("[stor] remove: " + doc_id);
        return self.db.remove.apply(self.db, arguments).then(function(result) {
            removeFromCache(doc_id);
            return result;
        });
    };

    self.removeAll = function() {
        return self.db.allDocs()
            .then(function (result) {
                // Promise isn't supported by all browsers; you may want to use bluebird
                return Promise.all(result.rows.map(function (row) {
                    return self.remove(row.id, row.value.rev);
                }));
            }).then(function () {
                console.log("[stor] finished deleting all docs");
              // done!
            }).catch(function (err) {
                console.log(err);
              // error!
            });
     };

    self.put = function() {
        var doc = arguments[0];
        console.log("[stor] put: ", doc);
        return self.db.put.apply(self.db, arguments).then(function() {
            addToCache(new LanternDocument(doc, self));
        });
    };

    self.upsert = function() {
        //console.log("[stor] upsert " + arguments[0]);
        var fn = arguments[1];
        var obj;

        var wrapper_fn = function(old_doc) {
            obj = fn(old_doc);
            return obj;
        };

        arguments[1] = wrapper_fn;

        return self.db.upsert.apply(self.db, arguments).then(function(results) {
            var new_doc = new LanternDocument(obj);
            new_doc.set("_rev", results.rev);
            refreshDocInCache(new_doc);
            return results;
        });
    };


    self.getCached = function(id) {
        var cached = self.cache[id];
        if (!cached) return;
        return $data[cached.type+"_docs"][cached.index];
    };


    /**
    * Compact database
    */
    self.compact = function() {
        return self.db.compact().then(function (info) {
            // compaction complete
            console.log("[stor] compaction complete", info);
        }).catch(function (err) {
            // handle errors
            console.error(err);
        });
    };


    /**
    * Check if we're connected to cloud instance (and therefore internet)
    */
    self.isCloudAvailable = function() {
        return self.cloud_db.info().then(function(results) {
            return true;
        })
        .catch(function() {
            return false;
        });
    };




    /**
    * Check if we're connected to a Lantern device
    */
    self.isLanternAvailable = function() {
        return self.lantern_db.info().then(function(results) {
            return true;
        })
        .catch(function() {
            return false;
        });
    };



    /**
    * Sync our in-browser database with the one on a physical device over wifi
    */
    self.syncWithLantern = function(continuous, status_fn, change_fn) {
        //console.log("[stor] trying sync with lantern");
        if (self.db.adapter == "http") {
            console.log("[stor] skipping sync since target is lantern already");
            status_fn(true);
            return;
        }

        
        LanternSync(self.browser_db, self.lantern_db, "lantern", continuous, function(status) {
                status_fn(status);

                // don't bother trying map sync until main sync is working...
                if (status && !did_sync_maps) {
                    did_sync_maps = true;


                    try {
                        var local_maps_db = new PouchDB("lantern-maps");

                        LanternSync(local_maps_db, self.lantern_maps_db, "lantern-maps", continuous, function() {}, function(changed_doc) {
                            //console.log("[stor] map update", changed_doc._id);
                        });
                    }
                    catch(e) {
                        // browser refuses to use local storage...
                        console.log("[stor] skip map sync since no in-browser storage available");
                    }

                }

            }, function(changed_doc) {
            refreshDocInCache(new LanternDocument(changed_doc, self));
            change_fn(changed_doc);
        });



        return;
    };

    /**
    * Sync our in-browser database with the one in the cloud
    */
    self.syncWithCloud = function(continuous, status_fn, change_fn) {
        //console.log("[stor] trying sync with cloud");
        LanternSync(self.browser_db, self.cloud_db, "cloud", continuous, status_fn, function(changed_doc) {
            refreshDocInCache(new LanternDocument(changed_doc, self));
            change_fn(changed_doc);
        });
        return;
    };



    return self;
});
window.LanternSync = function LanternSync(src, dest, label, continuous, status_fn, change_fn) {
    var reset_delay;

    function setStatus(status) {
        if (status == true) {
            reset_delay = true;
        }
        if (status_fn && typeof(status_fn) == "function") {
            status_fn(status);
        }
    }

    // @todo expore pouchdb bug where this may be run twice
    function backOffSync(delay) {
        

        if (reset_delay) {
            reset_delay = false;
            return 0;
        }
        
        //console.log("[" + label + "] retry sync in: " + delay);
        if (delay === 0) {
          return 3000;
        }
        return delay * 3;
    }

    var opts =  {
        since: 0,
        batch_size: 500,
        live: continuous || false,
        retry: true,
        back_off_function: backOffSync
    };

    
    src.sync(dest, opts)
    .on('complete', function() {
        console.log("[" + label + "] started sync");
        setStatus(true);
    })
    .on('paused', function(err) {
        if (err) {
            console.log("[" + label +"] lost connection");
            setStatus(false);
        }
    })
    .on('active', function() {
        //console.log("[" + label + "] active sync");
        setStatus(true);
    })
    .on('change', function (info) {
        setStatus(true);
        if (info.change.docs) {
            console.log("[" + label + "] %s: %s docs", 
                    info.direction, 
                    info.change.docs.length);
            for (var idx in info.change.docs) {
                change_fn(info.change.docs[idx]);
            }
        }
    })
    .on('error', function (err) {
        console.log("[stor] sync " + label + "err", err);
    });
};
