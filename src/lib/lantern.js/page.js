window.LanternPage = (function(id) {

    var opts = {
        data: {
            cloud_connected: null,
            lantern_connected: null,
            page_title: "",
            page_loading: true,
            allow_back_button: false
        },
        methods: {
            handleGoBack: function() {
                window.history.go(-1);
            }

        }
    };

    var self = {
        stor: null,
        user: null,
        view: null
    };


    // initialize arrays for each type of doc
    // only these document types will ever be accepted by the system
    (["m", "i", "c", "r", "n", "u", "d"]).forEach(function(type) {
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
        doc.save();
        return doc;
    }

    /**
    * Get user from database 
    */
    function getUser() {
        return self.stor.get("u:"+getUserId()).then(function(doc) {
            console.log("[user] found", doc.get("_id"));
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


    function sync(continuous) {

        // make sure we tell the system we're awake
        self.user.set("updated_at",new Date());
        self.user.save();

        self.stor.syncWithCloud(continuous, function(status) {
            self.view.$data.cloud_connected = status;
        });

        if (window.location.host != "lantern.global") {
            self.stor.syncWithLantern(continuous, function(status) {
                self.view.$data.lantern_connected = status;
            });
        }
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
            })
            .then(function() {
                // draw listening user count
                return self.stor.getManyByType("u");
            });
    };





    /**
    * Display the map for the user based on approx. location
    */
    self.renderMap= function(lat, lon) {
        if (map) {
            // already showing map
            return;
        }

        console.log("[browse] showing map");


        map = new LanternMapManager(lat, lon);
        map.setPosition(lat, lon);

        console.log("[browse] map loaded");

        // add markers to map
        self.view.$data.m_docs.forEach(function(marker) {
            var coords = [];
            for (var idx in marker.geo) {
                var c = Geohash.decode(marker.geo[idx]);
                coords.push(c);
            }

            if (coords.length == 1) {
                // point
                map.addPoint(coords[0]);
            }
            else {
                // draw a shape
                map.addPolygon(coords);
            }
        });

    };
    
    self.askForLocation = function() {
        function geo_success(position) {
            console.log("[browse] found position", position);
            self.view.$data.map_err = false;
            self.renderMap(position.coords.latitude, position.coords.longitude);
        }

        function geo_error(err) {
            console.log("[browse] no position available", err);
            self.view.$data.map_err = true;
        }

        console.log("[browse] asking for location");
        var geo_options = {
          enableHighAccuracy: false, 
          maximumAge        : 30000, 
          timeout           : 27000
        };

        navigator.geolocation.getCurrentPosition(geo_success, geo_error, geo_options);
        var wpid = navigator.geolocation.watchPosition(geo_success, geo_error, geo_options);
    };




    /**
    * Points to the right server for processing requests
    */
    self.getBaseURI = function() {
        return "http://" + (window.location.host == "localhost:3000" ? 
            "localhost:8080" :  window.location.host);
    };

    
    /**
    * Get a query parameter value
    */
    self.getURIParameterByName = function(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
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
    };



    //------------------------------------------------------------------------
    return self;
});

