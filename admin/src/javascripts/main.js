var dlxs = dlxs || {};
dlxs.App = function(options) {
  var self = this;
  this.identifiers = [];
  this.identifier = null;
  this.info = {};
  this.dirty = [];
  // this.dingbat = "&#10027;"; // open centre black star (U+272B)
  this.dingbat = "&#10020;"; // heavy four balloon-spoked asterisk (U+2724)
  // this.dingbat = "&#10043;"; // teardrop-spoked asterisk (U+273B)
  // this.dingbat = "&#10055;"; // sparkle (U+2747)
  // this.dingbat = "&#128846;"; // alchemical symbol for caput mortuum (U+1F74E)

  $.extend(this, options);
  console.log("AHOY", this);
}

dlxs.App.prototype.loadScan = function(identifier) {
  if ( identifier === undefined ) { identifier = this.identifier; }
  this.loadScanData(identifier);
  this.current_index = this.identifiers.indexOf(identifier) + 1;
  this.identifier = identifier;
  // this.updateDocumentTitle('viewer', identifier);
};

dlxs.App.prototype.initializeViewer = function(options) {
  var self = this;

  self.identifier = options.identifier;
  self.published_at = options.published_at;
  self.updated_at = options.updated_at;

  self.viewer = L.map(self.$scan.get(0), {
    center: [0,0],
    crs: L.CRS.Simple,
    zoom: 0,
    scrollWheelZoom: false,
    attributionControl: false,
    touchZoom: true,
    contextmenu: false //,
    // contextmenuItems: context_menu_items
  });

  self.drawnItems = new L.FeatureGroup();
  self.viewer.addLayer(self.drawnItems);

  self.layer = L.tileLayer.iiif('https://quod.lib.umich.edu/cgi/i/image/api/image/' + self.identifier + '/info.json', { bestFit: true });
  self.layer.on('load', function(e) { 
    e.target.off('load'); 
    self.width = self.layer.x;
    self.height = self.layer.y;
    self.initializeHighlightOverlay(options.annoData); 
  });
  self.layer.addTo(self.viewer);

  L.easyButton('<i class="fa fa-home fa-1_8x"></i>', function() {
    self.viewer.setZoom(self.viewer.getMinZoom());
  }).addTo(self.viewer);

  self._addDrawControl();
  self._addSaveControl();

  self._initEvents();
  self._toggleObsolete();
};

dlxs.App.prototype.initializeHighlightOverlay = function(annoData) {
  var self = this;

  var viewer = self.viewer;
  var drawnItems = self.drawnItems;

  var maxZoom = self.layer.maxZoom;

  self.annoData = {};
  self.linkedData = {};
  self.footnotesData = {};
  self.footnotesIndex = 0;


  for(index in annoData) {

    var value = annoData[index].slice(0);
    
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
      m = L.polygon(latlngs, self._defaultRectOptions());
    } else {
      var x = value[0];
      var y = value[1];
      var w = value[2];
      var h = value[3];
      var minPoint = L.point(x, y);
      var maxPoint = L.point(x + w, y + h);
      var min = viewer.unproject(minPoint, maxZoom);
      var max = viewer.unproject(maxPoint, maxZoom);

      m = L.rectangle(L.latLngBounds(min, max), self._defaultRectOptions());                    
    }

    drawnItems.addLayer(m);
    m.on('click', function(e) {
      // self.editRegion(this, $(this._path).data('content'));
      self.editAnnotation($(this._path).data('index'));
    })

    // var index_ = parseInt(index, 10) + 1;
    $(m._path).attr("id", "region" + index_);
    $(m._path).attr("aria-labelledby", "text" + index_);
    // $(m._path).data("content", plain_content);
    $(m._path).data('index', index_);
    $(m._path).addClass("highlight");

  }

  self.drawAnnotations();

};

dlxs.App.prototype._defaultRectOptions = function() {
  return { clickable: true, color: randomColor({luminosity: 'bright',format:'hex'}),opacity: 0.75,weight:4,fillColor: '#eeeeee'};
};

dlxs.App.prototype._processText = function(index, content) {
  var self = this;

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

dlxs.App.prototype.drawAnnotations = function() {
  var self = this;
  self.$annotations.empty();

  var layers = self.getSortedDrawnLayers();
  if ( layers.length > 0 ) {
    for(var i in layers) {
      var layer = layers[i];
      var path = layer._path;
      var index = $(path).data('index');
      var content = self.linkedData[index];
      var $span = $("<li><span>" + content + "</span></li>").appendTo(self.$annotations);
      // $span.appendTo($lines);
      $span.attr("id", "text" + index);
      $span.data('index', index);
    }
    self.drawFootnotes();
  }
};

dlxs.App.prototype._generateId = function() {
  var date = new Date();
  return md5([ date.getTime(), Math.random(date.getTime()) ].join("."));
};

dlxs.App.prototype._addDrawControl = function() {
  var self = this;
  var viewer = self.viewer;
  var drawnItems = self.drawnItems;

  // Initialise the draw control and pass it the FeatureGroup of editable layers
  var drawControl = new L.Control.Draw({
    draw: {
      polyline: false,
      circle: false,
      marker: false,
      polygon: {
        shapeOptions: {
          clickable: true,
          color: '#3fc078',
          opacity: 0.75,
          weight: 4,
          fillColor: '#eeeeee'
        }
      },
      rectangle: {
        shapeOptions: {
          clickable: true,
          color: '#3fc078',
          opacity: 0.75,
          weight: 4,
          fillColor: '#eeeeee'
        }
      }
    },
    edit: {
      featureGroup: drawnItems
    }
  });

  viewer.addControl(drawControl);

  L.easyButton('<i class="fa fa-repeat fa-1_8x"></i>', function(btn, map) {
    var tmp = drawnItems.getLayers();
    if ( tmp.length == 0 ) { return; }
    var layer = tmp[tmp.length - 1];
    var new_layer;
    var padding = 1;
    if ( layer instanceof L.Rectangle ) {
      var se = layer.getBounds().getSouthEast();
      var nw = layer.getBounds().getNorthWest();
      var se_px = viewer.options.crs.latLngToPoint(se);
      var nw_px = viewer.options.crs.latLngToPoint(nw);

      var new_nw_px = L.point(nw_px.x, se_px.y + padding);
      var new_se_px = L.point(se_px.x, se_px.y + padding + ( se_px.y - nw_px.y ));

      var new_bounds = L.latLngBounds(
        viewer.options.crs.pointToLatLng(new_nw_px),
        viewer.options.crs.pointToLatLng(new_se_px)
      );
      new_layer = L.rectangle(new_bounds, self._defaultRectOptions());
    } else {
      // polygon
      padding = 0;
      var se = layer.getBounds().getSouthEast();
      var nw = layer.getBounds().getNorthWest();
      var se_px = viewer.options.crs.latLngToPoint(se);
      var nw_px = viewer.options.crs.latLngToPoint(nw);
      var delta = se_px.y - nw_px.y;
      var latlngs = layer.getLatLngs()[0];
      var new_latlngs = [];
      for(var i = 0; i < latlngs.length; i++) {
        var pt = viewer.options.crs.latLngToPoint(latlngs[i]);
        var new_pt = L.point(pt.x, pt.y + padding + delta);
        new_latlngs.push(viewer.options.crs.pointToLatLng(new_pt));
      }
      new_layer = L.polygon([new_latlngs], self._defaultRectOptions());
    }
    drawnItems.addLayer(new_layer);
    var index_ = self._generateId();
    $(new_layer._path).attr("id", "region" + index_);
    $(new_layer._path).data('index', index_);
    $(new_layer._path).addClass("highlight");

    new_layer.on('click', function(e) {
      self.editAnnotation($(this).data('index')); // , $(this._path).data('content'));
    })
    self.editAnnotation(index_, self.getSelectedText());

  }, 'Repeat', 'action-draw-repeat').addTo(viewer);

};

dlxs.App.prototype.editAnnotation = function(index, text) {
  var self = this;

  if ( window.deleting === true ) { return; }
  window.dragging = true;

  text = text || self.annoData[index] || '';
  var $path = $("#region" + index);
  self.$modalForm.find("textarea").val(text);
  self.$modalForm.data('index', index);

  var bounds = $path.get(0).getBoundingClientRect();
  if ( ! self.modal ) {
    var options = {
      minWidth: 600,
      maxWidth: 640,
      repositionOnOpen: false,
      animation: 'slide',
      draggable: 'title',
      closeButton: true,
      audio: '/e/epistles/vendor/jBox/audio/beep1',
      overlay: true,
      content: self.$modalForm,
      adjustPosition: true,
      title: 'Translation?',
      target: $path,
      position: {
        x: bounds.left,
        y: bounds.top
      },
      offset: {
        y: bounds.height
      },
      outside: 'xy',
      confirm: function() {
        window.dragging = false;
        var index = self.$modalForm.data('index');
        var update = self.$modalForm.find("textarea").val();
        update = update.replace(/\s+/g, ' ').replace(/ +/g, ' ');
        self._processText(index, update);
        self.drawAnnotations();
        self._toggleDirty('annotations');
      },
      onOpen: function() {
        console.log("FOCUSED");
        setTimeout(function() {
          self.$modalForm.find('textarea').get(0).focus();
        }, 0);
      }
    };

    self.modal = new jBox('Confirm', options);
  } else {
    self.modal.position({ target: $path, position: { x: bounds.left, y: bounds.top } });
  }
  self.modal.open();
};

dlxs.App.prototype.editRegion = function(layer, text) {
  var self = this;

  if ( window.deleting === true ) { return; }
  window.dragging = true;

  var $target = $(layer);
  self.$modalForm.find("textarea").val(text);

  var path = layer._path;
  var $path = $(path);
  self.$modalForm.data('path', path);

  var bounds = path.getBoundingClientRect();
  console.log("AHOY BOUNDS", bounds);

  if ( ! self.modal ) {
    var options = {
      minWidth: 600,
      maxWidth: 640,
      repositionOnOpen: false,
      animation: 'slide',
      draggable: 'title',
      audio: '/e/epistles/vendor/jBox/audio/beep1',
      overlay: false,
      content: self.$modalForm,
      adjustPosition: true,
      title: 'Translation?',
      target: $path,
      position: {
        x: bounds.left,
        y: bounds.top
      },
      offset: {
        y: bounds.height
      },
      outside: 'xy',
      confirm: function() {f
        window.dragging = false;
        var path = self.$modalForm.data('path');
        console.log("AHOY UPDATING", path, $(path).data('index'));
        var update = self.$modalForm.find("textarea").val();
        update = update.replace(/\s+/g, ' ').replace(/ +/g, ' ');
        // $(path).data('content', update);
        self._processText($(path).data('index'), update);
        // self.annoData[$(path).data('index')] = update;
        self.drawAnnotations();
      }
    };

    self.modal = new jBox('Confirm', options);
  } else {
    self.modal.position({ target: $path, position: { x: bounds.left, y: bounds.top } });
  }
  // options.target = $(layer._path);
  // var bounds = layer._path.getBoundingClientRect();
  // var left = bounds.left + 50;
  // var top = bounds.bottom + 10;
  // if ( top + )
  // options.position = { x: left, y: top };


  self.modal.open();
};

dlxs.App.prototype._addSaveControl = function() {
  var self = this;
  var viewer = self.viewer;
  var drawnItems = self.drawnItems;

  var fn = {};
  fn['annotations'] = function(data) {
    data.annotations = [];
    var layers = self.getSortedDrawnLayers();
    for(idx in layers) {
      var layer = layers[idx];
      var tuple = [];

      if ( layer instanceof L.Rectangle ) {
        var se = layer.getBounds().getSouthEast();
        var nw = layer.getBounds().getNorthWest();
        var se_px = viewer.options.crs.latLngToPoint(se, viewer.getMaxZoom());
        var nw_px = viewer.options.crs.latLngToPoint(nw, viewer.getMaxZoom());
        tuple.push(nw_px.x); // x
        tuple.push(nw_px.y); // y
        tuple.push(se_px.x - nw_px.x); // w
        tuple.push(se_px.y - nw_px.y); // h
      } else {
        // polyline
        tuple.push('polygon');
        var latlngs = layer.getLatLngs()[0];
        $.each(latlngs, function(index, latlng) {
          tuple.push(viewer.options.crs.latLngToPoint(latlng, viewer.getMaxZoom()));
        })
      }

      var index = $(layer._path).data('index');
      tuple.push(self.annoData[index]);
      data.annotations.push(tuple);
    }
  };

  fn['footnotes'] = function(data) {}

  L.easyButton('<i class="fa fa-floppy-o fa-1_8x "></i>', function() {
    var data = {};
    if ( self.dirty.length == 0 ) { 
      alert("Nothing to save.");
      return ; 
    }

    data.action = 'update';

    for(var i in self.dirty) {
      var target = self.dirty[i];
      fn[target](data);
    }

    $.ajax({
      type: 'POST',
      url: location.href,
      data: JSON.stringify(data), 
      success: function(response) { 
        console.log(response); 
        self.updated_at = response.updated_at;
        self._toggleDirty(false); 
        self._toggleObsolete();
      }, 
      contentType: 'application/json',
      dataType: 'json'
    });
  }, 'Save Annotations', 'action-save-annotation').addTo(viewer);

  L.easyButton('<i class="fa fa-rocket fa-1_8x"></i>', function() {
    if ( self.dirty.length ) {
      alert("Please save changes before publishing");
      return;
    }
    $.ajax({
      type: 'POST',
      url: location.href,
      data: JSON.stringify({ action: 'publish' }),
      success: function(response) { 
        console.log(response); 
        self.published_at = response.published_at;
        self._toggleObsolete();
      }, 
      contentType: 'application/json',
      dataType: 'json'
    });

  }, 'Publish Annotation', 'action-publish-annotation').addTo(viewer);

};

dlxs.App.prototype._toggleDirty = function(state) {
  if ( state && this.dirty.indexOf(state) < 0 ) { this.dirty.push(state); }
  else if ( state === false ) { this.dirty = []; }
  $("#action-save-annotation").toggleClass("dirty", state);
};

dlxs.App.prototype._toggleObsolete = function() {
  console.log("AHOY OBSOLETE", ( this.published_at == null || this.updated_at > this.published_at ));
  $("#action-publish-annotation").toggleClass("ready", ( this.published_at == null || this.updated_at > this.published_at ));
};

dlxs.App.prototype._initEvents = function() {
  var self = this;
  self.$annotations.on("mouseenter mouseleave", "li[id]", function(e) {
    var $this = $(this);
    var base_id = $this.data('index');
    var $region = $("#region" + base_id);
    if ( e.type == 'mouseenter' || e.type == 'focusin' ) {
      $region.addClass('focused');
    } else {
      // hide_annotation($this);
      $region.removeClass('focused');
    }
  })

  self.$annotations.on("click", "li[id]", function(e) {
    console.log("AHOY CLICK", e.target.tagName);
    if ( e.target.tagName == 'A' || e.target.tagName == 'BUTTON' ) { return ; }
    // if ( self.in_footnote ) { self.in_footnote = false; return ; }
    if ( $("[rel=footnote].is-active").size() ) { return ; }
    var $this = $(this);
    var index = $this.data('index');
    self.editAnnotation(index);
  })

  self.$footnotes.on("click", "a", function(e) {
    e.preventDefault();
    $(".pulse").removeClass("pulse");
    var target = $(this).attr("href");
    // target is the button
    var $target = $("[id='" + target.substr(1) + "']");
    console.log("AHOY TARGET", target.substr(1), $target);
    var $span = $target.parents("li:first");
    var index = $span.data('index');
    $("#group-annotations").prop('checked', true);
    var $pulsing = $span.add($("#region" + index));
    $pulsing.addClass('pulse');
    setTimeout(function() {
      $pulsing.removeClass('pulse');
    }, 10000);
  })

  self.$scan.on("mouseenter mouseleave focusin focusout", "path.highlight", function(e) {
    var $this = $(this);
    var base_id = $this.data('index');
    var $text = $("#text" + base_id);
    if ( e.type == 'mouseenter' || e.type == 'focusin' ) {
      // var content = $this.data('content');
      var index = $this.data('index');
      $text.addClass("focused");
    } else {
      $text.removeClass('focused');
    }
  });

  var viewer = self.viewer;
  var drawnItems = self.drawnItems;

  viewer.on(L.Draw.Event.CREATED, function (e) {
    var type = e.layerType
    var layer = e.layer;

    var new_color = randomColor({luminosity: 'bright',format:'hex'});
    var index = self._generateId();

    // Do whatever else you need to. (save to db, add to map etc)
    layer.on('click', function(e) {
      self.editAnnotation(index);
    })

    drawnItems.addLayer(layer);

    layer.setStyle({
      color: new_color
    })

    $(layer._path).attr("id", "region" + index);
    $(layer._path).data('index', index);
    $(layer._path).addClass("highlight");
    self.editAnnotation(index, self.getSelectedText());

  });

  viewer.on(L.Draw.Event.DELETED, function(e) {
    var layers = e.layers.getLayers();
    for(var i in layers) {
      var layer = layers[i];
      var path = layer._path;
      var index = $(path).data('index');
      delete self.annoData[index];
    }
    self._toggleDirty(true);
    self.drawAnnotations();
  })

  viewer.on(L.Draw.Event.DRAWSTART, function(e) {
    window.dragging = true;
  })
  viewer.on(L.Draw.Event.DRAWSTOP, function(e) {
    window.dragging = false;
  })
  viewer.on(L.Draw.Event.EDITSTART, function(e) {
    window.dragging = true;
  })
  viewer.on(L.Draw.Event.EDITSTOP, function(e) {
    window.dragging = false;
  })
  viewer.on(L.Draw.Event.DELETESTART, function(e) {
    window.dragging = true;
    window.deleting = true;
  })
  viewer.on(L.Draw.Event.DELETESTOP, function(e) {
    window.dragging = false;
    window.deleting = false;
  })

};

dlxs.App.prototype.drawFootnotes = function() {
  var self = this;

  var $footnotes = self.$footnotes;
  $footnotes.empty();

  var layers = self.getSortedDrawnLayers();
  if ( layers.length > 0 ) {
    for(var i in layers) {
      var layer = layers[i];
      var path = layer._path;
      var index = $(path).data('index');
      var footnote_indexes = self.footnotesData[index];
      if ( ! footnote_indexes ) { continue; }
      // console.log("AHOY FOOTNOTE", footnote_indexes);
      for(var fid in footnote_indexes) {
        var content = self.footnotesData[index][fid];
        var $li = $('<li class="footnote"><p><a href="#fnref:' + fid + '" title="return">↩</a> ' + content + '</p></li>').appendTo($footnotes);
        $li.attr("id", "fn:" + fid);
      }
    }
  }

  $.bigfoot({ 
    positionContent: false,
    activateCallback: function() { self.in_footnote = true; },
    actionOriginalFN: 'hide',
    // buttonMarkup: '<div class="bigfoot-footnote__container"><button href="#" class="bigfoot-footnote__button" rel="footnote" id="{{SUP:data-footnote-backlink-ref}}" data-footnote-number="{{FOOTNOTENUM}}" data-footnote-identifier="{{FOOTNOTEID}}" alt="See Footnote {{FOOTNOTENUM}}" data-bigfoot-footnote="{{FOOTNOTECONTENT}}">{{FOOTNOTENUM}}</button></div>'
    buttonMarkup: '<div class="bigfoot-footnote__container"><button href="#" class="bigfoot-footnote__button" rel="footnote" id="{{SUP:data-footnote-backlink-ref}}" data-footnote-number="{{FOOTNOTENUM}}" data-footnote-identifier="{{FOOTNOTEID}}" alt="See Footnote {{FOOTNOTENUM}}" data-bigfoot-footnote="{{FOOTNOTECONTENT}}">' + self.dingbat + '</button></div>'
  } );
}

dlxs.App.prototype.getSelectedText = function() {

  function makeEditableAndHighlight(colour) {
      var range, sel = window.getSelection();
      if (sel.rangeCount && sel.getRangeAt) {
          range = sel.getRangeAt(0);
      }
      document.designMode = "on";
      if (range) {
          sel.removeAllRanges();
          sel.addRange(range);
      }
      // Use HiliteColor since some browsers apply BackColor to the whole block
      if (!document.execCommand("HiliteColor", false, colour)) {
          document.execCommand("BackColor", false, colour);
      }
      document.designMode = "off";
  }

  function highlight(colour) {
      var range, sel;
      if (window.getSelection) {
          // IE9 and non-IE
          try {
              if (!document.execCommand("BackColor", false, colour)) {
                  makeEditableAndHighlight(colour);
              }
          } catch (ex) {
              makeEditableAndHighlight(colour)
          }
      } else if (document.selection && document.selection.createRange) {
          // IE <= 8 case
          range = document.selection.createRange();
          range.execCommand("BackColor", false, colour);
      }
  }

  var selection = window.getSelection();
  var text = "";
  if ( selection.toString() != "" ) {
    text = selection.toString();
    highlight(randomColor({luminosity: 'light',format:'hex'}));
  }
  return text;
};

$().ready(function() {
  console.log("READY")
  if ( ! $(".panels--scan").data('identifier') ) {
    return;
  }

  var annoData = JSON.parse($("#annotations-data").text());

  var app = new dlxs.App({
    $scan: $(".panels--scan"),
    $annotations: $(".group-annotations ul"),
    $footnotes: $(".group-footnotes ol"),
    $modalForm: $("#modal-form"),
    // $metadata: $(".panels--metadata"),
    // $text: $(".panels--text .panels--inner"),
    // $stickable: $("#stickable"),
    // $pages: $(".pages"),
    // $annotation: $("#annotation")
    EOT: true
  })

  app.initializeViewer({
    identifier: $(".panels--scan").data('identifier'),
    published_at: $(".panels--scan").data('published_at') || null,
    updated_at: $(".panels--scan").data('updated_at'),
    annoData: annoData
  });

  window.app = app;
})