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
        text: "tx",         // text or label for object
        status: "st",       // level or quantity
        owner: "ou",        // user array
        editor: "eu",       // user array
        geo: "gp",          // geohash array
        tag: "tg",          // category or other tags
        style: "sl",        // css styles,
        parent: "pt",       // parent document reference
        child: "cd"         // child document reference

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
        self.data[key].push(val);
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
            console.log("[doc] saved " + self.id, self.toJSON());
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

    

    return self;
});
window.LanternImport = function(stor) {
    
    var self = {};


    /**
    * Save an interest to the database for future use in the interface.
    * Allows for dynamically adding new interests over over time.
    */
    function addTag(slug, title, valid_doc_types, color, background_color) {
        var doc = new LanternDocument("t:"+slug, stor);
        doc.set("title", title);
        valid_doc_types.forEach(function(type) {
            doc.push("tag", type);
        });
        doc.set("style", {
            "color": color, 
            "background-color": background_color}
        );
        doc.set("$ia", new Date());
        doc.save();
    }
    
    function addZone(id, title, geo, tag) {
        var venue_doc = new LanternDocument("z:"+id, stor);
        venue_doc.set("title", title);
        venue_doc.set("geo", [geo]);
        venue_doc.push("tag", tag);
        venue_doc.set("$ia", new Date());
        venue_doc.save();

        var supply_id = "i:wtr-1-" + id;
        var supply_doc = new LanternDocument(supply_id, stor);
        supply_doc.set("status", 1);
        supply_doc.push("parent", venue_doc.id);
        supply_doc.push("tag", "wtr");
        supply_doc.set("$ia", new Date());
        supply_doc.save();


        var net_id = "i:net-1-" + id;
        var net_doc = new LanternDocument(net_id, stor);
        net_doc.set("status", 1);
        net_doc.push("parent", venue_doc.id);
        net_doc.push("tag", "net");
        net_doc.set("$ia", new Date());
        net_doc.save();
    }

    function addKind(id, title) {
        var kind_doc = new LanternDocument("k:" +id, stor);
        kind_doc.set("title", title);
        kind_doc.set("$ia", new Date());
        kind_doc.save();
    }


    //------------------------------------------------------------------------
    self.tag = function() {
        console.log("[import] adding default item tags");
        addTag("shr", "Shelter", ["i"], "ffcc54", "fff7ef");
        addTag("wtr", "Water", ["i"], "78aef9", "e9f2fe");
        addTag("ful", "Fuel", ["i"], "c075c9", "f5e9f6");
        addTag("net", "Internet", ["i"], "73cc72", "e8f7e8");
        addTag("med", "Medical", ["i"], "ff844d", "ffebe2");
        addTag("dnt", "Donations", ["i"], "50c1b6", "e3f5f3");
        addTag("pwr", "Power", ["i"], "f45d90", "f2dae2");
        addTag("eqp", "Equipment", ["i"], "4aaddb", "e8f4fa");


        console.log("[import] adding default zone tags");
        addTag("sup", "Supply Location", ["z"]);
        addTag("str", "Safe Shelter", ["z"]);
        addTag("dgr", "Dangerous Area", ["z"]);
    };


    /**
    * Save an arbitrary map location into the database.
    * Allows for tracking population size and resource distribution
    * against meaningful points in a town.
    */
    self.zone = function() {
        console.log("[import] adding default venues");
        addZone("css", "Central City Shelter", "drs4b7s", "str");
        addZone("aic", "AI's Cafe", "drs4b77", "sup");
        addZone("rcm", "Red Cross HQ", "drs4b75", "str");
    };

    self.item = function() {
        // items to be added directly along-side zones
    };

    self.route = function() {
        console.log("[import] adding default geo routes"); 
        var doc = new LanternDocument("r:test-route", stor);
        doc.set("geo", ['drs4b77e8', 'drs4b77e9']);
        doc.set("$ia", new Date());
        doc.save();
    };


    self.note = function() {
        console.log("[import] adding default notes");
        var doc = new LanternDocument("n:test-note", stor);
        doc.push("tag", "v:test-place");
        doc.set("$ia", new Date());
        doc.save();
    };

    self.all = function() {
        self.tag(); // accepted tags for various types of docs
        self.zone(); // items placed in specific zones
        self.item(); // dummy for consistency, see zone()
        self.route(); // routes between zones
        self.note(); // notes related to items or zones or routes
    };



    //------------------------------------------------------------------------
    return self;
};

    
window.LanternPage = (function(id) {

    var opts = {
        data: {
            cloud_connected: null,
            lantern_connected: null
        },
        methods: {}
    };

    var self = {
        stor: null,
        user: null,
        view: null
    };


    // initialize arrays for each type of doc
    (["z", "i", "t", "r", "n", "u"]).forEach(function(type) {
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


    function sync() {

        // make sure we tell the system we're awake
        self.user.set("updated_at",new Date());
        self.user.save();


        self.stor.syncWithCloud(function(status) {
            self.view.$data.cloud_connected = status;
        });
        self.stor.syncWithLantern(function(status) {
            self.view.$data.lantern_connected = status;
        });
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
        
        self.stor = new LanternStor(opts.data);
        return self.stor.setup()
            .then(getOrCreateUser)
            .then(function(user) {
                // make sure we have an anonymous user all the time
                self.user = user;
                var cached = self.stor.getCached(user.id);
                self.view.$data.user = cached;
                //sync();
            })
            .then(function() {
                // draw listening user count
                return self.stor.getManyByType("u");
            });
    };



    /**
    * Points to the right server for processing requests
    */
    self.makeURI = function(uri) {
        return "http://" + (window.location.host == "localhost:3000" ? 
            "localhost:8080" :  window.location.host);
    };



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


window.LanternStor = (function($data) {

    var cloud_uri = "http://app.lantern.works/db/lantern";
    var lantern_uri = window.location.origin + "/db/lantern";

    var self = {
        cache: {},        
        browser_db: new PouchDB("lantern"),
        lantern_db: new PouchDB(lantern_uri.replace(":3000", ":8080"), {
            skip_setup: true,
            withCredentials: false        
        }),
        cloud_db: new PouchDB(cloud_uri, {
            skip_setup: true,
            withCredentials: false        
        }),
        cloud_connected: null,
        lantern_connected: null,
        db: null
    };

    //------------------------------------------------------------------------


    function getIndexForDoc(id,type) {
        var doc_id_list = $data[type+"_docs"].map(function(compare_doc) {
            return compare_doc._id;
        });
        var index = doc_id_list.indexOf(id);
        return index;
    }

    function removeFromCache(doc_id) {
        var type = doc_id.split(":")[0];
        var index = getIndexForDoc(doc_id,type);
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

    function pickDatabase() {
        //console.log("[stor] picking database");
        if (self.db) return Promise.resolve(self.db);

        return new Promise(function(resolve, reject) {

            // fall-back for older devices that might not know how to handle indexDB
            var timer = setTimeout(function() {
                console.log("timed out looking for local db. use remote storage...");
                if (!self.db) {
                    self.db = self.lantern_db;
                    resolve(self.db);
                }
            }, 1000);

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
                            // @todo default to cloud if lanter not available and we have internet
                            self.db = self.lantern_db;
                        }
                        else if (err.reason == "QuotaExceededError") {
                            console.log("quota exceeded for local storage. using remote storage...");
                            self.db = self.lantern_db;
                        }
                        resolve(self.db);
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
            .then(function() {
                console.log("[stor] target = " + 
                    (self.db.adapter == "http" ? "remote" : "local")
                );
            });
    };

    self.get = function() {
        console.log("[stor] get: " + arguments[0]);
        return self.db.get.apply(self.db, arguments)
            .then(function(data) {
                var doc = new LanternDocument(data, self);
                refreshDocInCache(doc);
                return doc;
            });
    };


    self.getManyByType = function(type) {
        console.log("[stor] loading type: " + type);
        var params = {
            startkey: type+':', 
            endkey: type + ":\ufff0", 
            include_docs: true
        };
        return self.db.allDocs(params)
            .then(function(result) {
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
    self.syncWithLantern = function(status_fn) {
        console.log("[stor] trying sync with lantern");
        if (self.db.adapter == "http") {
            console.log("[stor] skipping sync since target is lantern already");
            return;
        }
        LanternSync(self.browser_db, self.lantern_db, "lantern", true, status_fn, function(changed_doc) {
            refreshDocInCache(new LanternDocument(changed_doc, self));
        });
        return;
    };

    /**
    * Sync our in-browser database with the one in the cloud
    */
    self.syncWithCloud = function(status_fn) {
        console.log("[stor] trying sync with cloud");
        LanternSync(self.browser_db, self.cloud_db, "cloud", true, status_fn, function(changed_doc) {
            refreshDocInCache(new LanternDocument(changed_doc, self));

        });
        return;
    };



    return self;
});
window.LanternSync = function LanternSync(src, dest, label, continuous, status_fn, change_fn) {
    var reset_delay;

    function setStatus(status) {
        self[label + "_connected"] = status;
        if (status == true) {
            reset_delay = true;
        }
        if (status_fn && typeof(status_fn) == "function") {
            status_fn(self[label + "_connected"]);
        }
    }

    // @todo expore pouchdb bug where this may be run twice
    function backOffSync(delay) {
        if (reset_delay) {
            console.log("[stor] " + label + " do reset delay");
            reset_delay = false;
            return 0;
        }
        
        console.log("[stor] delaying " + label + " sync retry: " + delay);
        if (delay === 0) {
          return 3000;
        }
        return delay * 3;
    }

    src.sync(dest, {
        live: continuous || false,
        retry: true,
        back_off_function: backOffSync
    })
    .on('complete', function() {
        console.log("[stor] started " + label + " sync");
        setStatus(true);
    })
    .on('paused', function(err) {
        if (err) {
            console.log("[stor] lost connection with " + label);
            setStatus(false);
        }
    })
    .on('active', function() {
        console.log("[stor] active " + label + " sync");
        setStatus(true);
    })
    .on('change', function (info) {
        setStatus(true);
        if (info.change.docs) {
            console.log("[stor] did %s to " + label + " database: %s docs", 
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
