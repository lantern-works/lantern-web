window.page = (function() {

    var self;
    var opts = {};

    opts.methods = {
      
        toggleCategory: function(evt) {
            var el = evt.target;
            var cat = el.getAttribute("id");
            if (self.user.has("tag", cat)) {
                self.user.pop("tag", cat);
            }
            else {
                self.user.push("tag", cat);
            }
            self.user.save();
        },
        makeCategoryClass: function(cat) {
            var cls = "";
            var user = self.user;
            if (user && user.has("tag", cat._id)) {
                cls += "active ";
            }
            return cls;
        },
        makeCategoryStyle: function(cat) {
            var obj;

            if (!cat) {
                return;
            }

            if (typeof(cat) == "string") {
                obj = self.stor.getCached(cat);
            }
            else {
                obj = cat;
            }

            var doc = new LanternDocument(obj, self.stor);
            var style = ["color: #" + doc.get("style","color")];
            style.push("background-color: #" + doc.get("style", "background-color"));
            style.push("border-color: #" + doc.get("style", "color"));
            return style.join("; ");
        },
        showReportPanel: function() {
            window.location = "/p/report/report.html";
        }
    };


    opts.data = {
        show_filter: false
    };

    var preload = ["v", "c", "u", "s"];

    for (var idx in preload) {
        opts.data[preload[idx] +"_docs"] = [];
    }



    opts.beforeMount = function() {
        if (!self.vm.$data.c_docs.length) {
            window.location.href = "/p/setup/setup.html";
        }
    };

    self = new LanternPage("browse", opts, preload);
    return self;
}());