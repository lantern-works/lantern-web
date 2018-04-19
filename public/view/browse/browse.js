window.app = (function() {

    var self;
    var opts = {};

    opts.methods = {
      
        toggleCategory: function(evt) {
            var el = evt.target;
            var cat = el.getAttribute("id");
            console.log("toggle category: " + cat);

            // save category state
            return self.stor.upsert("u:"+self.getUserId(), function(user_doc) {
                console.log(user_doc);
                user_doc.updated_at = new Date();
                if (!user_doc.watch) user_doc.watch = {};
                user_doc.watch[cat] = (user_doc.watch[cat] === true ? false : true);
                self.vm.$data.user = user_doc;
                return user_doc;
            });
        },
        makeCategoryClass: function(cat) {
            var cls = "";
            var user = self.vm.$data.user;
            if (user && user.watch) {
                if (user.watch[cat._id]) {
                    cls += "active ";
                }
            }
            return cls;
        },
        makeCategoryStyle: function(cat) {
            if (typeof(cat) == "string") {
                var cat_id = "c:"+cat;
                cat = self.stor.getCached(cat_id);
            }
            if (!cat || !cat.hasOwnProperty("color")) {
                console.log("skipping bad cat", cat);
                return "";
            }
            var style = ["color: #" + cat.color];
            style.push("background-color: #" + cat.background_color);
            style.push("border-color: #" + cat.color);
            return style.join("; ");
        }
    };


    opts.beforeMount = function() {
        if (!self.vm.$data.c_docs.length) {
            window.location.href = "/view/setup/setup.html";
        }
    };

    self = new LanternPage("browse", opts, ["v", "c", "u", "s"]);
    return self;
}());