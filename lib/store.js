window.LanternStore = (function($data) {

    // local and remote database connections
    var db_opts = {
        skip_setup: true,
        withCredentials: false        
    };
    var cache_map = {};
    var local_db = new PouchDB("lantern", db_opts);
    var remote_db = new PouchDB("http://localhost:8080/db/lantern/", db_opts);
    var target_db = null; // set once we know if remote is available

    var self = {};


    //------------------------------------------------------------------------
    function cacheDoc(doc) {

        var type = doc._id.split(":")[0];

        // is the document already cached?
        var item = cache_map[doc._id];
        if (item) {
            if (doc._deleted) {
                console.log("[store] delete from cache", doc._id);
                $data[type+"_docs"].splice(item.index, 1, doc);
            }
            else {
                console.log("[store] replace cache doc:", doc);
                // replace in cache
                $data[type+"_docs"].splice(item.index, 1, doc);
            }
        }
        else {
            // insert new to cache
            console.log("[store] insert cache doc:", doc);
            $data[type+"_docs"].push(doc);
            cache_map[doc._id] = {
                id: doc._id, 
                type: type,
                index: $data[type+"_docs"].length-1
            };
        }
    }

    function loadDocuments(type) {
        console.log("[store] loading type: " + type);
        var params = {
            startkey: type+':', 
            endkey: type + ":\ufff0", 
            include_docs: true
        };
        return target_db.allDocs(params)
            .then(function(result) {
                return Promise.all(result.rows.map(function(result) {
                    return cacheDoc(result.doc);
                }));
            });
    }

    //------------------------------------------------------------------------
    self.setup = function(types) {
        return self.pickDatabase()
            .then(function(db) {
                console.log("[store] db: " + 
                    (db.prefix == "_pouch_" ? "local" : "remote"));
                return;
            })
            .then(function() {
                if (types && types.length) {
                    return Promise.all(types.map(function (type) {
                        if (!$data[type+"_docs"]) {
                            $data[type+"_docs"] = [];
                        }
                        return loadDocuments(type);
                    }));
                }
            }).then(self.sync);
    };

    self.pickDatabase = function() {
        if (target_db) return Promise.resolve(target_db);
        return local_db.info()
            .then(function (result) {
                target_db = local_db;
                return target_db;
            }).catch(function(err) {
                if (err.status == 500) {
                    if (err.name == "indexed_db_went_bad") {
                        // may be in private browsing mode
                        // attempt in-memory store
                        // some browsers may not allow us to store data locally
                        console.log("may be in private browsing mode. refusing to cache data in browser");
                        target_db = remote_db;
                        return target_db;
                    }
                }
            });
    };

    self.upsert = function(id, fn) {
        return target_db.upsert(id,fn);
    };

    self.sync = function() {
        if (!local_db) {
            console.log("[store] skipping sync since no local db");
            return;
        }
        else {
            console.log("[store] starting sync");
        }
        return local_db.sync(remote_db, {
            live: true,
            retry: true
        })
        .on('change', function (info) {
            console.log(info);
            if (info.change.docs) {
                for (var idx in info.change.docs) {
                    cacheDoc(info.change.docs[idx]);
                }
            }
        })
        .on('error', function (err) {
            console.log("[store] sync err", err);
        });
    };


    self.deleteAll = function() {
        return target_db.allDocs()
            .then(function (result) {
                // Promise isn't supported by all browsers; you may want to use bluebird
                return Promise.all(result.rows.map(function (row) {
                    return target_db.remove(row.id, row.value.rev);
                }));
            }).then(function () {
                console.log("[store] finished deleting all docs");
              // done!
            }).catch(function (err) {
                console.log(err);
              // error!
            });
     };


    return self;
});