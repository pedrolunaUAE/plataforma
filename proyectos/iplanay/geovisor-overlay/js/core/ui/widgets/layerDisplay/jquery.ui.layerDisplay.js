$.widget("custom.layerDisplay", {
  // default options
  id: '',
  timer: null,
  currentScale: 0,
  transparency: 1,
  wmsLayers: [],
  outLayers: {},
  cloud: {},
  layerCount: 0,
  lastSearch: '',
  selectedLayers: [],
  selectedServices: [],
  exludeList: {},
  statusMain: 'hidden',
  statusList: 'hidden',
  shortListTimer: 0,
  listaID:[],
  wmsCapabilitiesCache: null,
  wmsCapabilitiesRequest: null,
  options: {
    specialLayer: null,
    timeToSearch: 400,
    layers: [],
    defaultLayers: [],
    url: '',
    map: null,
    layerExtentWmsUrl: '/cgi-bin/mapserv?map=/opt/map/mdm60/vector_compostela.map',
    layerExtentWmsVersion: '1.1.1',
    // callbacks
    onActiveLayer: function () { },
    onResetActiveStatus: function () { },
    onDeactiveLayer: function () { },
    onThemeLayers: function (layers) { },
    onSetScale: function (scale) { },
    onZoomLayerExtent: function (extent, layer) { return false; },
    onChangeOpacity: function (val) { },
    getBottomMargin: function () { },
    onRefreshLists: function (data) { },
    change: null,
    random: null,
    startTheme: null

  },
  
  saveStats: function (data) {
    var obj = this;
    var dataSource = obj.options.dataSource;

    if (!dataSource || !dataSource.saveStats || !obj.options.map) {
      return;
    }

    var mainObj = {
      project: dataSource.proyName || '',
      session: obj.options.map.idSession || '',
      layers: data && data.id ? data.id : '',
      type: data && data.type ? data.type : ''
    };

    var request = $.extend(true, {}, dataSource.saveStats);
    request.data = JSON.stringify(mainObj);

    if (!request.url) {
      return;
    }

    $.ajax(request).fail(function () {
      // El registro estadístico no debe interrumpir la activación de capas.
    });
  },
  printAllLayers: function () {
    var obj = this;
    obj.printOutLayers();
    obj.printLayerSelectedList();
    obj.listLayersSelected();

    //notifica que se estan refrescando las listas
    obj.options.onRefreshLists({ layers: obj.selectedLayers, services: obj.selectedServices, outlayers: obj.countOutLayers() });
  },
  getLayers: function () {
    var obj = this;
    return obj.options.layers;
  },
  getActiveLayers: function () {
    var obj = this;
    var list = obj.selectedLayers;
    var result = [];
    for (var x in list) {
      if (list[x].active)
        result.push(list[x]);
    }
    return result;
  },


  getAllActiveLayers: function () {
    var obj = this;
    var list = obj.selectedLayers;
    var result = [];
    for (var x in list) {
      if (list[x].active) {
        result.push(list[x]);
      } else {
        var texts = list[x].texts;
        if (texts)
          if (texts.active)
            result.push(list[x]);
      }
    }
    return result;
  },
  getLayer: function (idLayer) {
    var obj = this;
    var list = obj.options.layers;
    var layer = null;
    var exlusionList = {};
    for (var x in list) {
      
      var idGroup = x;
      var labelGroup = list[x].label;
      var item = list[x].layers;
      var exists = item[idLayer];
      if (exists) {
        layer = exists;
        break;
      }
    }
    return layer;
  },
  exludeRules: function () {
    var obj = this;
    var list = obj.options.layers;
    var exlusionList = obj.exludeList;
    var specialLayersList = [];
    //get all specialLayers
    for (var x in list) {
      var item = list[x].layers;
      for (var i in item) {
        var layer = item[i];
        if (layer.specialLayer)
          specialLayersList.push(layer.idLayer);
      }
    }
    var tspecial = $.extend([], specialLayersList); //listado temporal de capas especiales 
    for (var x in list) {
      var idGroup = x;
      var labelGroup = list[x].label;
      var item = list[x].layers;
      for (var i in item) {
        var layer = item[i];
        var idLayer = i;
        var excludeItem = item[i].exclude;
        if (excludeItem || layer.specialLayer) {
          if (!excludeItem) { excludeItem = []; } else {
            excludeItem = excludeItem.split(',');
          }
          //si es una capa especial, excluye tambien a todas las demas especiales
          if (layer.specialLayer) {
            for (var s in tspecial) {
              var sl = tspecial[s]
              if (excludeItem.indexOf(sl) < 0 && sl != idLayer) {
                excludeItem.push(sl);
              }

            }
          }

          for (var e in excludeItem) {
            var eitem = excludeItem[e];
            var plist = exlusionList[idLayer];
            var elist = exlusionList[eitem];

            if (plist) {
              exlusionList[idLayer].push(eitem);
            } else {
              exlusionList[idLayer] = [eitem];
            }
            if (elist) {
              exlusionList[eitem].push(idLayer);
            } else {
              exlusionList[eitem] = [idLayer];
            }
          }
        }
      }
    }
  },
  setActiveLayers: function (layers) {
    var obj = this;
    var previousLayers = obj.getActiveLayers();
    var activeLayers = false;
    var layersIds = [];

    for (var x = 0; x < previousLayers.length; x++) {
      obj.options.onDeactiveLayer(previousLayers[x]);
    }

    $('#' + obj.id + ' .layerDisplay-body input:checkbox').prop('checked', false);
    $('#' + obj.id + ' .layerDisplay-body .layerDisplay-iconText_a')
      .removeClass('layerDisplay-iconText_a')
      .addClass('layerDisplay-iconText_d');

    obj.resetActiveStatus();
    obj.selectedLayers = [];

    if (layers && $.isArray(layers.layers)) {
      var ids = layers.layers;
      var list = obj.options.layers;
      activeLayers = [];

      for (var idGroup in list) {
        if (!list.hasOwnProperty(idGroup)) continue;

        var groupData = list[idGroup];
        var groupLayers = groupData.layers || {};

        for (var idLayer in groupLayers) {
          if (!groupLayers.hasOwnProperty(idLayer)) continue;
          if (ids.indexOf(idLayer) < 0) continue;

          var item = groupLayers[idLayer];
          var canActive = true;

          if (groupData.private) {
            canActive = !!$.cookie(groupData.private.urlvar);
            if (!canActive && obj.options.map && obj.options.map.Notification) {
              obj.options.map.Notification({ message: 'La capa es privada' });
            }
          }

          if (!canActive) continue;

          item.active = true;
          item.idGroup = idGroup;
          item.idLayer = idLayer;

          $('#' + obj.id + ' #' + idLayer).prop('checked', true);
          obj.addLayerShortcut(item);
          activeLayers.push(item);
          layersIds.push(idLayer);

          if (item.texts !== undefined) {
            $('#' + obj.id + ' .layerDisplay-body button[idref="' + idLayer + '"]')
              .removeClass('layerDisplay-iconText_d')
              .addClass('layerDisplay-iconText_a');

            item.texts.active = true;
            var textId = idLayer.replace('c', 't');
            var textLayer = $.extend({}, item);
            textLayer.idGroup = idGroup;
            textLayer.idLayer = textId;
            layersIds.push(textId);
            activeLayers.push(textLayer);
          }
        }
      }
    }

    obj.options.onThemeLayers(activeLayers);

    if ($.isArray(activeLayers)) {
      for (var index = 0; index < activeLayers.length; index++) {
        obj.options.onActiveLayer(activeLayers[index]);
      }
    }

    obj.printAllLayers();

    if (layersIds.length > 0) {
      obj.saveStats({ id: layersIds.join(), type: 'theme' });
    }
  },
  resetActiveStatus: function () {
    var obj = this;
    var list = obj.options.layers;
    for (var x in list) {
      var idGroup = x;
      var labelGroup = list[x].label;
      var item = list[x].layers;
      for (var i in item) {
        var idLayer = i;
        var label = item[i].label;
        var synonymous = item[i].synonymous;
        var scale = item[i].scale;
        var position = item[i].position;
        var active = item[i].active;

        item[i].active = false;
        if (!(item[i].texts === undefined)) item[i].texts.active = false;
      }
    }
    obj.options.onResetActiveStatus();
  },
  prepareLayers: function () {
    var obj = this;
    var list = obj.options.layers;
    var viewDataList = obj.layerViewData;

    for (var x in list) {
      var idGroup = x;
      var labelGroup = list[x].label;
      var item = list[x].layers;
      for (var i in item) {
        var idLayer = i;

        //ajusta layer en caso que sea una capa de solo te
        if (idLayer.substr(0, 1) == 't') {
          item[i].isText = true;
          item[i].texts = { active: item[i].active };
          item[i].active = false;
        }

        item[i].idGroup = idGroup;
        item[i].idLayer = idLayer;
        if (viewDataList.indexOf(item[i].idLayer) >= 0)
          item[i].viewData = true;


        if (item[i].active || (!(item[i].texts === undefined) && item[i].texts.active)) {
          obj.addLayerShortcut(item[i]); //agrega la capa activa a el despliegue frontal
        }
      }
    }
  },
  setZoomIcon: function (_scale) {
    var obj = this;
    obj.currentScale = _scale;
    var list = obj.options.layers;
    for (var x in list) {
      var idGroup = x;
      var labelGroup = list[x].label;
      var item = list[x].layers;
      for (var i in item) {
        var idLayer = i;
        var label = item[i].label;
        var synonymous = item[i].synonymous;
        var scale = item[i].scale;
        var position = item[i].position;
        var active = item[i].active;

        var visible = ((_scale < scale) && (scale != 0)) ? '' : 'none';

        $('#' + obj.id + '_' + idLayer + '_scale').css('display', visible);
        $('#' + obj.id + '_' + idLayer + '_scale_sel').css('display', visible);
        $('#' + obj.id + '_' + idLayer + '_scale_s').css('display', visible);
      }
    }
  },
  setTextLayer: function (group, layer, value) {
    var obj = this;
    var item = obj.options.layers[group].layers[layer];

    var group = obj.options.layers[group];
    var canActive = false;
    if (group.private) { // es privado el grupo
      var _var = group.private.urlvar;
      var val = group.private.value;
      var cookieVal = $.cookie(_var);
      if (cookieVal) {
        canActive = true
      } else {
        obj.options.map.Notification({ message: 'La capa es privada' });
      }
    } else {
      canActive = true;
    }

    if (canActive) {

      if (value === undefined) {
        item.texts.active = !item.texts.active;
      } else {
        item.texts.active = value;
      }

      var titem = $.extend({}, item);
      var tId = layer.replace('c', 't');
      titem.idLayer = tId;
      if (titem.texts.active) {
        obj.options.onActiveLayer(titem);
        obj.addLayerShortcut(item);
      } else {
        obj.options.onDeactiveLayer(titem);
      }

      

      $('.layerDisplay-btnText[idgroup="' + group + '"][idref="' + layer + '"]').each(function () {
       
        var strActive = (item.texts.active) ? 'a' : 'd';
        $(this).removeClass('layerDisplay-iconText_a')
          .removeClass('layerDisplay-iconText_d')
          .addClass('layerDisplay-iconText_' + strActive);
      });
      obj.printAllLayers();

    }
  },
  exludeLayer: function (activeId) {
    var obj = this;
    var exludeRule = null;

    var layer = '';

    if (typeof (activeId) == 'object') {
      if (activeId.exludeList) {
        exludeRule = activeId.exludeList;
      }
    } else {
      layer = activeId;
      exludeRule = obj.exludeList[layer];
    }


    if (exludeRule) {
      var preserve = obj.getLayer(layer);
      var list = exludeRule;
      for (var x in exludeRule) {
        var reject = obj.getLayer(exludeRule[x]);
        var treject = null;
        if (reject && reject.active) {
          reject.active = false;
          $('#' + reject.idLayer).prop('checked', false);
          obj.options.onDeactiveLayer(reject);

          treject = reject.texts;
        }
        if (treject) {
          if (treject.active) {
            reject.texts.active = false;
            $('.layerDisplay-btnText[idref=' + reject.idLayer + ']').addClass('layerDisplay-iconText_d').removeClass('layerDisplay-iconText_a');
            treject = $.extend(true, {}, reject);
            treject.idLayer = treject.idLayer.replace('c', 't');
            obj.options.onDeactiveLayer(treject);
          }
        }
      }
    }
    if (typeof (activeId) == 'object')
      obj.printAllLayers();
  },
  parseLayerExtent: function (value) {
    if (!value) return null;
    var values = $.isArray(value) ? value.slice(0, 4) : String(value).split(/[\s,]+/).slice(0, 4);
    if (values.length < 4) return null;
    var extent = [parseFloat(values[0]), parseFloat(values[1]), parseFloat(values[2]), parseFloat(values[3])];
    if (!isFinite(extent[0]) || !isFinite(extent[1]) || !isFinite(extent[2]) || !isFinite(extent[3])) return null;
    if (extent[0] > extent[2]) { var tx = extent[0]; extent[0] = extent[2]; extent[2] = tx; }
    if (extent[1] > extent[3]) { var ty = extent[1]; extent[1] = extent[3]; extent[3] = ty; }
    return extent;
  },
  xmlLocalName: function (node) {
    return node ? (node.localName || node.baseName || String(node.nodeName || '').split(':').pop()) : '';
  },
  directXmlChildren: function (parent, name) {
    var obj = this;
    var result = [];
    if (!parent || !parent.childNodes) return result;
    for (var i = 0; i < parent.childNodes.length; i++) {
      var child = parent.childNodes[i];
      if (child.nodeType === 1 && obj.xmlLocalName(child) === name) result.push(child);
    }
    return result;
  },
  xmlText: function (node) {
    return $.trim(node ? (node.textContent || node.text || '') : '');
  },
  findWmsLayerNode: function (node, layerName) {
    var obj = this;
    if (!node) return null;
    if (obj.xmlLocalName(node) === 'Layer') {
      var names = obj.directXmlChildren(node, 'Name');
      if (names.length && obj.xmlText(names[0]) === layerName) return node;
    }
    var children = node.childNodes || [];
    for (var i = 0; i < children.length; i++) {
      if (children[i].nodeType !== 1) continue;
      var found = obj.findWmsLayerNode(children[i], layerName);
      if (found) return found;
    }
    return null;
  },
  normalizeProjection: function (code) {
    code = String(code || '').toUpperCase();
    if (code === 'EPSG:900913' || code === 'EPSG:102100' || code === 'EPSG:102113') return 'EPSG:3857';
    return code;
  },
  getMapProjectionCode: function () {
    var map = this.options.map && (this.options.map.map || this.options.map);
    if (!map) return '';
    if ($.isFunction(map.getProjectionObject)) {
      var projection = map.getProjectionObject();
      if (projection && $.isFunction(projection.getCode)) return projection.getCode();
    }
    return $.isFunction(map.getProjection) ? map.getProjection() : '';
  },
  getWmsLayerExtent: function (layerNode) {
    var obj = this;
    var boxes = obj.directXmlChildren(layerNode, 'BoundingBox');
    var preferred = [obj.getMapProjectionCode(), 'EPSG:900913', 'EPSG:3857', 'EPSG:4326'];
    for (var p = 0; p < preferred.length; p++) {
      var wanted = obj.normalizeProjection(preferred[p]);
      if (!wanted) continue;
      for (var i = 0; i < boxes.length; i++) {
        var code = boxes[i].getAttribute('SRS') || boxes[i].getAttribute('CRS') || '';
        if (obj.normalizeProjection(code) !== wanted) continue;
        var extent = obj.parseLayerExtent([
          boxes[i].getAttribute('minx'), boxes[i].getAttribute('miny'),
          boxes[i].getAttribute('maxx'), boxes[i].getAttribute('maxy')
        ]);
        if (extent) return { extent: extent, projection: code };
      }
    }
    var latLon = obj.directXmlChildren(layerNode, 'LatLonBoundingBox');
    if (latLon.length) {
      var llExtent = obj.parseLayerExtent([
        latLon[0].getAttribute('minx'), latLon[0].getAttribute('miny'),
        latLon[0].getAttribute('maxx'), latLon[0].getAttribute('maxy')
      ]);
      if (llExtent) return { extent: llExtent, projection: 'EPSG:4326' };
    }
    return null;
  },
  getWmsCapabilities: function (success, failure) {
    var obj = this;
    if (obj.wmsCapabilitiesCache) { success(obj.wmsCapabilitiesCache); return; }
    if (obj.wmsCapabilitiesRequest) {
      obj.wmsCapabilitiesRequest.done(success).fail(failure);
      return;
    }
    obj.wmsCapabilitiesRequest = $.ajax({
      url: obj.options.layerExtentWmsUrl,
      type: 'GET',
      dataType: 'xml',
      cache: true,
      data: {
        SERVICE: 'WMS',
        REQUEST: 'GetCapabilities',
        VERSION: obj.options.layerExtentWmsVersion || '1.1.1'
      }
    });
    obj.wmsCapabilitiesRequest.done(function (xml) {
      obj.wmsCapabilitiesCache = xml;
      if ($.isFunction(success)) success(xml);
    }).fail(function () {
      if ($.isFunction(failure)) failure();
    }).always(function () {
      obj.wmsCapabilitiesRequest = null;
    });
  },
  zoomMapToExtent: function (extentData, layer) {

      var obj = this;

      if (!extentData || !extentData.extent || !obj.options.map) {
          return false;
      }

      var e = extentData.extent;

      if (
          extentData.projection === 'EPSG:900913' ||
          extentData.projection === 'EPSG:3857'
      ) {

          var ll1 =
              obj.options.map.transformToGeographic(
                  e[0],
                  e[1]
              );

          var ll2 =
              obj.options.map.transformToGeographic(
                  e[2],
                  e[3]
              );

          obj.options.map.goCoords(
              ll1.lon,
              ll1.lat,
              ll2.lon,
              ll2.lat,
              'geographic'
          );

          return true;
      }

      obj.options.map.goCoords(
          e[0],
          e[1],
          e[2],
          e[3],
          'geographic'
      );

      return true;
  },
  zoomToLayerContent: function (idLayer, scale) {
    var obj = this;
    function fallback() {
      if (scale !== undefined && scale !== null && scale !== '') obj.options.onSetScale(parseFloat(scale, 10));
    }
    if (!idLayer || !obj.options.layerExtentWmsUrl) { fallback(); return; }
    obj.getWmsCapabilities(function (xml) {
      var node = obj.findWmsLayerNode(xml.documentElement || xml, idLayer);
      if (!node) { fallback(); return; }
      var extentData = obj.getWmsLayerExtent(node);
      if (!extentData || !obj.zoomMapToExtent(extentData, obj.getLayer(idLayer) || { idLayer: idLayer })) fallback();
    }, fallback);
  },
  mapExtend: function (param, geo) {
    var obj = this;
    switch (typeof (param)) {
      /*case 'string':
        obj.options.map.goCoords(param);
        break;*/
      case 'object':
        var geo = (!(geo === undefined) && geo) ? 'geographic' : 'mercator';
        var lon = 0;
        var lat = 0;
        if (param.length == 2) {
          lon = parseFloat(param[0], 10);
          lat = parseFloat(param[1], 10);
        } else {
          lon = parseFloat(param.lon);
          lat = parseFloat(param.lat);
        }

        obj.options.map.goCoords(lon, lat, geo);
        break;
    };
  },
  setCheckLayer: function (group, layer, value) {
    var obj = this;
    var groupData = obj.options.layers[group];

    if (!groupData || !groupData.layers || !groupData.layers[layer]) {
      return;
    }

    var canActive = true;

    if (groupData.private) {
      canActive = !!$.cookie(groupData.private.urlvar);
      if (!canActive && obj.options.map && obj.options.map.Notification) {
        obj.options.map.Notification({ message: 'La capa es privada' });
      }
    }

    if (!canActive) {
      $('#' + layer).prop('checked', false);
      return;
    }

    if (value) {
      obj.exludeLayer(layer);
    }

    var item = groupData.layers[layer];
    item.idGroup = group;
    item.idLayer = layer;
    item.active = !!value;

    $('#' + layer).prop('checked', item.active);

    if (item.active) {
      obj.addLayerShortcut(item);
      obj.options.onActiveLayer(item);
    } else {
      obj.options.onDeactiveLayer(item);
    }

    obj.printAllLayers();
  },
  closeLayer: function (group, layer) {
    var obj = this;

    if (typeof group == 'object') {
      layer = group.idLayer;
      group = group.idGroup;
    }

    var groupData = obj.options.layers[group];
    if (!groupData || !groupData.layers || !groupData.layers[layer]) {
      return;
    }

    var item = groupData.layers[layer];
    item.active = false;
    obj.options.onDeactiveLayer(item);

    if (item.texts && item.texts.active) {
      var textItem = $.extend(true, {}, item);
      textItem.idLayer = layer.replace('c', 't');
      item.texts.active = false;
      obj.options.onDeactiveLayer(textItem);
    }

    $('#' + layer).prop('checked', false);

    for (var index = obj.selectedLayers.length - 1; index >= 0; index--) {
      if (obj.selectedLayers[index].idLayer == layer) {
        obj.selectedLayers.splice(index, 1);
      }
    }

    obj.printAllLayers();
  },
  addLayerShortcut: function (item) {
    var obj = this;

    var list = this.selectedLayers;
    var ban = false; //existe el elemento?
    var idLayer = item.idLayer;
    if (list.length > 0) {
      for (var x in list) {
        if (list[x].idLayer == idLayer) {
          ban = true;
          break;
        }
      }
    }
    if (!ban)
      list.push(item);

    return !ban; //devuelve true si la inserto y false de lo contrario
  },
  printLayerSelectedList: function () {
    var obj = this;
    var list = this.selectedLayers;
    var services = obj.wmsLayers;
    var strGroup = '';
    for (var x in list) {

      var idGroup = list[x].idGroup;
      var idLayer = list[x].idLayer;
      var item = list[x];

      var strLayer = '';

      var label = item.label;
      var synonymous = item.synonymous;
      var scale = item.scale;
      var position = item.position;
      var active = item.active;

      var displayStatus = (active) ? 'layerDisplay-iconEye_a' : 'layerDisplay-iconEye_d';
      var btnClose = '<button alt="Remover capa" title="Remover capa" pos="' + x + '" id="' + obj.id + '_' + idLayer + '_show_" idref="' + idLayer + '" scale="' + scale + '"  idGroup="' + idGroup + '" class="layerDisplay-sprite layerDisplay-iconClose2 layerDisplay-transparentBtn btnCloseShortcut"></button>';
      var btnDisplay = (item.isText === undefined) ? '<button alt="Visualizar/Ocultar capa" title="Visualizar/Ocultar capa" id="' + obj.id + '_' + idLayer + '_show" idref="' + idLayer + '" scale="' + scale + '"  idGroup="' + idGroup + '" class="layerDisplay-sprite ' + displayStatus + ' layerDisplay-transparentBtn btnShowShortcut"></button>' : '<div class="layerDisplay-btnSpace"></div>';

      var scaleVisible = ((obj.currentScale < scale) && (scale != 0)) ? '' : 'none';
      var btnScale = '<button alt="Acercar al contenido de la capa" title="Acercar al contenido de la capa" id="' + obj.id + '_' + idLayer + '_scale_sel" idref="' + idLayer + '" scale="' + scale + '"  idGroup="' + idGroup + '" style="display:' + scaleVisible + '" class="layerDisplay-sprite layerDisplay-btnScale layerDisplay-btnScale-selected  layerDisplay-iconZoom_a layerDisplay-flatBtn shadow"></button>';
      //
      var texts = (!(item.texts === undefined)) ? item.texts : null;
      var btnTextClass = (texts != null && texts.active) ? 'layerDisplay-iconText_a shadow' : 'layerDisplay-iconText_d';
      var btnText = ((texts != null) ? '<button id="' + obj.id + '_' + idLayer + '_tl_s2" idref="' + idLayer + '" idGroup="' + idGroup + '" alt="Activar/Desactivar textos" title="Activar/Desactivar textos" class="layerDisplay-sprite ' + btnTextClass + ' layerDisplay-flatBtn btnTextShortcut"></button>' : '');

      var btnViewLayerData = (!(item.viewData === undefined)) ? '<button idref="' + idLayer + '" idGroup="' + idGroup + '" alt="Ver metadato" title="Ver datos de capa" class="layerDisplay-iconViewData_a layerDisplay-btnViewData layerDisplay-flatBtn"></button>' : '';

      var btnDownload = (!(item.download === undefined)) ? '<button idref="' + idLayer + '" idGroup="' + idGroup + '" alt="Descarga" title="Descarga" class="layerDisplay-iconDownload_a layerDisplay-flatBtn layerDisplay-download btnLayerDownload"></button>' : '';

      strLayer += '<div class="layerDisplay-layerSelected-2 shadow" layer="' + idLayer + '" id="container_'+idLayer+'_selected">' + btnClose + btnDisplay + '<label id="' + obj.id + '_l_' + idLayer + '_s_">' + label + '</label><div style="float:right;padding-right:3px;">' + btnViewLayerData + btnText + btnScale + btnDownload + '</div></div>';
      //    
      strGroup += strLayer;
    }
    var strService = '';
    var selectedServices = []
    for (var x in services) {
      var service = services[x];
      if (service.selected.layers.length > 0) {
        selectedServices.push(service);
        var id = service.id;
        var label = service.label;
        var format = service.selected.format.split('/')[1].toUpperCase();

        var checked = (service.active) ? 'layerDisplay-iconEye_a' : 'layerDisplay-iconEye_d';

        strService += '<div id="layerDisplay_selectedService_' + id + '" idref="' + id + '" class="layerDisplay-selectedService2">';
        strService += '	<span id="layerDisplay_selectedService2_check_' + id + '" active="' + service.active + '" idref="' + id + '" class="layerDisplay-selectedService2-check layerDisplay-sprite ' + checked + '"/>';
        strService += '	<label>' + label + '</label>';
        strService += '	<label class="layerDisplay-selectedService2-check">' + format + '</label>';
        strService += '</div>';
      }
    }
    obj.selectedServices = selectedServices;

    $('#' + obj.id + '_service_selected_2').html(strService);
    $('.shortList-service-group').css('display', ((strService != '') ? 'block' : 'none'));

    //_service_selected_2

    $('.shortList-layer-group').css('display', ((strGroup != '') ? 'block' : 'none'));
    $('#' + obj.id + '_layer_selected_2').html(strGroup);

    $('.layerDisplay-selectedService2-check').each(function (index, element) {
      $(this).click(function () {
        var idref = $(this).attr('idref');
        var active = ($(this).attr('active') == 'true');
        obj.changeService({ active: !active }, idref)
      });
    });


    $('.btnCloseShortcut').each(function () {
      var layer = $(this).attr('idref');
      var group = $(this).attr('idgroup');
      var pos = parseInt($(this).attr('pos'), 10);
      var value = $(this).hasClass('layerDisplay-iconEye_a');
      var outlayer = $(this).attr('outlayer');
      $(this).click(function (e) {
        if (!outlayer) {
          obj.closeLayer(group, layer);
          e.stopPropagation();
        } else {
          obj.closeOutLayer(group, pos);
        }
      })
    });

    $('.btnShowShortcut').each(function () {
      var layer = $(this).attr('idref');
      var group = $(this).attr('idgroup');
      var value = $(this).hasClass('layerDisplay-iconEye_a');
      var outlayer = $(this).attr('outlayer');
      $(this).click(function (e) {
        if (!outlayer) {
          obj.setCheckLayer(group, layer, !value);
        } else {
          var pos = parseInt($(this).attr('pos'), 10);
          obj.setCheckOutLayer(group, pos, !value);
        }
        e.stopPropagation();
      })
    });

    $('.btnTextShortcut').each(function () {
      $(this).click(function (e) {
        var layer = $(this).attr('idref');
        var group = $(this).attr('idgroup');
        var value = $(this).hasClass('layerDisplay-iconText_a');
        obj.setTextLayer(group, layer, !value);
        e.stopPropagation();
      });

    });



  },
  getLayersSelected: function () {
    var obj = this;
    var list = obj.options.layers;
    var services = obj.wmsLayers;

    var strGroup = '';
    for (var x in list) {
      var idGroup = x;
      var labelGroup = list[x].label;
      var item = list[x].layers;
      var strLayer = '';
      for (var i in item) {
        if (
          (!(item[i].active === undefined) && item[i].active) ||
          (!(item[i].texts === undefined) && item[i].texts.active)) {
          var idLayer = i;
          var label = item[i].label;
          var synonymous = item[i].synonymous;
          var scale = item[i].scale;
          var position = item[i].position;
          var active = item[i].active;

          var checked = (active) ? 'checked="checked"' : '';

          var scaleVisible = ((obj.currentScale < scale) && (scale != 0)) ? '' : 'none';
          var btnScale = '<button alt="Acercar al contenido de la capa" title="Acercar al contenido de la capa" id="' + obj.id + '_' + idLayer + '_scale_s" scale="' + scale + '" idref="' + idLayer + '"  idGroup="' + idGroup + '" style="display:' + scaleVisible + '" class="layerDisplay-sprite layerDisplay-btnScale layerDisplay-btnScale-selected  layerDisplay-iconZoom_a layerDisplay-flatBtn shadow"></button>';

          var texts = (!(item[i].texts === undefined)) ? item[i].texts : null;
          var btnTextClass = (texts != null && texts.active) ? 'layerDisplay-iconText_a shadow' : 'layerDisplay-iconText_d';
          var btnText = ((texts != null) ? '<button id="' + obj.id + '_' + idLayer + '_tl_s" idref="' + idLayer + '" idGroup="' + idGroup + '" alt="Activar/Desactivar textos" title="Activar/Desactivar textos" class="layerDisplay-sprite ' + btnTextClass + ' layerDisplay-btnText layerDisplay-btnText-selected layerDisplay-flatBtn"></button>' : '');
          var checkbox = (item[i].isText === undefined) ? '<input type="checkbox" id="' + idLayer + '_s" idGroup="' + idGroup + '" layer="' + idLayer + '" ' + checked + ' class="layerDisplay-checkLayer layerDisplay-checkLayer-selected">' : '<div class="layerDisplay-btnSpace"></div>';
          strLayer += '<div class="layerDisplay-layerSelected" layer="' + idLayer + '" id="container_' + idLayer + '_s">' + checkbox + '<label id="' + obj.id + '_l_' + idLayer + '_s">' + label + '</label><div style="float:right;padding-right:3px;">' + btnText + btnScale + '</div></div>';
        }
      }
      strGroup += strLayer;
    }
    //Listado de servicios
    if (strGroup != '')
      strGroup = '<label class="layerDisplay-layerSelected-title">Capas de informaci&oacute;n</label>' + strGroup;
    var strService = '';
    for (var x in services) {
      var service = services[x];
      if (service.selected.layers.length > 0) {
        var id = service.id;
        var label = service.label;
        var format = service.selected.format.split('/')[1].toUpperCase();

        var checked = (service.active) ? 'checked="checked"' : '';

        strService += '<div id="layerDisplay_selectedService_' + id + '" idref="' + id + '" class="layerDisplay-selectedService">';
        strService += '	<input id="layerDisplay_selectedService_check_' + id + '" idref="' + id + '" class="layerDisplay-selectedService-check" type="checkbox" ' + checked + ' />';
        strService += '	<label for="layerDisplay_selectedService_check_' + id + '">' + label + '</label>';
        strService += '	<span idref="' + id + '" class="layerDisplay-selectedService-close layerDisplay-sprite layerDisplay-iconClose-s" />';
        strService += '	<label for="layerDisplay_selectedService_check_' + id + '" class="layerDisplay-selectedService-check">' + format + '</label>';
        strService += '</div>';
      }
    }
    if (strService != '')
      strGroup = strGroup + '<label class="layerDisplay-layerSelected-title">Servicios</label>' + strService;

    return strGroup;
  },
 
   

  getGroupIconClass: function (label) {
    var text = (label || '').toString().toLowerCase();

    if (/marco|geoestad|cartograf|territor|geograf/.test(text)) return 'ld-groupIcon-geo';
    if (/medio fis|medio fís|ambient|natural|ecolog/.test(text)) return 'ld-groupIcon-nature';
    if (/infraestructura|vial|transporte|equipamiento|obra/.test(text)) return 'ld-groupIcon-infrastructure';
    if (/socio|demograf|poblacion|población|vivienda|social/.test(text)) return 'ld-groupIcon-people';
    if (/riesgo|peligro|atlas|emergencia|proteccion|protección/.test(text)) return 'ld-groupIcon-risk';
    if (/econom|comerc|industr|empresa|actividad/.test(text)) return 'ld-groupIcon-economy';
    if (/agua|hidro|rio|río|cuenca|oromap/.test(text)) return 'ld-groupIcon-water';
    if (/salud|hospital|medic/.test(text)) return 'ld-groupIcon-health';
    if (/educa|escuela|universidad/.test(text)) return 'ld-groupIcon-education';
    if (/seguridad|justicia|delito/.test(text)) return 'ld-groupIcon-security';

    return 'ld-groupIcon-layers';
  },

  getLayersDomList: function () {

    var obj = this;
    var list = obj.options.layers;
    var strGroup = '';
    var count = 0;
    var coords= '';
    var temasAgregados = {}; // Objeto para rastrear los temas ya agregados
    // Objeto para almacenar las capas agrupadas por tema
    var layersByTheme = {};
    // Inicializamos un objeto para almacenar los grupos con el atributo theme{...}
    const layersByGroup= {
      PMDU: {},
      PPDUCH: {},
      sinGroup:{},
    };
    var contPMDU =0;
    var contPPDUCH =0;

    for (var x in list) {
      var idGroup = x;
      var labelGroup = list[x].label;
      var groupIconClass = obj.getGroupIconClass(labelGroup);
      var coords = list[x].coord;
      var item = list[x].layers;
      
      var strLayer = '';

      
      for (var i in item) {

        
        var idLayer = i;
       //console.log("Coord en layerDisplay: "+coords);
        var label = item[i].label;
        var synonymous = item[i].synonymous;
        var scale = item[i].scale;
        var position = item[i].position;
        var active = item[i].active;
        /**** actual v1*/
        var theme = item[i].theme;
       // console.log("TEMA ES : "+tema);
       var varIdTema;
        /****** */
        
        

        var checked = (active) ? 'checked="checked"' : '';

        var btnScale = '<button alt="Acercar al contenido de la capa" title="Acercar al contenido de la capa" id="' + obj.id + '_' + idLayer + '_scale" layer="' + idLayer + '" idref="' + idLayer + '" scale="' + scale + '" idGroup="' + idGroup + '" style="display:none" class="layerDisplay-sprite layerDisplay-btnScale layerDisplay-iconZoom_a layerDisplay-flatBtn shadow"></button>';

        var texts = (!(item[i].texts === undefined)) ? item[i].texts : null;
        var btnTextClass = (texts != null && texts.active) ? 'layerDisplay-iconText_a shadow' : 'layerDisplay-iconText_d';
        var btnText = ((texts != null) ? '<button id = "' + idLayer+'_btn" idref="' + idLayer + '" idGroup="' + idGroup + '" alt="Activar/Desactivar textos" title="Activar/Desactivar textos" class="layerDisplay-sprite ' + btnTextClass + ' layerDisplay-btnTextIcon layerDisplay-btnText layerDisplay-flatBtn button"></button>' : '');
        var btnDisplay = (item[i].isText === undefined) ? '<input type="checkbox" id="' + idLayer + '" idGroup="' + idGroup + '" layer="' + idLayer + '" ' + checked + ' class="layerDisplay-checkLayer layerDisplay-coord" data-coords="' + coords + '" >' : '<div class="layerDisplay-btnSpace"></div>';
        var relLabelCheck = (item[i].isText === undefined) ? 'for="' + idLayer + '"' : '';
      /*var btnMetadato = (!(item[i].metadato === undefined)) ? '<div class="dropdown2"> <button onclick="myFunction()" idref="' + idLayer + '" url="' + item[i].metadato + '" idGroup="' + idGroup + '" alt="Ver metadato" title="Ver metadato" class="layerDisplay-iconDownload layerDisplay-download dropbtn  layerDisplay-flatBtn"></button> <div id="myDropdown" class="dropdown-content2">   <a class = "layerDisplay-btnMetadato" href="#">Link 1</a>  <a href="#">Link 2</a> </div> </div>' : ''; */
        //var btnMetadato = (!(item[i].metadato === undefined))?'<button idref="'+idLayer+'" url="'+item[i].metadato+'" idGroup="'+idGroup+'" alt="Ver metadato" title="Ver metadato" class="layerDisplay-iconDownload layerDisplay-download layerDisplay-btnMetadato layerDisplay-flatBtn"></button>':'';
        var btnMetadato = (!(item[i].metadato === undefined))?'<button   id = "'+idLayer+'_btnDownload" idref="'+idLayer+'" url="'+item[i].metadato+'" idGroup="'+idGroup+'" alt="Descargar" title="Descargar" class="layerDisplay-iconDownload layerDisplay-download layerDisplay-downloadToggle dropbtn layerDisplay-flatBtn descargabtn" ></button>':'';
        var btnDownload = (!(item[i].download === undefined)) ? '<button idref="' + idLayer + '" idGroup="' + idGroup + '" alt="Descarga" title="Descarga" class="layerDisplay-iconDownload layerDisplay-download layerDisplay-flatBtn"></button>' : '';
        
        var btnViewLayerData = (!(item[i].viewData === undefined)) ? '<button idref="' + idLayer + '" idGroup="' + idGroup + '" alt="Ver metadato" title="Ver datos de capa" class="layerDisplay-iconViewData_a layerDisplay-btnViewData layerDisplay-flatBtn"></button>' : '';

        /* Menu de descarga reutilizable para capas normales y capas de subgrupos. */
        var downloadMenu = '';
        if (item[i].metadato !== undefined || item[i].descarga !== undefined) {
          downloadMenu += '<div class="btndescarga_' + idLayer + ' layerDisplay-downloadMenu" data-layer="' + idLayer + '">';
          downloadMenu += '  <div class="dropdown-content2">';

          if (item[i].metadato !== undefined) {
            downloadMenu += '<a url="' + item[i].metadato + '" class="layerDisplay-btnMetadato downloadMapBtn">' + 'Descarga Mapa</a>';
          }
          if (item[i].descarga !== undefined) {
            downloadMenu += '<a url="' + item[i].descarga + '" class="layerDisplay-btnMetadato downloadSourceBtn">' + 'Descarga Fuente</a>';
          }

          downloadMenu += '  </div>';
          downloadMenu += '</div>';
        }
/******** */
        var btnInformatio = (!(item[i].informatio === undefined))?'<button idref="'+idLayer+'" url="'+item[i].informatio+'" idGroup="'+idGroup+'" alt="Ver documento" title="Ver documento" class="layerDisplay-sprite layerDisplay-iconMetadato_a layerDisplay-btnMetadato layerDisplay-flatBtn"></button>':'';
        var btnImagen = (!(item[i].imagen === undefined))?'<button   id = "'+idLayer+'_btnMap" idref="'+idLayer+'" url="'+item[i].imagen+'" idGroup="'+idGroup+'" alt="Visualizar mapa" title="Visualizar mapa" class="layerDisplay-icon-mapa layerDisplay-flatBtn layerDisplay-btnMetadato"></button>':'';

/******* */
        //var btnThematicLink = ((item[i].thematicLink && item[i].thematicLink != '' ))?'<a href="'+item[i].thematicLink+'" target="_blank"><button idref="'+idLayer+'"  class="layerDisplay-thematicLink layerDisplay-info layerDisplay-flatBtn"></button></a>':'';
        if (theme !== undefined) { // Verificar si el tema estÃ¡ definido y no estÃ¡ vacÃ­o
          // Verificar si el tema ya ha sido agregado, si no, agregarlo
          //varIdTema = idGroup+theme.idTema;
          if(idLayer.slice(4,8)==="pmdu"){
            if (!layersByGroup.PMDU[idGroup+theme.idTema]) {
              layersByGroup.PMDU[idGroup+theme.idTema] = {
                tema: theme.tema,
                layersT: []
              };
            }
            layersByGroup.PMDU[idGroup+theme.idTema].layersT.push('<div class="layerDisplay-layer-'+idGroup+theme.idTema+' layerDisplay-layer-tema layerDisplay-coord"  id="' + obj.id + '_mLayer_' + idLayer + '" data-coords="' + coords + '">' + btnDisplay + '<label ' + relLabelCheck + ' id="' + obj.id + '_l_' + idLayer + '">' + ((btnViewLayerData != '') ? '<big><b>*</b></big>' : '') + label + '</label><div class="layerDisplay-actions">'+ btnMetadato + btnImagen + btnInformatio + btnScale + btnText + btnDownload + '</div></div>' + downloadMenu);
          }
          else if(idLayer.slice(4,10)==="ppduch"){
            if (!layersByGroup.PPDUCH[idGroup+theme.idTema]) {
              layersByGroup.PPDUCH[idGroup+theme.idTema] = {
                tema: theme.tema,
                layersT: []
              };
            }
            layersByGroup.PPDUCH[idGroup+theme.idTema].layersT.push('<div class="layerDisplay-layer-'+idGroup+theme.idTema+' layerDisplay-layer-tema layerDisplay-coord"  id="' + obj.id + '_mLayer_' + idLayer + '" data-coords="' + coords + '">' + btnDisplay + '<label ' + relLabelCheck + ' id="' + obj.id + '_l_' + idLayer + '">' + ((btnViewLayerData != '') ? '<big><b>*</b></big>' : '') + label + '</label><div class="layerDisplay-actions">'+ btnMetadato + btnImagen + btnInformatio + btnScale + btnText + btnDownload + '</div></div>' + downloadMenu);
          }
          else{
            if (!layersByGroup.sinGroup[idGroup+theme.idTema]) {
              //strLayer += '<div class="layerDisplay-layer themeName" id="' + theme.idTema + '">' + theme.tema + '</div>';
              //temasAgregados[theme.idTema] = true; // Marcar el tema como agregado
              // Si no estÃ¡, crear un array vacÃ­o para ese tema
              layersByGroup.sinGroup[idGroup+theme.idTema] = {
                tema: theme.tema,
                layersT: []
              };
          }
          layersByGroup.sinGroup[idGroup+theme.idTema].layersT.push('<div class="layerDisplay-layer-'+idGroup+theme.idTema+' layerDisplay-layer-tema layerDisplay-coord"  id="' + obj.id + '_mLayer_' + idLayer + '" data-coords="' + coords + '">' + btnDisplay + '<label ' + relLabelCheck + ' id="' + obj.id + '_l_' + idLayer + '">' + ((btnViewLayerData != '') ? '<big><b>*</b></big>' : '') + label + '</label><div class="layerDisplay-actions">'+ btnMetadato + btnImagen + btnInformatio + btnScale + btnText + btnDownload + '</div></div>' + downloadMenu);

          }
          /*
          if (!layersByTheme[theme.idTema]) {

              //strLayer += '<div class="layerDisplay-layer themeName" id="' + theme.idTema + '">' + theme.tema + '</div>';
              //temasAgregados[theme.idTema] = true; // Marcar el tema como agregado
              // Si no estÃ¡, crear un array vacÃ­o para ese tema
              layersByTheme[theme.idTema] = {
                tema: theme.tema,
                layersT: []
              };
          }

         layersByTheme[theme.idTema].layersT.push('<div class="layerDisplay-layer-'+theme.idTema+' layerDisplay-layer-tema layerDisplay-coord"  id="' + obj.id + '_mLayer_' + idLayer + '" coords="' + coords + '">' + btnDisplay + '<label ' + relLabelCheck + ' id="' + obj.id + '_l_' + idLayer + '">' + ((btnViewLayerData != '') ? '<big><b>*</b></big>' : '') + label + '</label>'+ btnMetadato +btnImagen+ btnInformatio+ btnScale + btnText + btnDownload  /*+btnViewLayerData*/ //+ '</div>');
          // Agregar el elemento al grupo del tema
        //strLayer += '<div id="theme_"' + tema + '">'; // Establecer el contenedor del tema como oculto inicialmente
          

       
      }
      else{
        strLayer += '<div class="layerDisplay-layer layerDisplay-layer-visible layerDisplay-coord" id="' + obj.id + '_mLayer_' + idLayer + '" data-coords="' + coords + '">' + btnDisplay + '<label ' + relLabelCheck + ' id="' + obj.id + '_l_' + idLayer + '">' + ((btnViewLayerData != '') ? '<big><b>*</b></big>' : '') + label + '</label><div class="layerDisplay-actions">'+ btnMetadato + btnImagen + btnInformatio + btnScale + btnText + btnDownload + '</div></div>';
        
          strLayer +='<div class="btndescarga_'+idLayer+'">';
            strLayer += '<div id="myDropdown" class="dropdown-content2">';
            if (item[i].metadato !== undefined) {
              strLayer += '<a url="' + item[i].metadato + '" class="layerDisplay-btnMetadato downloadMapBtn">' + 'Descarga Mapa</a>';
            }
              //strLayer += '<div url="'+item[i].metadato+'" class = "layerDisplay-btnMetadato"> Link 1 </div>';
            if (item[i].descarga !== undefined) { 
              strLayer += '<a url="'+item[i].descarga+'" class = "layerDisplay-btnMetadato downloadSourceBtn">' + 'Descarga Fuente</a>';
            }
            strLayer += '</div>';
        strLayer += '</div>';
        //obj.myfuntionid(idLayer);
      }
      
    }
    
    if (Object.keys(layersByGroup.PMDU).length > 0) {
      for (var themeId in layersByGroup.PMDU) {
        if(contPMDU <1){
          strLayer += '<div class="layerDisplay-layer-visible separadorTheme">PMDU</div>';
          contPMDU ++;
        }
        // Obtener el objeto de tema actual
          var themeObj = layersByGroup.PMDU[themeId]
         
          strLayer += '<div class="layerDisplay-layer-visible hidden-color themeName" id="' + themeId + '" data-click-state="0" aria-expanded="false">' + themeObj.tema + '</div>';
          strLayer += '<div class="layerDisplay-themeContent" data-theme-id="' + themeId + '">';
          for (var j = 0; j < themeObj.layersT.length; j++) {
            strLayer += themeObj.layersT[j];
          }
          strLayer += '</div>';
      }
      layersByGroup.PMDU= {};

    }
    
    if (Object.keys(layersByGroup.PPDUCH).length > 0) {
      
      for (var themeId in layersByGroup.PPDUCH) {
        if(contPPDUCH <1){
          strLayer += '<div class="layerDisplay-layer-visible separadorTheme">PPDUCH</div>';
          contPPDUCH ++;
        }
        // Obtener el objeto de tema actual
          var themeObj = layersByGroup.PPDUCH[themeId]
         
          strLayer += '<div class="layerDisplay-layer-visible hidden-color themeName" id="' + themeId + '" data-click-state="0" aria-expanded="false">' + themeObj.tema + '</div>';
          strLayer += '<div class="layerDisplay-themeContent" data-theme-id="' + themeId + '">';
          for (var j = 0; j < themeObj.layersT.length; j++) {
            strLayer += themeObj.layersT[j];
          }
          strLayer += '</div>';
      }
      layersByGroup.PPDUCH = {};

    }
    if (Object.keys(layersByGroup.sinGroup).length > 0) {
      for (var themeId in layersByGroup.sinGroup) {
        
        // Obtener el objeto de tema actual
          var themeObj = layersByGroup.sinGroup[themeId]
         
          strLayer += '<div class="layerDisplay-layer-visible hidden-color themeName" id="' + themeId + '" data-click-state="0" aria-expanded="false">' + themeObj.tema + '</div>';
          strLayer += '<div class="layerDisplay-themeContent" data-theme-id="' + themeId + '">';
          for (var j = 0; j < themeObj.layersT.length; j++) {
            strLayer += themeObj.layersT[j];
          }
          strLayer += '</div>';
      }
      layersByGroup.sinGroup = {};

    }
    /*
    if (layersByTheme.length !== 0) {
      for (var themeId in layersByTheme) {
        
      // Obtener el objeto de tema actual
        var themeObj = layersByTheme[themeId]
       
        strLayer += '<div class="layerDisplay-layer-visible hidden-color themeName" id="' + themeId + '">' + themeObj.tema + '</div>';
      for (var j = 0; j < themeObj.layersT.length; j++) {
        strLayer += themeObj.layersT[j];
        
      }
    }
    layersByTheme = {};
  }*/
   
      var groupMetadato = list[x].metadato;
      var groupDescarga = list[x].descarga;
      var groupSource = list[x].source;
      var hasLink = list[x].thematicLink;

     //original// var btnMetadatoGroup = (groupMetadato) ? '<div idref="' + idLayer + '" url="' + groupMetadato + '" idGroup="' + idGroup + '" alt="Ver informaci&oacute;n" title="Ver informaci&oacute;n" class="layerDisplay-sprite layerDisplay-iconMetadato_a layerDisplay-btnMetadato layerDisplay-btnMetadatoGroup"></div>' : '';
     
     var btnMetadatoGroup = (groupMetadato) ? '<div idref="' + idLayer + '" url="' + groupMetadato + '" idGroup="' + idGroup + '" alt="Descarga" title="Descarga" class="layerDisplay-iconDownload layerDisplay-download layerDisplay-btnMetadato layerDisplay-btnMetadatoGroup"></div>' : '';
     var btnMetadatoGroup2 = (groupDescarga,groupMetadato) ? '<div id = "btnD_'+idGroup+'" idref="' + idLayer + '" url="' + groupMetadato + '" idGroup="' + idGroup + '" alt="Descarga" title="Descarga" class="layerDisplay-iconDownload layerDisplay-download  layerDisplay-btnMetadatoGroup dropbtn"></div>' : '';
     var btnMetadatoGroup2 = (groupMetadato,groupDescarga) ? '<div id = "btnD_'+idGroup+'" idref="' + idLayer + '" url="' + groupMetadato + '" idGroup="' + idGroup + '" alt="Descarga" title="Descarga" class="layerDisplay-iconDownload layerDisplay-download  layerDisplay-btnMetadatoGroup dropbtn"></div>' : '';
     var labelSource = (groupSource) ? '<div class="layerDisplay-source-label"><div><label alt="Fuente" title="Fuente">' + groupSource + '</label></div></div>' : '';
     var btnThematicLink = ((hasLink && hasLink != '')) ? '<a href="' + hasLink + '" target="_blank"><button idref="' + x + '"  class="layerDisplay-thematicLink layerDisplay-info layerDisplay-flatBtn"></button></a>' : '';
      
      strGroup += '<div id="' + obj.id + '_groupLayer_' + idGroup + '" class="layerDisplay-groupLayer" data-open="false">';
      strGroup += '  <div class="layerDisplay-title-container">';
      strGroup += '    <div class="layerDisplay-title">';
      strGroup +=          btnMetadatoGroup;
      strGroup += '      <div class="layerDisplay-groupLayer-name" idgroup="' + idGroup + '" data-click-state="0" aria-expanded="false">';
      strGroup += '        <span class="layerDisplay-groupIcon ' + groupIconClass + '" aria-hidden="true"></span>';
      strGroup += '        <span class="layerDisplay-groupLabel">' + labelGroup + '</span>' + btnThematicLink;
      strGroup += '      </div>';
      strGroup += '    </div>';
      strGroup += '  </div>';
      strGroup += '  <div class="layerDisplay-groupContent">' + strLayer + labelSource + '</div>';
      strGroup += '</div>';
    }
    obj.layerCount = count;
    
    return strGroup;

    
  },

  
  listLayersSelected: function () {
    var obj = this;
    //obj.getLayerSelectedList();
    $('.layerDisplay-body-selected').html(obj.getLayersSelected());
    //$('#'+obj.id+'_layer_selected_2').html(obj.getLayersSelected2());
    obj.assignBtnsActions_selected();
    //obj.setZoomIcon(obj.currentScale);
  },
  //search in text
  textSearchFormat: function (text) {
    text = text.toLowerCase();

    text = text.replace(/[\u00E1]/gi, 'a');
    text = text.replace(/[\u00E9]/gi, 'e');
    text = text.replace(/[\u00ED]/gi, 'i');
    text = text.replace(/[\u00F3]/gi, 'o');
    text = text.replace(/[\u00FA]/gi, 'u');
    text = text.replace(/[\u00F1]/gi, 'n');

    text = text.replace(/&aacute;/g, 'a');
    text = text.replace(/&eacute;/g, 'e');
    text = text.replace(/&iacute;/g, 'i');
    text = text.replace(/&oacute;/g, 'o');
    text = text.replace(/&uacute;/g, 'u');
    text = text.replace(/&ntilde;/g, 'n');

    text = text.replace(/rr/g, 'r');
    text = text.replace(/ll/g, 'l');
    text = text.replace(/x|z|c/g, "s");
    return text;
  },
  compareText: function (a, b) {
    var obj = this;
    if (typeof (a) == 'object') {
      var ban = false;
      for (var x in a) {
        var a_s = (obj.textSearchFormat(a[x]));
        var b_s = (obj.textSearchFormat(b));
        if (a_s.search(b_s) >= 0) ban = true;
      }
      return ban;
    } else {
      var a_s = (obj.textSearchFormat(a));
      var b_s = (obj.textSearchFormat(b));
      return (a_s.search(b_s) >= 0);
    }
  },
  showAllLayers: function () {

      var obj = this;
      var $tree = $('#' + obj.id + ' #layerDisplay-bodyLayers');

      /* Quitar estado de búsqueda */
      $tree.removeClass('layerDisplay-searchMode');

      /* Restaurar todos los elementos */
      $tree
          .find(
              '.layerDisplay-groupLayer, ' +
              '.layerDisplay-groupContent, ' +
              '.themeName, ' +
              '.layerDisplay-themeContent, ' +
              '.layerDisplay-layer, ' +
              '.layerDisplay-layer-tema, ' +
              '.separadorTheme, ' +
              '.layerDisplay-source-label'
          )
          .removeClass('layerDisplay-hidde');

      /* Restaurar filas de capas */
      $tree
          .find('.layerDisplay-layer, .layerDisplay-layer-tema')
          .removeClass('layerDisplay-hidde');

      /*Regresar al estado normal del acordeón: grupos y subgrupos cerrados.*/
      $tree.find('.layerDisplay-themeContent').hide();

      $tree
          .find('.themeName')
          .show()
          .attr({
              'data-click-state': '0',
              'aria-expanded': 'false'
          })
          .removeClass('visible-color')
          .addClass('hidden-color');

      $tree
          .find('.layerDisplay-groupLayer')
          .attr('data-open', 'false');

      $tree
          .find('.layerDisplay-groupLayer-name')
          .attr({
              'data-click-state': '0',
              'aria-expanded': 'false'
          });

      $tree.find('.layerDisplay-groupContent').hide();

      /* Cerrar menús de descarga que pudieran quedar abiertos */
      $tree
          .find('.layerDisplay-downloadMenu')
          .hide();

      $tree
          .find('.layerDisplay-downloadToggle')
          .attr('data-click-state', '0');

      /* Permitir repetir la misma búsqueda después de limpiar */
      obj.lastSearch = '';
  },
  
  initSearch: function (text) {

      var obj = this;
      var list = obj.options.layers;
      var $tree = $('#' + obj.id + ' #layerDisplay-bodyLayers');
      var searchText = $.trim(text || '');

      /*Si la búsqueda no tiene al menos tres caracteres,restaurar la vista normal.*/
      if (searchText.length <= 2) {
          obj.showAllLayers();
          return;
      }

      $tree.addClass('layerDisplay-searchMode');

      /*Ocultar inicialmente toda la estructura. Después solo se mostrarán las coincidencias. */
      $tree
          .find('.layerDisplay-groupLayer')
          .addClass('layerDisplay-hidde')
          .attr('data-open', 'false');

      $tree
          .find('.layerDisplay-groupContent')
          .addClass('layerDisplay-hidde')
          .hide();

      $tree
          .find('.themeName')
          .addClass('layerDisplay-hidde')
          .hide()
          .attr({
              'data-click-state': '0',
              'aria-expanded': 'false'
          })
          .removeClass('visible-color')
          .addClass('hidden-color');

      $tree
          .find('.layerDisplay-themeContent')
          .addClass('layerDisplay-hidde')
          .hide();

      $tree
          .find('.layerDisplay-layer, .layerDisplay-layer-tema')
          .addClass('layerDisplay-hidde');

      $tree
          .find('.separadorTheme, .layerDisplay-source-label')
          .addClass('layerDisplay-hidde');

      /*Recorrer las capas de los datos originales.*/
      for (var idGroup in list) {

          if (!list.hasOwnProperty(idGroup)) {
              continue;
          }

          var group = list[idGroup];
          var layers = group.layers || {};

          for (var idLayer in layers) {

              if (!layers.hasOwnProperty(idLayer)) {
                  continue;
              }

              var layer = layers[idLayer];

              var label = layer.label || '';
              var synonymous = layer.synonymous || '';

              /*La coincidencia se realiza exclusivamente contra el nombre o sinónimo de la capa.*/
              var match =
                  obj.compareText(label, searchText) ||
                  obj.compareText(synonymous, searchText);

              if (!match) {
                  continue;
              }

              var $layer =
                  $('#' + obj.id + '_mLayer_' + idLayer);

              if (!$layer.length) {
                  continue;
              }

              /*Mostrar exclusivamente la fila coincidente.*/
              $layer.removeClass('layerDisplay-hidde');

              /*Mostrar el grupo al que pertenece la capa.*/
              var $group = $layer.closest('.layerDisplay-groupLayer');
              var $groupContent =
                  $group.children('.layerDisplay-groupContent');

              $group
                  .removeClass('layerDisplay-hidde')
                  .attr('data-open', 'true');

              $groupContent
                  .removeClass('layerDisplay-hidde')
                  .show();

              $group
                  .find('.layerDisplay-groupLayer-name')
                  .first()
                  .attr({
                      'data-click-state': '1',
                      'aria-expanded': 'true'
                  });

              /*Si pertenece a un subgrupo, mostrar únicamente ese subgrupo y su encabezado.*/
              var $themeContent =
                  $layer.closest('.layerDisplay-themeContent');

              if ($themeContent.length) {

                  var $theme =
                      $themeContent.prev('.themeName');

                  $themeContent
                      .removeClass('layerDisplay-hidde')
                      .show();

                  $theme
                      .removeClass('layerDisplay-hidde')
                      .show()
                      .attr({
                          'data-click-state': '1',
                          'aria-expanded': 'true'
                      })
                      .removeClass('hidden-color')
                      .addClass('visible-color');

                  /*Mostrar PMDU o PPDUCH solamente cuando correspondan al subgrupo encontrado.*/
                  var $separator =
                      $theme.prevAll('.separadorTheme').first();

                  if ($separator.length) {
                      $separator.removeClass('layerDisplay-hidde');
                  }
              }
          }
      }

      /*Eliminar subgrupos que hayan quedado sin ninguna fila coincidente visible.*/
      $tree.find('.layerDisplay-themeContent').each(function () {

          var $themeContent = $(this);

          var hasVisibleMatches =
              $themeContent
                  .find(
                      '.layerDisplay-layer-tema' +
                      ':not(.layerDisplay-hidde)'
                  )
                  .length > 0;

          if (!hasVisibleMatches) {

              $themeContent
                  .addClass('layerDisplay-hidde')
                  .hide();

              $themeContent
                  .prev('.themeName')
                  .addClass('layerDisplay-hidde')
                  .hide();
          }
      });

      /*Eliminar grupos que hayan quedado sin capas coincidentes.*/
      $tree.find('.layerDisplay-groupLayer').each(function () {

          var $group = $(this);

          var hasNormalMatches =
              $group
                  .find(
                      '.layerDisplay-layer' +
                      ':not(.layerDisplay-layer-tema)' +
                      ':not(.layerDisplay-hidde)'
                  )
                  .length > 0;

          var hasThemeMatches =
              $group
                  .find(
                      '.layerDisplay-layer-tema' +
                      ':not(.layerDisplay-hidde)'
                  )
                  .length > 0;

          if (!hasNormalMatches && !hasThemeMatches) {

              $group.addClass('layerDisplay-hidde');

          } else {

              $group.removeClass('layerDisplay-hidde');

              $group
                  .children('.layerDisplay-groupContent')
                  .removeClass('layerDisplay-hidde')
                  .show();
          }
      });
  },

  trackInput: function () {
    var obj = this;
    clearTimeout(obj.searchTimer);
    obj.searchTimer = setTimeout(function () {
      var text = $('#' + obj.id + '_txtSearch').val();
      if (text.length > 2 && text != obj.lastSearch) {
        obj.lastSearch = text;
        obj.initSearch(text);
        $('#' + obj.id + '_txtSearch').css('color', '#444');
      }
      if (text.length <= 2) {
        obj.showAllLayers();
        $('#' + obj.id + '_txtSearch').css('color', '#888');
      }
    }, obj.options.timeToSearch);
  },
  setInputText: function (id, callback) {
    var obj = this;
    $('#' + id).bind("keypress", function (evt) {
      var otherresult = 12;
      if (window.event != undefined) {
        otherresult = window.event.keyCode;
      }
      var charCode = (evt.which) ? evt.which : otherresult;
      if (charCode == 13 || charCode == 12) {
        if (charCode == 13)/*$("#"+idClick).click();*/
          if (charCode == 12 && evt.keyCode == 27) {  //atrapa esc y limpia
            setTimeout(function () { $('#' + id).val(''); }, 200);
          }
        if (charCode == 46 && $.isFunction(callback)) {
          callback();
        }
        if (charCode == 27) {
          setTimeout(function () { $('#' + id).val(''); }, 200);
          obj.showAllLayers();
        }
      } else {
        var keyChar = String.fromCharCode(charCode);
        var keyChar2 = keyChar.toLowerCase();
        var re = /[\u00E0-\u00E6\u00E8-\u00EB\u00EC-\u00EF\u00F2-\u00F6\u00F9-\u00FC\u0061-\u007a\u00f10-9 \-\,\.]/
        var result = re.test(keyChar2);
        result = (charCode == 8) ? true : result;
        if (result) {
          if ($.isFunction(callback))
            callback();
        }
        return result;

      }

    }).keydown(function (e) {
      if (((e.which == 46) || (e.which == 8)) && $.isFunction(callback)) {
        callback();
      }
      if (e.which == 27) {
        setTimeout(function () { $('#' + id).val(''); }, 200);
        obj.showAllLayers();
      }
    });
  },
  adjustDefaultLayers: function () {
    var obj = this;
    var def = obj.options.defaultLayers;
    var layers = obj.options.layers;

    obj.resetActiveStatus();
    for (var x in def) {
      var g = def[x].group;
      var l = def[x].id; //layer

      var item = obj.options.layers[g].layers[l];
      if (item === undefined) {
        if (l.substr(0, 1) == 't') {
          var tmpL = l.replace('t', 'c');
          var item = obj.options.layers[g].layers[tmpL];//.texts;
          item.isText = true;
        }
      }
      if (!(item === undefined)) {
        item.active = true;
        obj.addLayerShortcut(item);
      }
    }
  },
  // the constructor
  _create: function () {
      var obj = this;

      obj.id = obj.element.attr('id');

      obj.selectedLayers = [];
      obj.selectedServices = [];
      obj.wmsLayers = [];
      obj.outLayers = {};
      obj.cloud = {};
      obj.exludeList = {};
      obj.listaID = [];
      obj.layerCount = 0;
      obj.lastSearch = '';
      obj.wmsCapabilitiesCache = null;
      obj.wmsCapabilitiesRequest = null;
      obj.statusMain = 'hidden';
      obj.statusList = 'hidden';

      var defaultLayers =
          obj.options.defaultLayers || [];

      var listViewLayers =
          obj.options.tree &&
          obj.options.tree.specialActions &&
          obj.options.tree.specialActions.consultables
              ? obj.options.tree.specialActions.consultables
              : [];

      obj.layerViewData = [];

      for (var x in listViewLayers) {
          obj.layerViewData.push(
              listViewLayers[x].name
          );
      }

      if (defaultLayers.length > 0) {
          obj.adjustDefaultLayers();
      }

      obj.prepareLayers();
      obj.exludeRules();
      obj.bootActionLayers();
    this.element
      // add a class for theming
      // .addClass("custom-layerDisplay no-print");
    // prevent double click to select text
    //.disableSelection();
    var layersSelected = obj.getLayersSelected();
    var struc = '<div id="layerDisplay-container1" class="layerDisplay-container">';
    struc += ' <div class="layerDisplay-header">';
    struc += '       <input id="' + obj.id + '_txtSearch" value="" placeholder="Consulta de capa">'; 
    struc += '       <span id="' + obj.id + '_btnClear" class="btnlayerDisplay-clear fa-solid fa-delete-left"></span>'; 
    struc += '       <span id="' + obj.id + '_btnClose" class="btnlayerDisplay-close fa-solid fa-xmark"></span>';
    struc += ' </div>';
    struc += ' <div class="layerDisplay-body">';
    struc += ' 	<div id="layerDisplay-bodyLayers" style="display: flex; flex-direction: column">' + obj.getLayersDomList() + '</div>';
    struc += ' 	<div id="layerDisplay-bodyWms" style="display:none">' + obj.getWmsForm() + '</div>';
    struc += ' </div>';
    // struc += ' <div class="layerDisplay-tabSelection">';
    // struc += ' 	<div id="' + obj.id + '_btnLayers" value="Layers" active="true" class="layerDisplay-btnLayers layerDisplay-tabBtn"><label class="layerDisplay-rotateLeft">Capas</label></div>';
    // struc += ' 	<div id="' + obj.id + '_btnWms" value="Wms" class="layerDisplay-btnWms layerDisplay-tabBtn"><label class="layerDisplay-rotateLeft">Servicios</label></div>';
    // struc += ' </div>';
    // struc+= ' <div class="layerDisplay-body-selected">'+layersSelected+'</div>';
    // struc+= ' <div id="layerDisplay-footer" class="layerDisplay-footer"><b>*</b>: Puede ser consultada la información tabular de la capa</div>';
    // struc+= '</div>';

    var cadena = '<div class="layerDisplay-bgmodal"></div>';
    // var cadena = '<div class="layerDisplay-bgmodal"><div class="layerDisplay-overlay"></div></div>';
    // cadena += '  <div class="layerDisplay-area-patch-br"><div class="layerDisplay-overlay"></div></div>';
    // cadena += '  <div class="layerDisplay-area-patch-bl"><div class="layerDisplay-overlay"></div></div>';
    cadena += '<div>' + struc + '</div>';
    // cadena += '<div class="layerDisplay-area ui-corner-all">' + struc + '</div>';

    var layerSelected_mini = '<div id="' + obj.id + '_shortList" class="layerDisplay-body-selected-2 shadow">';
    layerSelected_mini += '  <label class="shortList-title">Capas en Mapa</label><span id="' + obj.id + '_btnClose_selected" class="flatBbtnlayerDisplay-close-s layerDisplay-sprite layerDisplay-iconClose-s" title="Cerrar lista" alt="Cerrar lista"></span>';
    layerSelected_mini += '  <div class="shortList-layer-group">';
    layerSelected_mini += '  	<div class="tool">';
    layerSelected_mini += '  		<label>Capas de Informaci&oacute;n</label>';
    layerSelected_mini += '  		<span id="' + obj.id + '_btnClear_shortcut" title="limpiar capas" alt="limpiar capas" class="layerDisplay-btnClear layerDisplay-sprite layerDisplay-iconClear"></span>';
    layerSelected_mini += '  	</div>';
    layerSelected_mini += '  	<div class="layerDisplay-transparencyContainer"><div class="layerDisplay-transparencyText">Transparencia</div><div class="layerDisplay-sprite layerDisplay-iconCircleBlank_a"></div><div id="' + obj.id + '_sliderTransparency" class="layerDisplay-sliderTransparency" alt="transparencia de capas" title="transparencia de capas"></div><div class="layerDisplay-sprite layerDisplay-iconCircleFill_a"></div></div>';
    layerSelected_mini += '  	<div id="' + obj.id + '_layer_selected_2" class="container"></div>';
    layerSelected_mini += '  </div>';
    layerSelected_mini += '  <div id="shortList_outlayers_group"class="shortList-outlayers-group"></div>';
    layerSelected_mini += '  <div class="shortList-service-group">';
    layerSelected_mini += '  	<div class="tool">';
    layerSelected_mini += '  		<label>Servicios de Informaci&oacute;n</label>';
    layerSelected_mini += '  	</div>';
    layerSelected_mini += '  	<div id="' + obj.id + '_service_selected_2" class="container"></div>';
    layerSelected_mini += '  </div>';
    layerSelected_mini += '</div>';
    obj.element.html(cadena);
    //obj.element.parent().append(layerSelected_mini);
    $('#panel-center').append(layerSelected_mini);

    $('#layerDisplay_serviceTypes').buttonset().change(function () {
      var type = $("#layerDisplay_serviceTypes :radio:checked").attr('value');
      $("#layerDisplay_serviceVer").css('display', ((type != 'wms') ? 'block' : 'none'));
    });

    $('#layerDisplay_serviceVer').buttonset();

    $('#layerDisplay_addService_btn').click(function (e) {

      var url = $("#layerDisplay_newServiceUrl").val();
      if (url != '' && url.isUrl()) {
        var type = $("#layerDisplay_serviceTypes :radio:checked").attr('value');
        var newService = {
          type: type,
          url: url
        }
        if (type != 'wms') {
          newService.version = $("#layerDisplay_serviceVer :radio:checked").attr('value');
        }

        obj.addService(newService)//spinner(true);
      }
    });
/****************me */    
$(".btndescarga").hide();
$(".layerDisplay-layer-visible").hide();
$(".layerDisplay-layer-tema").hide();
$(".menuConsulta").hide();
/**me ocultar descarga */
$(".descargas").hide();
 /********* */   
var obj = this;
var list = obj.options.layers;
for (var x in list) {
  var item = list[x].layers;
  for (var i in item) {
    var idLayer = i;
    $(".btndescarga_"+idLayer).hide();
  }
}
 /**************************** */
/* Descargas de capa: controlador delegado, compatible con contenido colapsable. */
$('#' + obj.id)
  .off('click.layerDisplayDownload', '.layerDisplay-downloadToggle')
  .on('click.layerDisplayDownload', '.layerDisplay-downloadToggle', function (e) {
    e.preventDefault();
    e.stopPropagation();

    var $button = $(this);
    var idref = $button.attr('idref');
    var $scope = $button.closest('.layerDisplay-themeContent');
    if (!$scope.length) {
      $scope = $button.closest('.layerDisplay-groupContent');
    }

    var $menu = $scope
      .find('.layerDisplay-downloadMenu[data-layer="' + idref + '"]')
      .first();

    if (!$menu.length) {
      $menu = $('#' + obj.id)
        .find('.btndescarga_' + idref)
        .first();
    }
    var isOpen = $button.attr('data-click-state') === '1';

    /* Cierra otros menus antes de abrir el seleccionado. */
    $button.closest('.layerDisplay-groupContent')
      .find('.layerDisplay-downloadMenu')
      .not($menu)
      .hide();
    $button.closest('.layerDisplay-groupContent')
      .find('.layerDisplay-downloadToggle')
      .not($button)
      .attr('data-click-state', '0');

    $button.attr('data-click-state', isOpen ? '0' : '1');
    $menu.stop(true, true).slideToggle(140);
  });

/* Los botones de mapa/documento mantienen la apertura directa definida en assignBtnsActions. */

/* -------------------cerrrar descargs------------------- */

document.addEventListener('click', function(event) {
    var cierreDescarga =
        document.getElementById('myDropdown');

    if (
        cierreDescarga &&
        !cierreDescarga.contains(event.target)
    ) {
        $('.layerDisplay-downloadMenu').hide();

        $('.layerDisplay-downloadToggle')
            .attr('data-click-state', '0');
    }
});
/* ------------------------------ */
/* *************** < Redirigir > ******* */
$('.layerDisplay-coord').click(function (e){
  if ($(e.target).is('input, button, a, span')) {
    return;
  }
  var coords = $(this).data('coords');
  if (!coords || !obj.options.map || !obj.options.map.getZoomLevel) {
    return;
  }
  var zoomActual = obj.options.map.getZoomLevel();
  if (zoomActual < 17) {
    obj.mapExtend(coords);
  }
});
 /* ************************** */

//+++++++++++++++++++++++++++++ capas windows  +++++++++++++++++++++++++++++
var carrusel = document.getElementById('layerDisplay-container1');
document.addEventListener('click', function(event) {
  var targetElement = event.target; // Elemento clicado
  if (carrusel && !carrusel.contains(targetElement)) {
    // Cierra 
   // $('#layersDisplay').css('display', 'none'); //Cierra ventana capa
  }
});

//++++++++++++++++++++++++++++++++  Fin  ++++++++++++++++++++++++++++++++++++++++++
/* =========================================================
   ACORDEON DE GRUPOS Y SUBGRUPOS
   ========================================================= */
var $layerTree = $('#' + obj.id + ' #layerDisplay-bodyLayers');

function closeTheme($theme, immediate) {
  var themeId = $theme.attr('id');
  var $themeLayers = $theme.next('.layerDisplay-themeContent');

  $theme.attr({
    'data-click-state': '0',
    'aria-expanded': 'false'
  }).removeClass('visible-color').addClass('hidden-color');

  $themeLayers.stop(true, true);
  if (immediate) {
    $themeLayers.hide();
  } else {
    $themeLayers.slideUp(160);
  }
}

function closeGroup($group, immediate) {
  var $name = $group.find('.layerDisplay-groupLayer-name').first();
  var $content = $group.children('.layerDisplay-groupContent');

  $group.attr('data-open', 'false');
  $name.attr({
    'data-click-state': '0',
    'aria-expanded': 'false'
  });

  $group.find('.themeName').each(function () {
    closeTheme($(this), true);
  });

  $content.stop(true, true);
  if (immediate) {
    $content.hide();
  } else {
    $content.slideUp(180);
  }
}

function openGroup($group) {
  var $name = $group.find('.layerDisplay-groupLayer-name').first();
  var $content = $group.children('.layerDisplay-groupContent');

  $group.attr('data-open', 'true');
  $name.attr({
    'data-click-state': '1',
    'aria-expanded': 'true'
  });

  $content.stop(true, true).slideDown(180);
  $group.find('.layerDisplay-themeContent').hide();
}

/* Estado inicial: todos los grupos y subgrupos cerrados. */
$layerTree.find('.layerDisplay-groupLayer').each(function () {
  closeGroup($(this), true);
});

/* Grupo principal. */
$layerTree
  .off('click.layerDisplayGroup', '.layerDisplay-groupLayer-name')
  .on('click.layerDisplayGroup', '.layerDisplay-groupLayer-name', function (e) {

      if ($(e.target).closest('.layerDisplay-thematicLink').length) {
          return;
      }

      if ($(e.target).closest('a').length) {
          return;
      }

      e.preventDefault();
      e.stopPropagation();

      var $group = $(this).closest('.layerDisplay-groupLayer');
      var isOpen = $group.attr('data-open') === 'true';

      if (isOpen) {
          closeGroup($group,false);
      } else {
          openGroup($group);
      }
  });

/* Tema o subgrupo. */
$layerTree
  .off('click.layerDisplayTheme', '.themeName')
  .on('click.layerDisplayTheme', '.themeName', function (e) {
    e.preventDefault();
    e.stopPropagation();

    var $theme = $(this);
    var themeId = $theme.attr('id');
    var $themeLayers = $theme.next('.layerDisplay-themeContent');
    var isOpen = $theme.attr('data-click-state') === '1';

    if (isOpen) {
      closeTheme($theme, false);
    } else {
      $theme.attr({
        'data-click-state': '1',
        'aria-expanded': 'true'
      }).removeClass('hidden-color').addClass('visible-color');

      $themeLayers.stop(true, true).slideDown(160);
    }
  });

/* Los controles de una fila no deben abrir o cerrar el acordeon. */
$layerTree.on(
  'click.layerDisplayControls',
  'input[type="checkbox"]',
  function (e) {
    e.stopPropagation();
  }
);

  $(".layerDisplay-groupLayer-name").hover(function(){
   // $(this).css("background-color", "#99C43A");
    $(this).css('cursor','pointer');
    }, function(){
    $(this).css("background-color", "#FFFFFF");
    $(this).css('cursor','auto');
  });


    $('.layerDisplay-body').each(function () {
      $(this).disableSelection();
    });
    $('#' + obj.id + '_btnClose').click(function () {
      obj.closeMainList();
    });

    $('.layerDisplay-tabBtn').each(function (index, element) {
      $(this).click(function (e) {
        var tab = $(this).attr('value');
        $('.layerDisplay-tabBtn[active=true]').removeAttr('active');
        $(this).attr('active', 'true');

        //control display body content
        $('#layerDisplay-bodyLayers').css('display', 'none');
        $('#layerDisplay-bodyWms').css('display', 'none');
        $('#layerDisplay-body' + tab).css('display', '');
        if (tab == 'Wms') {
          $('.layerDisplay-header label').hide();
          $('.layerDisplay-header input').hide();
          $('#layersDisplay_btnClear').hide();
        } else {
          $('.layerDisplay-header label').show();
          $('.layerDisplay-header input').show();
          $('#layersDisplay_btnClear').show();
        }
        e.stopPropagation();
      })
    });

    $('#' + obj.id + '_btnClose_selected').click(function () {
      obj.closeShortList();
    });

  $('#' + obj.id + '_btnClear_shortcut')
    .off('click.layerDisplayClear')
    .on('click.layerDisplayClear', function (e) {
        e.preventDefault();
        e.stopPropagation();

        obj.setActiveLayers({
            layers: []
        });

        obj.closeShortList();
    });

    $('#' + obj.id + '_btnClear').click(function () {
      $('#' + obj.id + '_txtSearch').val('');
      obj.showAllLayers();
      $('#' + obj.id + '_txtSearch').focus();
    })
    $('#' + obj.id + '_sliderTransparency').slider({
      range: "max",
      min: 1,
      max: 100,
      value: 100,
      slide: function (event, ui) {
        var val = (ui.value > 0) ? (ui.value / 100) : 0;
        obj.transparency = val;
        obj.options.onChangeOpacity(val);
      }
    });

    //$('#layerDisplay-footer').html('<label>Capas: '+obj.layerCount+'</label>');

    obj.setInputText(obj.id + '_txtSearch', function () { obj.trackInput() });

    $('#' + obj.id + '_shortList').mouseenter(function () {
      clearTimeout(obj.shortListTimer);
    })
    $('#' + obj.id + '_shortList').mouseleave(function () {
      if (obj.statusList == 'show')
        obj.shortListTimer = setTimeout(function () {
          obj.closeShortList();
        }, 2500);
    });

    obj.selectedLayers = [];

    for (var idGroup in obj.options.layers) {
        if (!obj.options.layers.hasOwnProperty(idGroup)) {
            continue;
        }

        var groupLayers =
            obj.options.layers[idGroup].layers || {};

        for (var idLayer in groupLayers) {
            if (!groupLayers.hasOwnProperty(idLayer)) {
                continue;
            }

            var layer = groupLayers[idLayer];

            layer.idGroup = idGroup;
            layer.idLayer = idLayer;

            if (
                layer.active ||
                (
                    layer.texts &&
                    layer.texts.active
                )
            ) {
                obj.addLayerShortcut(layer);
            }
        }
    }

    obj.printLayerSelectedList();
    obj.assignBtnsActions();

    obj.closeMainList();
    obj.closeShortList();

    this._refresh();
  },

  bootActionLayers: function () {
    var obj = this;
    var layers = obj.getActiveLayers();
    for (var x in layers) {
      var item = layers[x];
      obj.options.onActiveLayer(item);
    }
  },
  getTransparency: function () {
    return this.transparency;
  },
  openMainList: function () {
    var obj = this;
    obj.statusMain = 'show';
    obj.statusList = 'hidden';
    $('#' + obj.id).css('display', '');
   // $('.' + obj.id + '-container').css('display', '');
    $('#' + obj.id + '_shortList').css('display', 'none');
    $('#' + obj.id + '_txtSearch').focus();


    $(document).bind('keydown', function (e) {
      if (e.which == 27) {
        obj.closeMainList();
      }
    });
  },
  switchMainList: function () {
    var obj = this;
    //if (obj.statusMain == 'show') {
    //  obj.closeMainList();
  //  } else {
      obj.openMainList();
   // }
  },
  switchShortList: function () {
    var obj = this;
    if (obj.statusList == 'show') {
      obj.closeShortList();
    } else {
      obj.openShortList();
    }
  },
  openShortList: function () {
    var obj = this;

    var bottomMargin = obj.options.getBottomMargin() || 31;
    obj.statusMain = 'hidden';
    obj.statusList = 'show';
    $('#' + obj.id).css('display', 'none');
    $('#' + obj.id + '_shortList').css({
      'display': '',
      'bottom': bottomMargin + 'px'
    });
  },
  closeShortList: function () {
    var obj = this;
    obj.statusList = 'hidden';
    $('#' + obj.id + '_shortList').css('display', 'none');
  },
  isOpenShortList: function () {
    var obj = this;
    var status = $('#' + obj.id + '_shortList').css('display');
    return status != 'none';
  },
  adjustMarginShortList: function () {
    var obj = this;
    if (obj.isOpenShortList()) {
      obj.openShortList();
    }
  },
  closeMainList: function () {
    var obj = this;
    obj.statusMain = 'hidden';
    $('#' + obj.id).css('display', 'none');

    $(document).unbind('keydown');
  },
  assignBtnsActions_selected: function () {
    var obj = this;
    $('.layerDisplay-selectedService-check').each(function (index, element) {
      $(this).click(function (e) {
        var idref = $(this).attr('idref');
        obj.changeService({ active: $(this).is(':checked') }, idref)
        e.stopPropagation();
      })
    });
    $('.layerDisplay-selectedService-close').each(function (index, element) {
      $(this).click(function (e) {
        var idref = $(this).attr('idref');
        obj.deleteService(idref)
        e.stopPropagation();
      })
    });
    $('.layerDisplay-btnText-selected').each(function () {
      var assigned = $(this).attr('assigned');
      if (assigned === undefined) {
        $(this).click(function (e) {
          $(this).attr('assigned', true);
          var layer = $(this).attr('idref');
          var group = $(this).attr('idgroup');
          obj.setTextLayer(group, layer);
          e.stopPropagation();
        });
      }
    });
    $('.layerDisplay-checkLayer-selected').each(function () {
      var assigned = $(this).attr('assigned');
      if (assigned === undefined) {
        $(this).click(function (e) {
          $(this).attr('assigned', true);
          var layer = $(this).attr('layer');
          var group = $(this).attr('idgroup');
          var value = $(this).is(':checked');

          //guarda estadistica
          if (value) obj.saveStats({ id: layer, type: 'main list' });

          obj.setCheckLayer(group, layer, value);
          e.stopPropagation();
        });
      }
    });
    $('.layerDisplay-btnScale').each(function () {
      var assigned = $(this).attr('assigned');
      if (assigned === undefined) {
        $(this).attr('assigned', true);
        $(this).click(function (e) {
          var scale = $(this).attr('scale');
          var idLayer = $(this).attr('idref');
          obj.zoomToLayerContent(idLayer, scale);
          e.stopPropagation();
        });
      }
    });
    $('.layerDisplay-btnViewData').each(function () {
      var assigned = $(this).attr('assigned');
      if (assigned === undefined) {
        $(this).attr('assigned', true);
        $(this).click(function (e) {
          var idref = $(this).attr('idref');
          obj.options.onViewLayerData(idref);
          e.stopPropagation();
        });
      }
    });
  },
  /***********/
  myfuntionid: function (idlayer){
   console.log("myfuntionid: "+idlayer);
    
  },
 /***********/ 
  assignBtnsActions: function () {
    var obj = this;

    $('.layerDisplay-btnText').each(function () {
      var assigned = $(this).attr('assigned');
      if (assigned === undefined) {
        $(this).attr('assigned', true);
        $(this).click(function (e) {
          var layer = $(this).attr('idref');
          var group = $(this).attr('idgroup');
          obj.setTextLayer(group, layer);
          e.stopPropagation();
        });
      }
    }); 
    
    $('.layerDisplay-checkLayer').each(function () {
      var assigned = $(this).attr('assigned');
      if (assigned === undefined) {
        
        $(this).attr('assigned', true);
        $(this).click(function (e) {
          
          var layer = $(this).attr('layer');
          var group = $(this).attr('idgroup');
          var value = $(this).is(':checked');
          if (value){ 
            obj.saveStats({ id: layer, type: 'main list' });
          }

          obj.setCheckLayer(group, layer, value);
          e.stopPropagation();
        });
      }
    });
    $('.layerDisplay-btnScale').each(function () {
      var assigned = $(this).attr('assigned');
      if (assigned === undefined) {
        $(this).attr('assigned', true);
        $(this).click(function (e) {
          var scale = $(this).attr('scale');
          var idLayer = $(this).attr('idref');
          obj.zoomToLayerContent(idLayer, scale);
          e.stopPropagation();
        });
      }
    });
    $('.layerDisplay-btnMetadato').each(function () {
      var assigned = $(this).attr('assigned');
      if (assigned === undefined) {
        $(this).attr('assigned', true);
        $(this).click(function (e) {
          var url = $(this).attr('url');
          if (!(url === undefined)) {
            window.open(url);
          }
          e.stopPropagation();
        });
      }
    });
    $('.layerDisplay-btnMetadato').each(function () {
      var assigned = $(this).attr('assigned');
      if (assigned === undefined) {
        $(this).attr('assigned', true);
        $(this).click(function (e) {
          var url = $(this).attr('url');
          if (!(url === undefined)) {
            window.open(url);
          }
          e.stopPropagation();
        });
      }
    });
 
/* ******************************* */ //cometar por ahora 
    /*
    $('.layerDisplay-download').each(function () {
      var assigned = $(this).attr('assigned');
      if (assigned === undefined) {
        $(this).attr('assigned', true);
        $(this).click(function (e) {
          var idref = $(this).attr('idref');
          var layer = obj.getLayer(idref);
          obj.menuLayerDownload(layer.download);
          e.stopPropagation();
        });
      }
    });
    */
 /* ************************** */   


  },
  loadMessages: function () {
    var obj = this;
    var params = {};
    obj.getData(obj.options.url, params, function (data) {
      //console.log(data);    
    });
  },
  menuLayerDownload: function (layer) {
    var obj = this;
    var list = layer.list;
    var dialog = '<div id="layerDisplay_layerDownload" title="' + layer.title + '">';
    dialog += '<table cellspacing="0" width="100%">';
    for (var x in list) {
      var item = list[x];
      dialog += '<tr><td width="100%">' + item.title + '</td><td><a class="ui-button ui-widget ui-corner-all layerDisplay-layerBtnDownload" target="_blank" href="' + item.url + '">Descargar</a></td></tr>';

      //<button style="width:100%" url="'+item.url+'" class="layerDisplay-layerBtnDownload ui-button ui-widget ui-corner-all">Descargar</button></td></tr>';
    }
    dialog += '</table></div>';
    $('#layerDisplay_layerDownload').remove();
    $('body').append(dialog);
    $('#layerDisplay_layerDownload').dialog({
      resizable: false,
      width: 350,
      modal: true,
      height: 100 + (list.length * 40),
      close: function (event, ui) {
        $(this).dialog('destroy').remove();
      },
      buttons: {
        "Aceptar": function () {
          $(this).dialog("close");
        }
      }
    });
  },
  printWmsServices: function () {
    var obj = this;
    var services = obj.wmsLayers;
    var createItem = function (service) {
      var selected = service.selected;
      var cadena = '';
      cadena += '<div id="serviceLayer_' + service.id + '" class="serviceLayer-serviceItem">';
      cadena += '	<div class="serviceLayer-header">';
      cadena += '		<div id="serviceLayer_cloudContainer' + service.id + '" class="serviceLayer-cloudContainer"></div>';
      cadena += '		<input id="serviceLayer_check_' + service.id + '" class="serviceLayer-checkService" idref="' + service.id + '" type="checkbox"' + ((service.active) ? 'checked="checked"' : '') + '/>';
      cadena += '		<span idref="' + service.id + '" class="serviceLayer-editName ui-icon ui-icon-pencil"/>';
      cadena += '		<span idref="' + service.id + '" class="serviceLayer-editName-ok ui-icon ui-icon-check" style="display:none"/>';
      cadena += '		<label class="serviceLayer-name" for="serviceLayer_check_' + service.id + '" idref="' + service.id + '" title="' + service.path + '">' + service.label + '</label>';
      cadena += '		<input class="serviceLayer-inputName" id="serviceLayer_name_' + service.id + '" type="text" value="' + service.label + '" idref="' + service.id + '" style="display:none" />';
      cadena += '	</div>';
      cadena += '	<span id="serviceLayer_' + service.id + '_closeBtn" idref="' + service.id + '" class="serviceLayer-closeBtn layerDisplay-sprite layerDisplay-iconClose-s"/>';

      cadena += '	<div class="serviceLayer-innerTools">';
      cadena += '		<span idref="' + service.id + '" class="serviceLayer-cloudBtn layerDisplay-sprite layerDisplay-iconZoom_a" title="Buscar elementos" />';
      cadena += '		<label class="serviceLayer-serviceType">' + service.type + '</label>';

      var formats = service.data.formats;


      var imgSel = selected.format;
      imgSel = ((!imgSel) || imgSel == '') ? service.data.formats[0] : imgSel;
      service.selected.format = imgSel;
      if (service.type != 'WFS') {
        cadena += '		<div class="serviceLayer-options">';
        cadena += '		<label>Imagen</label>';
        cadena += '			<select id="serviceLayer_' + service.id + '_formats" class="serviceComboFormat" idref="' + service.id + '">';
        for (var x in formats) {
          var format = formats[x];
          if (format.indexOf('/') >= 0)
            format = formats[x].split('/')[1];

          var selected = (formats[x] == imgSel) ? 'selected="selected"' : '';
          cadena += '			<option  val="' + formats[x] + '" idref="' + service.id + '" class="serviceLayer-combo" ' + selected + '>' + format.toUpperCase() + '</option>';
        }
        cadena += '			</select>';
        cadena += '		</div>';
      }
      var srsSel = service.selected.srs;
      srsSel = ((!srsSel) || srsSel == '') ? service.data.srs[0] : srsSel;
      service.selected.srs = srsSel;

      cadena += '		<div class="serviceLayer-options">';
      cadena += '		<label>Proyecci&oacute;n</label>';
      cadena += '		<select id="serviceLayer_' + service.id + '_srs" class="serviceComboSRS" idref="' + service.id + '">';
      var srs = service.data.srs;
      for (var x in srs) {
        var proj = srs[x];
        var selected = (srs[x] == srsSel) ? 'selected="selected"' : '';
        cadena += '			<option  val="' + proj + '" idref="' + service.id + '" class="serviceLayer-combo" ' + selected + '>' + proj.toUpperCase() + '</option>';
      }
      cadena += '			</select>';
      cadena += '		</div>'

      cadena += '</div>';
      //transparencia tool
      cadena += '<div class="serviceLayer-transparencyTool-container" title="Control de transparencia">';
      cadena += '	<span class="layerDisplay-sprite layerDisplay-iconCircleBlank_a"/>';
      cadena += '	<div id="serviceLayer_' + service.id + '_tranparency" idref="' + service.id + '" val="' + service.opacity + '" class="serviceLayer-transparencyTool"></div>';
      cadena += '	<span class="layerDisplay-sprite layerDisplay-iconCircleFill_a"/>';
      cadena += '</div>';
      //cloud filter
      cadena += '<div class="serviceLayer-filterTools">';
      cadena += '	<div id="serviceLayer_filterTools_' + service.id + '" class="serviceLayer-filterBtns">'
      //cadena+= '		<span idref="'+service.id+'" class="serviceLayer-cloudBtn layerDisplay-sprite layerDisplay-iconZoom_a" title="Buscar elementos" />';
      cadena += '	</div>';
      cadena += '</div>';

      cadena += '	<ul id="serviceLayer_' + service.id + '_layersContent" class="serviceLayer-layerList" idref="' + service.id + '">';
      var layers = service.data.layers;
      for (var x in layers) {
        var layer = layers[x];
        var isSelected = '';
        var isValid = (layer.formats.join().indexOf(service.selected.format) >= 0) ?
          (layer.srs.join().indexOf(service.selected.srs) >= 0) ? true : false : false;

        if (isValid) { //la capa tiene un formato y proyeccion contenido en el universo del servicio
          var slayers = service.selected.layers;
          for (var y in slayers) {
            if (slayers[y].id == layer.id) {
              isSelected = 'checked="checked"';
              break;
            }
          }

          var formats = '';
          for (var y in layer.formats) {
            var format = layer.formats[y];
            if (format.indexOf('/') >= 0)
              format = format.split('/')[1];

            formats += ' ' + format.toUpperCase();
          }
          cadena += '		<li class="ui-state-default" id="' + service.id + '_' + layer.id + '" idservice="' + service.id + '" layername="' + layer.layer + '" idref="' + layer.id + '" tit="' + layer.title + '" formats="' + layer.formats.join() + '" >';
          cadena += '			<span class="ui-icon ui-icon-arrowthick-2-n-s"></span>';
          cadena += '			<label for="' + service.id + '_' + layer.id + '_layer">' + layer.title + '</label>';
          cadena += '			<input type="checkbox" ' + isSelected + ' class="serviceLayer-layerList-layerCheck" id="' + service.id + '_' + layer.id + '_layer" layerid="' + layer.id + '" idref="' + service.id + '" srs="' + layer.srs + '" formats="' + layer.formats.join() + '"/>';
          cadena += '			<label for="' + service.id + '_' + layer.id + '_layer" class="serviceLayer-layerList-formats">' + formats + '</label>';
          cadena += '		</li>';
        }
      }
      cadena += '	</ul>';

      cadena += '</div>';

      return cadena;
    }
    var cadena = '';
    for (var x in services) {
      var service = services[x];
      cadena += createItem(service);
    }
    $('#layerDisplay_serviceListContent').html(cadena);

    $('.serviceLayer-cloudBtn').each(function (index, element) {
      $(this).click(function () {
        obj.createCloudSelection($(this).attr('idref'));
      });
    });
    $('.serviceLayer-closeBtn').each(function (index, element) {
      $(this).click(function () {
        var idref = $(this).attr('idref');
        obj.deleteService(idref);
      });
    });
    $('.serviceLayer-inputName').each(function (index, element) {
      $(this).keydown(function (event) {
        if (event.which == 13) {
          var idref = $(this).attr('idref');
          $('.serviceLayer-editName-ok[idref=' + idref + ']').click();
          event.preventDefault();
        }
      });
    });



    $('.serviceLayer-checkService').click(function () {
      var val = $(this).is(':checked');
      obj.changeService({ active: val }, $(this).attr('idref'));
      var service = obj.getService($(this).attr('idref'));
      $(this).prop('checked', service.active);
    });

    $('.serviceLayer-editName').each(function (index, element) {
      $(this).click(function () {
        var idref = $(this).attr('idref');
        $(this).css('display', 'none');
        $('.serviceLayer-name[idref=' + idref + ']').css('display', 'none');

        $('.serviceLayer-editName-ok[idref=' + idref + ']').css('display', '');
        $('.serviceLayer-inputName[idref=' + idref + ']').css('display', '').focus().select();

      });
    });

    $('.serviceLayer-editName-ok').each(function (index, element) {
      $(this).click(function () {
        var idref = $(this).attr('idref');
        $(this).css('display', 'none');
        $('.serviceLayer-editName[idref=' + idref + ']').css('display', '');
        $('.serviceLayer-name[idref=' + idref + ']').css('display', '');

        $('.serviceLayer-editName-ok[idref=' + idref + ']').css('display', 'none');
        $('.serviceLayer-inputName[idref=' + idref + ']').css('display', 'none');

        var val = $('.serviceLayer-inputName[idref=' + idref + ']').val();
        if (val != '') {
          $('.serviceLayer-name[idref=' + idref + ']').html(val);
          obj.changeService({ label: val }, $(this).attr('idref'));
        } else {
          $('.serviceLayer-inputName[idref=' + idref + ']').val($('.serviceLayer-name[idref=' + idref + ']').html());
        }
      });
    });

    $('.serviceLayer-transparencyTool').each(function (index, element) {
      var val = parseFloat($(this).attr('val'), 10);
      $(this).slider({
        min: 0,
        max: 100,
        value: val * 100,
        change: function (event, ui) {
          obj.changeService({ opacity: (ui.value / 100) }, $(this).attr('idref'));
        }
      });
    });
    $('.serviceComboFormat').each(function () {
      $(this).change(function () {
        var _serv = obj.getService($(this).attr('idref'));
        var selected = $('option:selected', this);
        var idref = selected.attr('idref');
        var val = selected.attr('val');
        _serv.selected.layers = [];
        obj.changeService({ selected: { format: val } }, idref);
        obj.printWmsServices();
      });
    })
    $('.serviceComboSRS').each(function () {
      $(this).change(function () {
        var _serv = obj.getService($(this).attr('idref'));
        var selected = $('option:selected', this);
        var idref = selected.attr('idref');
        var val = selected.attr('val');
        _serv.selected.layers = [];
        obj.changeService({ selected: { srs: val } }, idref);
        obj.printWmsServices();
      });
    });

    $('.serviceLayer-layerList').each(function (index, element) {
      $(this).sortable({
        stop: function (event, ui) {
          var items = [];
          var idref = $(this).attr('idref');
          $(this).find('li').each(function (index, element) {
            var isActive = $('#' + $(this).attr('idservice') + '_' + $(this).attr('idref') + '_layer').is(':checked');
            if (isActive) {
              items.push({ layer: $(this).attr('idref'), title: $(this).attr('tit') });
            }
          });
          obj.changeService({ selected: { layers: items } }, idref);
        }
      });
      $(this).disableSelection();
    });
    $('.serviceLayer-layerList-layerCheck').each(function (index, element) {
      $(this).click(function () {
        var idref = $(this).attr('idref');
        var layerid = $(this).attr('layerid');

        var service = obj.getService(idref);
        var s_layer = obj.getLayerService(idref, layerid);

        obj.clickOnServiceLayer(service, s_layer);
      });
    });

  },
  clickOnServiceLayer: function (service, layer) {
    var obj = this;
    var type = service.type;
    var l_sel = $.extend(true, [], service.selected.layers);
    var d_layer = $('#' + service.id + '_' + layer.id + '_layer');
    var d_service = $('.serviceLayer-checkService[idref=' + service.id + ']');

    if (d_layer.is(':checked')) {
      var okFormat = (layer.formats.join().search(service.selected.format) >= 0);
      var okSrs = (layer.srs.join().search(service.selected.srs) >= 0);
      if (okFormat && okSrs) {
        if (/WMS|WMTS/.test(type)) { //formatos que soportan multiseleccion
          l_sel.push(layer);
        } else { //seleccion de capa unica
          for (var x in l_sel)
            $('#' + service.id + '_' + l_sel[x].id + '_layer').prop('checked', false);
          l_sel = [layer];
        }
      } else {
        $('#' + service.id + '_' + layer.id + '_layer').prop('checked', false);
      }
    } else {
      for (var x in l_sel) {
        if (l_sel[x].id == layer.id) {
          l_sel.splice(x, 1);
          break;
        }
      }
    }
    obj.changeService({ selected: { layers: l_sel } }, service.id);
    service = obj.getService(service.id);
    d_service.prop('checked', service.active);
  },
  loadWmsList: function (list, index) {
    var obj = this;
    index = (index) ? index : 0;

    if (list.length > 0 && index <= (list.length - 1)) {

      var service = list[index];
      var newService = {
        type: service.type,
        url: service.path
      }
      obj.addService(newService, function (data) {
        var t_service = obj.wmsLayers.pop();
        t_service.selected = service.selected;
        t_service.active = service.active;
        t_service.opacity = service.opacity;
        t_service.label = service.label;
        t_service.type = service.type;

        obj.wmsLayers.push(t_service);


        if (index == (list.length - 1)) {
          obj.serviceChanged();
          obj.printWmsServices();
        } else {
          index++;
          obj.loadWmsList(list, index);
        }

      })//spinner(true);

    }
  },
  getWmsServices: function () {
    var obj = this;
    var services = obj.wmsLayers;
    var list = [];

    for (var x in services) {
      var service = services[x];
      var values = {};
      values.selected = service.selected;
      values.active = service.active;
      values.opacity = service.opacity;
      values.label = service.label;
      values.path = service.path;
      values.type = service.type;
      list.push(values);
    }
    return list;
  },
  serviceChanged: function () {
    var obj = this;
    var services = obj.wmsLayers;
    var map = obj.options.map;

    clearTimeout(obj.timer)
    obj.timer = setTimeout(function () {
      map.Service.event({ action: 'set', data: services });
    }, 1000);
    obj.listLayersSelected();
    obj.printLayerSelectedList();
  },
  changeService: function (valObj, id) {
    var obj = this;
    var services = obj.wmsLayers;
    var service = obj.getService(id);
    var root = obj.getService(id);
    if (service) {
      var sub = valObj.selected;
      if (sub) {
        valObj = sub;
        service = service.selected;
      }
      for (var x in valObj) {
        service[x] = valObj[x];
      }
      //el servicio será activo solo si hay almenos una capa seleccionada
      root.active = (root.selected.layers.length > 0) ? root.active : false;
      if ((sub && sub.format) || (sub && sub.srs) || (!sub && !(valObj.active === undefined))) { //si se cambio el formato se reviza integridad
        obj.verifyIntegrityService(id);
      }
    }
    obj.serviceChanged();
  },
  verifyIntegrityService: function (id) {
    var obj = this;
    var service = obj.getService(id);
    var format = service.selected.format;
    var srs = service.selected.srs;
    var slayers = service.selected.layers;
    var nlayers = [];
    for (var x in slayers) {
      var slayer = slayers[x];
      if (
        (slayer.formats.join().indexOf(format) >= 0) && //si el formato existe para la capa
        (slayer.srs.indexOf(srs) >= 0) //si la proyeccion existe para la capa
      ) {
        nlayers.push(slayer);
      } else {
        $('#' + id + '_' + slayer.id + '_layer').prop('checked', false);
      }
    }
    if (slayers.length == 0) {
      service.active = false;
    }

    $('#serviceLayer_check_' + id).prop('checked', service.active);
    $('#layerDisplay_selectedService_check_' + id).prop('checked', service.active);
    $('#layerDisplay_selectedService2_check_' + id).prop('checked', service.active);

    obj.options.onRefreshLists({ layers: obj.selectedLayers, services: obj.selectedServices, outlayers: obj.countOutLayers() });

    slayers = nlayers;
  },
  deleteService: function (id) {
    var obj = this;
    var map = obj.options.map;
    var services = obj.wmsLayers;
    var index = null;
    for (var x in services) {
      if (services[x].id == id) {
        index = x;
        break;
      }
    }
    if (index !== null) {
      clearTimeout(obj.timer); //detiene refresco de capas de servicios
      var delItem = $.extend({}, services[index]);
      services.splice(index, 1);
      map.Service.event({ action: 'delete', data: [delItem] });

      obj.listLayersSelected();
      obj.printLayerSelectedList();
      obj.printWmsServices();
    }
  },
  getService: function (id) {
    var obj = this;
    var services = obj.wmsLayers;
    var r = null;
    for (var x in services) {
      if (services[x].id == id) {
        r = services[x];
        break;
      }
    }
    return r;
  },
  getLayerService: function (service, idlayer) {
    var obj = this;
    var services = obj.wmsLayers;
    var r = null;
    for (var x in services) {
      if (services[x].id == service) {
        var list = services[x].data.layers;
        for (var y in list) {
          var layer = list[y];
          if (layer.id == idlayer) {
            r = layer;
            break;
          }
        }
      }
    }
    return r;
  },
  addService: function (service, func) {
    var obj = this;
    var map = obj.options.map;
    obj.checkService(service, function (data) {
      if (!data.valid) {
        obj.spinner(true, 'Servicio inv&aacute;lido');
        setTimeout(function () { obj.spinner(false); }, 1500);
      } else {
        if (!obj.getService(data.id)) {

          if (data.data.formats.length == 0) {
            var format = ['feature/F'];
            var layers = data.data.layers;

            data.data.formats = format;
            for (var x in layers) {
              layers[x].formats = format;
            }
          }


          data.selected.format = data.data.formats[0];
          data.selected.srs = data.data.srs[0];

          data.active = false;
          for (var x in data.data.layers) {
            data.data.layers[x].id = data.data.layers[x].layer.asId() + '_' + x;
          }
          obj.wmsLayers.push(data);

          obj.listLayersSelected();
          obj.printLayerSelectedList();
          obj.printWmsServices();
          if ($.isFunction(func)) {
            setTimeout(function () {
              func(data);
            }, 500);
          }
        } else {
          alert('El servicio que intenta agregar, contiene el mismo ID de uno que actualmente esta ya agregado');
        }
      }
    })
  },
  checkService: function (service, func) {
    var obj = this;
    service.path = service.url;
    var map = obj.options.map;

    var params = {
      action: 'get',
      catchEvent: function (data) {
        $('#layerDisplay_newServiceUrl').val('');
        obj.spinner(false);
        if ($.isFunction(func)) {
          func(data);
        }
      }
    };
    for (var x in service) {
      params[x] = service[x];
    }


    obj.spinner(true, 'Verificando servicio...')
    map.Service.event(params);
  },
  createCloudSelection: function (id) {
    var obj = this;
    var service = obj.getService(id);
    var layers = service.data.layers;
    var cloud = {};

    var applyFilterText = function (text) {
      var cloud = obj.cloud;
      text = text.asId();
      if (text.length > 2) {
        for (var x in cloud) {
          if (x.search(text) < 0) {
            $('.layerDisplay-cloudItem[idref=' + x + ']').hide();
          } else {
            $('.layerDisplay-cloudItem[idref=' + x + ']').show();
          }
        }
      } else {
        $('.layerDisplay-cloudItem').each(function () {
          $(this).show();
        });
      }
    };

    var domParent = $('#serviceLayer_' + service.id);
    var mainContainer = $('.layerDisplay-body').width();
    var pos = domParent.position();
    var sidePos = (pos.left + 430 > mainContainer) ? 'Left' : 'Right';

    var max = 0;
    for (var x in layers) {
      var layer = layers[x];
      var words = layer.title.replace(/_/g, ' ').split(' ');
      for (var y in words) {
        var word = words[y].asId();
        var testVals = ['el', 'la', 'los', 'las', 'a', 'ante', 'va', 'bajo', 'con', 'contra', 'de', 'desde', 'hasta', 'hacia', 'para', 'por', 'sin', 'son', 'sobre', 'tras']
        if (testVals.indexOf(word) < 0) {
          var item = cloud[word];
          if (!item) {
            cloud[word] = { label: words[y], count: 0, list: [] }
            item = cloud[word];
          }
          item.count++;
          item.list.push(layer.id);
          if (item.count > max) max = item.count;
        }
      }
    }
    obj.cloud = cloud;
    var cloudText = '';
    for (var x in cloud) {
      var item = cloud[x];
      var size = item.count * (60 / max); //maximo valor de tamaño de fuente
      var colorElem = ((max - item.count) * (60 / max));
      //var color = 'background-color:rgb('+colorElem+','+colorElem+','+colorElem+');'
      var color = 'background-color:rgb(' + (60 + colorElem) + ',' + (99 + colorElem) + ',255);'
      cloudText += '<div idref="' + x + '" class="layerDisplay-cloudItem" style="font-size:' + (Math.round(100 + size)) + '%;' + color + '" title="' + item.count + ' ocurrencia(s)">' + item.label + '</div>'
    }

    $('.layerDisplay-cloud-container').remove();

    var cadena = '<div class="layerDisplay-cloud-container cloudSide' + sidePos + '">';
    cadena += '	<input type="text" id="layerDisplay_cloud_input" class="layerDisplay-cloud-title" placeholder="Buscar elementos"/>';
    cadena += '	<span class="layerDisplay-cloud-clearInput ui-icon ui-icon-close" />';
    cadena += '	<span class="layerDisplay-cloud-close layerDisplay-sprite layerDisplay-iconClose-s" />';
    cadena += '	<div class="layerDisplay-cloud" idref="' + id + '">' + cloudText + '</div>';
    cadena += '	<div class="layerDisplay-cloud-detail" idref="' + id + '"></div>';
    cadena += '</div>';

    $('#serviceLayer_cloudContainer' + id).append(cadena);

    obj.setInputText('layerDisplay_cloud_input', function (text) {
      setTimeout(function () {
        var text = $('#layerDisplay_cloud_input').val();
        applyFilterText(text);
      }, 20);
    });

    $('.layerDisplay-cloud-clearInput').click(function () {
      $('#layerDisplay_cloud_input').val();
      applyFilterText('');
    });

    $('.layerDisplay-cloud-close').click(function () {
      $('.layerDisplay-cloud-container').remove();
      $('#serviceLayer_' + id + '_layersContent li').each(function (index, element) {
        $(this).css('display', '');
      });
    });
    $('.layerDisplay-cloudItem').each(function (index, element) {
      $(this).click(function () {
        if ($(this).attr('selected')) {
          $(this).removeAttr('selected');
          $('#serviceLayer_' + id + '_layersContent li').each(function (index, element) {
            $(this).css('display', '');
          });
        } else {
          $('.layerDisplay-cloudItem[selected=selected]').removeAttr('selected');
          $(this).attr('selected', 'selected');
          var idref = $(this).attr('idref');

          $('#serviceLayer_' + id + '_layersContent li').each(function (index, element) {
            $(this).css('display', 'none');
          });
          var items = obj.cloud[idref].list;
          for (var x in items) {
            $('#' + id + '_' + items[x]).css('display', '');
          }
        }
      });
    });

  },
  controlSpinner: function (data) {
    var obj = this;
    obj.spinner(data.status, data.label);
  },
  spinner: function (status, label) {
    var obj = this;
    label = label || 'procesando...';
    if (status) {
      if ($('#layerDisplay_serviceSpinner').attr('id')) {
        $('.layerDisplay-serviceSpinner-label').html(label);
      } else {
        var cadena = '<div id="layerDisplay_serviceSpinner" class="layerDisplay-serviceSpinner">';
        cadena += '		<div class="layerDisplay-serviceSpinner-bg"></div>';
        cadena += '		<div class="layerDisplay-serviceSpinner-center">';
        cadena += '			<div class="layerDisplay-serviceSpinner-content"><center>';
        cadena += '				<div class="layerDisplay-serviceSpinner-img"></div>';
        cadena += '				<div class="layerDisplay-serviceSpinner-label">' + label + '</div>';
        cadena += '			</center></div>';
        cadena += '		</div>';
        cadena += '</div>';

        $('body').append(cadena);
      }
    } else {
      $('#layerDisplay_serviceSpinner').remove();
    }

  },
  //WMS Form
  getWmsForm: function () {
    var obj = this;
    var layers = obj.wmsLayers;
    var cadena = '';
    cadena += '<div class="layerDisplay-addService">';
    cadena += '	<label></label>';
    cadena += '	<input id="layerDisplay_newServiceUrl" placeholder="Dirección web del servicio" type="text" value="" />';
    cadena += '	<div id="layerDisplay_addService_btn" class="layerDisplay-addService-btn" title="Agregar nuevo servicio"><span class="ui-icon ui-icon-plusthick"></span></div>';
    cadena += '	<span id="layerDisplay_serviceTypes">';
    cadena += '			<input type="radio" value="wms" id="layerDisplay_serviceWms" name="remoteServices" checked="checked"><label for="layerDisplay_serviceWms">WMS</label>';
    cadena += '			<input type="radio" value="wfs" id="layerDisplay_serviceWfs" name="remoteServices"><label for="layerDisplay_serviceWfs">WFS</label>';
    cadena += '			<input type="radio" value="wmts" id="layerDisplay_serviceWmts" name="remoteServices"><label for="layerDisplay_serviceWmts">WMTS</label>';
    cadena += '			<input type="radio" value="tms" id="layerDisplay_serviceTms" name="remoteServices"><label for="layerDisplay_serviceTms">TMS</label>';
    cadena += '	</span>';
    cadena += '	<span id="layerDisplay_serviceVer" style="display:none">';
    cadena += '			<input type="radio" value="1.0.0" id="layerDisplay_service100" name="remoteVer" checked="checked"><label for="layerDisplay_service100">ver 1.0.0</label>';
    cadena += '			<input type="radio" value="1.1.0" id="layerDisplay_service110" name="remoteVer"><label for="layerDisplay_service110">ver 1.1.0</label>';
    cadena += '			<input type="radio" value="1.1.1" id="layerDisplay_service111" name="remoteVer"><label for="layerDisplay_service111">ver 1.1.1</label>';
    cadena += '	</span>';
    cadena += '	<div id="layerDisplay_serviceListContent" class="layerDisplay-serviceListContent">';
    cadena += '		<div class="layerDisplay-editService">';
    cadena += '		</div>';
    cadena += '	</div>';
    cadena += '</div>';


    return cadena;
  },
  //External Layers Creation
  createNewLayer: function (layer) {
    var obj = this;
    var outLayers = obj.outLayers;
    var groupData = layer.group;

    var group = outLayers[groupData.idGroup];
    if (!group) {
      outLayers[groupData.idGroup] = {
        list: [],
        id: groupData.idGroup,
        label: groupData.labelGroup,
        onChange: groupData.onChange
      };
      group = outLayers[groupData.idGroup];
    }

    var list = group.list;
    var found = false;
    for (var x in list) {
      var item = list[x];
      if (item.id == layer.id) {
        found = true;
        item.active = true;
      }
    }
    if (!found) {
      layer.active = true;
      list.push(layer);
    }

    if ($.isFunction(group.onChange))
      group.onChange(group);

    obj.printOutLayers();

    //make it blink
    setTimeout(function () {
      $('#container_' + layer.id + '_outlayer').addClass('blink_it');
      setTimeout(function () {
        $('#container_' + layer.id + '_outlayer').removeClass('blink_it');
      }, 3000);
    }, 300);
    obj.openShortList();
  },
  printOutLayers: function () {
    var obj = this;
    var outLayers = obj.outLayers;


    var cadena = '';
    for (var x in outLayers) {
      var group = outLayers[x];
      var list = group.list;
      var label = group.label;
      if (list.length > 0) { //solo imprime grupos con capas
        cadena += '  <div class="shortList-outLayer-group">';
        cadena += '  	<div class="tool">';
        cadena += '  		<label>Capas ' + label + '</label>';
        cadena += '  	</div>';
        cadena += '  	<div id="' + group.id + '_outlayer" class="container">';

        for (var y in list) {
          var item = list[y];

          var strLayer = '';
          var label = item.name;
          var position = item.position;
          var active = item.active;

          var displayStatus = (active) ? 'layerDisplay-iconEye_a' : 'layerDisplay-iconEye_d';
          var btnClose = '<button alt="Remover capa" outlayer="true" title="Remover capa" pos="' + y + '" id="outLayer_' + item.id + '" idref="' + item.id + '" idGroup="' + group.id + '" class="layerDisplay-sprite layerDisplay-iconClose2 layerDisplay-transparentBtn outLayer_btnCloseShortcut"></button>';
          var btnDisplay = (item.isText === undefined) ? '<button alt="Visualizar/Ocultar capa" outlayer="true"  pos="' + y + '" title="Visualizar/Ocultar capa" id="outLayer_' + item.id + '_show" idref="' + item.id + '" idGroup="' + group.id + '" class="layerDisplay-sprite ' + displayStatus + ' layerDisplay-transparentBtn outLayer_btnShowShortcut"></button>' : '<div class="layerDisplay-btnSpace"></div>';
          //
          strLayer += '<div class="layerDisplay-layerSelected-2 shadow" outlayer="true" layer="' + item.id + '" id="container_' + item.id + '_outlayer">' + btnClose + btnDisplay + '<label id="outlayer_' + item.id + '_label">' + label + '</label></div>';
          //    
          cadena += strLayer;

        }
        cadena += '  	</div>';
        cadena += '  </div>';
      }

    }
    $('#shortList_outlayers_group').html(cadena);


    $('.outLayer_btnCloseShortcut').each(function () {
      var layer = $(this).attr('idref');
      var group = $(this).attr('idgroup');
      var pos = parseInt($(this).attr('pos'), 10);
      var value = $(this).hasClass('layerDisplay-iconEye_a');
      var outlayer = $(this).attr('outlayer');

      $(this).click(function (e) {
        if (!outlayer) {
          obj.selectedLayers.splice(pos, 1);
          obj.closeLayer(group, layer);
          e.stopPropagation();
        } else {
          obj.closeOutLayer(group, pos);
        }
      })
    });

    $('.outLayer_btnShowShortcut').each(function () {
      var layer = $(this).attr('idref');
      var group = $(this).attr('idgroup');
      var value = $(this).hasClass('layerDisplay-iconEye_a');
      var outlayer = $(this).attr('outlayer');
      $(this).click(function (e) {
        if (!outlayer) {
          obj.setCheckLayer(group, layer, !value);
        } else {
          var pos = parseInt($(this).attr('pos'), 10);
          obj.setCheckOutLayer(group, pos, !value);
        }
        e.stopPropagation();
      })
    });

  },
  countOutLayers: function () {
    var obj = this;
    var outLayers = obj.outLayers;
    var list = [];
    for (var x in outLayers) {
      var layers = outLayers[x].list;
      for (var y in layers) {
        list.push(layers[y]);
      }
    }
    return list;
  },
  setCheckOutLayer: function (group, layer, value) {
    var obj = this;
    var outLayers = obj.outLayers;
    var group = outLayers[group];
    var list = group.list;
    var item = list[layer];
    item.active = value;

    if ($.isFunction(group.onChange))
      group.onChange(group);

    obj.printAllLayers();
  },
  closeOutLayer: function (group, pos) {
    var obj = this;
    var outLayers = obj.outLayers;
    var group = outLayers[group];
    var list = group.list;
    list = list.splice(pos, 1);

    if ($.isFunction(group.onChange))
      group.onChange(group);

    obj.printAllLayers();
  },
  // called when created, and later when changing options
  _refresh: function () {
    // trigger a callback/event
    this._trigger("change");
  },


  // events bound via _on are removed automatically
  // revert other modifications here
  _destroy: function () {
    var obj = this;
    if (obj.wmsCapabilitiesRequest) {
      obj.wmsCapabilitiesRequest.abort();
      obj.wmsCapabilitiesRequest = null;
    }
    obj.wmsCapabilitiesCache = null;
    // remove generated elements
    this.element
      .removeClass("custom-layerDisplay")
      .enableSelection()
      .css("background-color", "transparent");
    $('#' + obj.id + '_shortList').remove();
  },

  // _setOptions is called with a hash of all options that are changing
  // always refresh when changing options
  _setOptions: function () {
    // _super and _superApply handle keeping the right this-context

    this._refresh();
  },

  // _setOption is called for each individual option that is changing
  _setOption: function (key, value) {
    // prevent invalid color values
    //if ( /red|green|blue/.test(key) && (value < 0 || value > 255) ) {
    //  return;
    //}
    this._super(key, value);
  },
  getData: function (url, params, callback, error, before, complete) {
    var obj = this;
    $.ajax({
      type: obj.options.postType,
      dataType: obj.options.dataType,
      url: url,
      data: params,
      success: function (json, estatus) { callback(json, estatus) },
      beforeSend: function (solicitudAJAX) {
        if ($.isFunction(before)) {
          before(params);
        }
      },
      error: function (solicitudAJAX, errorDescripcion, errorExcepcion) {
        if ($.isFunction(error)) {
          error(errorDescripcion, errorExcepcion);
        }
      },
      complete: function (solicitudAJAX, estatus) {
        if ($.isFunction(params)) {
          complete(solicitudAJAX, estatus);
        }
      }
    });
  }

  
});


