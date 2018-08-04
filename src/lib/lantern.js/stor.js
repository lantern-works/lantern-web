window.LanternStor = (function($data, uri) {

    var cloud_uri = "https://lantern.global/db/lnt/";
    var did_sync_maps = true; // @todo disable browser cache by default
    uri = uri.replace(":3000", "");

    var self = {
        doc_cache: {}, 
        browser_db: null,
        lantern_db: new PouchDB(uri + "/db/lnt/", {
            skip_setup: true,
            withCredentials: false        
        }),
        lantern_maps_db: new PouchDB( uri + "/db/map/", {
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
        self.browser_db = new PouchDB("lnt");
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

        if (index == -1) return;
        $data[type+"_docs"].splice(index, 1);
        self.doc_cache[doc_id] = null;
        console.log("[cache] remove", doc_id);
    }

    function addToCache(doc) {
        var index;

        var type = doc.id.split(":")[0];
        var obj = doc.toJSONFriendly();
        if (obj._deleted == true) {
            return;
        }
        //console.log("[cache] add " + doc.id,  obj);
        var type_key = type+"_docs";
        if (!$data.hasOwnProperty(type_key)) {
            $data[type_key] = [];
        }

        // make sure we don't double-add to cache
        index = getIndexForDoc(doc.id, type);
        if (index != -1) {
            // console.log("[cache] found existing index for " + doc.id, index);
        }
        else {
            $data[type_key].push(obj);
            index = getIndexForDoc(doc.id, type);
            self.doc_cache[doc.id] = {
                id: doc.id, 
                type: type,
                index: index
            };

        }
    }

    function replaceInCache(doc) {
        var type = doc.id.split(":")[0];
        var index = getIndexForDoc(doc.id,type);
        // replace in cache
        var obj = doc.toJSONFriendly();

        var cached = self.getCached(doc.id);
        if (cached._rev == obj._rev) {
            //console.log("[stor] skip cache replace since same rev", obj._id, obj._rev);
        }
        else {

            console.log("[cache] replace", obj._id, obj._rev);

            $data[type+"_docs"].splice(index, 1, obj);
            self.doc_cache[doc.id].index = index;

        }
    }


    function refreshDocInCache(doc) {
        var type = doc.id.split(":")[0];
        var index;

        // is the document already cached?
        if (self.doc_cache[doc.id]) {
            index = getIndexForDoc(doc.id,type);
            if (doc.data._deleted) {
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
                    return lanternOrCloud().then(resolve);
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

    self.get = function(id, allow_cached) {

        
        var doc;

        return new Promise(function(resolve, reject) {
            if (allow_cached) {
                var cached = self.getCached(id);
                if (cached) {
                    doc = new LanternDocument(cached, self);
                    console.log("[stor] get (cached): " + id);
                    return resolve(doc);
                }
            }
            
            self.db.get(id)
                .then(function(data) {
                    console.log("[stor] get: " + id);
                    doc = new LanternDocument(data, self);
                    refreshDocInCache(doc);
                    resolve(doc);
                })
                .catch(function(err) {
                    if (err.name == "not_found") {
                        console.log("[stor] get (not found): " + id);                        
                    }
                    reject(err);
                });
        });

    };

    self.print = function(id) {
        return self.get(id).then(function(res) {
            console.log(res.toJSONFriendly());
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

               console.log("[stor] loading type: " + type + " (" + result.rows.length + ")");

                return Promise.all(result.rows.map(function(result) {

                    var doc = new LanternDocument(result.doc, self);
                    refreshDocInCache(doc);
                    return doc;
                }));
            });
    };


    self.remove = function() {
        var doc_id = arguments[0];
        var rev = arguments[1];
        var type = doc_id.split(":")[0];
        console.log("[stor] remove: " + doc_id, rev);
        return self.db.remove.apply(self.db, arguments).then(function(result) {
            removeFromCache(doc_id);
            return result;
        })
        .catch(function (err) {
            console.log(err);
            // error!
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
            });
     };

    self.put = function() {
        var doc = arguments[0];
        console.log("[stor] put: ", doc);
        return self.db.put.apply(self.db, arguments).then(function(results) {
            refreshDocInCache(new LanternDocument(doc, self));
            return results;
        });
    };

    self.post = function() {
        var doc = arguments[0];
        console.log("[stor] post: ", doc);
        return self.db.put.apply(self.db, arguments).then(function(results) {
            doc._rev = results.rev;
            refreshDocInCache(new LanternDocument(doc, self));
            return results;
        });
    };


    self.getCached = function(id) {
        var cached = self.doc_cache[id];
        if (!cached) return;
        return $data[cached.type+"_docs"][cached.index];
    };

    self.getCachedIndex = function(id) {
        var cached = self.doc_cache[id];
        if (!cached) return;
        return cached.index;
    };


    self.getManyCachedByType = function(type) {
        return $data[type+"_docs"] || [];
    };


    self.refreshCached = function(doc) {
        return refreshDocInCache(doc);
    };


    /**
    * Compact database
    */
    self.compact = function() {
        if (self.browser_db) {
            self.browser_db.compact();
        }

        return self.db.compact().then(function (info) {
            // compaction complete
            console.log("[stor] compaction complete", info);
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


                // @todo allow user control, but for now we disable local storage by default

                // don't bother trying map sync until main sync is working...
                if (status && !did_sync_maps) {
                    did_sync_maps = true;


                    try {
                        var local_maps_db = new PouchDB("map");
                        LanternSync(local_maps_db, self.lantern_maps_db, "map", continuous);
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