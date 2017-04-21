var App = App || {};

var layer;
var drawnItems;
var mask;

App.initializeViewer = function() {
  if ( App.viewer !== undefined ) { return ; }
  App.viewer = L.map(App.$scan.find(".panels--scan--viewer").get(0), {
    center: [0,0],
    crs: L.CRS.Simple,
    zoom: 0,
    scrollWheelZoom: false,
    attributionControl: false,
    touchZoom: true,
    contextmenu: false //,
  });

  // L.easyButton('<i class="fa fa-comments"></i>', function() {
  //   App.$scan.toggleClass('annotations-visible');
  //   console.log("AHOY", this);
  // }).addTo(App.viewer);

  L.easyButton({
    states: [{
      stateName: 'annotations-hidden',
      icon: 'icon-comments',
      title: 'show annotations',
      onClick: function(btn, map) {
        btn.state('annotations-visible');
        App.$scan.addClass("annotations-visible");
      }
    },
    {
      stateName: 'annotations-visible',
      icon: 'icon-comments',
      title: 'hide annotations',
      onClick: function(btn, map) {
        btn.state('annotations-hidden');
        App.$scan.removeClass("annotations-visible");
      }      
    }]
  }).addTo(App.viewer);


  setTimeout(function() {
    // why won't this fire? maybe now??
    var $zoom = $(".leaflet-control-zoom.leaflet-bar.leaflet-control");
    $('<div class="leaflet-control leaflet-bar"><a class="action-page action-page-home" data-target="home" role="button" aria-label="Go Home" title="Go Home"></a></div>').insertBefore($zoom);
    // $('<div class="leaflet-control leaflet-bar"><a class="action-toggle-annotations"><i class="fa fa-comments"></i></a></div>').insertAfter($zoom);
  }, 0);

  App.$text.on("mouseenter mouseleave", "span[id]", function(e) {
    var $this = $(this);
    var base_id = $this.data('base_id');
    var $region = $("#region" + base_id);
    if ( e.type == 'mouseenter' || e.type == 'focusin' ) {
      $region.addClass('focused');
    } else {
      // hide_annotation($this);
      $region.removeClass('focused');
    }
  })

  App.$scan.on("mouseenter mouseleave focusin focusout", "path.highlight", function(e) {
    var $this = $(this);
    var base_id = $this.data('base_id');
    var $text = $("#text" + base_id);
    if ( e.type == 'mouseenter' || e.type == 'focusin' ) {
      var content = $this.data('content');
      var index = $this.data('index');
      $text.addClass("focused");
      if ( App.$info == App.$text ) {
        App.$annotation.removeClass('invisible');
        App.$annotation.find(".translation-text").html('<span class="line-number">LINE: ' + index + '</span>' + content);
      }
    } else {
      $text.removeClass('focused');
      App.$annotation.addClass('invisible');
    }
  })

  App.$annotation = $("#annotation");
};

App.resetViewer = function() {
  if ( layer ) {
    App.viewer.removeLayer(layer);
    // App.$footnotes.empty();
  }
  if ( drawnItems ) {
    App.viewer.removeLayer(drawnItems);
  }
  if ( mask ) {
    App.viewer.removeLayer(mask);
  }
  layer = mask = drawnItems = undefined;
  // need to scroll back to the top
  $("html,body").scrollTop(0);
  App.$text.empty();
};

App.loadScanData = function(identifier) {
  App.initializeViewer();
  App.resetViewer();
  if ( identifier === undefined ) { identifier = App.identifier; }

  console.log("AHOY LOADING", identifier);

  var viewer = App.viewer;
  var service_url = App.info[identifier]['service']['@id'];
  var bounds;
  if ( App.info[identifier]['service']['profile'] == 'http://iiif.io/api/image/2/level0.json' ) {
    viewer.setMaxZoom(3); viewer.setMinZoom(1);
    var w = App.info[identifier]['width'];
    var h = App.info[identifier]['height'];
    var sw = viewer.unproject([0, h], viewer.getMaxZoom() - 1);
    var ne = viewer.unproject([w, 0], viewer.getMaxZoom() - 1);
    bounds = new L.LatLngBounds(sw, ne);
    layer = L.imageOverlay(service_url, bounds);
  } else {
    viewer.setMaxZoom(Infinity); viewer.setMinZoom(0);
    layer = L.tileLayer.iiif(service_url + '/info.json');
    layer.on('load', function(e) { e.target.off('load'); App.loadMask(identifier); App.loadTranslationOverlay(identifier); });
  }
  layer.addTo(viewer);
  if ( bounds ) { viewer.setMaxBounds(bounds); viewer.fitBounds(bounds);  }
  else { 
    // viewer.setMaxBounds(null); 
  }

  drawnItems = new L.FeatureGroup();
  // viewer.addLayer(drawnItems);
};

App.loadMask = function(identifier) {
  var viewer = App.viewer;
  var w = App.info[identifier]['width'];
  var h = App.info[identifier]['height'];
  var w2 = w * 0.0955;
  var nw = viewer.unproject([0, h], viewer.getMaxZoom() - 1);
  var se = viewer.unproject([w2, 0], viewer.getMaxZoom() - 1);
  mask = L.rectangle([ nw, se ], { color: '#ddd', fillOpacity: 0.8, weight: 1}).addTo(viewer);
};

App.loadTranslationOverlay = function(identifier) {

  var data_href = App.info[identifier]['annotations']['@id'];
  data_href = data_href.replace('https://preview.quod.lib.umich.edu', location.protocol + "//" + location.host);

  var maxZoom = layer.maxZoom;
  App.content_map = {};

  $.getJSON(data_href, {_: new Date().getTime()}, function(annoData) {

    var width = annoData.width;
    var height = annoData.height;

    // var dimensions = viewer.source.dimensions;
    // var scale = 1 / dimensions.x;
    // var placement = OpenSeadragon.OverlayPlacement.BOTTOM;

    var defaultRectOptions = function() {
      return { weight: 1.0, color: '#666', fillColor: '#eeeeee' };
    }

    App.viewer.addLayer(drawnItems);

    for(index in annoData.regions) {
      var value = annoData.regions[index].slice(0);

      var m;
      var content = value.pop();
      var plain_content = content.replace(/\{\d+\}/g, '');

      var markers = content.match(/\{\d+\}/g);
      $.each(markers, function(mii, marker) {
        var marker_idx = marker.replace(/\{(\d+)\}/, '$1');
        // content = content.replace(marker, '<a href="#note' + marker_idx + '" class="footnote--link"><i class="fa fa-info-circle"></i></a>');
        content = content.replace(marker, '<sup id="fnref:' + marker_idx + '"><a href="#fn:' + marker_idx + '" rel="footnote">' + marker_idx + '</a></sup>');
      })

      if ( value[0] == 'polygon' ) {
        value.shift();
        var latlngs = [];
        $.each(value, function(ii, xy) {
          latlngs.push(App.viewer.options.crs.pointToLatLng(xy, maxZoom));
        })
        m = L.polygon(latlngs, defaultRectOptions());
      } else {
        var x = value[0];
        var y = value[1];
        var w = value[2];
        var h = value[3];
        var minPoint = L.point(x, y);
        var maxPoint = L.point(x + w, y + h);
        var min = App.viewer.unproject(minPoint, maxZoom);
        var max = App.viewer.unproject(maxPoint, maxZoom);

        m = L.rectangle(L.latLngBounds(min, max), defaultRectOptions());                                    
      }

      // m.bindTooltip(content, { permanent: false, direction: 'top' }).addTo(viewer);
      drawnItems.addLayer(m);

      $(m._path).attr("id", "region" + m._leaflet_id);
      $(m._path).attr("aria-labelledby", "text" + m._leaflet_id);
      $(m._path).data('base_id', m._leaflet_id);
      $(m._path).data("content", plain_content);
      $(m._path).data('index', parseInt(index, 10) + 1);
      $(m._path).addClass("highlight");
      App.content_map[m._leaflet_id] = content;

    };

    App.$text.empty();

    if ( annoData.regions.length > 0 ) {
      $.each(App.content_map, function(m_id, content) {
        var $span = $("<span>" + content + "</span>").appendTo(App.$text);
        // $span.appendTo($lines);
        $span.attr("id", "text" + m_id);
        $span.data('base_id', m_id);
      })
      App.reflowText();
    } else {
      App.$text.html(annoData.lines.join("<br />\n"));
    }

    App.footnotes_data = {};
    if ( $(".footnotes").size() ) {
      $(".footnotes").remove();
    }
    var $div = $('<div class="footnotes"><ol></ol></div>').appendTo(App.$metadata.find(".panels--inner"));
    var $ol = $div.find('ol');
    $.each(annoData.footnote, function(key, value) {
      App.footnotes_data[key] = value;
      var $li = $('<li class="footnote"><p>' + value + ' <a href="#fnref:' + key + '" title="return" ↩</a></p></li>').appendTo($ol);
      $li.attr('id', "fn:" + key);
    })

    $.bigfoot({ 
      positionContent: true,
      buttonMarkup: '<div class="bigfoot-footnote__container"><button href="#" class="bigfoot-footnote__button" rel="footnote" id="{{SUP:data-footnote-backlink-ref}}" data-footnote-number="{{FOOTNOTENUM}}" data-footnote-identifier="{{FOOTNOTEID}}" alt="See Footnote {{FOOTNOTENUM}}" data-bigfoot-footnote="{{FOOTNOTECONTENT}}">{{FOOTNOTENUM}}</button></div>'
    } );

  })
}

App.reflowText = function() {
  if ( App.$info == App.$text && App.$text.is(".tweaked")) {
    // remove 
    App.$text.find("span").css('font-size', '');
    App.$text.removeClass('tweaked');
    return;
  }

  var $span = App.$text.find("span");
  $span.css('font-size', '');
  while ( App.$text.outerHeight() > $(window).height() ) {
    var px = parseFloat($span.slice(0,1).css('font-size'));
    px -= 0.2;
    $span.css('font-size', px + 'px');
  }

}
