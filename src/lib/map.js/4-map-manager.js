window.LanternMapManager = function() {

    var self = {
        map: L.map('map'),
        markers: []
    };

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: false,
        dbName: "lantern-maps",
        maxZoom: 18,
        useCache: true,
        crossOrigin: true
    }).addTo(self.map);


    //------------------------------------------------------------------------
    self.addPoint = function(title, coords,  icon, color) {

        var opts = {};
        icon = icon || "info-circle";
        color = "#"+ (color || "3273dc");

        opts.icon = L.icon.fontAwesome({ 
            iconClasses: 'fa fa-' + icon, // you _could_ add other icon classes, not tested.
            markerColor: color,
            iconColor: '#FFF'
        });        

        var marker = L.marker(coords, opts).bindTooltip(title).addTo(self.map);
        self.markers.push(marker);
        return marker;
    };
    
    self.addPolygon = function(title, coords, opts) {
        //console.log("[map] adding polygon: ", coords);
        return L.polygon(coords, opts || {}).bindTooltip(title).addTo(self.map);
    };

    self.addCircle = function(title, coords, opts) {
        //console.log("[map] adding circle: ", coords);
        return L.circle(coords, opts || {}).bindTooltip(title).addTo(self.map);
    };
    
    self.setPosition = function(lat, lon, zoom) {
        //console.log("[map] set position to:" + lat, lon);
        self.map.setView([lat, lon], zoom || 11);
    };

    self.fitToMarkers = function() {
        var group = new L.featureGroup(self.markers);
        self.map.fitBounds(group.getBounds());
    };

    self.removeZoomControl = function() {
        self.map.removeControl(self.map.zoomControl);
    };

    self.addZoomControl = function() {
        self.map.addControl(self.map.zoomControl);
    };


    self.setPosition(38.42,-102.79, 4);

    //------------------------------------------------------------------------

    return self;
};