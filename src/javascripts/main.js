var dlxs = dlxs || {};
dlxs.App = function(options) {
  var self = this;
  this.identifiers = [];
  this.identifier = null;
  this.info = {};
  this.default_title = document.title;
  this.dingbat = "&#10020;"; // heavy four balloon-spoked asterisk (U+2724)


  this.routes = { home: true, help: true, viewer: true };

  $.extend(this, options);
  this.$scan.height($(window).height() * 1.0);

  $("body").on("app:pagechange", function(e, args) {
    // console.log("AHOY PAGE CHANGE", args);
    self.updateDocumentTitle(args)
  })
}

dlxs.App.prototype.loadScan = function(identifier) {
  if ( identifier === undefined ) { identifier = this.identifier; }
  this.loadScanData(identifier);
  this.current_index = this.identifiers.indexOf(identifier) + 1;
  this.identifier = identifier;
  // this.updateDocumentTitle('viewer', identifier);
};

dlxs.App.prototype.fixScanInPlace = function() {
  if ( ! this.$scan.data('stickyKit') ) {
    this.$scan.stick_in_parent({ parent : this.$stickable, offset_top : 0, inner_scrolling: false })
      .on('sticky_kit:stick', function(e) {
      })
      .on('sticky_kit:unstick', function(e) {
      })
  }
  $(document.body).trigger("sticky_kit:recalc");
};

dlxs.App.prototype.resizeViewer = function() {
  this.$scan.height($(window).height() * 1.0);
  this.reflowText();
  if ( $(window).width() <= 800 ) {
    // our breakpoint1
    this.$scan.trigger('sticky_kit:detach');
    this.$info = this.$text;
  } else {
    this.$info = this.$metadata;
    this.fixScanInPlace();
  }
}

dlxs.App.prototype.showPage = function(page) {

  // this.$pages.addClass("hidden");

  // if ( ! page ) { page = 'home'; }
  // var target = page;
  // if ( target == 'viewer' ) { page = app.identifiers[0]; }
  // else if ( ! this.routes[page] ) { target = 'viewer'; }


  // this.$pages.filter(".pages--" + target).removeClass("hidden");

  // if ( page != 'help' ) {
  //   this.$pages.filter(".pages--help").find(".action-page").data('target', page);
  // }

  if ( page == 'start' ) { page = app.identifiers[0]; }

  if ( ! this.routes[page] ) {
    this.loadScan(page);
    return;
  }

  $("body").trigger("app:pagechange", [ { page: page } ]);
}

dlxs.App.prototype.updateDocumentTitle = function(args) {
  var title = this.default_title;
  var pathname = location.pathname;
  if ( args.title ) {
    title += ": " + args.title;
  }
  if ( args.page != 'home' ) {
    pathname += "?" + args.page;
  }
  document.title = title;
  this.$pages.filter(":visible").find("h1[aria-live]").text(title);

  history.pushState({page: args.page, title: title}, title, pathname);
};

dlxs.App.prototype.gotoPageByDelta = function(delta) {
  var index = this.current_index + delta - 1;
  if ( index < 0 ) { index = this.identifiers.length - 1; }
  if ( index >= this.identifiers.length  ) { index = 0; }
  var identifier = this.identifiers[index];
  this.loadScan(identifier);
}

dlxs.App.prototype.initializeViewer = function(data) {
  var self = this;
  $.each(data["sequences"], function() {
    $.each(this['canvases'], function() {
      var service = this['images'][0]['resource']['service'];
      if ( service['profile'] == "http://iiif.io/api/image/2/level0.json" ) {
        return;
      }
      var annotations = this['seeAlso'] ? this['seeAlso'][0] : null;
      var metadata = this['metadata'] ? this['metadata'] : [];
      var identifier = service['@id'].split('/').pop();
      self.identifiers.push(identifier);
      self.info[identifier] = this['images'][0]['resource'];
      self.info[identifier]['label'] = this['label'];
      self.info[identifier]['metadata'] = metadata;
      self.info[identifier]['annotations'] = annotations;
    });
  });
  self.showPage(location.search.substr(1));
};

dlxs.App.prototype.initializeScanViewer = function() {
  var self = this;
  if ( this.viewer !== undefined ) { return ; }

  this.viewer = L.map(this.$scan.find(".panels--scan--viewer").get(0), {
    center: [0,0],
    crs: L.CRS.Simple,
    zoom: 0,
    scrollWheelZoom: false,
    attributionControl: false,
    touchZoom: true,
    contextmenu: false //,
  });

  L.easyButton({
    states: [{
      stateName: 'annotations-hidden',
      icon: 'icon-comments',
      title: 'show annotations',
      onClick: function(btn, map) {
        btn.state('annotations-visible');
        self.$scan.addClass("annotations-visible");
      }
    },
    {
      stateName: 'annotations-visible',
      icon: 'icon-comments',
      title: 'hide annotations',
      onClick: function(btn, map) {
        btn.state('annotations-hidden');
        self.$scan.removeClass("annotations-visible");
      }      
    }]
  }).addTo(self.viewer);


  setTimeout(function() {
    var $zoom = $(".leaflet-control-zoom.leaflet-bar.leaflet-control");
    $('<div class="leaflet-control leaflet-bar"><a href="?" class="action-page action-page-home" data-target="home" role="button" aria-label="Go Home" title="Go Home"></a><a href="?help" class="action-page action-page-help" data-target="help" role="button" aria-label="Help" title="Help"></a></div>').insertBefore($zoom);
  }, 0);

  self.$text.on("mouseenter mouseleave", "span[id]", function(e) {
    var $this = $(this);
    var index = $this.data('index');
    var $region = $("#region" + index);
    if ( e.type == 'mouseenter' || e.type == 'focusin' ) {
      $region.addClass('focused');
    } else {
      // hide_annotation($this);
      $region.removeClass('focused');
    }
  })

  self.$scan.on("mouseenter mouseleave focusin focusout", "path.highlight", function(e) {
    var $this = $(this);
    var index = $this.data('index');
    var line = $this.data('line');
    var $text = $("#text" + index);
    if ( e.type == 'mouseenter' || e.type == 'focusin' ) {
      var content = self.plainData[index];
      $text.addClass("focused");

      if ( false || self.$info == self.$text ) {
        self.$annotation.removeClass('invisible');
        self.$annotation.find(".translation-text").html('<span class="line-number">LINE: ' + line + '</span>' + content);
      } else if ( ! $text.isOnScreen() ) {
          // self.$text.scrollTop(self.$text.scrollTop() +  $text.position().top - 20);
          var delta = ( $text.position().top + $text.height() ) - $(window).height() + 20; //  - $(window).scrollTop();
          // console.log("SCROLLING:", delta, $text.position().top + $text.height(), $(window).height(), $(window).scrollTop());
          $(window).scrollTop(delta);
      }
    } else {
      $text.removeClass('focused');
      self.$annotation.addClass('invisible');
    }
  })
};

dlxs.App.prototype.resetViewer = function() {
  if ( this.layer ) {
    this.viewer.removeLayer(this.layer);
  }
  if ( this.drawnItems ) {
    this.viewer.removeLayer(this.drawnItems);
  }
  if ( this.mask ) {
    this.viewer.removeLayer(this.mask);
  }
  this.layer = this.mask = this.drawnItems = undefined;
  // need to scroll back to the top
  $("html,body").scrollTop(0);
  this.$text.empty();
};

dlxs.App.prototype.loadScanData = function(identifier) {
  var self = this;

  this.initializeScanViewer();
  this.resetViewer();
  if ( identifier === undefined ) { identifier = this.identifier; }

  var viewer = this.viewer;
  var info = this.info[identifier];
  var service_url = info['service']['@id'];
  var bounds;
  if ( info['service']['profile'] == 'http://iiif.io/api/image/2/level0.json' ) {
    viewer.setMaxZoom(3); viewer.setMinZoom(1);
    var w = info['width'];
    var h = into['height'];
    var sw = viewer.unproject([0, h], viewer.getMaxZoom() - 1);
    var ne = viewer.unproject([w, 0], viewer.getMaxZoom() - 1);
    bounds = new L.LatLngBounds(sw, ne);
    service_url = service_url.replace('https://quod.lib.umich.edu', location.protocol + "//" + location.host);
    this.layer = L.imageOverlay(service_url, bounds);
  } else {
    self.height = info['height'];
    self.width = info['width'];
    viewer.setMaxZoom(Infinity); viewer.setMinZoom(0);
    this.layer = L.tileLayer.iiif(service_url + '/info.json', { bestFit: true });
    this.layer.on('load', function(e) { 
      e.target.off('load'); 
      self.loadMask(identifier); 
      self.loadTranslationOverlay(identifier);
      self.loadMetadata(identifier);
      $("body").trigger("app:pagechange", [ { page: identifier, title: info['label'] } ]);
    });
  }
  this.layer.addTo(viewer);
  if ( bounds ) { viewer.setMaxBounds(bounds); viewer.fitBounds(bounds);  }
  else { 
    // viewer.setMaxBounds(null); 
  }

  this.drawnItems = new L.FeatureGroup();
};

dlxs.App.prototype.loadMask = function(identifier) {
  var viewer = this.viewer;
  var w = this.info[identifier]['width'];
  var h = this.info[identifier]['height'];
  var w2 = w * 0.0955;
  var nw = viewer.unproject([0, h], viewer.getMaxZoom() - 1);
  var se = viewer.unproject([w2, 0], viewer.getMaxZoom() - 1);
  this.mask = L.rectangle([ nw, se ], { color: '#ddd', fillOpacity: 0.8, weight: 1}).addTo(this.viewer);
  $(this.mask._path).attr('aria-hidden', 'true');
};

dlxs.App.prototype.loadMetadata = function(identifier) {
  var self = this;
  var metadata = this.info[identifier]['metadata'];
  this.$inner = this.$metadata.find(".panels--inner");
  this.$inner.find(".metadata").remove();
  $('<h3 class="metadata">About this page</h3>').appendTo(this.$inner);
  var $div = $('<dl class="metadata"></dl>').appendTo(this.$inner);
  $.each(metadata, function(index, data) {
    $("<dt>" + data.label + "</dt>").appendTo($div);
    $.each(data.value, function(vidx, value) {
      $("<dd>" + value + "</dd>").appendTo($div);
    })
  })
}

dlxs.App.prototype.loadTranslationOverlay = function(identifier) {

  var self = this;

  self.annoData = {};
  self.linkedData = {};
  self.plainData = {};
  self.footnotesData = {};
  self.footnotesIndex = 0;

  var viewer = self.viewer;
  var drawnItems = self.drawnItems;

  // var data_href = this.info[identifier]['annotations']['@identifier'];
  // data_href = data_href.replace('https://quod.lib.umich.edu', location.protocol + "//" + location.host);
  var data_href = location.protocol + "//" + location.host + location.pathname;

  var maxZoom = this.layer.maxZoom;

  $.getJSON(data_href, { identifier: identifier, action: 'annotation', _: new Date().getTime()}, function(annoData) {

    var width = self.width;
    var height = self.height;

    self.original_translation = annoData.original_translation;

    var defaultRectOptions = function() {
      return { weight: 1.0, color: '#666', fillColor: '#eeeeee' };
    }

    self.viewer.addLayer(self.drawnItems);

    for(index in annoData.annotations) {

      var value = annoData.annotations[index].slice(0);
      
      var m;
      var content = value.pop();
      // var plain_content = content.replace(/\{\d+\}/g, '');

      var index_ = self._generateId();

      self._processText(index_, content);

      if ( value[0] == 'polygon' ) {
        value.shift();
        var latlngs = [];
        $.each(value, function(ii, xy) {
          latlngs.push(viewer.options.crs.pointToLatLng(xy, maxZoom));
        })
        m = L.polygon(latlngs, defaultRectOptions());
      } else {
        var x = value[0];
        var y = value[1];
        var w = value[2];
        var h = value[3];
        var minPoint = L.point(x, y);
        var maxPoint = L.point(x + w, y + h);
        var min = viewer.unproject(minPoint, maxZoom);
        var max = viewer.unproject(maxPoint, maxZoom);

        m = L.rectangle(L.latLngBounds(min, max), defaultRectOptions());                    
      }

      drawnItems.addLayer(m);

      // var index_ = parseInt(index, 10) + 1;
      $(m._path).attr("id", "region" + index_);
      $(m._path).attr("aria-labelledby", "text" + index_);
      // $(m._path).data("content", plain_content);
      $(m._path).data('index', index_);
      $(m._path).data('line', index + 1);
      $(m._path).addClass("highlight");

    }

    if ( annoData.annotations.length == 0 ) {
      // no annotations were made
      for(index in self.original_translation) {
        var content = self.original_translation[index];
        self._processText(index, content);
      }
    }

    self.drawAnnotations();

  })
}

dlxs.App.prototype._generateId = function() {
  var date = new Date();
  return md5([ date.getTime(), Math.random(date.getTime()) ].join("."));
};

dlxs.App.prototype._defaultRectOptions = function() {
  return { clickable: true, color: randomColor({luminosity: 'bright',format:'hex'}),opacity: 0.75,weight:4,fillColor: '#eeeeee'};
};

dlxs.App.prototype._processText = function(index, content) {
  var self = this;

  if ( ! content ) { return ; }

  content = content.replace(/</g, '&lt;');

  var footnotesData = {};
  var plain_content = linked_content = content;
  var footnotes = content.match(/\{[^}]+\}/g);

  $.each(footnotes, function(mii, footnote) {
    var fid = self._generateId();
    footnotesData[fid] = footnote.substr(1, footnote.length - 2);
    linked_content = linked_content.replace(footnote, '<sup id="fnref:' + fid + '"><a href="#fn:' + fid + '" rel="footnote">' + self.dingbat + '</a></sup>');
    plain_content = plain_content.replace(footnote, '');
  })

  self.annoData[index] = content;
  self.linkedData[index] = linked_content;
  self.plainData[index] = plain_content;

  if ( ! $.isEmptyObject(footnotesData) ) {
    self.footnotesData[index] = footnotesData;
  }
}

dlxs.App.prototype.getSortedDrawnLayers = function() {
  var self = this;

  // sort the drawnItems by position; the "top" of the map is 0
  // need to do a descending sort to be correct
  var layers = self.drawnItems.getLayers();
  layers.sort(function(a, b) {
    var a_top = a.getBounds().getNorth();
    var b_top = b.getBounds().getNorth();
    return b_top - a_top;
  })
  return layers;
};

dlxs.App.prototype.getSortedIndexes = function() {
  var self = this;
  var results = [];
  var layers = self.getSortedDrawnLayers();
  if ( layers.length > 0 ) {
    for(var i in layers) {
      results.push($(layers[i]._path).data('index'));
    }
  } else {
    for(var i in self.original_translation) {
      results.push(i);
    }
  }
  return results;
};

dlxs.App.prototype.drawAnnotations = function() {
  var self = this;
  self.$text.empty();

  // var layers = self.getSortedDrawnLayers();
  var indexes = self.getSortedIndexes();
  var hasLayers = self.drawnItems.getLayers().length > 0;
  for(var i in indexes) {
    var index = indexes[i];
    var content = self.linkedData[index];
    // var $span = $("<span>" + content + "</span>").appendTo(self.$text);
    var $span = $("<span></span>").appendTo(self.$text);
    $span.html(content);
    if ( hasLayers ) {
     $span.attr("id", "text" + index);
     $span.data('index', index); 
    }
  }

  self.drawFootnotes();
};

dlxs.App.prototype.drawFootnotes = function() {
  var self = this;

  if ( $(".footnotes").size() ) {
    $(".footnotes").remove();
  }

  $('<h3 class="footnotes">Footnotes</h3>').appendTo(self.$inner);
  var $footnotes = $('<div class="footnotes"><ol></ol></div>').appendTo(self.$metadata.find(".panels--inner"));
  $footnotes = $footnotes.find('ol');

  var indexes = self.getSortedIndexes();
  for(var i in indexes) {
    var index = indexes[i];
    var footnote_indexes = self.footnotesData[index];
    if ( ! footnote_indexes ) { continue; }
    for(var fid in footnote_indexes) {
      var content = self.footnotesData[index][fid];
      var $li = $('<li class="footnote"><p><a href="#fnref:' + fid + '" title="return">↩</a> ' + content + '</p></li>').appendTo($footnotes);
      $li.attr("id", "fn:" + fid);
    }
  }
  
  $.bigfoot({ 
    positionContent: true,
    activateCallback: function() { self.in_footnote = true; },
    actionOriginalFN: 'hide',
    buttonMarkup: '<div class="bigfoot-footnote__container"><button href="#" class="bigfoot-footnote__button" rel="footnote" id="{{SUP:data-footnote-backlink-ref}}" data-footnote-number="{{FOOTNOTENUM}}" data-footnote-identifier="{{FOOTNOTEID}}" alt="See Footnote {{FOOTNOTENUM}}" data-bigfoot-footnote="{{FOOTNOTECONTENT}}">{{FOOTNOTENUM}}</button></div>'
    // buttonMarkup: '<div class="bigfoot-footnote__container"><button href="#" class="bigfoot-footnote__button" rel="footnote" id="{{SUP:data-footnote-backlink-ref}}" data-footnote-number="{{FOOTNOTENUM}}" data-footnote-identifier="{{FOOTNOTEID}}" alt="See Footnote {{FOOTNOTENUM}}" data-bigfoot-footnote="{{FOOTNOTECONTENT}}">' + self.dingbat + '</button></div>'
  } );
}

dlxs.App.prototype.reflowText = function() {
  return;
  if ( this.$info == this.$text && this.$text.is(".tweaked")) {
    // remove 
    this.$text.find("span").css('font-size', '');
    this.$text.removeClass('tweaked');
    return;
  }

  var $span = this.$text.find("span");
  $span.css('font-size', '');
  while ( this.$text.outerHeight() > $(window).height() ) {
    var px = parseFloat($span.slice(0,1).css('font-size'));
    px -= 0.2;
    $span.css('font-size', px + 'px');
  }

}


$().ready(function() {

  var app = new dlxs.App({
    $scan: $(".panels--scan"),
    $metadata: $(".panels--metadata"),
    $text: $(".panels--text .panels--inner"),
    $stickable: $("#stickable"),
    $pages: $(".pages"),
    $annotation: $("#annotation")
  })

  window.app = app;

  var resizeTimer;

  $(window).on('resize orientationchange', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() { app.resizeViewer(); }, 100);
  });

  $(window).on('popstate', function(e) {
    // console.log("location: " + document.location + ", state: " + JSON.stringify(event.state));
    app.showPage(event.state.page); //, event.state.target);
  })

  $("#action-reveal-info").on('click', function(e) {
    e.preventDefault();
    // this is slightly complicated
    var top = app.$info.offset().top;
    $("html,body").animate({ scrollTop: top - 100 }, 'fast');
  })

  $("#action-reveal-scan").on('click', function(e) {
    e.preventDefault();
    $("html,body").animate({ scrollTop: 0 }, 'fast');
  })

  // $("body").on('click', '.action-page', function(e) {
  //   e.preventDefault();
  //   var target = $(this).data('target');
  //   app.showPage(target);
  // })

  $("body").on('click', ".action-go-page", function(e) {
    e.preventDefault();
    var delta = parseInt($(this).data('delta'));
    app.gotoPageByDelta(delta);
  })

  $("body").on('click', ".action-page-back", function(e) {
    e.preventDefault();
    app.popPageBack();
  })

  app.resizeViewer();

  var get_data_href = function(leaf, bucket="data") {
    var data_href = location.pathname.split("/")
    while ( data_href[data_href.length - 1] != 'epistles' ) {
      data_href.pop();
    }
    data_href.push(bucket);
    data_href.push(leaf);
    return data_href.join('/');
  }

  $.getJSON(get_data_href("epistles-of-paul-metadata.json", "assets"), function(data) {
    app.initializeViewer(data);
  });

})