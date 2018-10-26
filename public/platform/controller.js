__base = "../";

var LX = window.LX || {};
window.LX = LX;
LX.Server = (function() {

    // default cross-domain JSON request options
    var _fetch_opts = {
         mode: "cors",
         cache: "no-cache",
         headers: {
            "Content-Type": "application/json; charset=utf-8"
         }
    };

    var self = {
    	cloud: false,
    	lantern: false,
    	info: null,
    	uri: null
    };

    self.connect = function(domain) {
    	var uri = window.location.protocol + "//" + domain;
	    return fetch(uri + "/api/info", _fetch_opts)
	        .then(function(result) {
	            return result.json();
	        })
	        .then(function(json) {
	            self.uri = uri;
	            self.info = json;
	            try {
	                self.cloud = (json.cloud == true);
	                self.lantern = (json.cloud == false);                    
	            }
	            catch(e) {
	                // if missing "cloud" value, leave defaults...
	            }
	            console.log("[server] connected:", self);
	            
	        })
	        .catch(function(err) {
	            console.log(err);
	            if (window.location.hostname == "localhost" && domain == "lantern.global") {
	                // allow developers to use localhost docker image
	                return self.connect("localhost");
	            }
	        });
	}

	return self;
});
LX.Worker = (function() {
	return {
		register: function() {
			if ("serviceWorker" in navigator) {
			    navigator.serviceWorker.register('/worker/sw.js', {
			        scope: "/"
			    }).then(function(registration) {
			        // success
			        console.log("[sw] registered service worker");
			    }).catch(function(e) {
			        // failed
			        console.log("[sw] service worker err", e);
			    });
			}
		}
	}
});
LX.Location = (function() {

    var _last_known_position;
    var _last_known_geohash;

    // geolocation options
    var _opts = {
        enableHighAccuracy: false, 
        maximumAge        : 30000, 
        timeout           : 27000
    };

    var self = {};

    // @todo fall-back to lantern geolocation if GPS sensor not available
    self.getCurrentPosition = function(use_saved_location) {
        return new Promise(function(resolve, reject) {

            if (use_saved_location && _last_known_position) {
                return resolve(_last_known_position);
            }

            //console.log("[page] asking for location");
            navigator.geolocation.getCurrentPosition(function(position) {
                _last_known_position = position;
                var geo = Geohash.encode(position.coords.latitude, position.coords.longitude);
                var short_geo = geo.substr(0,4); // reduce geohash precision for privacy
                _last_known_geohash = short_geo;
                resolve(position);
            }, function(err) {
                reject(err);
            }, _opts);
        });
    };


    self.getCurrentGeohash = function(use_saved_location) {
        return self.getCurrentPosition(use_saved_location)
            .then(function(position) {
                return _last_known_geohash;
            });
    }

    self.getPositionFrom = function(geo) {
        return Geohash.decode(geo);
    }

    self.getDistanceFrom = function(geo) {
        return Math.round(Geohash.inKm(geo, _last_known_geohash));
    }
    
    self.getDistanceBetween = function(geo_a, geo_b) {
        return Math.round(Geohash.inKm(geo_a, geo_b));
    }

    return self;
})();
LX.Page = (function(id) {

    // where we store our desired view methods before creating our app on the page
    var _methods = {};

    // where we store our starting data before we create the app
    var _data = {};

    // computed properties
    var _computed = {};


    //------------------------------------------------------------------------
    var self = {
        view: null, // vue app
        geo: null, // user geohash location
        stor: null, // database storage
        user: null, // user document
        map: null,// leaflet map
        server: new LX.Server() // server instance connected
    };


    // prevents duplicate assignments of same location to device
    var did_assign_location = false;



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
        var doc = new LX.Document("u:"+getUserId(), self.stor);
        console.log("[page] create user:"+getUserId());
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
        
        if (doc._deleted == true) {
            self.view.$data.sync_label = "Syncing";
            self.view.$data.is_syncing  = true;
        }

        else {
            self.view.$data.is_syncing = true;
            
            // display title of doc where possible
            if (doc && doc.hasOwnProperty("tt")) {
                self.view.$data.is_syncing = doc.tt;

                if (doc._rev.split("-")[0] == "1") {
                    self.view.$data.sync_label = "Adding";
                }
                else {
                    self.view.$data.sync_label = "Updating";
                }
            } 
        }

        setTimeout(function() {
            self.view.$data.sync_label = "Syncing";
            self.view.$data.is_syncing = false;
        }, 1000);
    }


    /**
    * Handle each document change
    */
    function handleDocumentChange(changed_doc) {

        console.log("[db:lnt] change: " + changed_doc._id);

        showSyncIcon(changed_doc);

        if (changed_doc._id == ("d:" + self.view.$data.lantern.id)) {
            self.view.$data.lantern.name = changed_doc.tt;
        }
        // always refresh document cache after change
        var doc = new LX.Document(changed_doc, self.stor);
        self.stor.refreshDocInCache(doc);
    }



    //------------------------------------------------------------------------
    /** 
    * Define helper for user interactions
    **/
    self.addHelper = function(name, fn) {
        _methods[name] = fn;
    };
    
    /** 
    * Define data for vue templates
    **/
    self.addData = function(name, val) {
        _data[name] = val;
    };


    /** 
    * Define data for vue templates
    **/
    self.addComputed = function(name, val) {
        _computed[name] = val;
    };

    

    /** 
    * Mount vue to our top-level document object
    **/
    self.render = function() {
        self.view = new LX.View(_data,_methods,_computed)
        self.view.$mount(["#", id, "-page"].join(""));
        return Promise.resolve();
    };

    /**
    * Add in data from PouchDB and identify network status
    */
    self.connect = function() {
        return self.server.connect("lantern.global")
            .then(function() {
                self.view.lantern_connected = self.server.lantern;
                self.view.cloud_connected = self.server.cloud;
                self.view.lantern = self.server.info;
            })
            .then(function() {
                self.stor = new LX.Stor(self.server.uri, "lnt", self.view.$data);
                return self.stor.setup();
            })
            .then(getOrCreateUser)
            .then(function(user) {
                // make sure we have an anonymous user all the time
                self.user = self.view.$data.user = user;

                // async kick-off pull after completing connection
                self.pull()
                .then(function() {
                    // // once we have up-to-date information, we can try sending back and syncing updates
                    setTimeout(function() {
                        self.sync(true, 100);   
                    }, 3500);
                });
            });

    };


    /**
    * Sync our in-browser database with the one on a physical device over wifi
    */
    self.sync = function(continuous, batch_size) {
        console.log("[page] sync %s <--> %s", self.stor.browser_db.name, self.stor.host_db.name);
        if (self.stor.db.name == self.stor.host_db.name) {
            console.log("[page] skipping sync since target is lantern already");
            return;
        }

        LX.Sync(
            self.stor.browser_db, 
            self.stor.host_db, 
            self.stor.name, 
            continuous, 
            handleDocumentChange, 
            batch_size
        );
        return;
    };

    self.pull = function() {

         if (self.stor.db.name == self.stor.host_db.name) {
            console.log("[page] skipping pull since target is lantern already");
            return;
        }

        return self.stor.browser_db.replicate.from(self.stor.host_db, {
            live: false
        }).then(function(results) {
            if (results.ok == true) {}
            console.log("[page] pull complete:", results);
        });

    }


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

    self.getNotes = function() {
        return self.stor.getManyByType("n");
    };


    self.getEvents = function() {
        return self.stor.getManyByType("e");
    };


    
    self.createMapManager = function() {
        return new Promise(function(resolve, reject) {
            if (self.map) {
                self.map.clear();
                resolve(self.map);
            }
            else {

                var cache = !(self.view.$data.lantern && self.view.$data.lantern.cloud);
                var db_uri;
                
                if (self.view.$data.lantern && self.view.$data.lantern.cloud == false) {

                    // working offline connected to device
                    db_uri = self.server.uri + "/db/map";

                    var min_docs = 300;

                    new PouchDB("map").info().then(function(local_res) {
                        var current_docs = local_res.doc_count;

                        console.log("[page] map cache: " + current_docs + " / " + min_docs);

                        if (current_docs > min_docs) {
                            db_uri = "map";
                            console.log("[page] using offline map cache");
                        }

                        self.map = new LX.Map(db_uri, cache, cache);
                        resolve(self.map);
                    });
                }
                else {
                    // fall-back to offline cache if we are not connected direct to lantern
                    self.map = new LX.Map("map", cache, cache);
                    resolve(self.map);
                }
            }
        });
    };



    /**
    * Display the map for the user based on approx. location
    */
    self.renderMap = function(venues, show_tooltip, icon, color) {

        venues = venues || [];

        return new Promise(function(resolve, reject) {
            self.createMapManager().then(function() {
                var venue_options = {};
                items = self.stor.getManyCachedByType("i");
                
                items.forEach(function(item){
                    if (item.parent && item.category) {
                        var v = item.parent[0];
                        var c_doc = "c:"+item.category[0];
                        venue_options[v] = venue_options[v] || [];
                        venue_options[v].push(self.stor.getCached(c_doc));
                    }
                });

                // add venues to map

                venues.forEach(function(v_id) {
                    var coords = [];
                    var venue = self.stor.getCached(v_id);
                    
                    if (venue.geo) {
                        for (var idx in venue.geo) {
                            try {
                                var c = Geohash.decode(venue.geo[idx]);
                                coords.push(c);
                            }
                            catch(e) {
                                console.error("[page] invalid geohash " + venue.geo + " for: " + v_id);
                            }
                        }   
                    }

                    if (coords.length == 1) {
                        // point
                        var final_icon = icon;
                        var final_color = color;

                        if (venue_options[venue._id]) {
                            final_icon = venue_options[venue._id][0].icon;
                            final_color = venue_options[venue._id][0].style.color;;
                        }
                        var pt = self.map.addPoint(venue.title, coords[0], final_icon, final_color);
                       

                        // @todo de-couple from page controller
                        if (show_tooltip) {
                            
                            pt.on("click", function(e) {
                                window.location = "/apps/rdr/detail.html#mrk=" + v_id;
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


    /**
    * Update connected device with geolocation
    */
    self.sendGeohashToLantern = function(geohash) {


        // only try to set location once per page-load
        if (did_assign_location) {
            return;
        }

        did_assign_location = true;

        // tell device to use this as it's most recent location (skip GPS)
        fetch(self.server.uri + "/api/geo",
        {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            }, 
            body: JSON.stringify({"geo": geohash })
        }).then(function() {
            console.log("[page] assigned geohash to lantern: " + geohash);
        })
        .catch(function(err) {
            console.log("[page] skipping geo assignment since no lantern connection");
        });

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




    //------------------------------------------------------------------------
    /**
    * Extract a category object from meaningful input such as a tag
    */
    self.addHelper("getCategory", function(arg) {
        if (!arg) {
            return;
        }
        var obj;
        if (typeof(arg) == "string") {
            obj = self.stor.getCached("c:"+arg);
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
            

    self.addHelper("handleGoBack", function() {
        if (window.history.length) {
            window.history.go(-1);
        }
        else {
            var url = window.location.href;
            window.location = url.substring(0,url.lastIndexOf("/"));
        }
    });



    /**
    * Extract background and stroke colors from database
    */
    self.addHelper("makeCategoryStyle", function(cat) {
        if (!cat) return;
        var doc = new LX.Document(cat, self.stor);
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


    /**
    * Setup global view helpers
    */
    self.addHelper("toggleNavigation", function(el) {
        self.view.$data.showNavMenu = !self.view.$data.showNavMenu;

        if (self.view.$data.showNavMenu) {
            self.getUsers();
        }
    });



    //------------------------------------------------------------------------
    return self;
});


