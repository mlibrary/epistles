(function(){
var oldBindTooltip = L.Layer.prototype.bindTooltip;
L.Layer.include({
    bindTooltip: function(content, options) {
        var retval = oldBindTooltip.call(this, content, options);
        // L.DomEvent.on(this._path, 'focusin', this._openTooltip, this);
        // L.DomEvent.on(this._path, 'focusout', this.closeTooltip, this);
        return this;
    },

    // @method openTooltip(latlng?: LatLng): this
    // Opens the bound tooltip at the specificed `latlng` or at the default tooltip anchor if no `latlng` is passed.
    openTooltip: function (layer, latlng) {
        if (!(layer instanceof L.Layer)) {
            latlng = layer;
            layer = this;
        }

        if (layer instanceof L.FeatureGroup) {
            for (var id in this._layers) {
                layer = this._layers[id];
                break;
            }
        }

        if (!latlng) {
            latlng = layer.getCenter ? layer.getCenter() : layer.getLatLng();
        }

        if ( latlng instanceof Node ) {
            var rect = latlng.getBoundingClientRect();
            var containerPoint = new L.Point(rect.left, rect.bottom);
            var layerPoint = this._map.containerPointToLayerPoint(containerPoint);
            latlng = this._map.layerPointToLatLng(layerPoint);
        }

        if (this._tooltip && this._map) {

            // set tooltip source to this layer
            this._tooltip._source = layer;

            // update the tooltip (content, layout, ect...)
            this._tooltip.update();

            // open the tooltip on the map
            this._map.openTooltip(this._tooltip, latlng);

            // Tooltip container may not be defined if not permanent and never
            // opened.
            if (this._tooltip.options.interactive && this._tooltip._container) {
                L.DomUtil.addClass(this._tooltip._container, 'leaflet-clickable');
                this.addInteractiveTarget(this._tooltip._container);
            }
        }

        return this;
    },

    EOT: true
});

var _updatePath = L.Polygon.prototype._updatePath;
L.Polygon.include({
    _updatePath: function() {
        _updatePath.call(this);
        if ( ! this.__focusAdded ) {
            this.__focusAdded = true;
            L.DomEvent.on(this._path, 'focusin', this._openTooltip, this);
            L.DomEvent.on(this._path, 'focusout', this.closeTooltip, this);
        }
    }
})
})();