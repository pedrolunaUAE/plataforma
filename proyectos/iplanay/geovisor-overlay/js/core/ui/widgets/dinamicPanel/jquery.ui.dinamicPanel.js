// =========================================================================
// jQuery UI dinamicPanel – versión con HERRAMIENTA DE ANÁLISIS mejorada
// =========================================================================
$.widget("custom.dinamicPanel", {
  currentTab: '',
  toolsTimer: 0,
  messagesTimer: 0,
  currentTool: 'search',
  currentLegends: [],
  nombresLegends: [],
  grupoNameLegends: [],
  lastResults: {},
  pagination: null,
  searchType: '',
  detailSearch: '',
  toolsOpacityTimer: 3500,
  mouseOnPanel: false,
  activeResult: {},
  activeFeatures: {},
  measures: [],
  curr_measure: {},
  buffers: [],
  crossType: 'intersects',
  points: [],
  curr_point: {},
  geo: [],
  curr_geo: {},
  buffer: [],
  curr_buffer: {},
  analysisLayers: [],       // ← NUEVO: capas para análisis
  analysisResults: [],      // ← NUEVO: resultados del análisis
  results: { index: -1, list: [] },
  panels: [
    { id: 'leyendPanel', type: 'leyend', label: 'Leyenda', desc: 'Significado de la simbolog&iacute;a del mapa', icon: 'fa-solid fa-list' },
    { id: 'measurePanel', type: 'measure', label: 'Medir', icon: 'fa-solid fa-ruler', desc: 'Realiza mediciones en el mapa', data: {}, list: [] },
    { id: 'searchPanel', type: 'search', label: 'Resultado', desc: 'Resultados de b&uacute;squeda', icon: 'fa-solid fa-magnifying-glass' },
    { id: 'vcalle', type: 'vcalle', height: 55, label: 'Street', desc: 'Vista de calle', icon: 'fa-solid fa-street-view' },
  ],
  lastSearch: '',
  id: '',
  searchTimer: 0,
  options: {
    canShowDetail: function () { return true },
    bufferLayers: [],
    analysisTableLayers: [],   // ← NUEVO: opcional, si no lo pasan, se autodetecta del XML
    treeLayers: null,
    recurrentIdentify: [],
    layers: [],
    timeToSearch: 300,
    dataSource: {},
    mapConfig: {},
    urlService: '',
    urlCat: '',
    urlCatDetail: '',
    autocomplete: true,
    translate_params: null,
    translate_results: null,
    translateLayer: function (name) { return name; },
    onCambioPanel: function () { },
    getActiveLayers: function () { },
    getIcon: function (icon) { },
    getBaseLayers: function () { },
    getCurrentBaseMap: function () { },
    privateResponse: function (data) { },
    change: null,
    modules: [],
    fichasBaseUrl: 'js/core/ui/widgets/dinamicPanel/fichas/',
    map: null,
    controlsMap: null,
    onAnalysis: function () { },
    onTabChange: function () { },
    onAnalysisClose: function () { },
    onIdentify: function () { },
    onCloseDetail: function () { },
    openLayerConf: function () { },
  },
  setCanShowDetail: function (func) { this.options.canShowDetail = func; },
  setActiveFeatures: function (data) { this.activeFeatures = data; },
  showGallery: function (id, url) {
    var obj = this;
    var listSource = { url: 'config/cemabe.json', type: 'POST', dataType: "json" };
    obj.getData(listSource, {}, function (data) {
      data.title = data.escuela; data.id = data.cctID;
      $('body').append('<div id="dinamicPanel_g"></div>');
      $('#dinamicPanel_g').lightGallery({ data: data });
    });
  },
  messageHeader: function (text, time) {
    time = time || 2000;
    return this.options.map.Notification({ message: text, time: time });
  },
  openLinkWindow: function (url) { window.open(url); },
  mapDeleteMarkers: function (type) { this.options.map.Mark.event({ action: 'delete', items: 'all', type: type }); },
  mapShowMarkers: function (opc, type) {
    opc = (opc === undefined || opc) ? 'show' : 'hide';
    this.options.map.Mark.event({ action: opc, items: 'all', type: type });
  },
  mapNewMarker: function (nom, lon, lat, type, desc, func) {
    return this.options.map.Mark.add({ lon: lon, lat: lat, type: type, params: { nom: nom, desc: desc, func: func } });
  },
  mapExtend: function (param, geo) {
    var obj = this;
    switch (typeof (param)) {
      case 'string': obj.options.map.goCoords(param); break;
      case 'object':
        var geo = (!(geo === undefined) && geo) ? 'geographic' : 'mercator';
        var lon = 0, lat = 0;
        if (param.length == 2) { lon = parseFloat(param[0], 10); lat = parseFloat(param[1], 10); }
        else { lon = parseFloat(param.lon); lat = parseFloat(param.lat); }
        obj.options.map.goCoords(lon, lat, geo);
        break;
    }
  },
  getAllFeatures: function () {
    return { currentTab: this.currentTool, measures: this.measures, buffers: this.buffers, buffer: this.buffer, points: this.points, geo: this.geo };
  },
  getMapExtent: function (param) { param = (param === undefined) ? 'geographic' : param; return this.options.map.getExtent(param); },
  getMapCenter: function () { return this.options.map.getDistanceFromCentroid(); },
  getActiveLayers: function (baseLayers) {
    var extraLayers = $.extend(true, {}, baseLayers);
    var obj = this;
    var layers = this.options.getActiveLayers();
    var defaultLayers = obj.options.recurrentIdentify;
    var list = [], index = [];
    var extensor = (layers.length > 0) ? 1000 : 0;
    if (!(extraLayers === undefined)) {
      for (var x in extraLayers) {
        if (x.substr(0, 4) != 'img_') {
          extraLayers[x].idLayer = x;
          var ban = false;
          for (var i in layers) { if (layers[i].idLayer == x) { ban = true; } }
          if (!ban) {
            var newPosition = extraLayers[x].layer.position + extensor;
            extraLayers[x].position = newPosition;
            extraLayers[x].layer.position = newPosition;
            list[newPosition] = extraLayers[x];
          }
        }
      }
    }
    for (var x in layers) { list[layers[x].position] = layers[x]; }
    for (var x in defaultLayers) {
      var layer = list[defaultLayers[x].position];
      if (layer === undefined) { list[defaultLayers[x].position] = defaultLayers[x]; }
    }
    for (var x in list) {
      var item = list[x], pos = 0;
      for (var i in index) { if (index[i].position > parseInt(x, 10)) { break; } pos++; }
      index.splice(pos, 0, item);
    }
    for (var x in index) {
      var id = index[x].idLayer;
      if (index[x].time) { id = obj.options.translateLayer(id); }
      index[x] = id;
    }
    return index.toString();
  },
  refreshLegend: function () {
    var obj = this;
    var leyendas = obj.createLeyendList();
    obj.refreshLayers();
    if (obj.currentTool == 'leyend') {
      $('#' + obj.id + '_leyendPanel').html(leyendas);
      obj.initLegendLayerDisplayBehavior(obj.id + '_leyendPanel');
      if (!obj.isToolPanelFill()) { if (obj.isToolPanelOpen()) { obj.closeToolPanel(); } }
      else { if (!obj.isToolPanelOpen()) { $('#layersDisplay').css('display', 'none'); var panel = obj.getPanel('leyendPanel'); obj.openToolPanel(panel.height); $('#' + obj.id + '_leyendPanel').css('display', ''); } }
    }
  },
  getLegendList: function () { this.refreshLegend(); return this.currentLegends; },
  getNameLegendList: function () { this.refreshLegend(); return this.nombresLegends; },
  getGrupoNameLegendList: function () { this.refreshLegend(); return this.grupoNameLegends; },
  translateLayer: function (name) { return this.options.translateLayer(name); },
  getLegendTreeGroups: function () {
    var obj = this;
    var layerDisplay = $('#layersDisplay').data('custom-layerDisplay');
    var source = null;
    if (layerDisplay && layerDisplay.options && layerDisplay.options.layers) { source = layerDisplay.options.layers; }
    else if (obj.options.treeLayers) {
      source = obj.options.treeLayers.layers && obj.options.treeLayers.layers.groups ? obj.options.treeLayers.layers.groups : (obj.options.treeLayers.groups || obj.options.treeLayers);
    }
    return source || {};
  },
  buildLegendLayerIndex: function () {
    var groups = this.getLegendTreeGroups();
    var index = {};
    $.each(groups, function (groupId, group) {
      if (!group || !group.layers) return;
      $.each(group.layers, function (idLayer, layer) {
        layer = layer || {};
        index[idLayer] = {
          groupId: groupId, groupLabel: group.label || groupId,
          themeId: layer.theme && layer.theme.idTema ? layer.theme.idTema : '_general',
          themeLabel: layer.theme && layer.theme.tema ? layer.theme.tema : '', layer: layer
        };
      });
    });
    return index;
  },
  initLegendLayerDisplayBehavior: function (panelId) {
    var $panel = $('#' + panelId);
    if (!$panel.length) return;
    $panel.find('.layerDisplay-groupLayer').each(function () {
      var $group = $(this);
      var $name = $group.find('.layerDisplay-groupLayer-name').first();
      var $content = $group.children('.layerDisplay-groupContent');
      if ($group.attr('data-open') === undefined) { $group.attr('data-open', 'false'); }
      $name.attr({ 'data-click-state': $group.attr('data-open') === 'true' ? '1' : '0', 'aria-expanded': $group.attr('data-open') === 'true' ? 'true' : 'false' });
      if ($group.attr('data-open') !== 'true') { $content.hide(); }
    });
    $panel.find('.themeName').each(function () {
      var $theme = $(this);
      var $content = $theme.next('.layerDisplay-themeContent');
      if ($theme.attr('data-click-state') === undefined) { $theme.attr('data-click-state', '0'); }
      $theme.attr('aria-expanded', $theme.attr('data-click-state') === '1' ? 'true' : 'false');
      if ($theme.attr('data-click-state') !== '1') { $content.hide(); }
    });
    $panel
      .off('click.dinamicLegendGroup', '.layerDisplay-groupLayer-name')
      .on('click.dinamicLegendGroup', '.layerDisplay-groupLayer-name', function (event) {
        event.preventDefault(); event.stopPropagation();
        var $name = $(this);
        var $group = $name.closest('.layerDisplay-groupLayer');
        var $content = $group.children('.layerDisplay-groupContent');
        var isOpen = $group.attr('data-open') === 'true';
        if (isOpen) {
          $group.attr('data-open', 'false');
          $name.attr({ 'data-click-state': '0', 'aria-expanded': 'false' });
          $group.find('.themeName').attr({ 'data-click-state': '0', 'aria-expanded': 'false' }).removeClass('visible-color').addClass('hidden-color');
          $group.find('.layerDisplay-themeContent').hide();
          $content.stop(true, true).slideUp(180);
        } else {
          $group.attr('data-open', 'true');
          $name.attr({ 'data-click-state': '1', 'aria-expanded': 'true' });
          $content.stop(true, true).slideDown(180);
          $group.find('.layerDisplay-themeContent').hide();
        }
      })
      .off('click.dinamicLegendTheme', '.themeName')
      .on('click.dinamicLegendTheme', '.themeName', function (event) {
        event.preventDefault(); event.stopPropagation();
        var $theme = $(this);
        var $content = $theme.next('.layerDisplay-themeContent');
        var isOpen = $theme.attr('data-click-state') === '1';
        if (isOpen) {
          $theme.attr({ 'data-click-state': '0', 'aria-expanded': 'false' }).removeClass('visible-color').addClass('hidden-color');
          $content.stop(true, true).slideUp(160);
        } else {
          $theme.attr({ 'data-click-state': '1', 'aria-expanded': 'true' }).removeClass('hidden-color').addClass('visible-color');
          $content.stop(true, true).slideDown(160);
        }
      });
  },
  refreshRasterLegend: function () {
    var content = this.createRasterLegendList();
    $('#' + this.id + '_rasterLegendPanel').html(content);
    this.initLegendLayerDisplayBehavior(this.id + '_rasterLegendPanel');
  },
  createRasterLegendList: function () {
    var obj = this;
    var activeLayers = $.isFunction(obj.options.getActiveLayers) ? (obj.options.getActiveLayers() || []) : [];
    var layerIndex = obj.buildLegendLayerIndex();
    var grouped = {}, order = [];
    var escapeHtml = function (value) { return $('<div/>').text(value === undefined || value === null ? '' : value).html(); };
    $.each(activeLayers, function (position, activeLayer) {
      if (!activeLayer || !activeLayer.idLayer) return;
      var config = layerIndex[activeLayer.idLayer];
      var layer = config ? config.layer : activeLayer;
      var rasterLegend = layer.rasterLegend || activeLayer.rasterLegend;
      var layerType = (layer.layerType || activeLayer.layerType || '').toString().toLowerCase();
      if (!rasterLegend || layerType !== 'raster') return;
      var groupId = config ? config.groupId : (activeLayer.idGroup || '_raster');
      var groupLabel = config ? config.groupLabel : 'LEYENDAS RÁSTER';
      var themeId = config ? config.themeId : '_general';
      var themeLabel = config ? config.themeLabel : '';
      if (!grouped[groupId]) { grouped[groupId] = { label: groupLabel, themes: {}, themeOrder: [] }; order.push(groupId); }
      if (!grouped[groupId].themes[themeId]) { grouped[groupId].themes[themeId] = { label: themeLabel, items: [] }; grouped[groupId].themeOrder.push(themeId); }
      grouped[groupId].themes[themeId].items.push({ label: layer.label || activeLayer.label || activeLayer.idLayer, image: rasterLegend });
    });
    var html = '<div class="dinamicPanel-legendLayerDisplayBody">';
    $.each(order, function (_, groupId) {
      var group = grouped[groupId];
      html += '<div class="layerDisplay-groupLayer dinamicPanel-legendGroup" data-open="false">';
      html += '<div class="layerDisplay-title-container">';
      html += '<div class="layerDisplay-title">';
      html += '<div class="layerDisplay-groupLayer-name" data-click-state="0" aria-expanded="false">';
      html += '<span class="layerDisplay-groupLabel">' + escapeHtml(group.label) + '</span>';
      html += '</div></div></div>';
      html += '<div class="layerDisplay-groupContent">';
      $.each(group.themeOrder, function (_, themeId) {
        var theme = group.themes[themeId];
        if (theme.label) {
          html += '<div class="layerDisplay-layer-visible hidden-color themeName" data-click-state="0" aria-expanded="false">' + escapeHtml(theme.label) + '</div>';
          html += '<div class="layerDisplay-themeContent">';
        }
        $.each(theme.items, function (_, item) {
          html += '<div class="dinamicPanel-rasterItem">';
          html += '<div class="dinamicPanel-rasterItemTitle">' + escapeHtml(item.label) + '</div>';
          html += '<img class="dinamicPanel-rasterImage" src="' + escapeHtml(item.image) + '" alt="Leyenda ráster de ' + escapeHtml(item.label) + '" />';
          html += '</div>';
        });
        if (theme.label) html += '</div>';
      });
      html += '</div></div>';
    });
    html += '</div>';
    return order.length ? html : '<div class="dinamicPanel-legendEmpty"><span>No hay capas ráster activas con una leyenda PNG configurada.</span></div>';
  },
  createLeyendList: function () {
    var obj = this;
    var unique_list = [];
    obj.currentLegends = [];
    obj.nombresLegends = [];
    obj.grupoNameLegends = [];
    var activeLayers = $.isFunction(obj.options.getActiveLayers) ? (obj.options.getActiveLayers() || []) : [];
    var layerIndex = obj.buildLegendLayerIndex();
    var defaultLegendUrl = (obj.options.dataSource && obj.options.dataSource.leyendUrl) ? obj.options.dataSource.leyendUrl : '';
    var grouped = {}, order = [];
    var escapeHtml = function (value) { return $('<div/>').text(value === undefined || value === null ? '' : value).html(); };
    var valid = function (url) { if (!url || unique_list.indexOf(url) >= 0) return ''; unique_list.push(url); return url; };
    var getLegendImage = function (idLayer, layer) {
      var customLegend = layer.urlLegend || null;
      if (customLegend) {
        if (typeof customLegend === 'object') { return customLegend.unique ? valid(customLegend.url) : (customLegend.url || ''); }
        if (typeof customLegend === 'string') return customLegend;
      }
      return defaultLegendUrl ? defaultLegendUrl + obj.translateLayer(idLayer) : '';
    };
    $.each(activeLayers, function (position, activeLayer) {
      if (!activeLayer || !activeLayer.idLayer) return;
      var config = layerIndex[activeLayer.idLayer];
      var layer = config ? config.layer : activeLayer;
      var layerType = (layer.layerType || activeLayer.layerType || '').toString().toLowerCase();
      var rasterLegend = layer.rasterLegend || activeLayer.rasterLegend;
      if (layerType === 'raster' && rasterLegend) return;
      var image = getLegendImage(activeLayer.idLayer, activeLayer);
      if (!image) return;
      var groupId = config ? config.groupId : (activeLayer.idGroup || '_active');
      var groupLabel = config ? config.groupLabel : 'CAPAS ACTIVAS';
      var themeId = config ? config.themeId : '_general';
      var themeLabel = config ? config.themeLabel : '';
      if (!grouped[groupId]) { grouped[groupId] = { label: groupLabel, themes: {}, themeOrder: [] }; order.push(groupId); }
      if (!grouped[groupId].themes[themeId]) { grouped[groupId].themes[themeId] = { label: themeLabel, items: [] }; grouped[groupId].themeOrder.push(themeId); }
      grouped[groupId].themes[themeId].items.push({ idLayer: activeLayer.idLayer, image: image });
    });
    var cadena = '<div class="dinamicPanel-legendLayerDisplayBody">';
    $.each(order, function (_, groupId) {
      var group = grouped[groupId];
      cadena += '<div class="layerDisplay-groupLayer dinamicPanel-legendGroup" data-open="false">';
      cadena += '<div class="layerDisplay-title-container">';
      cadena += '<div class="layerDisplay-title">';
      cadena += '<div class="layerDisplay-groupLayer-name" data-click-state="0" aria-expanded="false">';
      cadena += '<span class="layerDisplay-groupLabel">' + escapeHtml(group.label) + '</span>';
      cadena += '</div></div></div>';
      cadena += '<div class="layerDisplay-groupContent">';
      $.each(group.themeOrder, function (_, themeId) {
        var theme = group.themes[themeId];
        if (theme.label) {
          cadena += '<div class="layerDisplay-layer-visible hidden-color themeName" data-click-state="0" aria-expanded="false">' + escapeHtml(theme.label) + '</div>';
          cadena += '<div class="layerDisplay-themeContent">';
        }
        $.each(theme.items, function (_, item) {
          cadena += '<div class="dinamicPanel-legendRow">';
          cadena += '<img src="' + escapeHtml(item.image) + '" alt="Leyenda" class="dinamicPanel-legendImage" />';
          cadena += '</div>';
          obj.currentLegends.push(item.image);
          obj.nombresLegends.push(item.idLayer);
          obj.grupoNameLegends.push(group.label);
        });
        if (theme.label) cadena += '</div>';
      });
      cadena += '</div></div>';
    });
    cadena += '</div>';
    var layerListSting = order.length ? cadena : '';
    cadena = order.length
      ? '<div class="btnWindow"><span id="' + obj.id + '_legendWindow" class="dinamicPanel-legendWindow dinamicPanel-sprite dinamicPanel-window-short"></span></div>' + cadena
      : '<div class="dinamicPanel-legendEmpty"><span>No hay leyendas vectoriales disponibles.</span></div>';
    if ($.isFunction(obj.options.onRefreshLegend)) { obj.options.onRefreshLegend(layerListSting); }
    setTimeout(function () {
      $('#' + obj.id + '_legendWindow').off('click.dinamicPanelLegend').on('click.dinamicPanelLegend', function (event) {
        event.preventDefault(); event.stopPropagation();
        if ($.isFunction(obj.options.onLegendWindow)) { obj.options.onLegendWindow(); }
      });
    }, 100);
    return cadena;
  },
  showResults: function (type) {
    var obj = this;
    $('.dinamicPanel-panelResult').each(function () { $(this).css('display', 'none'); });
    if (type === undefined) { $('#' + obj.id + '_results').css('display', 'none'); }
    else {
      if ($('#' + obj.id + '_' + type + '_result').html() != '') {
        obj.moduleEvents({ id: 'showResult', value: type });
        $('#' + obj.id + '_results').css('display', '');
        $('#' + obj.id + '_' + type + '_result').css('display', '');
      } else { $('#' + obj.id + '_results').css('display', 'none'); }
    }
    obj.showPanelResult();
  },
  showPanelResult: function () {
    var panel = $('#' + this.id + '_' + this.currentTool + '_result');
    var results = $('#' + this.id + '_results');
    if (panel.html() != '') { if (results.attr('visible') == 'false') { results.attr('visible', true).show(); } }
    else { if (results.attr('visible') == 'true') { results.attr('visible', false).hide(); } }
    if (this.pagination) { $('#' + this.id + '_pagination').show(); }
  },
  mapFeatureDisplay: function (type) { },
  showSlideBtn: function () { $('#' + this.id + '_hideSearch').fadeIn('slow'); },
  hideSlideBtn: function () { $('#' + this.id + '_hideSearch').fadeOut('slow'); },
  hiddeTools: function () { $('#' + this.id + '_toolSet').css('display', 'none'); },
  showTools: function () { $('#' + this.id + '_toolSet').css('display', ''); },
  floatingToolPanels: {
    leyend: { title: 'Leyenda', icon: 'fa-solid fa-list', width: 380 },
    rasterLegend: { title: 'Leyendas ráster', icon: 'fa-solid fa-image', width: 390 },
    buffer: { title: 'Análisis espacial', icon: 'fa-solid fa-globe-americas', width: 410 },
  },
  isCompactMapTool: function (type) { return type === 'geo' || type === 'measure'; },
  initCompactMapTools: function () {
    var obj = this;
    var $host = $('#panel-center');
    if (!$host.length) $host = $('body');
    $.each(['geo', 'measure'], function (_, type) {
      var shellId = obj.id + '_' + type + 'CompactTool';
      if (!$('#' + shellId).length) {
        $('<div/>', { id: shellId, 'class': 'dinamicPanel-compactTool dinamicPanel-compactTool-' + type, 'aria-hidden': 'true' })
          .append($('<button/>', { type: 'button', 'class': 'dinamicPanel-compactClose', title: 'Cerrar', 'aria-label': 'Cerrar' }).append('<i class="fa-solid fa-xmark" aria-hidden="true"></i>'))
          .append($('<div/>', { 'class': 'dinamicPanel-compactBody' }))
          .appendTo($host).hide();
        $('#' + shellId + ' .dinamicPanel-compactClose').on('click', function (event) {
          event.preventDefault(); event.stopPropagation();
          obj.closeCompactMapTool(type);
        });
      }
    });
  },
  prepareCompactMapTool: function (type) {
    var obj = this;
    var $shell = $('#' + obj.id + '_' + type + 'CompactTool');
    var $body = $shell.children('.dinamicPanel-compactBody');
    var $panel = $('#' + obj.id + '_' + type + 'Panel');
    if (!$shell.length || !$panel.length) { return false; }
    if (!$panel.parent().is($body)) { $panel.detach().appendTo($body); }
    if (type === 'geo') {
      $('#' + obj.id + '_geo_btnImporting').hide().attr('aria-hidden', 'true');
      var geoTips = { point: 'Punto', line: 'Línea', poly: 'Polígono', btnImport: 'Importar geometría', btnExport: 'Exportar geometría', btnClearBuffers: 'Limpiar geometría' };
      $.each(geoTips, function (suffix, text) {
        var id = obj.id + '_geo_' + suffix;
        var $control = $('#' + id);
        var $target = $control.is('input') ? $('label[for="' + id + '"]') : $control;
        $target.attr({ 'data-tooltip': text, 'aria-label': text }).removeAttr('title').removeAttr('aria-describedby');
        try { $target.tooltip('destroy'); } catch (e) {}
        try {
          $target.closest('.ui-controlgroup').find('.ui-checkboxradio-label').each(function () {
            try { $(this).tooltip('destroy'); } catch (ex) {}
            $(this).removeAttr('title').removeAttr('aria-describedby');
          });
        } catch (e) {}
      });
    } else {
      var measureTips = { line: 'Medir distancia', poly: 'Medir área' };
      $.each(measureTips, function (suffix, text) {
        var id = obj.id + '_measure_' + suffix;
        $('label[for="' + id + '"]').attr({ 'data-tooltip': text, 'aria-label': text }).removeAttr('title').removeAttr('aria-describedby');
      });
    }
    try { $('.geoType+label,.measureType+label,.ui-checkboxradio-label').tooltip('destroy'); } catch (e) {}
    $('.ui-tooltip').remove();
    $('[aria-describedby]').removeAttr('aria-describedby');
    return true;
  },
  openCompactMapTool: function (type) {
    var obj = this;
    if (!obj.isCompactMapTool(type)) return false;
    obj.initCompactMapTools();
    if (!obj.prepareCompactMapTool(type)) return false;
    $('.dinamicPanel-compactTool').not('#' + obj.id + '_' + type + 'CompactTool').hide().attr('aria-hidden', 'true');
    $('#' + obj.id + '_' + type + 'CompactTool').show().attr('aria-hidden', 'false');
    $('#' + obj.id + '_' + type + '_result').addClass('dinamicPanel-detachedResult');
    obj.showResults(type);
    return true;
  },
  closeCompactMapTool: function (type) {
    var obj = this;
    $('#' + obj.id + '_' + type + 'CompactTool').hide().attr('aria-hidden', 'true');
    $('#' + obj.id + '_' + type + '_result').hide();
    if (obj.currentTool === type && obj.options.map) { obj.options.map.activeCtl({ control: 'none', active: true }); }
  },
  isFloatingTool: function (type) { return !!this.floatingToolPanels[type]; },
  initFloatingToolPanels: function () {
    var obj = this;
    if (!$.fn.toolPanel) {
      if (window.console && console.warn) { console.warn('No se cargó jquery.ui.toolPanel.js. Se mantiene el comportamiento original.'); }
      return false;
    }
    var $host = $('#panel-center');
    if (!$host.length) $host = $('body');
    $.each(obj.floatingToolPanels, function (type, config) {
      var panelId = obj.id + '_' + type + 'ToolPanel';
      var $tool = $('#' + panelId);
      if (!$tool.length) {
        $tool = $('<div/>', { id: panelId }).appendTo($host);
        $tool.toolPanel({
          title: config.title, icon: config.icon, width: config.width,
          top: 75, right: 18, appendTo: $host, initiallyOpen: false,
          draggable: true, resizable: true,
          onClose: function () { if (obj.currentTool === type && obj.options.map) { obj.options.map.activeCtl({ control: 'none', active: true }); } }
        });
      }
      var $body = $tool.toolPanel('getBody');
      var controlsSelector = '#' + obj.id + '_' + type + 'Panel';
      var resultsSelector = '#' + obj.id + '_' + type + '_result';
      var $controlsOutside = $(controlsSelector).filter(function () { return !$(this).parent().is($body); }).first();
      var $resultsOutside = $(resultsSelector).filter(function () { return !$(this).parent().is($body); }).first();
      if ($controlsOutside.length) { $body.children(controlsSelector).remove(); $controlsOutside.detach().appendTo($body); }
      if ($resultsOutside.length) { $body.children(resultsSelector).remove(); $resultsOutside.detach().appendTo($body); }
    });
    return true;
  },
  openFloatingToolPanel: function (type) {
    var obj = this;
    if (!obj.isFloatingTool(type) || !$.fn.toolPanel) return false;
    var $tool = $('#' + obj.id + '_' + type + 'ToolPanel');
    if (!$tool.length) { obj.initFloatingToolPanels(); $tool = $('#' + obj.id + '_' + type + 'ToolPanel'); }
    if (!$tool.length) return false;
    $.each(obj.floatingToolPanels, function (otherType) {
      var $other = $('#' + obj.id + '_' + otherType + 'ToolPanel');
      if (otherType !== type && $other.length && $other.toolPanel('isOpen')) { $other.toolPanel('close'); }
    });
    $('#' + obj.id + '_' + type + 'Panel').show();
    if ($('#' + obj.id + '_' + type + '_result').html() !== '') { $('#' + obj.id + '_' + type + '_result').show(); }
    $tool.toolPanel('restore');
    $tool.toolPanel('open');
    return true;
  },
  closeFloatingToolPanels: function () {
    var obj = this;
    if (!$.fn.toolPanel) return;
    $.each(obj.floatingToolPanels, function (type) {
      var $tool = $('#' + obj.id + '_' + type + 'ToolPanel');
      if ($tool.length && $tool.toolPanel('isOpen')) $tool.toolPanel('close');
    });
  },
  showPanel: function (id) {
    var obj = this;
    var map = obj.options.map;
    obj.options.onCambioPanel(id);
    $('.dinamicPanel-panel').each(function () { $(this).css('display', 'none'); });
    $('.dinamicPanel-tab .dinamicPanel-selector').each(function () { $(this).addClass('dinamicPanel-hidde'); });
    if (!(id === undefined)) {
      $('#' + obj.id + '_' + id).css('display', '');
      $('#' + obj.id + '_' + id + '_tab .dinamicPanel-selector').removeClass('dinamicPanel-hidde');
      var item = {};
      for (var x in obj.panels) { if (obj.panels[x].id == id) { item = obj.panels[x]; break; } }
      obj.currentTool = item.type;
      obj.createPanel(item.type);
      if (obj.isCompactMapTool(item.type) && obj.openCompactMapTool(item.type)) { }
      else if (obj.isFloatingTool(item.type) && obj.openFloatingToolPanel(item.type)) { }
      else if ($('#' + obj.id + '_' + item.type + 'Panel').html() != '') { $('#' + obj.id + '_' + item.type + 'Panel').css('display', ''); obj.openToolPanel(item.height); }
      else if (item.type !== 'search') { obj.closeToolPanel(); }
      obj.moduleEvents({ id: 'tabChange', value: id });
      obj.options.onTabChange(id);
    }
  },
  moduleEvents: function (evt) {
    var modules = this.options.modules;
    for (var x in modules) { modules[x].eventListener(evt); }
  },
  externalEvent: function (evt) { this.moduleEvents({ id: evt, value: null }); },
  temporalView: function () {
    var obj = this;
    clearTimeout(obj.toolsTimer);
    obj.panelTransparency();
    obj.toolsTimer = setTimeout(function () { obj.panelTransparency('activate'); }, obj.toolsOpacityTimer);
  },
  panelTransparency: function (opc) {
    var obj = this;
    var ban = false;
    var container = $(document.activeElement).attr('id');
    if (!(container === undefined)) {
      var container = $('#' + obj.id + ' #' + container).attr('id');
      if (!(container === undefined)) {
        ban = true;
        $('#' + container).bind('blur', function () {
          if (!obj.mouseOnPanel) {
            obj.toolsTimer = setTimeout(function () { obj.panelTransparency('activate'); }, obj.toolsOpacityTimer);
            $('#' + container).unbind('blur');
          }
        });
      }
    }
    if (opc === undefined) {
      $('#' + obj.id + '_toolSet').css('opacity', '0.9');
      $('#' + obj.id + '_minitools').css('opacity', '0.9');
      if ($('#' + obj.id + '_detail').html() == '') { obj.showPanelResult(); }
      obj.showSlideBtn();
      if (!obj.isDetailOpen() && !obj.isToolPanelOpen() && obj.isToolPanelFill() && obj.currentTool == 'search') { obj.showPanel('searchPanel'); }
    } else {
      if (obj.currentTool == 'route') { ban = true; }
      if (!ban && !obj.mouseOnPanel) {
        $('#' + obj.id + '_toolSet').css('opacity', 0.3);
        $('#' + obj.id + '_minitools').css('opacity', 0.3);
        obj.hiddeResults();
        obj.hideSlideBtn();
        if (obj.currentTool == 'search') { obj.closeToolPanel(); }
      }
    }
  },
  createPanel: function (type, data) {
    var obj = this;
    var map = obj.options.map;
    obj.closeDetail();
    map.Feature.event({ action: 'hide', items: 'all' });
    obj.options.map.activeCtl({ control: 'none', active: true });
    if (typeof (type) == 'object') { data = type; type = data.type; }
    if (type != 'search') {
      obj.options.map.Mark.event({ action: 'delete', items: 'all', type: 'identify' });
      obj.activeResult = {};
    }
    var cadena = '';
    obj.showResults(type);
    switch (type) {
      case 'edit':
        cadena = '<div class="edit-controls"><label style="float:left;width:157px;">Seleccionar el punto donde desea efectuar su observación.</label><div class="type"><button id="cartografia" class="dinamic_flatBtn" style="float:right;">Seleccionar punto</button></div></div>';
        $('#' + obj.id + '_editPanel').html(cadena);
        $('#cartografia').click(function () {
          if ($(this).attr('active') === undefined) {
            $(this).addClass('dinamic_flatBtn-Inverted').attr('active', true);
            obj.options.map.activeCtl({ control: 'cartografia', active: true });
          } else {
            $(this).removeClass('dinamic_flatBtn-Inverted').removeAttr('active');
            obj.options.map.activeCtl({ control: 'none', active: true });
          }
        });
        break;

      // =====================================================================
      //  ▼▼▼  ANÁLISIS ESPACIAL — NUEVA VERSIÓN ▼▼▼
      // =====================================================================
      case 'buffer':
        $('#layersDisplay').css('display', 'none');
        obj.renderAnalysisPanel();
        obj.showResults('buffer');
        map.Feature.event({ action: 'show', items: 'all', type: 'georeference' });
        break;

      case 'geo':
        $('#layersDisplay').css('display', 'none');
        var cadena = '';
        data = (data === undefined) ? { data: { name: '', type: '', measure: 0, unit: 'metric' }, id: '' } : data;
        var um = (data.data.unit == 'metric') ? 'checked="checked"' : '';
        var ui = (data.data.unit == 'english') ? 'checked="checked"' : '';
        var tl = (data.data.type == 'line') ? 'checked="checked"' : '';
        var tp = (data.data.type == 'polygon') ? 'checked="checked"' : '';
        var isNew = (data.id == '') ? true : false;
        var isMetric = (data.data.unit == 'metric') ? true : false;
        cadena += '<div class="dinamicPanel-geoPanel" idref="' + data.id + '">';
        cadena += '   <div class="geoOption">';
        cadena += '      <div style="display:' + ((isNew) ? '' : 'none') + '" id="' + obj.id + '_geo_typeSet" class="type">';
        cadena += '           <input type="radio" ' + tl + ' id="' + obj.id + '_geo_point" class="geoType" value="georeferencePoint" idref="point" name="geo_type"/><label for="' + obj.id + '_geo_point">Punto</label>';
        cadena += '           <input type="radio" ' + tp + ' id="' + obj.id + '_geo_line" class="geoType" value="georeferenceLine" idref="line" name="geo_type"/><label for="' + obj.id + '_geo_line">L&iacute;nea</label>';
        cadena += '           <input type="radio" ' + tp + ' id="' + obj.id + '_geo_poly" class="geoType" value="georeferencePolygon" idref="poly" name="geo_type"/><label for="' + obj.id + '_geo_poly">Pol&iacute;gono</label>';
        cadena += '      </div>';
        cadena += '      <button id="' + obj.id + '_geo_btnEndAction" style="display:' + ((isNew) ? 'none' : '') + '">Cancelar</button>';
        cadena += '      <button id="' + obj.id + '_geo_btnFinish" style="display:' + ((isNew) ? 'none' : '') + '">Terminar</button>';
        cadena += '      <div id="' + obj.id + '_geo_errorFile" style="font-size:115%;width:150px;display:none" >';
        cadena += '          <div style="width:100%;padding-left: 0.7em;padding-right: 0.7em;" class="ui-state-error ui-corner-all">';
        cadena += '              <p><span style="float: left; margin-right: 0.3em;" class="ui-icon ui-icon-alert"></span><strong>Archivo no válido</strong></p>';
        cadena += '          </div>';
        cadena += '      </div>';
        cadena += '   </div>';
        cadena += '   <div class="geoControls">';
        cadena += '      <div class="controls">';
        cadena += '          <div id="' + obj.id + '_geo_import" class="unit">';
        cadena += '                  <button id="' + obj.id + '_geo_btnImport" style="display:' + ((isNew) ? '' : 'none') + '">Importar</button>';
        cadena += '                  <button style="width:120px;display:none" id="' + obj.id + '_geo_btnImporting" class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" aria-disabled="false">';
        cadena += '                      <span class="ajax-loader" style="position:absolute;left:0px;height:20px;width:20px"></span>';
        cadena += '                      <span class="ui-button-text">Importando...</span>';
        cadena += '                  </button>';
        cadena += '          </div>';
        cadena += '          <div id="' + obj.id + '_geo_export" class="unit">';
        cadena += '                <button id="' + obj.id + '_geo_btnExport" style="display:' + ((isNew) ? '' : 'none') + '">Exportar</button>';
        cadena += '          </div>';
        cadena += '      </div>';
        cadena += '   </div>';
        cadena += '   <div class="geoBuffers" align="center">';
        cadena += '          <button id="' + obj.id + '_geo_btnClearBuffers" class="geoClear" style="display:' + ((isNew) ? '' : 'none') + '">Limpiar</button>';
        cadena += '   </div>';
        cadena += '</div>';
        $('#' + obj.id + '_geoPanel').html(cadena);
        $('#' + obj.id + '_geo_unitSet').buttonset().change(function () {
          $('#' + obj.id + '_geo_value').html(obj.convertionUnit($('#' + obj.id + '_geo_unitSet :radio:checked').attr('value'), $('#' + obj.id + '_geo_typeSet :radio:checked').attr('value'), parseFloat($('#' + obj.id + '_geo_value').attr('value'), 10)));
        });
        $('#' + obj.id + '_geo_typeSet').buttonset().change(function () {
          obj.geoControl('addNew', $('#' + obj.id + '_geo_typeSet :radio:checked').attr('idref'));
        });
        $('#' + obj.id + '_geo_btnEndAction').button().click(function () { obj.geoControl('endCreation'); });
        $('#' + obj.id + '_geo_btnFinish').button().click(function () {
          var finished = map.Feature.finishGeoreference();
          if (!finished) { $('#' + obj.id + '_geo_btnEndAction').click(); }
        });
        $("#" + obj.id + '_geo_btnImport').button().click(function () { map.Feature.importGeoreference(); });
        $("#" + obj.id + '_geo_btnExport').button().button('disable').click(function () { map.Feature.exportGeoreference(); });
        $("#" + obj.id + '_geo_btnCreateBuffers').button().click(function () { obj.geoControl('appyBuffersForAllPoints'); }).button("disable");
        $("#" + obj.id + '_geo_btnClearBuffers').button().click(function () {
          obj.options.map.Mark.event({ action: 'delete', items: 'all', type: 'georeference' });
          obj.removeGeoList();
          obj.geoControl('showGeoList');
        });
        map.Feature.event({ action: 'show', items: 'all', type: 'georeference' });
        obj.showResults('geo');
        if (obj.geo.length > 0) { $("#" + obj.id + '_geo_btnCreateBuffers').button('enable'); $("#" + obj.id + '_geo_btnExport').button('enable'); }
        obj.geoControl('declareEvents');
        obj.geoControl('enableBufferPoints');
        var sharedGeo = obj.activeFeatures.georeference;
        if (sharedGeo) { map.Feature.restore('georeference', sharedGeo); delete obj.activeFeatures.georeference; }
        break;

      case 'search':
        $('#layersDisplay').css('display', 'none');
        var detailSearch = data;
        $('#' + obj.id + '_routePanel').html(detailSearch);
        obj.mapShowMarkers(true, 'search');
        break;
      case 'leyend':
        obj.refreshLegend();
        break;
      case 'rasterLegend':
        obj.refreshRasterLegend();
        break;
      case 'route':
        $('#' + obj.id + '_routePanel').html('');
        break;
      case 'measure':
        $('#layersDisplay').css('display', 'none');
        var cadena = '';
        data = (data === undefined) ? { data: { name: '', type: '', measure: 0, unit: 'metric' }, id: '' } : data;
        var um = (data.data.unit == 'metric') ? 'checked="checked"' : '';
        var ui = (data.data.unit == 'english') ? 'checked="checked"' : '';
        var tl = (data.data.type == 'line') ? 'checked="checked"' : '';
        var tp = (data.data.type == 'polygon') ? 'checked="checked"' : '';
        var isNew = (data.id == '') ? true : false;
        var isMetric = (data.data.unit == 'metric') ? true : false;
        cadena += '<div class="dinamicPanel-measurePanel" idref="' + data.id + '">';
        cadena += '   <div class="measureTitle">Medir</div> ';
        cadena += '   <div class="measureOption">';
        cadena += '      <div style="display:' + ((isNew) ? '' : 'none') + '" id="' + obj.id + '_measure_typeSet" class="type">';
        cadena += '           <input type="radio" ' + tl + ' id="' + obj.id + '_measure_line" class="measureType" value="measureLine" idref="line" name="measure_type"/><label for="' + obj.id + '_measure_line">Distancia</label>';
        cadena += '           <input type="radio" ' + tp + ' id="' + obj.id + '_measure_poly" class="measureType" value="measurePolygon" idref="poly" name="measure_type"/><label for="' + obj.id + '_measure_poly">&Aacute;rea</label>';
        cadena += '      </div>';
        cadena += '      <button id="' + obj.id + '_measure_btnEndAction" style="display:' + ((isNew) ? 'none' : '') + '">Cancelar</button>';
        cadena += '      <button id="' + obj.id + '_measure_btnFinish" style="display:' + ((isNew) ? 'none' : '') + '">Terminar</button>';
        cadena += '   </div>';
        cadena += '   <div class="measureControls">';
        cadena += '      <div class="controls">';
        cadena += '          <div id="' + obj.id + '_measure_unitSet" class="unit">';
        cadena += '              <input type="radio" ' + um + ' ' + ((isMetric) ? 'selected="selected"' : '') + ' id="' + obj.id + '_measure_unit_1" value="metric" name="measure_unit"/><label for="' + obj.id + '_measure_unit_1">M&eacute;trico</label>';
        cadena += '              <input type="radio" ' + ui + ' ' + ((isMetric) ? '' : 'selected="selected"') + ' id="' + obj.id + '_measure_unit_2" value="english" name="measure_unit"/><label for="' + obj.id + '_measure_unit_2">Ingl&eacute;s</label>';
        cadena += '          </div>';
        cadena += '          <div id="' + obj.id + '_measure_value" class="value" value="' + data.data.measure + '">' + obj.convertionUnit(data.data.unit, data.data.type, data.data.measure) + '</div>';
        cadena += '      </div>';
        cadena += '   </div>';
        cadena += '</div>';
        $('#' + obj.id + '_measurePanel').html(cadena);
        $('#' + obj.id + '_measure_unitSet').buttonset().change(function () {
          $('#' + obj.id + '_measure_value').html(obj.convertionUnit($('#' + obj.id + '_measure_unitSet :radio:checked').attr('value'), $('#' + obj.id + '_measure_typeSet :radio:checked').attr('value'), parseFloat($('#' + obj.id + '_measure_value').attr('value'), 10)));
        });
        $('#' + obj.id + '_measure_typeSet').buttonset().change(function () {
          obj.measureControl('addNew', $('#' + obj.id + '_measure_typeSet :radio:checked').attr('idref'));
        });
        $('#' + obj.id + '_measure_btnEndAction').button().click(function () { obj.measureControl('endCreation'); });
        $('#' + obj.id + '_measure_btnFinish').button().click(function () {
          var finished = map.Feature.finishMeasure();
          if (!finished) { $('#' + obj.id + '_measure_btnEndAction').click(); }
        });
        map.Feature.event({ action: 'show', items: 'all', type: 'measure' });
        obj.showResults('measure');
        obj.measureControl('setEvent');
        var shared = obj.activeFeatures.measure;
        if (shared) { map.Feature.restore('measure', shared); delete obj.activeFeatures.measure; }
        break;
      case 'vcalle':
        obj.options.map.activeCtl({ control: "sel_poly", active: true });
        obj.options.map.activeCtl({ control: "sel_poly", active: false });
        map.activeCtl({ control: "streetv", active: true });
        break;
    }
  },

  // =========================================================================
  //  NUEVA HERRAMIENTA DE ANÁLISIS ESPACIAL
  // =========================================================================
  renderAnalysisPanel: function () {
    var obj = this;
    var $panel = $('#' + obj.id + '_bufferPanel');
    var html = '';

    html += '<div class="dp-analysis-panel">';

    // Sección 1: geometría
    html += '<section class="dp-analysis-section">';
    html += '  <h3><i class="fa-solid fa-draw-polygon"></i> Geometría de análisis</h3>';
    html += '  <div class="dp-analysis-geometry-list" id="dp-analysis-geoms">';
    var polys = obj.getAnalysisPolygons();
    if (polys.length === 0) {
      html += '    <div class="dp-analysis-empty">Dibuja un polígono en <strong>Georef</strong> o genera un área de influencia para analizar.</div>';
    } else {
      $.each(polys, function (i, p) {
        html += '    <label class="dp-analysis-geom-item">';
        html += '      <input type="radio" name="dp-geom" value="' + p.id + '" ' + (i === 0 ? 'checked' : '') + '>';
        html += '      <span class="dp-geom-icon"><i class="fa-solid fa-vector-square"></i></span>';
        html += '      <span class="dp-geom-name">' + p.name + '</span>';
        html += '    </label>';
      });
    }
    html += '  </div>';
    html += '</section>';

    // Sección 2: tipo de análisis
    html += '<section class="dp-analysis-section">';
    html += '  <h3><i class="fa-solid fa-filter"></i> Tipo de análisis</h3>';
    html += '  <select id="dp-analysis-type" class="dp-analysis-select">';
    html += '    <option value="INTERSECTS">Intersección (toca el polígono)</option>';
    html += '    <option value="CONTAINS">Contención (dentro del polígono)</option>';
    html += '  </select>';
    html += '</section>';

    // Sección 3: capas a analizar
    html += '<section class="dp-analysis-section">';
    html += '  <h3><i class="fa-solid fa-layer-group"></i> Capas a analizar</h3>';
    html += '  <div id="dp-analysis-layers" class="dp-analysis-layer-list">';
    var layers = obj.getAnalysisAvailableLayers();
    if (layers.length === 0) {
      html += '    <div class="dp-analysis-empty">No hay capas con totales configurados en el XML.</div>';
    } else {
      $.each(layers, function (i, layer) {
        html += '    <label class="dp-analysis-layer-item">';
        html += '      <input type="checkbox" value="' + layer.alias + '" data-layer="' + layer.name + '" ' + (i === 0 ? 'checked' : '') + '>';
        html += '      <span class="dp-layer-name">' + (layer.label || layer.alias) + '</span>';
        html += '      <span class="dp-layer-count" data-layer="' + layer.alias + '">—</span>';
        html += '    </label>';
      });
    }
    html += '  </div>';
    html += '</section>';

    // Sección 4: resumen
    html += '<section class="dp-analysis-section">';
    html += '  <h3><i class="fa-solid fa-chart-simple"></i> Resumen</h3>';
    html += '  <div id="dp-analysis-summary" class="dp-analysis-summary">';
    html += '    <div class="dp-analysis-empty">Selecciona las capas y presiona <strong>Analizar</strong>.</div>';
    html += '  </div>';
    html += '</section>';

    // Acciones
    html += '<div class="dp-analysis-actions">';
    html += '  <button type="button" id="dp-analysis-run" class="dp-btn-primary"><i class="fa-solid fa-play"></i> Analizar</button>';
    html += '  <button type="button" id="dp-analysis-export-xls" class="dp-btn-secondary" title="Exportar XLS"><i class="fa-solid fa-file-excel"></i> XLS</button>';
    html += '  <button type="button" id="dp-analysis-export-csv" class="dp-btn-secondary" title="Exportar CSV"><i class="fa-solid fa-file-csv"></i> CSV</button>';
    html += '</div>';

    html += '</div>';

    $panel.html(html);
    obj.bindAnalysisPanelEvents();
  },

  getAnalysisPolygons: function () {
    var obj = this;
    var polys = [];
    for (var x in obj.geo) {
      var item = obj.geo[x];
      if (item.data && item.data.type === 'polygon') {
        polys.push({
          id: item.id,
          name: item.data.name || item.data.nom || ('Polígono ' + (polys.length + 1))
        });
      }
    }
    return polys;
  },

  getAnalysisAvailableLayers: function () {
    var obj = this;
    var result = [];
    var added = {};

    /* En bufferLayers, name corresponde al alias de tabla de mdm6.xml
       (centidad, cmunicipal, clocalidad, c_obra_publica_ident), no al nombre físico de la vista. */
    var layersWithTotals = {
      centidad: { label: 'Estado' },
      cmunicipal: { label: 'Municipio' },
      c_localidad: { label: 'Localidad' },
      c_lpr: { label: 'Localidad rural' },
      c_ageb_urb: { label: 'Área Geoestadística Básica Urbana' },
      c_manzanas: { label: 'Manzana' },
      c_obra_publica_ident: { label: 'Obra Pública' }
    };

    $.each(obj.options.bufferLayers || [], function (_, layer) {
      if (!layer) return;

      var table = layer.name || layer.table || layer.idLayer || '';
      var config = layersWithTotals[table];

      if (!config || added[table]) return;

      added[table] = true;
      result.push({
        name: table,
        alias: layer.alias || config.label,
        label: layer.alias || config.label,
        totals: true
      });
    });

    return result;
  },
  bindAnalysisPanelEvents: function () {
    var obj = this;
    var $panel = $('#' + obj.id + '_bufferPanel');

    $panel.off('click.dpRun').on('click.dpRun', '#dp-analysis-run', function () {
      obj.runAnalysis();
    });

    $panel.off('click.dpXls').on('click.dpXls', '#dp-analysis-export-xls', function () {
      obj.exportAnalysis('xls');
    });

    $panel.off('click.dpCsv').on('click.dpCsv', '#dp-analysis-export-csv', function () {
      obj.exportAnalysis('csv');
    });
  },

  runAnalysis: function () {
    var obj = this;
    var geomId = $('#' + obj.id + '_bufferPanel input[name="dp-geom"]:checked').val();
    var type = $('#' + obj.id + '_bufferPanel #dp-analysis-type').val();
    var layers = [];

    $('#' + obj.id + '_bufferPanel #dp-analysis-layers input:checked').each(function () {
      layers.push({
        alias: $(this).val(),
        name: $(this).attr('data-layer')
      });
    });

    if (!geomId) {
      obj.messageHeader('Selecciona una geometría');
      return;
    }
    if (layers.length === 0) {
      obj.messageHeader('Selecciona al menos una capa');
      return;
    }

    obj.lastAnalysis = { geomId: geomId, type: type, layers: layers, results: [] };

    var $summary = $('#' + obj.id + '_bufferPanel #dp-analysis-summary');
    $summary.html('<div class="dp-analysis-loading"><i class="fa-solid fa-spinner fa-spin"></i> Procesando análisis…</div>');

    var pending = layers.length;
    $.each(layers, function (i, layer) {
      obj.analyzeLayer(layer, geomId, type, function (result) {
        obj.lastAnalysis.results.push(result);
        pending--;
        if (pending === 0) {
          obj.renderAnalysisSummary();
        }
      });
    });
  },

  analyzeLayer: function (layer, geomId, type, callback) {
    var obj = this;
    var item = obj.getGeo(geomId);
    if (!item) {
      callback({ layer: layer.alias, error: true, value: 0 });
      return;
    }
    var polyEvt = obj.options.map.Feature.event({ action: 'get', id: geomId });
    var poly = polyEvt && polyEvt.data ? polyEvt.data.db : null;
    if (!poly) {
      callback({ layer: layer.alias, error: true, value: 0 });
      return;
    }
    var dataSource = obj.options.dataSource.bufferLayer || {};
    var params = {
      table: layer.name,
      polygon: poly,
      project: obj.options.dataSource.proyName,
      'function': String(type || 'INTERSECTS').toUpperCase(),
      page: 1,
      limit: 20
    };
    if ($.isFunction(obj.options.onAnalysis)) { obj.options.onAnalysis(params); }
    $.ajax({
      url: dataSource.url,
      type: dataSource.type || 'POST',
      dataType: 'json',
      contentType: dataSource.contentType || 'application/json; charset=utf-8',
      data: JSON.stringify(params),
      success: function (data) {
        var result = { layer: layer.alias, layerName: layer.name, totals: {}, value: 0, error: false };
        if (data && data.response && data.response.success) {
          if (data.data && data.data.totals) { result.totals = data.data.totals; }
          if (data.data && data.data.recordCount !== undefined) { result.value = data.data.recordCount; }
        } else {
          result.error = true;
        }
        callback(result);
      },
      error: function () {
        callback({ layer: layer.alias, layerName: layer.name, error: true, value: 0, totals: {} });
      }
    });
  },

  renderAnalysisSummary: function () {
    var obj = this;
    var results = obj.lastAnalysis.results;
    var $summary = $('#' + obj.id + '_bufferPanel #dp-analysis-summary');
    $summary.empty();

    if (!results || results.length === 0) {
      $summary.html('<div class="dp-analysis-empty">Sin resultados</div>');
      return;
    }

    $.each(results, function (i, result) {
      var html = '<div class="dp-analysis-card' + (result.error ? ' is-error' : '') + '">';
      html += '  <div class="dp-analysis-card-header">';
      html += '    <i class="fa-solid fa-layer-group"></i>';
      html += '    <span>' + result.layer + '</span>';
      html += '  </div>';

      if (result.totals && result.totals.fields && result.totals.fields.length > 0) {
        html += '  <div class="dp-analysis-totals-grid">';
        $.each(result.totals.fields, function (j, field) {
          var val = field.value;
          if (val !== null && val !== undefined && val !== '' && !isNaN(Number(val))) {
            val = Number(val).toLocaleString('es-MX', { maximumFractionDigits: 2 });
          }
          html += '    <div class="dp-analysis-total-item">';
          html += '      <span class="dp-total-label">' + field.label + '</span>';
          html += '      <span class="dp-total-value">' + val + '</span>';
          html += '    </div>';
        });
        html += '  </div>';
      } else if (result.error) {
        html += '  <div class="dp-analysis-empty">Servicio no disponible</div>';
      } else {
        html += '  <div class="dp-analysis-empty">Sin totales configurados</div>';
      }

      html += '</div>';
      $summary.append(html);
    });

    // Actualizar contadores por capa
    $.each(results, function (i, result) {

        var count = result.value || 0;

        $('.dp-layer-count[data-layer="' + result.layer + '"]')
            .text(count);

    });
  },

  exportAnalysis: function (type) {
    var obj = this;
    if (!obj.lastAnalysis || !obj.lastAnalysis.results || obj.lastAnalysis.results.length === 0) {
      obj.messageHeader('Primero ejecuta un análisis');
      return;
    }
    var cols = [{ label: 'Capa' }, { label: 'Indicador' }, { label: 'Valor' }];
    var values = [];
    $.each(obj.lastAnalysis.results, function (i, r) {
      if (r.totals && r.totals.fields) {
        $.each(r.totals.fields, function (j, f) {
          values.push([r.layer, f.label, f.value]);
        });
      }
    });
    obj.exportList('Análisis_espacial', cols, values, type);
  },

  // =========================================================================
  //  FIN ANÁLISIS ESPACIAL
  // =========================================================================

  convertionUnit: function (type, poly, value) {
    var label = 'm';
    var post = (poly == 'measureLine' || poly == 'line') ? '' : '&sup2;';
    var banMetros = (type == 'metric' || type === undefined);
    var banCuad = (post != '');
    if (banMetros) {
      if (!banCuad) { label = (value > 1000) ? 'km' : label; value = (value > 1000) ? (value / 1000) : value; }
      else { label = (value > 1000000) ? 'km' : label; value = (value > 1000000) ? (value / 1000000) : value; }
    } else {
      label = 'yr';
      if (!banCuad) { value = value * 1.0936133; label = (value > 1760) ? 'mi' : label; value = (value > 1760) ? (value / 1760) : value; }
      else { value = value * 1.1960; label = (value > 3097600) ? 'mi' : label; value = (value > 3097600) ? (value / 3097600) : value; }
    }
    return value.formatMoney(3, '.', ',') + ' ' + label + post;
  },
  measureControl: function (opc, data) {
    var obj = this;
    var list = obj.measures;
    var map = obj.options.map;
    var removeItem = function (pos, id) {
      map.Feature.event({ action: 'delete', id: id });
      list.splice(pos, 1);
      map.activeCtl({ control: 'measure', active: false });
    };
    var showList = function () {
      $('#' + obj.id + '_measure_result').html(obj.createPolyList(list));
      $('.dinamicPanel-featureEditName').each(function () {
        $(this).off('click.dpEdit').on('click.dpEdit', function () {
          var idref = $(this).attr('idref');
          $(this).css('display', 'none');
          $('.dinamicPanel-featureOkName[idref="' + idref + '"]').css('display', '').off('click.dpOk').on('click.dpOk', function (event) {
            var idRef = $(this).attr('idref');
            var item = getPoly(idRef);
            if (item) { item.data.name = $('#inputText_' + idRef).val(); editPoly(item); map.Feature.event({ select: true, id: item.id }); }
            event.stopPropagation();
          });
          $('.dinamicPanel-featureName[idref="' + idref + '"]').css('display', 'none');
          $('#inputText_' + idref).css('display', '').focus();
          obj.setInputTextRestriction('inputText_' + idref, function (ban) {
            if (ban) { $('.dinamicPanel-featureOkName[idref="' + idref + '"]').css('display', ''); } else { $('.dinamicPanel-featureOkName[idref="' + idref + '"]').css('display', 'none'); }
          }, function () { if ($('#inputText_' + idref).val() != '') $('.dinamicPanel-featureOkName[idref="' + idref + '"]').click(); });
        });
      });
      $('.dp-result-measure').each(function () {
        $(this).off('click.dpSelect').on('click.dpSelect', function (e) {
          if ($(e.target).closest('.dp-item-edit, .dp-item-close').length) return;
          var id = $(this).attr('id');
          map.Feature.event({ select: true, id: id });
          e.stopPropagation();
        });
      });
      $('.dp-result-measure .feature-rem-button').each(function () {
        $(this).off('click.dpRemove').on('click.dpRemove', function (e) {
          var id = $(this).attr('idref');
          var pos = parseInt($(this).attr('pos'), 10);
          if (id == $('#' + obj.id + '_measurePanel').attr('idref')) { $('#' + obj.id + '_measurePanel').attr('idref', ''); obj.createPanel('measure'); }
          removeItem(pos, id);
          obj.measureControl('showList');
          e.stopPropagation();
        });
      });
      $('.dinamicPanel-panelResult .dinamicPanel-buffer').each(function () {
        $(this).on('click', function (e) { e.stopPropagation(); });
      });
    };
    var clickNew = function () {
      $('#' + obj.id + '_measurePanel').attr('idref', '');
      $('#' + obj.id + '_measure_btnEndAction').css('display', 'none');
      $('#' + obj.id + '_measure_btnFinish').css('display', 'none');
      $('#' + obj.id + '_measure_line').prop('checked', true);
      $('#' + obj.id + '_measure_typeSet').buttonset('refresh').css('display', '');
      setTimeout(function () { $('#' + obj.id + '_measure_typeSet :radio:checked').click(); }, 100);
    };
    var clickEnd = function () {
      $('#' + obj.id + '_measure_btnEndAction').css('display', 'none');
      $('#' + obj.id + '_measure_btnFinish').css('display', 'none');
      $('#' + obj.id + '_measure_typeSet').css('display', '');
      obj.createPanel('measure');
      obj.measureControl('none');
    };
    var editPoly = function (item) {
      map.Feature.event({ action: 'set', id: item.id, params: item });
      obj.measureControl('showList');
      obj.createPanel('measure');
    };
    var getPoly = function (id) {
      var result = null;
      for (var x in list) { if (list[x].id == id) { result = list[x]; break; } }
      return result;
    };
    var newPolygon = function () {
      type = $('#' + obj.id + '_measure_typeSet :radio:checked').attr('value');
      $('#' + obj.id + '_measure_btnEndAction').css('display', 'none');
      $('#' + obj.id + '_measure_btnFinish').css('display', 'none');
      $('#' + obj.id + '_measure_typeSet').css('display', 'grid');
      map.event.setEventDisableCtl(function (data) { });
      map.activeCtl({ control: type, active: true });
      map.event.setFeatureAdded(function (data) { savePoly(data); });
      map.event.setFeatureCanceled(function () { });
      map.event.setEventCatchMeasure(function (data) {
        $('#' + obj.id + '_measure_value').html(obj.convertionUnit($('#' + obj.id + '_measure_unitSet :radio:checked').attr('value'), $('#' + obj.id + '_measure_typeSet :radio:checked').attr('value'), data)).attr('value', data);
      });
      map.event.setEventPoiAdded(function (e) { });
      map.event.setEventPoiCanceled(function () { });
      map.event.setEventDisableCtl(function (data) { clickEnd(); });
    };
    var events = function () {
      type = $('#' + obj.id + '_measure_typeSet :radio:checked').attr('value');
      map.activeCtl({ control: type, active: true });
      map.event.setFeatureAdded(function (data) { savePoly(data); });
    };
    var savePoly = function (data) {
      if (!(data === undefined)) {
        var ban = false;
        var size = data.length;
        if (size) { list = data; showList(); obj.showResults('measure'); }
        else {
          data.data.unit = $('#' + obj.id + '_measure_unitSet :radio:checked').attr('value');
          data.tools = [];
          if (!data.data.name || $.trim(data.data.name) === '') {
            var numItem = list.length + 1;
            var isLine = (data.data.type === 'line' || data.data.type === 'measureLine');
            data.data.name = (isLine ? 'Distancia ' : 'Área ') + numItem;
          }
          if (!data.data.description) { data.data.description = ''; }
          for (var x in list) { if (list[x].id == data.id) { ban = true; item = data; break; } }
          if (!ban) { list.push(data); }
          showList();
          $('#' + obj.id + '_measurePanel').attr('idref', data.id);
          obj.createPanel('measure');
          obj.curr_measure = data;
          obj.temporalView();
          obj.blinkElement(data.id);
          map.Feature.event({ select: true, id: data.id });
          map.Feature.event({ action: 'set', id: data.id, params: data });
        }
      }
    };
    if (map != null) {
      if (opc == 'none') { obj.options.map.activeCtl({ control: 'none', active: true }); }
      else {
        switch (opc) {
          case 'showList': showList(); break;
          case 'editPoly': editPoly(data); break;
          case 'setEvent': events(); break;
          case 'startNew': clickNew(); newPolygon(); break;
          case 'endCreation': clickEnd(); break;
          case 'addNew': newPolygon(); break;
        }
      }
    }
  },
  refreshLayers: function () { if (this.currentTool == 'buffer') { this.renderAnalysisPanel(); } },
  showBufferList: function () { this.renderAnalysisPanel(); },
  identificableToCombo: function (id, sel) {
    var obj = this;
    var baseLayers = obj.options.getBaseLayers();
    var list = obj.options.bufferLayers;
    var activeL = obj.options.getActiveLayers();
    var tactive = [];
    var cadena = '<select id="' + id + '_layer" idref="' + id + '" class="dinamicPanel-layerSelect">';
    if (sel == '') { cadena += '<option selected="selected" value="-1" alias="">Seleccione una capa</option>'; }
    for (var x in list) {
      var layer = list[x];
      for (var i in activeL) {
        if (layer.name == activeL[i].idLayer) {
          tactive.push(layer.name);
          var selec = (sel != '' && sel == layer.name) ? ' selected="selected" ' : '';
          cadena += '<option value="' + layer.name + '" alias="' + layer.alias + '" ' + selec + '>' + layer.alias + '</option>';
          break;
        }
      }
    }
    for (var x in list) {
      var layer = list[x];
      var blayer = baseLayers[layer.name];
      if (!(blayer === undefined) && (tactive.indexOf(layer.name) < 0)) {
        var selec = (sel != '' && sel == layer.name) ? ' selected="selected" ' : '';
        cadena += '<option value="' + layer.name + '" alias="' + layer.alias + '" ' + selec + '>' + layer.alias + '</option>';
      }
    }
    cadena += '</select>';
    return cadena;
  },
  dataSpinner: function (ban) {
    if (ban) { $('#' + this.id + '_spinner').addClass('ajax-loader'); }
    else { $('#' + this.id + '_spinner').removeClass('ajax-loader'); }
  },
  convertBufferLayerData: function (data) {
    var pointer = data.data.elements;
    var filterFields = function (label) {
      switch (label) {
        case 'ID': return '_id';
        case 'ubicacion': return '_hidden_extent';
        case 'tabla': return '_hidden_tabla';
      }
      return label;
    };
    for (var x in pointer) {
      var tabla = '', id = '';
      var row = pointer[x];
      var listf = row.fields;
      for (var i in listf) {
        var field = listf[i];
        field['label'] = filterFields(field.label);
        if (field.label == 'tabla') tabla = field.value;
        if (field.label == '_id') id = field.value;
      }
      listf.push({ label: '_btn_identificar', value: tabla, text: 'Informaci&oacute;n', sprite: 'dinamicPanel-sprite dinamicPanel-info' });
    }
    data.data.value = data.data.elements;
    delete data.data.elements;
    data.data.pageSize = 20;
    return data;
  },
  convertIdentifyData: function (data) {
    var pointer = data.data.value;
    var filterFields = function (label) {
      switch (label) {
        case 'ID': return '_id';
        case 'ubicacion': return '_hidden_extent';
        case 'tabla': return '_hidden_tabla';
      }
      return label;
    };
    if (pointer.length > 0) {
      pointer = pointer[0];
      var tabla = '', id = '';
      var row = pointer;
      row.fields = row.tables[0].fields.fields;
      data.data.recordCount = row.totalFields;
      data.data.currentPage = row.currentPage;
      data.data.tabla = row.tabla;
      tabla = row.tabla;
      var listf = row.fields;
      for (var i in listf) {
        var field = listf[i];
        field['label'] = filterFields(field.aliasName);
        if (field.label == 'tabla') tabla = field.value;
        if (field.label == '_id') id = field.value;
      }
      listf.push({ label: '_btn_identificar', value: tabla, text: 'Informaci&oacute;n', sprite: 'dinamicPanel-sprite dinamicPanel-info' });
      listf.push({ label: '_hidden_tabla', value: tabla });
      data.data.value = [{ fields: listf }];
      data.data.pageSize = 50;
      data.data.response = { success: true };
    }
    return data;
  },
  getBufferLayerData: function (idPoly, alias, layer) {
    // Fallback: si la nueva herramienta falla, se puede usar este método
    // Redirige a runAnalysis para que use el panel nuevo
    this.runAnalysis();
  },
  createPolyList: function (list) {
    var obj = this;
    var cadena = '';
    var escapeHtml = function (value) { return $('<div/>').text(value === undefined || value === null ? '' : value).html(); };
    if (typeof (list) != 'undefined') {
      var count = 0;
      for (var x in list) {
        var item = list[x];
        var value = obj.convertionUnit(item.data.unit, item.data.type, item.data.measure);
        var valueHtml = $('<div/>').html(value).html();
        var nameText = item.data.name || 'Sin nombre';
        var isLine = (item.data.type === 'line' || item.data.type === 'measureLine');
        var iconUnicode = isLine ? '\uF4D7' : '\uF5EE';
        var closeBtn = (item.lock === undefined)
          ? '<button type="button" pos="' + x + '" idref="' + item.id + '" class="dp-item-close feature-rem-button" title="Eliminar" aria-label="Eliminar"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>'
          : '';
        var editBtn = (item.lock === undefined)
          ? '<div class="dp-item-edit dinamicPanel-featureEditName" idref="' + item.id + '" title="Editar nombre" aria-label="Editar nombre"><i class="fa-solid fa-pencil" aria-hidden="true"></i></div>' +
            '<div class="dp-item-edit dinamicPanel-featureOkName" idref="' + item.id + '" style="display:none" title="Guardar" aria-label="Guardar"><i class="fa-solid fa-check" aria-hidden="true"></i></div>'
          : '<div class="dp-item-edit" aria-hidden="true"><i class="fa-solid fa-pencil" aria-hidden="true"></i></div>';
        var nameHtml = '<label class="dinamicPanel-featureName" idref="' + item.id + '" title="' + escapeHtml(nameText) + '">' + escapeHtml(nameText) + '</label>' +
          '<input type="text" id="inputText_' + item.id + '" value="' + escapeHtml(item.data.name || '') + '" idref="' + item.id + '" class="dinamicPanel-featureInputName" style="display:none">';
        cadena += '<div id="' + item.id + '" pos="' + count + '" class="dp-result-item dp-result-measure dinamicPanel-featureItem">';
        cadena += '  <div class="dp-item-icon dp-icon-measure"><i class="fa-solid" style="font-family:\'Font Awesome 6 Free\';font-weight:900" aria-hidden="true">' + iconUnicode + '</i></div>';
        cadena += '  ' + editBtn;
        cadena += '  <div class="dp-item-name">' + nameHtml + '</div>';
        cadena += '  <div class="dp-item-value">' + valueHtml + '</div>';
        cadena += '  ' + closeBtn;
        cadena += '</div>';
        count++;
      }
    }
    return cadena;
  },
  removeGeoList: function () {
    var map = this.options.map;
    for (var x in this.geo) { map.Feature.event({ action: 'delete', id: this.geo[x].id }); }
    this.geo = [];
    this.curr_geo = {};
  },
  getGeo: function (id) {
    var list = this.geo;
    if (this.geo && this.geo.length > 0) {
      for (var x in list) { if (list[x].id == id) { return list[x]; } }
    }
    return null;
  },
  geoControl: function (opc, data, enableAddress) {
    var obj = this;
    var list = obj.geo;
    var map = obj.options.map;
    var removeItem = function (pos, item) {
      var typeMark = item.type + '';
      switch (item.data.type) {
        case 'address': typeMark = 'georeferenceAddress';
        case 'point': map.Mark.event({ action: 'delete', items: [{ id: item.id }], type: typeMark }); break;
        default: map.Feature.event({ action: 'delete', id: item.id });
      }
      list.splice(pos, 1);
      map.activeCtl({ control: 'georeference', active: false });
      $("#" + obj.id + '_geo_btnExport').button(list.length == 0 ? 'disable' : 'enable');
      enableBufferPoints();
    };
    var showGeoList = function () {
      $('#' + obj.id + '_geo_result').html(obj.createGeoList(list));
      $('#' + obj.id + '_geo_result').addClass('dinamicPanel-detachedResult');
      $('.dinamicPanel-geoEditName').each(function () {
        $(this).off('click.dpGeoEditName').on('click.dpGeoEditName', function () {
          var idref = $(this).attr('idref');
          $(this).css('display', 'none');
          $('.dinamicPanel-geoOkName[idref="' + idref + '"]').css('display', '').off('click.dpGeoOkName').on('click.dpGeoOkName', function (event) {
            var idRef = $(this).attr('idref');
            var item = getGeo(idRef);
            if (item) { item.data.name = $('#inputText_' + idRef).val(); editGeo(item); }
            event.stopPropagation();
          });
          $('.dinamicPanel-geoName[idref="' + idref + '"]').css('display', 'none');
          $('#inputText_' + idref).css('display', '').focus();
          obj.setInputTextRestriction('inputText_' + idref, function (ban) {
            if (ban) { $('.dinamicPanel-geoOkName[idref="' + idref + '"]').css('display', ''); } else { $('.dinamicPanel-geoOkName[idref="' + idref + '"]').css('display', 'none'); }
          }, function () { if ($('#inputText_' + idref).val() != '') $('.dinamicPanel-geoOkName[idref="' + idref + '"]').click(); });
        });
      });
      $('.dinamicPanel-geoEditDesc').each(function () {
        $(this).off('click.dpGeoEditDesc').on('click.dpGeoEditDesc', function () {
          var idref = $(this).attr('idref');
          $(this).css('display', 'none');
          $('.dinamicPanel-geoOkDesc[idref="' + idref + '"]').css('display', '').off('click.dpGeoOkDesc').on('click.dpGeoOkDesc', function (event) {
            var idRef = $(this).attr('idref');
            var item = getGeo(idRef);
            if (item) { item.data.description = $('#inputText_' + idRef + '_description').val(); item.data.desc = item.data.description; editGeo(item); }
            event.stopPropagation();
          });
          $('.dinamicPanel-geoInfoI[idref="' + idref + '"]').css('display', 'none');
          $('#inputText_' + idref + '_description').css('display', '').focus();
          obj.setInputTextRestriction('inputText_' + idref + '_description', function (ban) {
            if (ban) { $('.dinamicPanel-geoOkDesc[idref="' + idref + '"]').css('display', ''); } else { $('.dinamicPanel-geoOkDesc[idref="' + idref + '"]').css('display', 'none'); }
          }, function () { if ($('#inputText_' + idref + '_description').val() != '') $('.dinamicPanel-geoOkDesc[idref="' + idref + '"]').click(); });
        });
      });
      $('.dp-result-geo .dp-geo-row-main').each(function () {
        $(this).off('click.dpGeoSelect').on('click.dpGeoSelect', function (e) {
          if ($(e.target).closest('.dp-item-edit, .dp-item-close, .dp-item-locate').length) return;
          var id = $(this).closest('.dinamicPanel-geoItem').attr('id');
          var item = getGeo(id);
          if (!item) return;
          map.Mark.event({ action: 'unselect', items: 'all', type: item.type });
          if (item.data.type == 'point') { map.Mark.event({ action: 'select', items: [{ id: item.id }], type: item.type }); }
          else { map.Feature.event({ select: true, id: id }); }
          e.stopPropagation();
        });
      });
      $('.dp-result-geo .geo-buffer-button').each(function () {
        $(this).off('click.dpGeoBuffer').on('click.dpGeoBuffer', function (e) {
          e.preventDefault(); e.stopPropagation();
          var id = $(this).attr('idref');
          var item = getGeo(id);
          if (!item) return;
          if (item.data.type === 'point' || item.data.type === 'address') {
            map.Mark.event({ action: 'addBuffer', items: [{ id: item.id }], type: item.type });
          } else {
            if (map.Feature && $.isFunction(map.Feature.addBufferGeoreference)) { map.Feature.addBufferGeoreference(item); }
            else if (map.Feature && $.isFunction(map.Feature.addBuffer)) { map.Feature.addBuffer(item.id); }
            else {
              obj.createPanel('buffer');
              if (map.Feature && $.isFunction(map.Feature.addArea)) { map.Feature.addArea({ id: item.id, table: '' }); }
            }
          }
        });
      });
      $('.dp-result-geo .dp-item-locate').each(function () {
        $(this).off('click.dpGeoLocate').on('click.dpGeoLocate', function (e) {
          var id = $(this).attr('idref');
          var item = getGeo(id);
          if (!item) return;
          switch (item.data.type) {
            case 'point': case 'address': map.Mark.event({ action: 'locate', id: id }); break;
            default: map.Feature.event({ select: false, action: 'locate', id: id });
          }
          e.stopPropagation();
        });
      });
      $('.dp-result-geo .geo-rem-button').each(function () {
        $(this).off('click.dpGeoRemove').on('click.dpGeoRemove', function (e) {
          var id = $(this).attr('idref');
          var pos = parseInt($(this).attr('pos'), 10);
          var item = getGeo(id);
          if (!item) return;
          if (id == $('#' + obj.id + '_geoPanel').attr('idref')) { $('#' + obj.id + '_geoPanel').attr('idref', ''); obj.createPanel('geo'); }
          removeItem(pos, item);
          obj.geoControl('showGeoList');
          e.stopPropagation();
        });
      });
      $('.dinamicPanel-panelResult .dinamicPanel-download').each(function () {
        $(this).off('click.dpGeoDownload').on('click.dpGeoDownload', function (e) {
          var id = $(this).attr('idref');
          var item = getGeo(id);
          if (item) { map.Tracking.Export(item); }
          e.stopPropagation();
        });
      });
      $('.dinamicPanel-geoPupup').each(function () {
        $(this).off('click.dpGeoPopup').on('click.dpGeoPopup', function () {
          var id = $(this).attr('idref');
          var item = getGeo(id);
          if (item) { map.showDataImporter(item.data.name, item.data.description); }
        });
      });
    };
    var enableBufferPoints = function () {
      var status = 'disable';
      for (var x in list) { if (list[x].data.type == 'point') { status = 'enable'; break; } }
      $("#" + obj.id + '_geo_btnCreateBuffers').button(status);
    };
    var clickNew = function () {
      $('#' + obj.id + '_geoPanel').attr('idref', '');
      $('#' + obj.id + '_geo_btnEndAction').css('display', '');
      $('#' + obj.id + 'geo_btnFinish').css('display', '');
      $('#' + obj.id + '_geo_line').prop('checked', true);
      $('#' + obj.id + '_geo_typeSet').buttonset('refresh').css('display', '');
      setTimeout(function () { $('#' + obj.id + '_geo_typeSet :radio:checked').click(); }, 100);
    };
    var clickEnd = function () {
      $('#' + obj.id + '_geo_btnEndAction').css('display', 'none');
      $('#' + obj.id + '_geo_btnFinish').css('display', 'none');
      $('#' + obj.id + '_geo_typeSet').css('display', '');
      obj.createPanel('geo');
      obj.geoControl('none');
    };
    var editGeo = function (item) {
      if (item.data.type == 'point') {
        map.Mark.event({ action: 'set', items: [{ id: item.id }], type: item.type, params: { nom: item.data.name, desc: item.data.description } });
      } else {
        map.Feature.event({ action: 'set', id: item.id, params: item });
      }
      obj.geoControl('showGeoList');
      obj.createPanel('geo');
    };
    var getGeo = function (id) {
      var result = null;
      for (var x in list) { if (list[x].id == id) { result = list[x]; break; } }
      return result;
    };
    var events = function () {
      type = $('#' + obj.id + '_geo_typeSet :radio:checked').attr('value');
      var activeAddress = ($('#' + obj.id + '_geo_address').attr('active') != undefined) ? true : false;
      if (activeAddress) { type = $('#' + obj.id + '_geo_address').attr('value'); }
      map.activeCtl({ control: type, active: true });
      map.event.setEventGeoAdded(function (data, multiple) { saveGeo(data, multiple); });
    };
    var newGeo = function () {
      $('#' + obj.id + '_geo_btnEndAction').css('display', '');
      $('#' + obj.id + '_geo_btnFinish').css('display', '');
      $('#' + obj.id + '_geo_typeSet').css('display', 'none');
      obj.geoControl('declareEvents');
    };
    var saveGeo = function (data, multiple) {
      var ref = multiple ? data[data.length - 1] : data;
      if (!(data === undefined) && ref.type == 'georeference') {
        var ban = false;
        ref.data.unit = $('#' + obj.id + '_geo_unitSet :radio:checked').attr('value');
        if (typeof multiple === 'undefined') {
          data.tools = (data.data.address) ? ['geoInfo'] : ['geobuffer'];
          if (data.data.tracking) { data.tools = ['download', 'info']; }
          for (var x in list) { if (list[x].id == data.id) { ban = true; item = data; break; } }
          if (!ban) { list.push(data); }
        } else {
          for (var x in data) {
            data[x].tools = (data[x].data.address) ? ['geoInfo'] : ['geobuffer'];
            if (data[x].data.tracking) { data[x].tools = ['download', 'info']; }
            list.push(data[x]);
          }
        }
        showGeoList();
        $('#' + obj.id + '_geoPanel').attr('idref', ref.id);
        obj.createPanel('geo');
        obj.curr_geo = ref;
        obj.temporalView();
        obj.blinkElement(ref.id);
        map.Feature.event({ select: true, id: ref.id });
        map.Feature.event({ action: 'set', id: ref.id, params: ref });
        $("#" + obj.id + '_geo_btnExport').button('enable');
        enableBufferPoints();
      }
    };
    var bufferPoits = function () { map.Mark.addBufferAll(); };
    if (map != null) {
      if (opc == 'none') { obj.options.map.activeCtl({ control: 'none', active: true }); }
      else {
        switch (opc) {
          case 'showGeoList': showGeoList(); break;
          case 'editGeo': editGeo(data); break;
          case 'startNew': clickNew(); newGeo(); break;
          case 'endCreation': clickEnd(); break;
          case 'addNew': newGeo(); break;
          case 'declareEvents': events(); break;
          case 'appyBuffersForAllPoints': bufferPoits(); break;
          case 'enableBufferPoints': enableBufferPoints(); break;
        }
      }
    }
  },
  getAbstract: function (data) {
    var text = (data.text == undefined) ? 'Sin descripci&oacute;n' : data.text;
    if (text.length > data.max) { text = text.substring(0, data.max); text += data.sufix; }
    return text;
  },
  hasHtml: function (text) {
    if (text.match(/<(\w+)((?:\s+\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/)) { return true; }
    return false;
  },
  createGeoList: function (list) {
    var obj = this;
    var cadena = '';
    var escapeHtml = function (value) { return $('<div/>').text(value === undefined || value === null ? '' : value).html(); };
    if (typeof (list) != 'undefined') {
      var count = 0;
      for (var x in list) {
        var item = list[x];
        var hasHTML = obj.hasHtml(((item.data.description) ? item.data.description : ''));
        var value = (item.data.desc) ? item.data.desc : item.data.description;
        var temValue = obj.getAbstract({ text: value, max: 60, sufix: '…' });
        var valueTitle = (item.data.name) ? item.data.name : item.data.nom;
        var geoIconUnicode = '\uF3C5';
        if (item.data.type === 'line') { geoIconUnicode = '\uF4D7'; }
        else if (item.data.type === 'polygon' || item.data.type === 'poly') { geoIconUnicode = '\uF5EE'; }
        var leftIcon = '<i class="fa-solid" style="font-family:\'Font Awesome 6 Free\';font-weight:900" aria-hidden="true">' + geoIconUnicode + '</i>';
        var closeBtn = '<button type="button" pos="' + x + '" idref="' + item.id + '" class="dp-item-close geo-rem-button" title="Eliminar" aria-label="Eliminar"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>';
        var bufferBtn = '<button type="button" class="dp-item-locate geo-buffer-button" idref="' + item.id + '" title="Generar área de influencia" aria-label="Generar área de influencia"><i class="fa-solid fa-location-dot" aria-hidden="true"></i></button>';
        var editTop = '<div class="dp-item-edit dinamicPanel-geoEditName" idref="' + item.id + '" title="Editar nombre" aria-label="Editar nombre"><i class="fa-solid fa-pencil" aria-hidden="true"></i></div>' +
          '<div class="dp-item-edit dinamicPanel-geoOkName" idref="' + item.id + '" style="display:none" title="Guardar" aria-label="Guardar"><i class="fa-solid fa-check" aria-hidden="true"></i></div>';
        var editBottom = '<div class="dp-item-edit dinamicPanel-geoEditDesc" idref="' + item.id + '" style="' + (((item.data.address) || (item.data.tracking)) ? 'display:none' : '') + '" title="Editar descripción" aria-label="Editar descripción"><i class="fa-solid fa-pencil" aria-hidden="true"></i></div>' +
          '<div class="dp-item-edit dinamicPanel-geoOkDesc" idref="' + item.id + '" style="display:none" title="Guardar" aria-label="Guardar"><i class="fa-solid fa-check" aria-hidden="true"></i></div>';
        var nameRow = '<div class="dp-item-name">' +
          '<label class="dinamicPanel-geoName" idref="' + item.id + '" title="' + escapeHtml(valueTitle || '') + '">' + escapeHtml(valueTitle || '') + '</label>' +
          '<input type="text" id="inputText_' + item.id + '" value="' + escapeHtml(item.data.name || '') + '" idref="' + item.id + '" class="dinamicPanel-geoInputName" style="display:none">' +
          '</div>';
        var descRow = '<div class="dp-item-desc">' +
          '<label class="dinamicPanel-geoInfoI" idref="' + item.id + '" title="' + escapeHtml(hasHTML ? '' : value) + '">' + escapeHtml(hasHTML ? '' : temValue) + '</label>' +
          '<input type="text" id="inputText_' + item.id + '_description" value="' + escapeHtml(hasHTML ? '' : item.data.description) + '" idref="' + item.id + '" class="dinamicPanel-geoInputDesc" style="display:none">' +
          '</div>';
        cadena += '<div id="' + item.id + '" pos="' + count + '" class="dp-result-item dp-result-geo dinamicPanel-geoItem">';
        cadena += '  <div class="dp-geo-col dp-geo-col-icon"><div class="dp-item-icon">' + leftIcon + '</div></div>';
        cadena += '  <div class="dp-geo-col dp-geo-col-edits">';
        cadena += '    <div class="dp-geo-edit-cell">' + editTop + '</div>';
        cadena += '    <div class="dp-geo-edit-cell dp-geo-edit-cell-bottom">' + editBottom + '</div>';
        cadena += '  </div>';
        cadena += '  <div class="dp-geo-col dp-geo-col-content">';
        cadena += '    <div class="dp-geo-name-cell">' + nameRow + '</div>';
        cadena += '    <div class="dp-geo-desc-cell">' + descRow + '</div>';
        cadena += '  </div>';
        cadena += '  <div class="dp-geo-col dp-geo-col-buffer">' + bufferBtn + '</div>';
        cadena += '  <div class="dp-geo-col dp-geo-col-close">' + closeBtn + '</div>';
        cadena += '</div>';
        count++;
      }
    }
    return cadena;
  },
  pointControl: function (opc, data) {
    var obj = this;
    var list = obj.points;
    var map = obj.options.map;
    var removeItem = function (pos, id) {
      map.Poi.event({ action: 'delete', poi: id });
      list.splice(pos, 1);
      map.activeCtl({ control: 'poi', active: false });
      if (list.length == 0) { $("#" + obj.id + '_point_btnCreateBuffers').button("disable"); $("#" + obj.id + '_point_btnExport').button("disable"); }
    };
    var showList = function () {
      $('#' + obj.id + '_point_result').html(obj.createPointList(list));
      $('.dinamicPanel-pointEditName').each(function () {
        $(this).click(function (event) {
          var idref = $(this).attr('idref');
          $(this).css('display', 'none');
          $('.dinamicPanel-pointOkName[idref="' + idref + '"]').css('display', '').click(function () {
            var idRef = $(this).attr('idref');
            var item = getPoint(idRef);
            item.data.name = $('#inputText_' + idRef).val();
            editPoint(item);
          });
          $('.dinamicPanel-pointName[idref="' + idref + '"]').css('display', 'none');
          $('#inputText_' + idref).css('display', '').focus();
          obj.setInputTextRestriction('inputText_' + idref, function (ban) {
            if (ban) { $('.dinamicPanel-pointOkName[idref="' + idref + '"]').css('display', ''); } else { $('.dinamicPanel-pointOkName[idref="' + idref + '"]').css('display', 'none'); }
          }, function () { if ($('#inputText_' + idref).val() != '') $('.dinamicPanel-pointOkName[idref="' + idref + '"]').click(); });
          event.stopPropagation();
        });
      });
      $('.dinamicPanel-pointItem').each(function () {
        $(this).click(function (e) {
          var id = $(this).attr('id');
          map.Poi.event({ action: 'ubicate', poi: id });
          e.stopPropagation();
        });
      });
      $('.dinamicPanel-panelResult .dinamicPanel-buffer').each(function () {
        $(this).click(function (e) {
          var id = $(this).attr('idref');
          map.Poi.event({ action: 'addBuffer', poi: id });
          e.stopPropagation();
        });
      });
      $('.point-rem-button').each(function () {
        $(this).click(function (e) {
          var id = $(this).attr('idref');
          var pos = parseInt($(this).attr('pos'), 10);
          if (id == $('#' + obj.id + '_pointPanel').attr('idref')) { $('#' + obj.id + '_pointPanel').attr('idref', ''); obj.createPanel('point'); }
          removeItem(pos, id);
          obj.pointControl('showList');
          e.stopPropagation();
        });
      });
    };
    var clickNew = function () {
      $('#' + obj.id + '_pointPanel').attr('idref', '');
      $("#" + obj.id + '_point_btnEndAction').css('display', '');
      $("#" + obj.id + '_point_btnStartAction').css('display', 'none');
    };
    var clickEnd = function () {
      $("#" + obj.id + '_point_btnStartAction').css('display', '');
      $("#" + obj.id + '_point_btnEndAction').css('display', 'none');
      obj.createPanel('point');
      obj.pointControl('none');
    };
    var editPoint = function (item) {
      map.Poi.event({ action: 'set', poi: item.id, params: item });
      obj.pointControl('showList');
      obj.createPanel('point');
    };
    var getPoint = function (id) {
      var result = null;
      for (var x in list) { if (list[x].id == id) { result = list[x]; break; } }
      return result;
    };
    var newPoint = function () {
      map.activeCtl({ control: 'poi', active: true });
      map.event.setEventPoiAdded(function (data) {
        savePoint(data);
        $("#" + obj.id + '_point_btnCreateBuffers').button("enable");
        $("#" + obj.id + '_point_btnExport').button("enable");
      });
      map.event.setEventPoiCanceled(function () { clickEnd(); });
    };
    var savePoint = function (data) {
      var ban = false;
      data.tools = ['buffer'];
      for (var x in list) { if (list[x].id == data.id) { ban = true; item = data; break; } }
      if (!ban) { list.push(data); }
      showList();
      $('#' + obj.id + '_pointPanel').attr('idref', data.id);
      obj.createPanel('point');
      obj.curr_point = data;
      obj.temporalView();
      obj.blinkElement(data.id);
    };
    var applyBuffers = function () { map.Poi.generateBuffers(); };
    if (map != null) {
      if (opc == 'none') { obj.options.map.activeCtl({ control: 'none', active: true }); }
      else {
        switch (opc) {
          case 'showList': showList(); break;
          case 'editPoint': editPoint(data); break;
          case 'startNew': clickNew(); newPoint(); break;
          case 'endCreation': clickEnd(); break;
          case 'addNew': newPoint(); break;
          case 'appyBuffersForAll': applyBuffers(); break;
        }
      }
    }
  },
  createPointList: function (list) {
    var obj = this;
    var cadena = '';
    var getItemTools = function (item, pos) {
      var labels = { buffer: 'Asignar una &Aacute;rea de influencia', edit: 'Editar el elemento' };
      var cadena = '';
      for (var x in item.tools) {
        cadena += '<button idref="' + item.id + '" pos="' + pos + '" alt="' + labels[item.tools[x]] + '" title="' + labels[item.tools[x]] + '" type="' + item.tools[x] + '" class="dinamicPanel-pointBtn dinamicPanel-sprite dinamicPanel-' + item.tools[x] + '"></button>';
      }
      return cadena;
    };
    if (typeof (list) != 'undefined') {
      var count = 0;
      for (var x in list) {
        var item = list[x];
        var tools = (!(item.tools === undefined)) ? getItemTools(item, count) : '';
        var value = item.data.date;
        cadena += '<div id="' + item.id + '" pos="' + count + '" class="dinamicPanel-pointItem">';
        cadena += '  <span class="dinamicPanel-pointIcon dinamicPanel-sprite dinamicPanel-icon-' + item.data.type + '"></span>';
        cadena += '  <div class="dinamicPanel-editBtns">';
        cadena += '      <div class="dinamicPanel-pointEditName" idref="' + item.id + '"><span class="ui-icon ui-icon-pencil"></span></div>';
        cadena += '      <div class="dinamicPanel-pointOkName" idref="' + item.id + '" style="display:none"><span class="ui-icon ui-icon-check"></span></div>';
        cadena += '  </div>';
        cadena += '  <div class="dinamicPanel-pointText">';
        cadena += '      <label class="dinamicPanel-pointName" idref="' + item.id + '">' + item.data.name + '</label>';
        cadena += '      <input type="text" id="inputText_' + item.id + '" value="' + item.data.name + '" idref="' + item.id + '" class="dinamicPanel-pointInputName" style="display:none">';
        cadena += '      <label class="dinamicPanel-pointInfo">' + value + '</label>';
        cadena += '  </div>';
        cadena += '  <span pos="' + x + '" idref="' + item.id + '" class="point-rem-button dinamicPanel-sprite dinamicPanel-close-short"></span>';
        cadena += '  <div class="dinamicPanel-pointTools">' + tools + '</div>';
        cadena += '</div>';
        count++;
      }
    }
    return cadena;
  },
  createTabs: function () {
    var obj = this;
    var cadena = '';
    var width = 58;
    for (var x in obj.panels) {
      var item = obj.panels[x];
      if (item.id != "searchPanel") {
        cadena += '<div style="width:' + width + 'px" id="' + obj.id + '_' + item.id + '_tab" idref="' + item.id + '" alt="' + item.desc + '"  title="' + item.desc + '" class="dinamicPanel-tab"><div class="dinamicPanel-tabIconContainer"><center><span title="' + item.desc + '" class="' + item.icon + '"></span></center></div><span class="dinamicPanel-tabDescription">' + item.label + '</span><span class="dinamicPanel-selector dinamicPanel-hidde"></span></div>';
      }
    }
    return cadena;
  },
  createResultPanels: function () {
    var obj = this;
    var cadena = '';
    for (var x in obj.panels) {
      var item = obj.panels[x];
      cadena += '<div id="' + obj.id + '_' + item.type + '_result" style="display:none" class="dinamicPanel-panelResult"></div>';
    }
    return cadena;
  },
  createPanels: function () {
    var obj = this;
    var cadena = '';
    for (var x in obj.panels) {
      var item = obj.panels[x];
      cadena += '<div id="' + obj.id + '_' + item.id + '" style="display:none" class="dinamicPanel-panel"></div>';
    }
    return cadena;
  },
  openToolPanel: function (size) {
    var height = (size === undefined) ? 135 : size;
    var obj = this;
    $('#' + obj.id + '_toolSet').animate({ 'height': height + 'px' }, function () { obj.adjustResultHeight(); });
  },
  isToolPanelFill: function () { return ($('#' + this.id + '_' + this.currentTool + 'Panel').html() != ''); },
  isToolPanelOpen: function () { return ($('#' + this.id + '_toolSet').height() > 55); },
  closeToolPanel: function () {
    var obj = this;
    $('#' + obj.id + '_toolSet').animate({ 'height': '55px' }, function () { obj.adjustResultHeight(); });
    obj.showPanel();
  },
  switchToolPanel: function () {
    var open = ($('#' + this.id + '_toolSet').height() > 55);
    if (open) { this.closeToolPanel(); } else { this.openToolPanel(); }
  },
  getPanel: function (id) {
    for (var x in this.panels) { if (this.panels[x].id == id) { return this.panels[x]; } }
    return null;
  },
  stringAsType: function (text) {
    text = text.toLowerCase();
    text = text.replace(/[\u00E1]/gi, 'a').replace(/[\u00E9]/gi, 'e').replace(/[\u00ED]/gi, 'i').replace(/[\u00F3]/gi, 'o').replace(/[\u00FA]/gi, 'u').replace(/[\u00F1]/gi, 'n');
    text = text.replace(/&aacute;/g, 'a').replace(/&eacute;/g, 'e').replace(/&iacute;/g, 'i').replace(/&oacute;/g, 'o').replace(/&uacute;/g, 'u').replace(/&ntilde;/g, 'n');
    text = text.replace(/,/g, '').replace(/\s/g, '');
    return text;
  },
  hiddeResults: function (clear) {
    var obj = this;
    $('#' + this.id + '_results').attr('visible', false).fadeOut('fast', function () {
      $('#' + obj.id + '_pagination').hide();
      if (!(clear === undefined)) { $('#' + obj.id + '_search_result').html(''); }
    });
  },
  navResults: function (key) {
    var obj = this;
    if (obj.results.list.length > 0) {
      var index = obj.results.index;
      var list = obj.results.list;
      var ban = false;
      switch (key) {
        case 40: ban = true; if (index < (list.length - 1)) { index = index + 1; } else { index = 0; } break;
        case 38: ban = true; if (index > 0) { index = index - 1; } else { index = list.length - 1; } break;
        case 13: obj.clickOnResultItem(index); break;
      }
      obj.results.index = index;
      if (ban) {
        $('#' + obj.id + '_results .dinamicPanel-resultSelected').each(function () { $(this).removeClass('dinamicPanel-resultSelected'); });
        $('#' + obj.id + '_' + list[index].id).addClass('dinamicPanel-resultSelected');
      }
    } else { if (key == 13) { obj.clickOnResultItem(); } }
  },
  exportDetail: function (data, type) {
    var obj=this,$detail=$('#'+obj.id+'_detail'),payload=$detail.data('fichaEstadisticaPayload');
    if($detail.attr('data-panel-type')==='estadistico'&&payload){obj.exportStatisticalXls(payload,$detail);return;}
    var title=data.data.table.substring(0,data.data.table.length-3),cols=[{label:'Campo'},{label:'Valor'}],values=[],list=data.data.list;
    for(var x in list){var item=list[x];values.push([item.name,item.value.substring(7,item.value.length-8)]);}
    if(list)obj.exportList(title,cols,values,type);
  },
  exportStatisticalXls: function(payload,$detail){
    var obj=this,cols=[{label:'Nivel geográfico'},{label:'Clave geoestadística'},{label:'Tema'},{label:'Código'},{label:'Indicador'},{label:'Valor'},{label:'Unidad'},{label:'Tipo de valor'},{label:'Periodo'},{label:'Fuente'}],rows=[],themes=payload.temas||[];
    $.each(themes,function(_,theme){$.each(theme.indicadores||[],function(_,indicator){rows.push([payload.nivel_geo||'',payload.clave_objeto||'',theme.titulo||theme.tema||'',indicator.campo||'',indicator.descripcion||'',indicator.valor===null||indicator.valor===undefined?'':indicator.valor,indicator.unidad||'',indicator.tipoValor||indicator.tipo_valor||'',payload.periodo||2020,payload.fuente||'SCINCE 2020']);});});
    var name=$.trim($detail.find('.dinamicPanel-detailTitle').first().text())||'estadistica';
    name=('estadistica_'+name+'_'+(payload.clave_objeto||'')+'_'+(payload.periodo||2020)).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_]+/g,'_');
    if(!rows.length){obj.messageHeader('No hay indicadores para exportar');return;}
    obj.exportList(name,cols,rows,'xls');
  },
  exportList: function (title, cols, list, type) {
    var obj = this;
    var data = { title: title, columns: [], values: [] };
    for (var x in cols) { data.columns.push(cols[x].label); }
    for (var x in list) { data.values.push(list[x]); }
    var dataSource = $.extend(true, {}, obj.options.dataSource.exportList);
    var params = JSON.stringify(data);
    obj.getData(dataSource, params, function (dataRes) {
      if (dataRes.response.success) {
        var id = dataRes.data.id;
        window.location.assign(dataSource.urlGet + '/' + type + '/' + id);
      }
    });
  },
  reverseTranslateLayerByZoom: function (layer) {
    var r = layer;
    if (layer.substr(layer.length - 2, 1) == '_') {
      var item = this.options.getLayer(layer.substr(0, layer.length - 2));
      if (item) { r = item.idLayer; }
    }
    return r;
  },
  translateLayerByZoom: function (layer) {
    var item = this.options.getLayer(layer);
    var zoom = this.options.map.getZoomLevel();
    var r = layer;
    if (item && item.dinamicNameOnZoom && item.dinamicNameOnZoom['z_' + zoom]) { r += '_' + item.dinamicNameOnZoom['z_' + zoom]; }
    return r;
  },
  identifyPoint: function (data, byText) {
    var obj = this;
    var dataSource = obj.options.dataSource.identify;
    var proyName = obj.options.dataSource.proyName;
    var baseLayers = obj.options.getBaseLayers();
    var activeLayers;
    if (!obj.options.controlsMap.identify.fixedLayer) { activeLayers = obj.getActiveLayers(baseLayers); }
    else { activeLayers = obj.options.controlsMap.identify.fixedLayer; }
    var tactive = activeLayers.split(',');
    for (var x in tactive) { tactive[x] = obj.translateLayerByZoom(tactive[x]); }
    activeLayers = tactive.join();
    if (data) { obj.activeResult = { type: 'identify', data: data }; }
    var pointIdentify = { lon: data.lon, lat: data.lat };
    var params = { 'tables': activeLayers, 'project': proyName, 'x': data.lon, 'y': data.lat, 'resolution': obj.options.map.getResolution() };
    obj.getData(dataSource, JSON.stringify(params),
      function (dataRes) {
        if (!(dataRes === undefined)) {
          var tables = dataRes.data.tables;
          var success = dataRes.response.success;
          if (success && tables && tables.length > 0) {
            var firstTable = null, recCount = 0, tabCount = 0;
            var point = obj.options.map.transformToGeographic(data.lon, data.lat);
            var pointDegree = obj.options.map.transformToDegrees(data.lon, data.lat);
            var dataObject = {
              id: 'Informaci&oacute;n del punto:',
              name: '<div style="font-size:85%;float:left;clear:both">' + pointDegree.lon + ', ' + pointDegree.lat + '</div>' +
                '<div style="font-size:85%;float:left;clear:both">' + point.lon.toFixed(15) + ', ' + point.lat.toFixed(15) + '</div>' +
                '<div style="font-size:85%;float:left;clear:both" id="dinamicPanel_point_altimetry" point="' + data.lon + ',' + data.lat + '">Altura:Cargando...</div>'
            };
            var listTables = [];
            for (var t in tables) {
              tabCount++;
              var tabla = { label: tables[t].table, point: pointIdentify };
              var results = tables[t].elements;
              var idTabla = tables[t].alias;
              var tablaRecord = [];
              var wkt = null;
              var download = [];
              if (!firstTable) firstTable = idTabla;
              for (var r in results) {
                recCount++;
                var fields = results[r].fields;
                var record = {};
                for (var i in fields) {
                  var nameField = obj.stringAsType(fields[i].label.toLowerCase());
                  var type = nameField.substr(0, 3);
                  var canDisplay = (['(d)', '(s)', '(i)', '(h)', '(t)'].indexOf(type) >= 0);
                  if (canDisplay) {
                    nameField = obj.stringAsType(nameField.substr(3));
                    if (type == '(d)') { download.push({ label: fields[i].label.substr(3), value: fields[i].value }); }
                    else { record[nameField] = fields[i].label.substr(3) + '|' + fields[i].value; }
                  } else {
                    nameField = (nameField == 'wkt' || nameField == 'tabla' || nameField == 'id' || nameField == 'nombre') ? nameField : 'value';
                    record[nameField] = fields[i].value;
                    if (nameField == 'wkt') { wkt = fields[i].value.value; }
                  }
                }
                record['tabla'] = idTabla;
                record['download'] = download;
                tablaRecord.push(record);
              }
              tabla.list = tablaRecord;
              tabla.table = idTabla;
              if (wkt) { tabla.wkt = wkt; }
              listTables.push(tabla);
            }
            var lastItem = listTables[0].list[0];
            if (listTables[0].list.length == 1) { dataObject.tools = [{ type: 'info', id: lastItem.id, value: lastItem.tabla }]; }
            dataObject.tables = tabCount;
            dataObject.total = recCount;
            dataObject.list = listTables;
            if (obj.options.canShowDetail(obj.options.getActiveLayers())) {
              var translatedFirstTable = obj.reverseTranslateLayerByZoom(firstTable);
              var infoLayer = obj.options.getLayer(translatedFirstTable);
              var directRecord = null;
              if (listTables.length === 1 && listTables[0].list && listTables[0].list.length === 1) { directRecord = listTables[0].list[0]; }
              if (directRecord && directRecord.id !== undefined && directRecord.id !== null && directRecord.tabla) { obj.searchDetail(directRecord.id, directRecord.tabla); }
              else if (infoLayer && infoLayer.displayOnMarker) { obj.displayOnMarker(dataObject); }
              else { obj.showDetail(dataObject, 'identify', null, byText); }
            }
            obj.options.onIdentify(dataObject);
          }
        }
      },
      function (a, b) { console.log(a, b); },
      function () { $('#' + obj.id + '_spinner').addClass('ajax-loader'); },
      function () { $('#' + obj.id + '_spinner').removeClass('ajax-loader'); }
    );
  },
  searchDetail: function (id, table) {
    var obj = this;
    var dataSource = $.extend({}, obj.options.dataSource.identifyDetail);
    var specialTables = obj.options.dataSource.detailTableSpecial;
    if (specialTables.indexOf(table) >= 0) { table = table + '_sh'; }
    var proyName = obj.options.dataSource.proyName;
    obj.getData(dataSource,
      JSON.stringify({ 'id': id, 'table': table, 'project': proyName }),
      function (dataRes) {
        var tabla = dataRes.data;
        var dataObject = {};
        var _table = tabla.table;
        dataObject.id = _table.table;
        dataObject.tools = [];
        dataObject.list = [];
        dataObject.name = '';
        dataObject.table = _table.alias;
        dataObject.panelType = obj.readPanelTypeFromTable(_table);
        var fields = _table.elements[0].fields;
        for (var i in fields) {
          var field = fields[i].label.toLowerCase();
          var nameField = obj.stringAsType(field);
          switch (nameField) {
            case 'id': break;
            case 'nombre': dataObject.id = fields[i].value; break;
            case 'tabla': dataObject.table = fields[i].value; break;
            case 'buffer': case 'metadato': case 'ubicacion': case 'coordenada': case '_download': case '_sistemas': case '_gallery':
              var lab = (nameField.substr(0, 1) == '_') ? nameField.substr(1, nameField.length - 1) : nameField;
              if (fields[i].value != '') { dataObject.tools.push({ id: fields[i].value, type: lab, value: _table }); }
              break;
            default:
              dataObject.list.push({ name: fields[i].label, value: fields[i].value, field: (fields[i].name || fields[i].field || fields[i].column || '') });
          }
        }
        obj.showDetail(dataObject, 'identifyDeep');
      },
      function () { },
      function () { $('#' + obj.id + '_spinner').addClass('ajax-loader'); },
      function () { $('#' + obj.id + '_spinner').removeClass('ajax-loader'); }
    );
  },
  closeDetail: function () {
    var obj = this;
    obj.options.onCloseDetail();
    if ($('#' + obj.id + '_detail').html() != '') {
      $('#' + obj.id + '_detail').slideDown('fast', function () {
        $('#' + obj.id + '_detail').addClass('dinamicPanel-hidde').html('');
        $('#' + obj.id + '_detail').fadeOut('fast');
      });
    } else { $('#' + obj.id + '_detail').css('display', 'none'); }
    obj.moduleEvents({ id: 'closeDetail', value: null });
    $('#' + obj.id + '_detail').unbind('click');
  },
  clearSearch: function (keepInput) {
    var obj = this;
    obj.pagination = null;
    if (!keepInput) { $('#' + obj.id + '_inputSearch').val(''); }
    MDM6('deletePolygons', 'SpetialPolygons');
    obj.mapDeleteMarkers('search');
    obj.hiddeResults();
    obj.resetToSearchPanel();
    $('#' + obj.id + '_searchPanel').html('');
    obj.showPanel('searchPanel');
    $('#' + obj.id + '_inputSearch').focus();
    obj.activeResult = {};
  },
  resetToSearchPanel: function () {
    $('#' + this.id + '_search_result').html('');
    this.results.index = -1;
    this.results.list = [];
    this.lastSearch = '';
    this.searchType = 'search';
    this.showTools();
  },
  updateTextSearch: function (pos) {
    var obj = this;
    if (pos >= 0 || pos != '') {
      switch (typeof (pos)) {
        case 'object': $('#' + obj.id + '_inputSearch').focus().val(pos.busqueda); break;
        case 'string': $('#' + obj.id + '_inputSearch').focus().val(pos); break;
        case 'number': $('#' + obj.id + '_inputSearch').focus().val(obj.results.list[pos].busqueda); break;
      }
    }
  },
  normalizePanelType: function (value) {
    var type = $.trim(String(value || '')).toLowerCase();
    type = type.replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e').replace(/[íìïî]/g, 'i').replace(/[óòöô]/g, 'o').replace(/[úùüû]/g, 'u').replace(/ñ/g, 'n').replace(/[\s-]+/g, '_');
    if (type === 'estadistica' || type === 'statistics' || type === 'statistical') { return 'estadistico'; }
    if (type === 'obra' || type === 'obras' || type === 'obras_publicas' || type === 'public_works') { return 'obra_publica'; }
    return type || 'default';
  },
  readPanelTypeFromTable: function (tableData) {
    if (!tableData) { return 'default'; }
    var attrs = tableData.attributes || tableData.attrs || tableData.attribute || {};
    var value = tableData.panel || tableData.panelType || tableData.paneltype || tableData.tipo_panel || tableData.tipoPanel || tableData['@panel'] || attrs.panel || attrs.panelType || attrs.paneltype || attrs.tipo_panel;
    if (value && typeof value === 'object') { value = value.value || value.text || value._ || value['#text']; }
    return this.normalizePanelType(value);
  },
  getDetailPanelType: function (detail) {
    if (!detail) { return 'default'; }
    return this.normalizePanelType(detail.panelType || detail.panel || detail.paneltype || detail.tipo_panel || detail.tipoPanel);
  },

  detectJsonPanelType: function () {
      var obj = this;
      var $detail = $('#' + obj.id + '_detail');
      var detectedType = '';

      $detail
          .find('.dinamicPanel-detailList-item')
          .each(function () {
              var $item = $(this);

              var field = $.trim(
                  String(
                      $item.attr('data-field') || ''
                  )
              ).toLowerCase();

              var alias = $.trim(
                  $item.find('strong').first().text()
              ).toLowerCase();

              if (field.normalize) {
                  field = field
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '');
              }

              if (alias.normalize) {
                  alias = alias
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '');
              }

              var isJsonField =
                  field === 'ficha_json' ||
                  field === 'fichajson' ||
                  field === 'fichas_json' ||
                  field === 'fichasjson' ||
                  alias === 'ficha json' ||
                  alias === 'fichas json' ||
                  alias.indexOf('ficha json') >= 0 ||
                  alias.indexOf('fichas json') >= 0;

              if (!isJsonField) {
                  return true;
              }

              var rawValue = '';
              var $label = $item.find('label').first();

              if ($label.length) {
                  rawValue = $.trim($label.text());
              }

              if (!rawValue) {
                  rawValue = $.trim(
                      $item
                          .clone()
                          .children('strong')
                          .remove()
                          .end()
                          .text()
                  );
              }

              if (!rawValue) {
                  return true;
              }

              try {
                  var jsonText = rawValue;

                  if (
                      jsonText.charAt(0) !== '{' &&
                      jsonText.charAt(0) !== '['
                  ) {
                      jsonText = window.atob(jsonText);

                      try {
                          jsonText = decodeURIComponent(
                              Array.prototype.map
                                  .call(
                                      jsonText,
                                      function (character) {
                                          return '%' +
                                              (
                                                  '00' +
                                                  character
                                                      .charCodeAt(0)
                                                      .toString(16)
                                              ).slice(-2);
                                      }
                                  )
                                  .join('')
                          );
                      } catch (utf8Error) {
                          // Se conserva el resultado de atob().
                      }
                  }

                  var payload = JSON.parse(jsonText);

                  var moduleType = obj.normalizePanelType(
                      payload.modulo ||
                      payload.tipo_ficha ||
                      payload.tipoFicha
                  );

                  if (
                      moduleType === 'selector' ||
                      moduleType === 'seguridad' ||
                      moduleType === 'estadistico' ||
                      moduleType === 'obra_publica'
                  ) {
                      detectedType = moduleType;
                      return false;
                  }

                  if (
                      payload.temas ||
                      payload.indicadores ||
                      payload.nivel_geo ||
                      payload.clave_objeto
                  ) {
                      detectedType = 'estadistico';
                      return false;
                  }
              } catch (error) {
                  if (window.console && console.warn) {
                      console.warn(
                          '[dinamicPanel] No se pudo interpretar el JSON.',
                          error
                      );
                  }
              }

              return true;
          });

      return detectedType;
  },
  detectDetailPanelType: function (panelType) {
      var obj = this;

      /*
      * Primero se revisa el JSON.
      * El JSON tiene prioridad porque distingue:
      * selector, estadístico, seguridad y obra pública.
      */
      var jsonPanelType = obj.detectJsonPanelType();

      if (jsonPanelType) {
          return jsonPanelType;
      }

      /*
      * Si no existe JSON interpretable,
      * se respeta el panel declarado en mdm6.xml.
      */
      var normalized = obj.normalizePanelType(panelType);

      if (normalized !== 'default') {
          return normalized;
      }

      var $detail = $('#' + obj.id + '_detail');
      var hasStatisticalJson = false;

      $detail.find('.dinamicPanel-detailList-item').each(function () {
          var $item = $(this);

          var field = $.trim(
              String($item.attr('data-field') || '')
          ).toLowerCase();

          var alias = $.trim(
              $item.find('strong').first().text()
          ).toLowerCase();

          if (field.normalize) {
              field = field.normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '');
          }

          if (alias.normalize) {
              alias = alias.normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '');
          }

          if (
              field === 'ficha_json' ||
              field === 'fichajson' ||
              alias === 'ficha json' ||
              alias === 'json estadistico' ||
              alias.indexOf('ficha json') >= 0
          ) {
              hasStatisticalJson = true;
              return false;
          }
      });

      if (hasStatisticalJson) {
          return 'estadistico';
      }

      var securityFields = {
          t_faltas: true,
          t_osi: true,
          t_robos: true,
          t_violencia: true,
          t_incidencias: true,
          tasa_incidencia: true,
          nivel_incidencia: true
      };

      var publicWorksFields = {
          nombre_obra: true,
          tipo_obra: true,
          descripcion_obra: true,
          monto: true,
          inversion: true,
          avance_fisico: true,
          avance_financiero: true,
          contratista: true,
          beneficiarios: true
      };

      var statisticalFields = {
          pobtot: true,
          pobmas: true,
          pobfem: true,
          pob0_14: true,
          pob15_64: true,
          pob65_mas: true,
          p_60ymas: true,
          tothog: true,
          tvivparhab: true,
          pea: true,
          pocupada: true,
          pdesocup: true
      };

      var securityAliases =
          /total faltas|total osi|total robos|total violencia|total incidencias|tasa de incidencia|nivel de incidencia/;

      var publicWorksAliases =
          /obra publica|nombre de la obra|tipo de obra|monto|inversion|avance fisico|avance financiero|contratista|beneficiarios/;

      var statisticalAliases =
          /poblacion|hogares|viviendas|escolaridad|salud|economicamente activa|ocupada|desocupada/;

      var securityCount = 0;
      var publicWorksCount = 0;
      var statisticalCount = 0;

      $detail
          .find('.dinamicPanel-detailList-item')
          .each(function () {
              var field = $.trim(
                  String(
                      $(this).attr('data-field') || ''
                  )
              ).toLowerCase();

              var alias = $.trim(
                  $(this)
                      .find('strong')
                      .first()
                      .text()
              ).toLowerCase();

              if (field.normalize) {
                  field = field
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '');
              }

              if (alias.normalize) {
                  alias = alias
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '');
              }

              if (
                  securityFields[field] ||
                  securityAliases.test(alias)
              ) {
                  securityCount++;
              }

              if (
                  publicWorksFields[field] ||
                  publicWorksAliases.test(alias)
              ) {
                  publicWorksCount++;
              }

              if (
                  statisticalFields[field] ||
                  statisticalAliases.test(alias)
              ) {
                  statisticalCount++;
              }
          });

      if (securityCount >= 2) {
          return 'seguridad';
      }

      if (statisticalCount >= 3) {
          return 'estadistico';
      }

      if (publicWorksCount >= 2) {
          return 'obra_publica';
      }

      return 'default';
  },
  renderDetailPanel: function (panelType, detailData) {
    var obj = this;
    panelType = obj.detectDetailPanelType(panelType);
    var $container = $('#' + obj.id + '_detail');
    $container.attr('data-panel-type', panelType);
    if (!window.DinamicPanelFichaRegistry) {
      if (window.console && console.error) console.error('[dinamicPanel] No se cargo ficha.registry.js');
      return;
    }
    window.DinamicPanelFichaRegistry.render(panelType, {
      widget: obj,
      container: $container,
      data: detailData || {},
      templateBaseUrl: obj.options.fichasBaseUrl || 'fichas/'
    });

    obj.scheduleFichaUiAdjustments();
  },

  scheduleFichaUiAdjustments: function () {
    var obj = this;

    window.clearTimeout(obj.fichaUiTimerShort);
    window.clearTimeout(obj.fichaUiTimerLong);

    obj.fichaUiTimerShort = window.setTimeout(function () {
      obj.adjustFichaDetailLayout();
    }, 50);

    obj.fichaUiTimerLong = window.setTimeout(function () {
      obj.adjustFichaDetailLayout();
    }, 250);
  },

  openFichaSelector: function () {
    var obj = this;
    var origin = obj.fichaSelectorOrigen;

    if (!origin || origin.id === null || origin.id === undefined || !origin.tabla) {
      obj.messageHeader('No se encontro el objeto geografico de origen.');
      return;
    }

    obj.searchDetail(parseInt(origin.id, 10), String(origin.tabla));
  },

  adjustFichaDetailLayout: function () {
    var obj = this;
    var $detail = $('#' + obj.id + '_detail');
    var panelType = $detail.attr('data-panel-type') || 'default';

    if (!$detail.length) return;

    var $content = $detail.find('.dinamicPanel-detailContent').first();
    var $footer = $detail.find('.dinamicPanel-detailList-exportTools').first();
    var $tools = $detail.find('.dinamicPanel-detailTools').first();

    $detail.find('.dinamicPanel-fichaBackButton').remove();

    if (panelType === 'selector') {
      $detail.addClass('dinamicPanel-detail-selectorCompact');
      $footer.hide();
      $tools.hide();

      $detail.add($content).css({
        height: 'auto',
        minHeight: '0',
        maxHeight: 'none',
        overflow: 'visible'
      });

      $detail.find('.dinamicPanel-detailFieldsGrid, .dp-selector-ficha').css({
        height: 'auto',
        minHeight: '0',
        maxHeight: 'none'
      });

      return;
    }

    $detail.removeClass('dinamicPanel-detail-selectorCompact');
    $detail.add($content).css({
      height: '',
      minHeight: '',
      maxHeight: '',
      overflow: ''
    });

    if ($tools.length) $tools.show();

    if (
      panelType !== 'default' &&
      obj.fichaSelectorOrigen &&
      obj.fichaSelectorOrigen.tabla
    ) {
      if (!$footer.length) {
        $footer = $('<div/>', {
          'class': 'dinamicPanel-detailList-exportTools'
        }).appendTo($content.length ? $content : $detail);
      }

      $footer.show();

      $('<button/>', {
        type: 'button',
        'class': 'dinamicPanel-detailExportButton dinamicPanel-fichaBackButton',
        title: 'Regresar al selector',
        'aria-label': 'Regresar al selector'
      })
        .append($('<i/>', {
          'class': 'fa-solid fa-arrow-left',
          'aria-hidden': 'true'
        }))
        .append($('<span/>').text('Selector'))
        .prependTo($footer);
    } else if ($footer.length) {
      $footer.show();
    }

    $detail
      .off('click.fichaBack', '.dinamicPanel-fichaBackButton')
      .on('click.fichaBack', '.dinamicPanel-fichaBackButton', function (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        obj.openFichaSelector();
        return false;
      });
  },

  isDetailOpen: function () {
    return ($('#' + this.id + '_detail').html() != '') && ($('#' + this.id + '_detail').is(':visible'));
  },
  enableDetailDrag: function () {
    var $detail = $('#' + this.id + '_detail');
    if (!$detail.length || !$.fn.draggable) return;
    try { if ($detail.hasClass('ui-draggable')) { $detail.draggable('destroy'); } } catch (e) { }
    $detail.draggable({
      handle: '.dinamicPanel-detailHeader',
      cancel: '.dinamicPanel-detailClose, a, button, input, select, textarea',
      containment: 'window',
      scroll: false,
      start: function () { $(this).addClass('is-dragging'); },
      stop: function () { $(this).removeClass('is-dragging'); }
    });
  },
  displayOnMarker: function (info) {
    var obj = this;
    var position = (info.list && info.list.length > 0) ? info.list[0].point : null;
    var list = info.list[0].list[0];
    var image = (list.imagen) ? list.imagen.split('|')[1] : null;
    var pdf = (image) ? image.substr(0, (image.length - 3)) + 'pdf' : null;
    var id = list.id;
    var table = list.tabla;
    var wkt = list.wkt;
    var download = (list.download) ? list.download : null;
    var ficha = (list.ficha) ? list.ficha.split('|')[1] : null;
    var detalle = (list.detalle) ? list.detalle.split('|')[1] : null;
    if (wkt) {
      MDM6('deletePolygons', 'SpetialPolygons');
      MDM6('addPolygon', wkt, { fColor: "none", lSize: 2, lColor: "#66C5CC", lType: "line", type: 'buffer', clearFeatures: true, layer: 'SpetialPolygons' });
    }
    delete list.imagen; delete list.id; delete list.tabla; delete list.wkt;
    delete list.download; delete list.ficha; delete list.detalle;
    var cadena = '<div id="dinamicPanel_markDetail_container" class="dinamicPanel-markDetail-container">';
    if (image) { cadena += '	<a href="' + pdf + '" target="_blank"><div class="dinamicPanel-markDetail-image" style="background-image:url(' + image + ');"></div></a>'; }
    cadena += '	<div class="dinamicPanel-markDetail-content">';
    if (ficha) { cadena += ficha; }
    cadena += '</div>';
    if (detalle) { cadena += '<div id="dinamicPanel_markDetail_btn" class="dinamicPanel-markDetail-btn">Ver detalle</div>'; }
    setTimeout(function () {
      obj.options.markerWithText(position, cadena, function () {
        $('#dinamicPanel_markDetail_btn').click(function () {
          obj.options.systemMessage(detalle, { width: 450, height: 350 });
          setTimeout(function () {
            $('.service-container-title').each(function () {
              $(this).click(function () {
                var parent = $(this).parent();
                var open = parent.attr('_open');
                parent.attr('_open', !(open == 'true'));
              });
            });
          }, 500);
        });
      });
    }, 100);
  },
  showPolygon: function (polygon) {
    MDM6('deletePolygons', 'SpetialPolygons');
    MDM6('addPolygon', polygon, { fColor: "none", lSize: 2, lColor: "#66C5CC", lType: "line", type: 'buffer', clearFeatures: true, layer: 'SpetialPolygons' });
  },
showDetail: function (pos, type, hidde, byText) {
    var obj = this;
    obj.clearSearch(((byText) ? true : false));
    obj.moduleEvents({ id: 'showDetail', value: null });
    if (type == 'content') {
      var content = pos.content;
      var onClose = pos.onClose;
      var onCreate = pos.onCreate;
      var cadena = '<div class="dinamicPanel-detailContent">';
      cadena += '  <div class="">';
      cadena += '  	<div class="dinamicPanel-detailClose"><span id="' + obj.id + '_btnDetailClose" class="dinamicPanel-sprite dinamicPanel-close-short"></span></div>';
      cadena += '  	<div id="dinamicPanel_customDetail_title" class="dinamicPanel-customDetail-title"></div>';
      cadena += '  	<div id="dinamicPanel_customDetail_header" class="dinamicPanel-customDetail-header"></div>';
      cadena += content;
      cadena += '		</div>';
      cadena += '	</div>';
      var $detalle = $('#' + obj.id + '_detail');
      $detalle.stop(true, false);
      $detalle.removeClass('dinamicPanel-hidde').html(cadena).css('display', 'block');
      obj.enableDetailDrag();
      if ($.isFunction(onCreate)) { onCreate(); }
      $('#' + obj.id + '_btnDetailClose').click(function (e) {
        if ($.isFunction(onClose)) { onClose(); }
        obj.closeDetail();
        obj.panelTransparency();
        e.stopPropagation();
      });
    } else {
      if (!(pos === undefined)) {
        obj.hiddeResults();
        var showDownload = true;
        var item = (typeof (pos) != 'object') ? obj.results.list[pos] : pos;
        var detailPanelType = obj.getDetailPanelType(item);
        var id = (item.id === undefined) ? '' : item.id;
        if (id.substring(0, 15) == '<!DOCTYPE html>') { showDownload = false; }
        var desc = item.name;
        var mainId = '<b>' + id + '</b></br>' + desc;
        var list = item.list;
        var extent = '';
        var coordenada = '';
        var cadena = '<div class="dinamicPanel-detailContent">';
        cadena += '  <div class="dinamicPanel-detailHeader"><div class="dinamicPanel-detailTitle">' + id + '</div>';
        cadena += '      <button type="button" id="' + obj.id + '_btnDetailClose" class="dinamicPanel-detailClose" title="Cerrar detalle" aria-label="Cerrar detalle"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>';
        cadena += '      <div class="dinamicPanel-detailDescription">' + desc + '</div>';
        cadena += '  </div>';
        if (!(item.tools === undefined)) {
          var tools = item.tools;
          cadena += '  <div class="dinamicPanel-detailTools">';
          for (var x in tools) {
            var tool = tools[x];
            if (tool.type != 'ubicacion' && tool.type != 'coordenada') {
              var idTable = (typeof (tool.value) == 'object') ? tool.value.alias : tool.value;
              var detailToolIcons = { info: 'fa-circle-info', metadato: 'fa-file-lines', buffer: 'fa-draw-polygon', gallery: 'fa-images', download: 'fa-download', sistemas: 'fa-globe' };
              var detailToolLabels = { info: 'Ver información', metadato: 'Consultar metadato', buffer: 'Generar área de influencia', gallery: 'Abrir galería', download: 'Descargar', sistemas: 'Abrir sistema relacionado' };
              var iconClass = detailToolIcons[tool.type] || 'fa-ellipsis';
              var toolLabel = detailToolLabels[tool.type] || 'Acción';
              cadena += '<div idref="' + tool.id + '" tableref="' + idTable + '" title="' + toolLabel + '" aria-label="' + toolLabel + '" class="dinamicPanel-detailToolButton dinamicPanel-btn-' + tool.type + '"><i class="fa-solid ' + iconClass + '" aria-hidden="true"></i></div>';
            } else {
              switch (tool.type) {
                case 'ubicacion': extent = tool.id; break;
                case 'coordenada': coordenada = tool.id; break;
              }
            }
          }
          cadena += '  </div>';
        }
        var rlist = [];
        var rowLines = [];
        if (!(list === undefined)) {
          rlist = [];
          if (type != 'identify') { cadena += '<div class="dinamicPanel-detailFieldsGrid">'; }
          var count = 0;
          var mainLabel = '';
          var prefijo = '';
          var isMultiple = (list[0] && list[0].list && list[0].list.length > 1);
          $('#' + obj.id + '_detail').attr('ismultiple', isMultiple);
          for (var x in list) {
            if (type == 'identify') {
              $('#' + obj.id + '_detail').attr('isidentify', 'true');
              var innerList = list[x].list;
              if (innerList.length == 1) {
                if (x == 0) { prefijo = list[x].label + ' '; mainLabel = list[x].list[0].nombre; }
                else { rlist.push(list[x].list[0].nombre); }
              } else { rowLines = rowLines.concat(innerList); }
            } else {
              $('#' + obj.id + '_detail').attr('isidentify', 'false');
              var item = list[x];
              var tcadena = '';
              if (typeof (item.value) == 'string' && item.value.indexOf('|') >= 0) {
                var values = item.value.split('|');
                if (values.length > 2) {
                  item.name = values[0];
                  var type = values[1].split(',')[0];
                  var labelObj = values[1].split(',')[1];
                  var displayPlace = values[1].split(',')[2];
                  var url = values[2];
                  if (/boton/.test(type)) { item.value = '<div title="' + labelObj + '" aria-label="' + labelObj + '" label="' + item.name + '" url="' + url + '" contenttype="html" target="' + displayPlace + '" class="dinamicPanel-html-btn"><i class="fa-solid fa-file-lines" aria-hidden="true"></i></div>'; }
                } else {
                  item.value = (item.value.search('https') > -1) ? '<a href="' + item.value.split('|')[1] + '" target="_blank">' + item.value.split('|')[0] + '</a>' : item.value;
                  item.value = '<label>' + item.value + '</label>';
                }
              } else {
                if (typeof (item.value) == 'number') { item.value = item.value.toString(); }
                if (item.name != '_image') { item.value = item.value.linkify(); item.value = '<label>' + item.value + '</label>'; }
              }
              if (item.name == '_image') { cadena += '<div class="dinamicPanel-detailList-item"><image src="' + item.value + '" width="100%" /></div>'; }
              else {
                var fieldMnemonic = item.field || item.nameField || item.mnemonic || item.nemonico || '';
                cadena += '<div class="dinamicPanel-detailList-item" data-field="' + $('<div/>').text(String(fieldMnemonic).toLowerCase()).html() + '"><strong>' + item.name + ' </strong>' + item.value + tcadena + '</div>';
              }
            }
          }
          if (type != 'identify') { cadena += '</div>'; }
          if (type == 'identify') {
            rlist = rlist.toString();
            cadena += '   <div class="dinamicPanel-detailPoint">';
            cadena += '       <div class="dinamicPanel-detailMainLabel"><label>' + prefijo + '</label>' + mainLabel + '</div>';
            cadena += '       <div class="dinamicPanel-detailUbication">' + rlist + '</div>';
            cadena += '  </div>';
          }
        }
        if (rowLines.length > 0) {
          var count = 0;
          cadena += '<div class="dinamicPanel-detailList-container">';
          for (var x in rowLines) {
            var item = rowLines[x];
            cadena += '<div class="dinamicPanel-detailList-item"><label>' + item.nombre + '</label><span idref="' + item.id + '" tableref="' + item.tabla + '" title="Ver información" aria-label="Ver información" class="dinamicPanel-btn-info"><i class="fa-solid fa-circle-info" aria-hidden="true"></i></span></div>';
            count++;
            if (count >= 10) { break; }
          }
          cadena += '</div>';
        }
        if (type == 'identifyDeep' && showDownload) {
          obj.lastDetailResults = { data: pos, type: type };
          cadena += '<div class="dinamicPanel-detailList-exportTools">';
          cadena += '<button type="button" class="dinamicPanel-detailExportButton dinamicPanel-export-xls" id="dinamicPanel_exportDetail_xls" title="Descargar XLS" aria-label="Descargar XLS"><i class="fa-solid fa-file-excel" aria-hidden="true"></i><span>XLS</span></button>';
          cadena += '<button type="button" class="dinamicPanel-detailExportButton dinamicPanel-export-csv" id="dinamicPanel_exportDetail_csv" title="Descargar CSV" aria-label="Descargar CSV"><i class="fa-solid fa-file-csv" aria-hidden="true"></i><span>CSV</span></button>';
          cadena += '</div>';
        }
        cadena += '</div>';
        $('#' + obj.id + '_detail').css('display', 'none');
        $('#' + obj.id + '_detail').removeClass('dinamicPanel-hidde').html(cadena).slideDown('slow');
        obj.renderDetailPanel(detailPanelType, item);
        obj.enableDetailDrag();

        /* =====================================================
           BOTÓN BUFFER UNIVERSAL — SOLO GUINDA, SIN DUPLICADOS
           ===================================================== */
        var COLOR_GUINDA = '#8B1A4A';
        var $detail = $('#' + obj.id + '_detail');

        // 1) Localizar el botón de buffer original (solo debe haber uno en .dinamicPanel-detailTools)
        var $bufferOriginal = $detail.find('.dinamicPanel-detailTools .dinamicPanel-btn-buffer').first();

        // 2) Localizar/crear el footer de export tools
        var $footer = $detail.find('.dinamicPanel-detailList-exportTools').first();

        // 3) Asegurar que exista el footer (para paneles que no lo traen, como obra_publica)
        if (!$footer.length) {
          $footer = $('<div class="dinamicPanel-detailList-exportTools"></div>');
          var $content = $detail.find('.dinamicPanel-detailContent').first();
          if ($content.length) { $content.append($footer); }
          else { $detail.append($footer); }
        }

        // 4) Si existe el botón de buffer, MOVERLO al footer y pintarlo de guinda
        if ($bufferOriginal.length) {
          // Quitar estilos previos por si se re-renderiza
          $bufferOriginal.removeClass('dinamicPanel-detailToolButton').addClass('dinamicPanel-detailExportButton dinamicPanel-detailBufferButton');

          // Estilo guinda (usando cssText para asegurar prioridad sobre hojas externas)
          $bufferOriginal.attr('style',
            'background-color:' + COLOR_GUINDA + ' !important;' +
            'border-color:' + COLOR_GUINDA + ' !important;' +
            'color:#ffffff !important;' +
            'cursor:pointer;'
          );

          // Metadatos accesibles
          $bufferOriginal.attr({
            'title': 'Generar área de influencia',
            'aria-label': 'Generar área de influencia'
          });

          // Insertar al inicio del footer
          $footer.prepend($bufferOriginal);
        }

        // 5) Eliminar cualquier botón de buffer duplicado en el footer (por re-render)
        $footer.find('.dinamicPanel-detailBufferButton').not($bufferOriginal).remove();

        // 6) Si por alguna razón ya existía un botón clonado previo, eliminarlo
        $footer.find('.dinamicPanel-detailBufferButton').each(function () {
          if (!$(this).is($bufferOriginal)) { $(this).remove(); }
        });

        // 7) Reasignar el evento click al botón de buffer (por si cambió de contexto)
        if ($bufferOriginal.length) {
          $bufferOriginal.off('click.dpBuffer').on('click.dpBuffer', function (e) {
            e.preventDefault();
            e.stopPropagation();
            obj.createPanel('buffer');
            obj.options.map.Feature.addArea({
              id: $bufferOriginal.attr('idref'),
              table: $bufferOriginal.attr('tableref')
            });
          });
        }

        // 8) Limpiar contenedor de tools si quedó vacío (evita espacio en blanco arriba)
        if (!$detail.find('.dinamicPanel-detailTools').children().length) {
          $detail.find('.dinamicPanel-detailTools').remove();
        }
        /* ===================================================== */

        $('#dinamicPanel_exportDetail_xls').click(function (e) { obj.exportDetail(obj.lastDetailResults, 'xls'); e.stopPropagation(); });
        $('#dinamicPanel_exportDetail_csv').click(function (e) { obj.exportDetail(obj.lastDetailResults, 'csv'); e.stopPropagation(); });
        if (coordenada != '') {
          coordenada = (coordenada.substring(6, coordenada.length - 1)).split(' ');
          obj.options.map.Mark.event({ action: 'delete', items: 'all', type: 'search' });
          obj.options.map.Mark.event({ action: 'delete', items: 'all', type: 'identify' });
          obj.mapNewMarker(mainId, coordenada[0], coordenada[1], 'identify', '', function () { });
        }
        if (extent != '') {
          obj.mapExtend(extent);
          $('#' + obj.id + '_detail').bind('click', function (e) { obj.mapExtend(extent); }).addClass('dinamicPanel-detailPointer');
        } else { $('#' + obj.id + '_detail').unbind('click').removeClass('dinamicPanel-detailPointer'); }
        obj.scheduleFichaUiAdjustments();
        obj.assignSearchOnLink();
        $('.dinamicPanel-html-btn').each(function () {
          $(this).click(function (e) {
            var target = $(this).attr('target');
            var url = $(this).attr('url');
            var title = $(this).attr('label');
            if (target == 'dentro') {
              $('#dinamicpanel_selfhtml').remove();
              $('body').append('<div id="dinamicpanel_selfhtml" title="' + title + '"><iframe src="' + url + '" width="595" height="520"></iframe></div>');
              $('#dinamicpanel_selfhtml').dialog({ resizable: false, width: 625, height: 580 });
            } else { window.open(url); }
            e.stopPropagation();
          });
        });
        $('.dinamicPanel-btn-info').each(function () {
          $(this).click(function (e) { obj.searchDetail($(this).attr('idref'), $(this).attr('tableref')); e.stopPropagation(); });
        });
        $('.dinamicPanel-btn-metadato').each(function () {
          $(this).click(function (e) { obj.openLinkWindow($(this).attr('idref')); e.stopPropagation(); });
        });
        // NOTA: se elimina el bucle original de .dinamicPanel-btn-buffer para no duplicar el handler
        $('.dinamicPanel-btn-gallery').each(function () {
          $(this).click(function (e) { obj.showGallery($(this).attr('idref')); e.stopPropagation(); });
        });
        $('.dinamicPanel-btn-download').each(function () {
          $(this).click(function (e) { window.open($(this).attr('idref')); e.stopPropagation(); });
        });
        $('.dinamicPanel-btn-sistemas').each(function () {
          $(this).click(function (e) { window.open($(this).attr('idref')); e.stopPropagation(); });
        });
        $('#' + obj.id + '_btnDetailClose').click(function (e) { obj.closeDetail(); obj.panelTransparency(); e.stopPropagation(); });
        if (obj.searchType == 'autocomplete') { $('#' + obj.id + '_search_result').html(''); obj.showResults(); }
        obj.results.index = -1;
        if ($('#dinamicPanel_point_altimetry').attr('id')) { obj.loadAltimetryToIdentify($('#dinamicPanel_point_altimetry')); }
      }
    }
  },
  loadAltimetryToIdentify: function (container) {
    var obj = this;
    var point = container.attr('point').split(',');
    var ds = $.extend({}, obj.options.dataSource.mousePosition.elevation);
    ds.contentType = "application/json; charset=utf-8";
    var params = JSON.stringify({ x: point[0], y: point[1] });
    obj.getData(ds, params, function (res) {
      if (res.data && res.data.elevation) { container.html('Altura:' + res.data.elevation.format() + ' metros.'); }
    });
  },
  trackInput: function () {
    var obj = this;
    clearTimeout(obj.searchTimer);
    obj.searchTimer = setTimeout(function () {
      if (obj.currentTool != 'search') { obj.createPanel('searchPanel'); }
      var text = $('#' + obj.id + '_inputSearch').val();
      var searchType = obj.getSearchType(text);
      if (text.length > 2 && text != obj.lastSearch && searchType == '') {
        if (obj.options.autocomplete) { obj.initSearch(text, 'autocomplete'); }
      } else { obj.resetToSearchPanel(); }
    }, obj.options.timeToSearch);
  },
  setInputTextRestriction: function (id, callback, callbackEnter) {
    var obj = this;
    var $input = $('#' + id);
    if (!$input.length) return;
    var INVALID = /[<>{}[\]\\|`~^$#@!?*+=;:"%&()]/;
    $input.off('.dpRestrict').on('keydown.dpRestrict', function (evt) {
      var code = evt.which || evt.keyCode;
      if (code === 13) { if ($.isFunction(callbackEnter)) { callbackEnter(); } return; }
      if (code === 27) { setTimeout(function () { $input.val(''); }, 100); return; }
      if (code === 8 || code === 46 || code === 9 || (code >= 35 && code <= 40)) { return; }
      if (evt.ctrlKey || evt.metaKey) { return; }
      var ch = evt.key;
      if (ch && ch.length === 1 && INVALID.test(ch)) { evt.preventDefault(); }
    });
    $input.off('.dpRestrictInput').on('input.dpRestrictInput', function () {
      var val = $input.val();
      var cleaned = val.replace(/[<>{}[\]\\|`~^$#@!?*+=;:"%&()]/g, '');
      if (cleaned !== val) {
        var pos = $input[0].selectionStart;
        $input.val(cleaned);
        try { $input[0].setSelectionRange(pos - 1, pos - 1); } catch (e) { }
      }
      if ($.isFunction(callback)) { callback($input.val()); }
    });
    $input.off('.dpRestrictKeyup').on('keyup.dpRestrictKeyup', function (e) {
      if (e.which === 13 && $.isFunction(callbackEnter)) { callbackEnter(); }
    });
  },
  setInputText: function (id, callback) {
    var obj = this;
    var $input = $('#' + id);
    if (!$input.length) return;
    var INVALID = /[<>{}[\]\\|`~^$#@!?*+=;:"%&()]/;
    $input.off('.dpInput').on('keydown.dpInput', function (e) {
      var code = e.which || e.keyCode;
      if (code === 46 && $.isFunction(callback)) { callback(); return; }
      if (code === 27) { setTimeout(function () { $input.val(''); }, 200); obj.hiddeResults(); obj.resetToSearchPanel(); return; }
      if (code === 38 || code === 40 || code === 13) { obj.navResults(code); return; }
      if (code === 8) { if ($.isFunction(callback)) { callback(); } return; }
      if (e.ctrlKey || e.metaKey) return;
      if (code === 9 || (code >= 35 && code <= 40)) return;
      var ch = e.key;
      if (ch && ch.length === 1 && INVALID.test(ch)) { e.preventDefault(); }
    });
    $input.off('.dpInputChange').on('input.dpInputChange', function () {
      var val = $input.val();
      var cleaned = val.replace(/[<>{}[\]\\|`~^$#@!?*+=;:"%&()]/g, '');
      if (cleaned !== val) {
        var pos = $input[0].selectionStart;
        $input.val(cleaned);
        try { $input[0].setSelectionRange(pos - 1, pos - 1); } catch (e) { }
      }
      if ($.isFunction(callback)) { callback(); }
    });
  },
  assignSearchOnLink: function () {
    var obj = this;
    $('.dinamicPanel-searchLink').each(function () {
      if ($(this).attr('assigned') === undefined) {
        $(this).attr('assigned', true);
        $(this).click(function (e) {
          var search = $(this).attr('search');
          obj.updateTextSearch(search);
          obj.resetToSearchPanel();
          obj.hiddeResults();
          obj.deepSearch(search);
          e.stopPropagation();
        });
      }
    });
  },
  hideSearch: function () {
    var obj = this;
    if (window.matchMedia('(max-width: 1199px)').matches) {
      $('#' + obj.id + '_inputSearch').blur();
      obj.element.stop(true, true).attr('isHide', 'true');
      obj.syncSearchLayout();
      return;
    }
    obj.element.animate({ left: -450 }, function () {
      obj.element.attr('isHide', 'true');
      obj.updateSearchAccessibility();
      $('#' + obj.id + '_showSearch').css({ left: '400px' }).animate({ left: '450px' }, 500);
    });
  },
  showSearch: function () {
    var obj = this;
    if (window.matchMedia('(max-width: 1199px)').matches) {
      obj.element.stop(true, true).attr('isHide', 'false');
      obj.syncSearchLayout();
      return;
    }
    $('#' + obj.id + '_showSearch').fadeOut('slow', function () {
      $('#' + obj.id + '_showSearch').css({ left: '-60px' });
      obj.element.animate({ left: '0px' });
      obj.element.attr('isHide', 'false');
      obj.updateSearchAccessibility();
    });
  },
  updateSearchAccessibility: function () {
    var hidden = this.element.attr('isHide') === 'true';
    $('#' + this.id + '_showSearch, #' + this.id + '_hideSearch').attr('aria-expanded', String(!hidden));
  },
  syncSearchLayout: function () {
    var compact = window.matchMedia('(max-width: 1199px)').matches;
    var hidden = this.element.attr('isHide') === 'true';
    this.element.stop(true, true).css('left', compact ? '' : (hidden ? '-450px' : '0px'));
    $('#' + this.id + '_showSearch').stop(true, true).css({ left: compact ? '' : '450px', display: hidden ? '' : 'none' });
    $('#main').toggleClass('search-collapsed', compact && hidden);
    this.updateSearchAccessibility();
  },
  initSearchCoords: function (coord) {
    var obj = this;
    var lonlat = obj.options.map.intersectExtent(coord[0], coord[1]);
    if (!lonlat) {
      lonlat = obj.options.map.transformToMercator(coord[0], coord[1]);
      lonlat = obj.options.map.intersectExtent(lonlat.lon, lonlat.lat);
    }
    if (lonlat) {
      obj.identifyPoint(lonlat, 'byText');
      obj.options.map.Mark.event({ action: 'delete', items: 'all', type: 'identify' });
      obj.mapNewMarker('coordenada: ' + coord[0] + ',' + coord[1], lonlat.lon, lonlat.lat, 'identify', 'Punto: ' + coord[0] + ',' + coord[1], function () { });
      obj.mapExtend([lonlat.lon, lonlat.lat]);
    } else {
      obj.messageHeader('La coordenada esta fuera de los limites de visualizaci&oacute;n');
    }
  },
  processCategoryData: function (data) {
    var obj = this;
    var cadena = '';
    var searchText = data.text;
    var list = data.categories;
    var service = data.service;
    var map = obj.options.map;
    var sversion = map.serviceVersion;
    var cadena2 = '';
    var count = 0;
    for (var x in list) {
      var value = list[x];
      if (sversion != 'INEGI') { service = x; value = 1; }
      value = (sversion != 'INEGI') ? 1 : value;
      if (value > 0) {
        var showCount = (service == 'entidades') ? '<span>' + value + '</span>' : '';
        cadena2 += '<div class="dinamicPanel-box-sizing dinamicPanel-categoryItem-left" service="' + service + '" searchtext="' + searchText + '" name="' + x + '">' + showCount + '<label>' + x + '</label></div>';
        count++;
      }
    }
    cadena2 = '<div class="dinamicPanel-categoryItem-container-left"><div class="dinamicPanel-box-sizing dinamicPanel-categoryItem-title">Otros resultados</div><div class="dinamicPanel-categoryItem-list dinamicPanel-box-sizing">' + cadena2 + '</div></div>';
    if (count > 0) {
      $('#' + obj.id + '_searchPanel').html(cadena2);
      $('.dinamicPanel-categoryItem-left').each(function () {
        $(this).click(function (e) {
          var name = $(this).attr('name');
          var text = $(this).attr('searchtext');
          var service = $(this).attr('service');
          var info = { name: name, service: service, category: name };
          if (sversion != 'INEGI') { obj.mainSearch(text, { tabla: service }); }
          else { obj.searchByCat(text, info); }
          e.stopPropagation();
        });
      });
      obj.showPanel('searchPanel');
    } else { obj.closeToolPanel(); }
  },
  initSearchCross: function (text, func) {
    var obj = this;
    var dataSource = obj.options.dataSource.crossSearch;
    var proyName = obj.options.dataSource.proyName;
    var params = { tabla: "geolocator", pagina: 1, searchCriteria: text, proyName: proyName, idUser: "", where: "", paramProy: "" };
    jQuery.ajaxSettings.traditional = true;
    obj.getData(dataSource, JSON.stringify(params), function (data) {
      var object = {};
      if (!(data === undefined) && data.response.success) {
        data = data.data.value;
        object.total = data.length;
        object.list = [];
        for (var x in data) {
          var fields = data[x].fields.fields;
          var rec = {};
          for (var i in fields) {
            var field = fields[i].aliasName.toLowerCase();
            var value = fields[i].value;
            var nameField = obj.stringAsType(field);
            switch (nameField) {
              case 'calle':
                if (rec.type === undefined) { rec.type = 'calle'; rec.name = value; }
                else { rec.name = rec.name + ' cruce con: ' + value; }
                break;
              case 'entidadmunicipio': rec.label = value; rec.busqueda = value; break;
              case '_coordenada':
                value = value.substr(6, value.length - 7).split(' ');
                value = value[1] + ',' + value[0];
                rec.position = { geo: value, merc: value };
                break;
              case 'ubicacion': rec.location = value; break;
            }
          }
          rec.position.geo = rec.location;
          rec.label += ', ' + rec.name;
          object.list.push(rec);
        }
        obj.searchType = 'cross';
        if ($.isFunction(func)) { func(object); } else { obj.processData(object); }
      }
    }, function () { }, function () { $('#' + obj.id + '_spinner').addClass('ajax-loader'); }, function () { $('#' + obj.id + '_spinner').removeClass('ajax-loader'); });
  },
  getActiveSearch: function () { return this.activeResult; },
  privateSearch: function (search) {
    var type = this.getSearchType(search.text);
    if (type == 'cross') { this.initSearchCross(search.text, search.func); }
    else { this.mainSearch(search.text, { private_: search.func }); }
  },
  deepSearch: function (text) { this.mainSearch(text, {}); },
  mainSearch: function (text, info) {
    var obj = this;
    var private_ = info.private_;
    var params = {};
    var dataSource = $.extend(true, {}, obj.options.dataSource.search);
    dataSource.params.q = text;
    var map = obj.options.map;
    var serviceVersion = map.serviceVersion;
    if (serviceVersion == 'INEGI') {
      dataSource.params.q = text;
      var pointBot = map.transformToGeographic(map.getExtent().lat[0], map.getExtent().lat[1]);
      var pointTop = map.transformToGeographic(map.getExtent().lon[0], map.getExtent().lon[1]);
      dataSource.params.point1 = pointTop.lat + ',' + pointTop.lon;
      dataSource.params.point2 = pointBot.lat + ',' + pointBot.lon;
      var location = obj.getMapCenter();
      dataSource.params.pt = location.centroid.lat + ', ' + location.centroid.lon;
      dataSource = obj.options.translateSearch.params(serviceVersion, dataSource);
    }
    if (info.tabla && serviceVersion != 'INEGI') { dataSource.params.fq = 'tipo:"' + info.tabla + '"'; }
    obj.getData(dataSource, params, function (data) {
      if (data) {
        if (serviceVersion != 'INEGI') { data = obj.translateExternalService(data); }
        var success = data.response.success;
        if (!data.data) { data.data = {}; }
        if (success) {
          data.data.text = text;
          if (!private_) {
            var info = { service: data.data.service };
            obj.processCategoryData(data.data);
            obj.showSearchResults(data.data);
            obj.activeResult = { type: 'search', data: info };
          }
          if (private_) {
            var info = { service: data.data.service };
            info.private_ = private_;
            private_(data);
          }
        } else {
          obj.clearSearch(true);
          var object = { text: text, list: [], total: 0 };
          obj.processData(object);
        }
      }
    });
  },
  translateExternalService: function (data) {
    var response = { success: true, message: 'ok' };
    var list = data.facet_counts.facet_fields.tipo;
    var cat = {};
    var catName = '';
    for (var x in list) {
      if (catName == '') { catName = list[x]; }
      else { if (parseInt(list[x], 10) > 0) { cat[catName] = list[x]; } catName = ''; }
    }
    return { response: response, data: { categories: cat, results: data.response.docs } };
  },
  showSearchResults: function (data) {
    var obj = this;
    var list = data.results;
    var object = { text: data.text, list: [], total: list.length };
    for (var x in list) {
      var item = list[x];
      item.label = item.busqueda;
      item.id = item.gid;
      item.name = item.nombre; delete item['nombre'];
      item.type = obj.stringAsType(item.tipo); delete item['tipo'];
      item.position = { geo: item.locacion, merc: item.coord_merc }; delete item['locacion']; delete item['coord_merc'];
      object.list.push(item);
    }
    obj.processData(object);
  },
  searchByCat: function (text, info) {
    var obj = this;
    var service = info.service;
    var privateSearch = info.private_;
    var category = info.category;
    if (!privateSearch) { info.text = text; obj.activeResult = { type: 'search', data: info }; }
    var dataSource = $.extend(true, {}, obj.options.dataSource.search);
    dataSource.params.q = text;
    dataSource.url += '/' + service;
    var map = obj.options.map;
    var pointBot = map.transformToGeographic(map.getExtent().lat[0], map.getExtent().lat[1]);
    var pointTop = map.transformToGeographic(map.getExtent().lon[0], map.getExtent().lon[1]);
    dataSource.params.point1 = pointTop.lat + ',' + pointTop.lon;
    dataSource.params.point2 = pointBot.lat + ',' + pointBot.lon;
    if (category) { dataSource.params.category = category; }
    var object = { text: text, list: [], total: 0 };
    obj.getData(dataSource, {}, function (data) {
      object.total = data.data.numFound;
      var list = data.data.results;
      object.list = [];
      for (var x in list) {
        var item = list[x];
        item.label = item.busqueda;
        item.id = item.gid;
        item.name = item.nombre; delete item['nombre'];
        item.type = obj.stringAsType(item.tipo); delete item['tipo'];
        item.position = { geo: item.locacion, merc: item.coord_merc }; delete item['locacion']; delete item['coord_merc'];
        object.list.push(item);
      }
      object.text = text;
      if (!($.isFunction(privateSearch))) { obj.processData(object); }
      else { privateSearch(object); }
    }, function () { obj.processData(object); }, function () { $('#' + obj.id + '_spinner').addClass('ajax-loader'); }, function () { $('#' + obj.id + '_spinner').removeClass('ajax-loader'); });
  },
  searchNotFound: function (search) {
    var obj = this;
    search = (search) ? 'No se encontraron resultados para <b>' + search + '</b>' : 'No se encontr&oacute; informaci&oacute;n';
    var msg = '<span class="ui-icon ui-icon-info"></span><label>' + search + '</label>';
    obj.hiddeResults();
    obj.closeToolPanel();
    obj.mapDeleteMarkers('search');
    $('#' + obj.id + '_messages').html(msg).css('display', 'none').removeClass('dinamicPanel-hidde');
    $('#' + obj.id + '_messages').fadeIn('slow');
    setTimeout(function () {
      $('#' + obj.id + '_messages').fadeOut('fast', function () { $('#' + obj.id + '_messages').addClass('dinamicPanel-hidde'); });
    }, 4000);
  },
  textToSearchLink: function (text, extra) {
    var plainText = function (text) { return text.replace('/', '').replace(/<strong>/ig, ''); };
    var textToLinkLabel = function (text, extra) {
      var oldText = text;
      var filter = plainText(text);
      extra = (!(extra === undefined) && extra != '') ? plainText(extra) + ',' : '';
      return '<label class="dinamicPanel-searchLink" search="' + extra + filter + '">' + oldText + '</label>';
    };
    var r = '';
    if (typeof (text) == 'object' && text.length > 0) {
      var list = text;
      var count = 0;
      var arrastre = '';
      for (var x in list) {
        if (count > 0) { r += ', '; }
        r += textToLinkLabel(list[x], arrastre);
        arrastre = (arrastre != '') ? arrastre + ',' + plainText(list[x]) : plainText(list[x]);
        count++;
      }
    } else { r += textToLinkLabel(text, extra); }
    return r;
  },
  clickOnResultItem: function (pos) {
    var obj = this;
    if (!(pos === undefined) && pos > -1) {
      if (obj.searchType == 'autocomplete') {
        obj.updateTextSearch(pos);
        obj.deepSearch($('#' + obj.id + '_inputSearch').val());
        obj.resetToSearchPanel();
      } else { obj.showDetail(pos); }
    } else {
      var text = $('#' + obj.id + '_inputSearch').val();
      if (text.trim() != '') {
        var searchType = obj.getSearchType(text);
        if (searchType != '') {
          if (searchType == 'coord') {
            var isCoord = obj.isCoord(text);
            obj.initSearchCoords([isCoord.lon, isCoord.lat]);
          } else {
            if (searchType == 'cross') { obj.initSearchCross(text); }
            else { obj.initSearchEstab(text, searchType); }
          }
        } else { obj.deepSearch(text); }
        obj.resetToSearchPanel();
      }
    }
  },
  beforeProcessData: {},
  createPagination: function (pagination) {
    var obj = this;
    var data = pagination;
    var idElement = obj.element.attr('id');
    var totalReg = data.total;
    var currentRegNum = data.currentRegNum;
    var pageNumReg = data.pageSize;
    var currentPage = data.page;
    var cantPages = 6;
    var middle = Math.ceil(cantPages / 2);
    var numPages = ((totalReg % pageNumReg) == 0) ? totalReg / pageNumReg : Math.floor(totalReg / pageNumReg) + 1;
    var pageIni = (numPages > cantPages) ? (currentPage > middle) ? (currentPage - (middle - 1)) : 1 : 1;
    var pageEnd = (numPages > cantPages) ? (numPages - currentPage > (middle)) ? (currentPage <= (middle - 1)) ? pageIni + (cantPages - 1) : currentPage + (middle - 1) : numPages : numPages;
    var regIni = (currentPage * pageNumReg - (pageNumReg - 1));
    var regEnd = ((currentPage * pageNumReg) - pageNumReg) + currentRegNum;
    if (((pageEnd - pageIni) < cantPages) && (numPages >= cantPages)) {
      if (pageEnd < cantPages) { pageEnd = cantPages; }
      pageIni = pageEnd - (cantPages - 1);
    }
    var prevSet = (pageIni > 1) ? '<div page="' + (pageIni - 1) + '" notext="notext" id="' + idElement + 'page' + (pageIni - 1) + '" icon="" class="dinamicPanel-pagination-item dinamicPanel-transition"><span class="dinamicPanel-pagination-navBtn ui-icon ui-icon-triangle-1-w"></span></div>' : '';
    var nextSet = (numPages > pageEnd) ? '<div page="' + (pageEnd + 1) + '" notext="notext" id="' + idElement + 'page' + (pageEnd) + '" icon="" class="dinamicPanel-pagination-item dinamicPanel-transition"><span class="ui-icon ui-icon-triangle-1-e"></span></div>' : '';
    var cadena = '';
    for (var x = pageIni; x <= (pageEnd); x++) {
      var sel = (x == currentPage) ? 'dinamicPanel-pagination-selected' : '';
      cadena += '<div page="' + x + '" id="' + idElement + 'page' + x + '" class="' + sel + ' dinamicPanel-pagination-item dinamicPanel-transition">' + x + '</div>';
    }
    cadena = '<div class="dinamicPanel-pagination-total">' + regIni + '-' + regEnd + '/' + totalReg + '</div><div class="dinamicPanel-num-container">' + prevSet + cadena + nextSet + '</div>';
    return cadena;
  },
  processData: function (data) {
    var obj = this;
    data.searchType = obj.searchType;
    var process = false;
    var currProcess = '';
    for (var x in obj.beforeProcessData) {
      var currentProcess = data.doneProcess;
      if (!currentProcess) { data.doneProcess = {}; }
      currentProcess = data.doneProcess;
      if (!currentProcess[x]) { currProcess = x; process = true; }
      if (process) { break; }
    }
    if (process) { data.doneProcess[currProcess] = true; obj.beforeProcessData[currProcess](data); }
    else {
      var paginationActive = $('.dinamicPanel-dinamicSection').attr('pagination');
      $('.dinamicPanel-dinamicSection').removeAttr('pagination');
      obj.options.map.Mark.event({ action: 'delete', items: 'all', type: 'identify' });
      var dataSource = obj.options.dataSource.mainSearch;
      if (typeof (data) != 'undefined' && data.total > 0) {
        var pagination = data.pagination;
        obj.pagination = pagination;
        if (pagination) {
          $('.dinamicPanel-dinamicSection').attr('pagination', true);
          $('#' + obj.id + '_pagination').html(obj.createPagination(pagination));
          $('.dinamicPanel-pagination-item').each(function () {
            $(this).click(function () {
              var page = $(this).attr('page');
              var pagination = obj.pagination;
              pagination.page = parseInt(page, 10);
              pagination.call(pagination);
            });
          });
        } else { $('#' + obj.id + '_pagination').hide(); }
        if (obj.searchType == 'autocomplete') { obj.hiddeTools(); }
        else { obj.lastResults = data; obj.mapDeleteMarkers('search'); obj.mapDeleteMarkers('identify'); }
        var cadena = '';
        var list = data.list;
        var count = 0;
        for (var x in list) {
          var id = list[x].id;
          var formatLabel = list[x].label.split(',');
          var mainLabel = formatLabel.pop();
          var links = list[x].busqueda.split(',');
          links.pop();
          var coords = '';
          var table = '';
          if (obj.searchType != 'autocomplete') {
            coords = (obj.searchType == 'cross') ? list[x].position.geo : list[x].position.merc;
            table = (!(list[x].tabla === undefined)) ? list[x].tabla : '';
          }
          var tools = list[x].tools;
          var toolStr = '';
          if (tools) {
            toolStr += '<div class="dinamicPanel-tool-container">';
            for (var y in tools) { var tool = tools[y]; toolStr += '<div class="' + tool.icon + '" title="' + tool.title + '"></div>'; }
            toolStr += '</div>';
          }
          formatLabel = '<div class="mainLabel">' + list[x].name + '</div>' + ((links.length > 0) ? '<div class="detailLabel">' + obj.textToSearchLink(links) + '</div>' : '');
          var icon = obj.options.getIcon(list[x].type);
          var isCross = (/cross/.test(obj.searchType)) ? obj.searchType + '="true"' : '';
          var style = list[x].styleClass;
          var strStyle = (style) ? list[x].styleClass : '';
          cadena += '<div id="' + obj.id + '_' + id + '" idref="' + list[x].id + '" ' + isCross + ' table="' + table + '" coords="' + coords + '" pos="' + count + '" class="dinamicPanel-resultItem ' + strStyle + '">';
          cadena += '  <span class="dinamicPanel-dataIcon ' + icon + '"></span>';
          cadena += '  <div class="dinamicPanel-resultText">' + formatLabel + '</div>';
          cadena += toolStr;
          cadena += '</div>';
          count++;
          if (obj.searchType != 'autocomplete') {
            coords = list[x].position.merc;
            position = coords.split(',');
            var domObj = obj.mapNewMarker(mainLabel, position[1], position[0], 'search', list[x], function () { });
            list[x].domId = domObj;
          }
        }
        obj.results.index = -1;
        obj.results.list = list;
        if (cadena != '') {
          if (!paginationActive) { $('#' + obj.id + '_results').css('display', 'none'); }
          $('#' + obj.id + '_search_result').html(cadena);
          $('#' + obj.id + '_search_result .dinamicPanel-resultItem').each(function () {
            $(this).click(function (e) {
              var pos = parseInt($(this).attr('pos'), 10);
              var coords = $(this).attr('coords');
              var cross = $(this).attr('cross');
              var table = $(this).attr('table');
              var idref = $(this).attr('idref');
              var item = obj.lastResults.list[pos];
              var func = item.func;
              if (func && $.isFunction(func)) { func(item); }
              else {
                if (!(cross === undefined)) { obj.mapExtend(coords); }
                else {
                  if (table === undefined || table == '') { obj.clickOnResultItem(pos); }
                  else { obj.searchDetail(idref, table); }
                }
              }
              e.stopPropagation();
            });
            $(this).hover(
              function (e) {
                var pos = parseInt($(this).attr('pos'), 10);
                var item = obj.lastResults.list[pos];
                var func = item.onMouseOver;
                if (func) { func(item); }
              },
              function (e) {
                var pos = parseInt($(this).attr('pos'), 10);
                var item = obj.lastResults.list[pos];
                var funcOut = item.onMouseOut;
                if (funcOut) { funcOut(item); }
              }
            );
          });
          obj.assignSearchOnLink();
          if (obj.searchType != 'autocomplete') { obj.showPanel('searchPanel'); }
          obj.showResults('search');
          obj.closeDetail();
        } else {
          obj.showResults();
          $('#' + obj.id + '_search_result').html(cadena);
        }
      } else {
        $('#' + obj.id + '_search_result').html('');
        obj.showResults();
        obj.searchNotFound(data.text);
      }
    }
  },
  _create: function () {
    var obj = this;
    obj.id = this.element.attr('id');
    obj.element.addClass("custom-dinamicPanel no-print").attr('isHide', 'false');
    var sversion = obj.options.dataSource.servicesVersion;
    sversion = sversion.replace('.', '');
    obj.element.attr('serviceversion', 'v' + sversion);
    obj._on(window, { resize: function () { obj.syncSearchLayout(); obj.adjustResultHeight(); } });
    obj.minitools = obj.options.denueShortcuts;
    var modules = obj.options.modules;
    for (var x in modules) { modules[x].init(obj); }
    this._refresh();
  },
  adjustResultHeight: function (height) {
    var obj = this;
    var posTop = $('#mdm6DinamicPanel_results').position().top;
    var rheight = $('#panel-center').height();
    rheight = (rheight - posTop) - 90;
    height = (height === undefined) ? $(window).height() : height;
    $('.dinamicPanel-detail').css('max-height', (rheight - 100) + 'px');
  },
  closeMiniMapBox: function () {
    var obj = this;
    var ban = $('#' + obj.id + '_miniMap_box').attr('switching');
    if (ban == 'false' || ban === undefined) {
      $('#' + obj.id + '_miniMap_box').attr('switching', true);
      $('#' + obj.id + '_v_container').animate({ bottom: '30px' }, 200, function () { });
      $('#' + obj.id + '_miniMap_box').animate({ height: '28px' }, 200, function () {
        $('#' + obj.id + '_miniMap_box').attr('switching', false).addClass('layerManager-hidde');
        $('#' + obj.id + '_layerManager_collapsedTools').show();
      });
    }
  },
  isOpenMiniMapBox: function () { return ($('#' + this.id + '_miniMap_box').height() > 100); },
  miniMapBoxHeight: function () { return ($('#' + this.id + '_miniMap_box').height()); },
  switchMiniMapBox: function () { if (this.isOpenMiniMapBox()) { this.closeMiniMapBox(); } else { this.openMiniMapBox(); } },
  _refresh: function () {
    var obj = this;
    var cadena = '<div id="' + obj.id + '_search" class="dinamicPanel-search dinamicPanel-border dinamicPanel-shadow dinamicPanel-box-sizing">';
    cadena += '  <button type="button" id="' + obj.id + '_showSearch" aria-label="Abrir buscador" aria-controls="' + obj.id + '_search" class="dinamicPanel-sliderightbtn dinamicPanel-showSearch dinamicPanel-shadow" style="display:none"></button>';
    cadena += '   <button type="button" id="' + obj.id + '_hideSearch" aria-label="Cerrar buscador" aria-controls="' + obj.id + '_search" class="dinamicPanel-slidebtn dinamicPanel-hideSearch dinamicPanel-shadow" style="display:none"></button>';
    cadena += '     <div class="dinamicPanel-searchContainer">';
    cadena += '      <span id="' + obj.id + '_spinner" class="dinamicPanel-spinner"></span>';
    cadena += '       <input type="text" id="' + obj.id + '_inputSearch" aria-label="Buscar en el mapa" class="ui-corner-all dinamicPanel-inset-focus dinamicPanel-transition" value="" placeholder="Buscar">';
    cadena += '      <span id="' + obj.id + '_btnClearSearch" class="dinamicPanel-clearSearch fa-solid fa-delete-left"></span>';
    cadena += '     </div>';
    cadena += '  </div>';
    cadena += ' </div>';
    cadena += '</div>';
    cadena += '      <div id="' + obj.id + '_toolTabs" class="dinamicPanel-toolTabs">';
    cadena += '         <div id="' + obj.id + '_layerManager_btnLayerConf" idref="layerPanel" alt="Filtrado de capas" title="Filtrado de capas" class="dinamicPanel-tab" style="width: 58px">';
    cadena += '           <div class="dinamicPanel-tabIconContainer"><center><span title="Filtrado de capas" class="fa-solid fa-layer-group"></span></center></div>';
    cadena += '           <span class="dinamicPanel-tabDescription"> Capas </span>';
    cadena += '           <span class="dinamicPanel-selector dinamicPanel-hidde"></span>';
    cadena += '         </div>';
    cadena += obj.createTabs();
    cadena += '      </div>';
    cadena += '  <div id="' + obj.id + '_panelContainer" class="dinamicPanel-panelContainer" >';
    cadena += obj.createPanels();
    cadena += '  </div>';
    cadena += '</div>';
    cadena += '<div id="' + obj.id + '_minitools" style="display:none" class="dinamicPanel-minitools dinamicPanel-box-sizing dinamicPanel-border dinamicPanel-shadow"></div>';
    cadena += '<div id="' + obj.id + '_messages" class="dinamicPanel-hidde dinamicPanel-messages dinamicPanel-box-sizing dinamicPanel-border dinamicPanel-shadow"></div>';
    cadena += '<div id="' + obj.id + '_pagination" class="dinamicPanel-pagination dinamicPanel-box-sizing dinamicPanel-border dinamicPanel-shadow"></div>';
    cadena += '<div id="' + obj.id + '_results" style="display:none" visible="false" class="">';
    cadena += obj.createResultPanels();
    cadena += '</div>';
    cadena += '<div id="' + obj.id + '_detail" class="dinamicPanel-hidde dinamicPanel-detail dinamicPanel-box-sizing dinamicPanel-border dinamicPanel-shadow"></div>';
    cadena += '</div>';
    obj.element.html(cadena);
    obj.syncSearchLayout();
    obj.initFloatingToolPanels();
    obj.initCompactMapTools();
    obj.adjustResultHeight();
    obj.closeMiniMapBox();
    $('#' + obj.id + '_hideSearch').click(function () { $('#layersDisplay').css('display', 'none'); obj.hideSearch(); });
    $('#' + obj.id + '_showSearch').click(function () { obj.showSearch(); });
    $('#' + obj.id + '_layerManager_btnLayerConf').click(function (e) { $('#layersDisplay').show(); e.preventDefault(); e.stopPropagation(); });
    $('#' + obj.id + '_btnSearch').click(function (e) { obj.clickOnResultItem(); e.stopPropagation(); });
    $('#' + obj.id + '_inputSearch').blur(function () {
      $('#' + obj.id + '_results .dinamicPanel-resultSelected').each(function () { $(this).removeClass('dinamicPanel-resultSelected'); });
      obj.results.index = -1;
    });
    $('#btnPanelClose').click(function () {
      obj.closeToolPanel();
      if (obj.currentTool == 'search') { $('#' + obj.id + '_searchPanel').html(''); obj.showPanel('searchPanel'); }
    });
    $('.dinamicPanel-tab').each(function () {
      $(this).click(function () { var idref = $(this).attr('idref'); obj.showPanel(idref); });
    });
    $('#' + obj.id).mouseleave(function () {
      obj.mouseOnPanel = false;
      obj.toolsTimer = setTimeout(function () { obj.panelTransparency('activate'); }, obj.toolsOpacityTimer);
    }).mouseenter(function () {
      obj.mouseOnPanel = true;
      obj.panelTransparency();
      clearTimeout(obj.toolsTimer);
    });
    $('#' + obj.id + '_btnClearSearch').click(function () { MDM6('hideMarkers', 'identify'); obj.clearSearch(); });
    $('#mdm6DinamicPanel_leyendPanel_tab').click(function () { MDM6('hideMarkers', 'identify'); });
    obj.setInputText(obj.id + '_inputSearch', function () { obj.trackInput(); });
    obj.moduleEvents({ id: 'createForm', value: null });
    this._trigger("change");
  },
  _destroy: function () {
    var obj = this;
    $('#main').removeClass('search-collapsed');
    $('#' + obj.id + '_geoCompactTool, #' + obj.id + '_measureCompactTool').remove();
    if ($.fn.toolPanel) {
      $.each(obj.floatingToolPanels, function (type) {
        var $tool = $('#' + obj.id + '_' + type + 'ToolPanel');
        if ($tool.length) { $tool.toolPanel('destroy').remove(); }
      });
    }
  },
  _setOptions: function () { this._superApply(arguments); this._refresh(); },
  _setOption: function (key, value) { this._super(key, value); },
  make_base_auth: function (user, password) {
    var tok = user + ':' + password;
    var hash = Base64.encode(tok);
    return "Basic " + hash;
  },
  getSearchType: function (text) {
    var obj = this;
    var type = '';
    if (obj.isCoord(text)) { type = 'coord'; }
    else {
      if (text.indexOf('--') > -1) { type = 'cross'; }
      else {
        var list = obj.options.dataSource.synonyms.list;
        var estab = false;
        for (var x in list) {
          var syn = list[x];
          if (obj.compareText(text, x)) { estab = x; break; }
          else {
            for (var i in syn) { var ban = obj.compareText(text, syn[i]); if (ban) { estab = x; break; } }
          }
          if (estab) { break; }
        }
        if (estab) { type = estab; }
      }
    }
    return type;
  },
  getData: function (source, params, callback, error, before, complete) {
    var obj = this;
    var s_params = source.params;
    var stringify = source.stringify;
    if (!(s_params === undefined)) { for (var x in s_params) { params[x] = s_params[x]; } }
    if (!(stringify === undefined) && stringify) { params = JSON.stringify(params); }
    var dataObject = {
      data: params,
      success: function (json, estatus) { callback(json, estatus); },
      beforeSend: function (solicitudAJAX) {
        $('#' + obj.id + '_spinner').addClass('ajax-loader');
        if ($.isFunction(before)) { before(params); }
      },
      error: function (solicitudAJAX, errorDescripcion, errorExcepcion) { if ($.isFunction(error)) { error(errorDescripcion, errorExcepcion); } },
      complete: function (solicitudAJAX, estatus) {
        $('#' + obj.id + '_spinner').removeClass('ajax-loader');
        if ($.isFunction(complete)) { complete(solicitudAJAX, estatus); }
      }
    };
    for (var x in source) { if (!(/field|name|id|params|stringify/.test(x))) { dataObject[x] = source[x]; } }
    jQuery.support.cors = true;
    $.ajax(dataObject);
  },
  blinkElement: function (id) {
    setTimeout(function () {
      $('#' + id).addClass('blinkBlue');
      setTimeout(function () {
        $('#' + id).removeClass('blinkBlue');
        setTimeout(function () {
          $('#' + id).addClass('blinkBlue');
          setTimeout(function () { $('#' + id).removeClass('blinkBlue'); }, 500);
        }, 500);
      }, 500);
    }, 500);
  },
  textSearchFormat: function (text) {
    text = text.toLowerCase();
    text = text.replace(/[\u00E1]/gi, 'a').replace(/[\u00E9]/gi, 'e').replace(/[\u00ED]/gi, 'i').replace(/[\u00F3]/gi, 'o').replace(/[\u00FA]/gi, 'u').replace(/[\u00F1]/gi, 'n');
    text = text.replace(/&aacute;/g, 'a').replace(/&eacute;/g, 'e').replace(/&iacute;/g, 'i').replace(/&oacute;/g, 'o').replace(/&uacute;/g, 'u').replace(/&ntilde;/g, 'n');
    text = text.replace(/rr/g, 'r').replace(/h/g, '').replace(/ll/g, 'l').replace(/x|z|c/g, "s");
    return text;
  },
  compareText: function (a, b) {
    var obj = this;
    if (typeof (a) == 'object') {
      var ban = false;
      for (var x in a) {
        var a_s = obj.textSearchFormat(a[x]);
        var b_s = obj.textSearchFormat(b);
        if (a_s.search(b_s) >= 0) { ban = true; }
      }
      return ban;
    } else {
      var a_s = obj.textSearchFormat(a);
      var b_s = obj.textSearchFormat(b);
      return (a_s.search(b_s) >= 0);
    }
  },
  getDecimal: function (d) {
    var r = 0;
    var f = 1;
    for (var i = 0; i < d.length; i++) { r += d[i] / f; f *= 60; }
    return r.toFixed(5);
  },
  isCoord: function (value) {
    var r = null;
    var getCoordsRegExp = /(-?\d+(?:\.\d+)?)\s?,\s?(-?\d+(?:\.\d+)?)/;
    var degrees = /\+?(\d{1,3})(?:\u00B0|\u002A)?\s+?(\d{1,2})'?(?:\s+?(?:(\d+?(?:\.\d+?)?))"?)?\s*([nsewNSEW])?\s*?,\s*\+?(\d{1,3})(?:\u00B0|\u002A)?\s+?(\d{1,2})'?(?:\s+?(?:(\d+?(?:\.\d+?)?))"?)?\s*([nsewNSEW])?\s*$/i;
    var coord1 = 0.0, coord2 = 0.0;
    var isDegrees = degrees.exec(value);
    if (isDegrees) {
      var i = isDegrees;
      r = { lon: (parseFloat(this.getDecimal([i[1], i[2], (i[3]) ? i[3] : 0]))), lat: parseFloat(this.getDecimal([i[5], i[6], (i[7]) ? i[7] : 0])) };
      if (r.lon < r.lat) { var aux = r.lon; r.lon = r.lat; r.lat = aux; }
      r.lon = r.lon * -1;
      coord1 = parseFloat(r.lon);
      coord2 = parseFloat(r.lat);
    } else {
      var match = getCoordsRegExp.exec(value);
      if (match != null) { coord1 = parseFloat(match[1]); coord2 = parseFloat(match[2]); }
    }
    if (coord2 < 0) { var tmp = coord2; coord2 = coord1; coord1 = tmp; }
    if (coord1 != 0 && coord2 != 0) { r = { lon: coord1, lat: coord2 }; }
    return r;
  }
});
