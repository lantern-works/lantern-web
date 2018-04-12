window.app = (function() {

    var self = {};

    var types = [
        {key: "v", name: "Venue", docs: [], populate: addDefaultVenues},
        {key: "r", name: "Route", docs: [], populate: addDefaultRoutes},
        {key: "c", name: "Category", docs: [], populate: addDefaultCategories},
        {key: "s", name: "Supply", docs: [], populate: addDefaultSupplyLevels}
    ];

    /**
    * Save an interest to the database for future use in the interface.
    * Allows for dynamically adding new interests over over time.
    */
    function addCategory(title, slug, color, background_color) {
        return self.store.upsert("c:"+slug, function(doc) {
            doc.name = title;
            doc.color = color;
            doc.background_color = background_color;
            if (!doc.created_at) {
                doc.created_at = new Date();
            }
            else {
                doc.updated_at = new Date();
            }
            return doc;
        });
    }
    
    function addDefaultCategories() {
        console.log("[admin] adding default resource categories");
        addCategory("Shelter", "shr", "ffcc54", "fff7ef");
        addCategory("Water", "wtr", "78aef9", "e9f2fe");
        addCategory("Fuel", "ful", "c075c9", "f5e9f6");
        addCategory("Internet", "net", "73cc72", "e8f7e8");
        addCategory("Medical", "med", "ff844d", "ffebe2");
        addCategory("Donations", "dnt", "50c1b6", "e3f5f3");
        addCategory("Power", "pwr", "f45d90", "f2dae2");
        addCategory("Equipment", "eqp", "4aaddb", "e8f4fa");
    }

    /**
    * Save an arbitrary map location into the database.
    * Allows for tracking population size and resource distribution
    * against meaningful points in a town.
    */
    function addDefaultVenues() {
        console.log("[admin] adding default venues");
        return self.store.upsert("v:test-place", function(doc) {
            doc.name = 'Meadowlane ' + Math.round(Math.random()*100);
            doc.geo = "u4pruydq";
            if (!doc.created_at) {
                doc.created_at = new Date();
            }
            else {
                doc.updated_at = new Date();
            }
            return doc;
        });
    }

    function addDefaultRoutes() {
        console.log("[admin] adding default geo routes"); 
        return self.store.upsert("r:test-route", function(doc) {
            doc.geo_start = 'u4pruydq';
            doc.geo_stop = 'u4pruyde';
            if (!doc.created_at) {
                doc.created_at = new Date();
            }
            else {
                doc.updated_at = new Date();
            }
            return doc;
        });
    }

    function addDefaultSupplyLevels() {
        console.log("[admin] adding default geo routes");
        return self.store.upsert("s:test-level", function(doc) {
            doc.count = 10;
            if (!doc.created_at) {
                doc.created_at = new Date();
            }
            else {
                doc.updated_at = new Date();
            }
            return doc;
        });
    }

    //------------------------------------------------------------------------
    var vue_opts = {
        methods: {
            pluralize: function(count) {
                if (count === 0) {
                    return 'No Documents';
                } 
                else if (count === 1) {
                    return '1 Document';
                } else {
                    return count + ' Documents';
                }
            }
        },
        data: {
            types: types
        },
        beforeMount: function() {
            console.log("[admin] view initialized");
        }
    };

    var docs_to_preload = [];
    for (var idx in types) {
        docs_to_preload.push(types[idx].key);
        vue_opts.data[types[idx].key+"_docs"] = types[idx].docs;
    }


    self.vm = new Vue(vue_opts);
    self.store = new LanternStore(self.vm.$data);
    self.store.setup(docs_to_preload).then(function() {
        self.vm.$mount('#admin-app');
    });

    return self;
}());