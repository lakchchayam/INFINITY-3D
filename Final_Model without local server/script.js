$(window).resize(function () {
    if ($(window).width() >= 768) {
        $('.section-body').collapse('show');
    }
});
$('.navbar-collapse a[role="tab"]').click(function () {
    $(".navbar-collapse").collapse('hide');
});
$('.dropdown').on('shown.bs.dropdown', function (event) {
    event.target.scrollIntoView(false); 
});
$(document).ready(function () {
    "use strict";
    WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_WARNING);
    // Attach the WorldWindow globe to the HTML5 canvas 
    var wwd = new WorldWind.WorldWindow("canvasOne"),
        MARKERS = "Markers",
        markersViewModel,
        globeViewModel;
    /**
      Returns the first layer with the given name.
      @param {String} name
      @returns {WorldWind.Layer}
     */
    function findLayerByName(name) {
        var layers = wwd.layers.filter(function (layer) {
            return layer.displayName === MARKERS;
        });
        return layers[0];
    }
    function GlobeViewModel(wwd, markersViewModel) {
        var self = this;
        self.markerPalette = ko.observableArray([
           
        ]);
        // The currently selected marker icon 
        self.selectedMarkerImage = ko.observable(self.markerPalette()[0]);
        // Used for cursor style and click handling 
        self.dropIsArmed = ko.observable(false);
        self.dropCallback = null;
        self.dropObject = null;
        /**
         * Adds a marker to the globe.
         */
        self.addMarker = function () {
            self.dropIsArmed(true);
            self.dropCallback = markersViewModel.dropMarkerCallback;
            self.dropObject = self.selectedMarkerImage();
        };
        self.selectedMarkerImage.subscribe(self.addMarker);
        /**
         * @param {Object} event 
         */
        self.handleClick = function (event) {
            if (!self.dropIsArmed()) {
                return;
            }
            var type = event.type,
                x, y,
                pickList,
                terrain;
            // Get the clicked window coords
            switch (type) {
                case 'click':
                    x = event.clientX;
                    y = event.clientY;
                    break;
                case 'touchend':
                    if (!event.changedTouches[0]) {
                        return;
                    }
                    x = event.changedTouches[0].clientX;
                    y = event.changedTouches[0].clientY;
                    break;
            }
            if (self.dropCallback) {
                // Get all the picked items 
                pickList = wwd.pickTerrain(wwd.canvasCoordinates(x, y));
                // Terrain should be one of the items if the globe was clicked
                terrain = pickList.terrainObject();
                if (terrain) {
                    self.dropCallback(terrain.position, self.dropObject);
                }
            }
            self.dropIsArmed(false);
            event.stopImmediatePropagation();
        };

        // Assign the click handler to the WorldWind
        wwd.addEventListener('click', function (event) {
            self.handleClick(event);
        });
    }
    function LayersViewModel(wwd) {
        var self = this;
        var usgsTopoCfg = {
            title: "USGS Topo Basemap",
            version: "1.3.0",
            service: "https://basemap.nationalmap.gov/arcgis/services/USGSTopo/MapServer/WmsServer?",
            layerNames: "0",
            sector: new WorldWind.Sector(-89.0, 89.0, -180, 180),
            levelZeroDelta: new WorldWind.Location(36, 36),
            numLevels: 13,
            format: "image/png",
            size: 256,
            coordinateSystem: "EPSG:4326", 
            styleNames: "" 
        },
            usgsImageryTopoCfg = {
                title: "USGS Imagery Topo Basemap",
                version: "1.3.0",
                service: "https://basemap.nationalmap.gov/arcgis/services/USGSImageryTopo/MapServer/WmsServer?",
                layerNames: "0",
                sector: new WorldWind.Sector(-89.0, 89.0, -180, 180),
                levelZeroDelta: new WorldWind.Location(36, 36),
                numLevels: 12,
                format: "image/png",
                size: 256,
                coordinateSystem: "EPSG:4326",
                styleNames: "" 
            },
            usgsContoursCfg = {
                title: "USGS Contour Lines Overlay",
                version: "1.3.0",
                service: "https://services.nationalmap.gov/arcgis/services/Contours/MapServer/WmsServer?",
                layerNames: "10,11,12,14,15,16,18,19",
                sector: new WorldWind.Sector(18.915561901, 64.8750000000001, -160.544024274, -66.9502505149999),
                levelZeroDelta: new WorldWind.Location(36, 36),
                numLevels: 19,
                format: "image/png",
                size: 256,
                coordinateSystem: "EPSG:4326", 
                styleNames: ""
            };
        var layer,
            layerCfg = [{
                    layer: new WorldWind.BMNGLayer(),
                    enabled: true
                }, {
                    layer: new WorldWind.BMNGLandsatLayer(),
                    enabled: true
                }, {
                    layer: new WorldWind.WmsLayer(usgsImageryTopoCfg),
                    enabled: false,
                    detailControl: 2.0,
                    disableTransparentColor: true
                }, {
                    layer: new WorldWind.WmsLayer(usgsTopoCfg),
                    enabled: false,
                    disableTransparentColor: true 
                }, {
                    layer: new WorldWind.BingAerialLayer(),
                    enabled: false
                }, {
                    layer: new WorldWind.BingAerialWithLabelsLayer(),
                    enabled: true
                }, {
                    layer: new WorldWind.BingRoadsLayer(),
                    enabled: false
                }, {
                    layer: new WorldWind.WmsLayer(usgsContoursCfg),
                    enabled: false,
                    opacity: 0.85
                }, {
                    layer: new WorldWind.RenderableLayer("Markers"),
                    enabled: true
                }, {
                    layer: new WorldWind.CompassLayer(),
                    enabled: true
                }, {
                    layer: new WorldWind.CoordinatesDisplayLayer(wwd),
                    enabled: true
                }, {
                    layer: new WorldWind.ViewControlsLayer(wwd),
                    enabled: true,
                    placement: new WorldWind.Offset(
                        WorldWind.OFFSET_FRACTION, 0,
                        WorldWind.OFFSET_FRACTION, 1),
                    alignment: new WorldWind.Offset(
                        WorldWind.OFFSET_PIXELS, -10,
                        WorldWind.OFFSET_INSET_PIXELS, -18)
                }];
        for (var i = 0; i < layerCfg.length; i++) {
            layer = layerCfg[i].layer;
            layer.enabled = layerCfg[i].enabled;
            layer.opacity = layerCfg[i].opacity ? layerCfg[i].opacity : 1.0;
            if (layerCfg[i].placement) {
                layer.placement = layerCfg[i].placement;
            }
            if (layerCfg[i].alignment) {
                layer.alignment = layerCfg[i].alignment;
            }
            if (layerCfg[i].disableTransparentColor) {
                layer.urlBuilder.transparent = false;
            }
            if (layerCfg[i].detailControl) {
                layer.detailControl = layerCfg[i].detailControl;
            }
            layer.layerEnabled = ko.observable(layer.enabled);
            wwd.addLayer(layer);
        }
        self.layers = ko.observableArray(wwd.layers);
        self.toggleLayer = function (layer) {
            layer.enabled = !layer.enabled;
            layer.layerEnabled(layer.enabled); 
            wwd.redraw();
        };
    }
    function ProjectionsViewModel(wwd) {
        var self = this;
        self.projections = ko.observableArray([
            "3D",
            "Equirectangular",
            "Mercator",
            "North Polar",
            "South Polar",
            "North UPS",
            "South UPS",
            "North Gnomonic",
            "South Gnomonic"
        ]);
        // Projection support vars
        self.roundGlobe = wwd.globe;
        self.flatGlobe = null;
        // Track the current projection
        self.currentProjection = ko.observable('3D');
        // Projection click handler
        self.changeProjection = function (projectionName) {
            // Capture the selection
            self.currentProjection(projectionName);
            // Change the projection
            if (projectionName === "3D") {
                if (!self.roundGlobe) {
                    self.roundGlobe = new WorldWind.Globe(new WorldWind.EarthElevationModel());
                }
                if (wwd.globe !== self.roundGlobe) {
                    wwd.globe = self.roundGlobe;
                }
            } else {
                if (!self.flatGlobe) {
                    self.flatGlobe = new WorldWind.Globe2D();
                }
                if (projectionName === "Equirectangular") {
                    self.flatGlobe.projection = new WorldWind.ProjectionEquirectangular();
                } else if (projectionName === "Mercator") {
                    self.flatGlobe.projection = new WorldWind.ProjectionMercator();
                } else if (projectionName === "North Polar") {
                    self.flatGlobe.projection = new WorldWind.ProjectionPolarEquidistant("North");
                } else if (projectionName === "South Polar") {
                    self.flatGlobe.projection = new WorldWind.ProjectionPolarEquidistant("South");
                } else if (projectionName === "North UPS") {
                    self.flatGlobe.projection = new WorldWind.ProjectionUPS("North");
                } else if (projectionName === "South UPS") {
                    self.flatGlobe.projection = new WorldWind.ProjectionUPS("South");
                } else if (projectionName === "North Gnomonic") {
                    self.flatGlobe.projection = new WorldWind.ProjectionGnomonic("North");
                } else if (projectionName === "South Gnomonic") {
                    self.flatGlobe.projection = new WorldWind.ProjectionGnomonic("South");
                }
                if (wwd.globe !== self.flatGlobe) {
                    wwd.globe = self.flatGlobe;
                }
            }
            wwd.redraw();
        };
    }
    // ---------------------------------------
    // Define the view model for the SearchBox
    // ---------------------------------------
    function SearchViewModel(wwd) {
        var self = this;
        self.geocoder = new WorldWind.NominatimGeocoder();
        self.goToAnimator = new WorldWind.GoToAnimator(wwd);
        self.searchText = ko.observable('');
        self.onEnter = function (data, event) {
            if (event.keyCode === 13) {
                self.performSearch();
            }
            return true;
        };
        self.performSearch = function () {
            var queryString = self.searchText();
            if (queryString) {
                var latitude, longitude;
                if (queryString.match(WorldWind.WWUtil.latLonRegex)) {
                    var tokens = queryString.split(",");
                    latitude = parseFloat(tokens[0]);
                    longitude = parseFloat(tokens[1]);
                    self.goToAnimator.goTo(new WorldWind.Location(latitude, longitude));
                } else {
                    self.geocoder.lookup(queryString, function (geocoder, result) {
                        if (result.length > 0) {
                            latitude = parseFloat(result[0].lat);
                            longitude = parseFloat(result[0].lon);
                            self.goToAnimator.goTo(new WorldWind.Location(latitude, longitude));
                        }
                    });
                }
            }
        };
    }
    // -------------------------------------
    // Define a view model for the markers
    // -------------------------------------
    function MarkersViewModel(wwd) {
        var self = this;

        self.markers = ko.observableArray();

        // Set up the common placemark attributes.
        self.commonAttributes = new WorldWind.PlacemarkAttributes(null);
        self.commonAttributes.imageScale = 1;
        self.commonAttributes.imageOffset = new WorldWind.Offset(
            WorldWind.OFFSET_FRACTION, 0.3,
            WorldWind.OFFSET_FRACTION, 0.0);
        self.commonAttributes.imageColor = WorldWind.Color.WHITE;
        self.commonAttributes.labelAttributes.offset = new WorldWind.Offset(
            WorldWind.OFFSET_FRACTION, 0.5,
            WorldWind.OFFSET_FRACTION, 1.0);
        self.commonAttributes.labelAttributes.color = WorldWind.Color.YELLOW;
        self.commonAttributes.drawLeaderLine = true;
        self.commonAttributes.leaderLineAttributes.outlineColor = WorldWind.Color.RED;

        /**
         * "Drop" action callback creates and adds a marker (WorldWind.Placemark) to the globe. 
         * 
         * @param {WorldWind.Location} position
         * @param {type} imageSource
         */
        self.dropMarkerCallback = function (position, imageSource) {
            var attributes = new WorldWind.PlacemarkAttributes(self.commonAttributes),
                placemark = new WorldWind.Placemark(position, /*eyeDistanceScaling*/true, attributes),
                markerLayer = findLayerByName(MARKERS);

            // Set the placemark properties and  attributes
            placemark.label = "Lat " + position.latitude.toPrecision(4).toString() + "\n" + "Lon " + position.longitude.toPrecision(5).toString();
            placemark.altitudeMode = WorldWind.CLAMP_TO_GROUND;
            placemark.eyeDistanceScalingThreshold = 2500000;
            attributes.imageSource = imageSource;
            markerLayer.addRenderable(placemark);
            self.markers.push(placemark);
        };
        self.goToAnimator = new WorldWind.GoToAnimator(wwd);
        /** 
         * "Goto" function centers the globe on the given marker.
         * @param {WorldWind.Placemark} marker
         */
        self.gotoMarker = function (marker) {
            self.goToAnimator.goTo(new WorldWind.Location(
                marker.position.latitude,
                marker.position.longitude));
        };
        /** 
         * "Edit" function invokes a modal dialog to edit the marker attributes.
         * @param {WorldWind.Placemark} marker 
         */
        self.editMarker = function (marker) {
        };

        /** 
         * "Remove" function removes a marker from the globe.
         * @param {WorldWind.Placemark} marker 
         */
        self.removeMarker = function (marker) {
            var markerLayer = findLayerByName(MARKERS),
                i, max, placemark;
            for (i = 0, max = self.markers().length; i < max; i++) {
                placemark = markerLayer.renderables[i];
                if (placemark === marker) {
                    markerLayer.renderables.splice(i, 1);
                    self.markers.remove(marker);
                    break;
                }
            }
        };

    }
    markersViewModel = new MarkersViewModel(wwd);
    globeViewModel = new GlobeViewModel(wwd, markersViewModel);
    ko.applyBindings(new LayersViewModel(wwd), document.getElementById('layers'));
    ko.applyBindings(new ProjectionsViewModel(wwd), document.getElementById('projections'));
    ko.applyBindings(new SearchViewModel(wwd), document.getElementById('search'));
    ko.applyBindings(markersViewModel, document.getElementById('markers'));
    ko.applyBindings(globeViewModel, document.getElementById('globe'));

});