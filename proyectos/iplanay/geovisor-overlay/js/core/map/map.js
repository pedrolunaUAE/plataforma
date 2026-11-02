var GeoRss;var Route;var getLonlat;
var chaskastasis;
var demoTraking = null;
var altitude=false;
var wmsR;
var chaskit;
var delchaskit;

define(['OpenLayers','config','mapControls','mapStyles','tree','mapLayers','mapTree','features','wps','marker','popup','georeference','linetime','poi','notification','escuelas','modal','help','request','tutorial','thirdService','geolocation','cluster','dataSource','routing','toolsConfig','printControl'],function(OL,config,ctl,mapStyle,tree,Layer,Tree,Features,wps,Marker,Popup,Georeference,LineTime,Poi,Notification,Escuelas,Modal,Help,Request,Tutorial,TS,Geolocation,Cluster,DataSource,Routing,toolsConfig,printControl) {
    var Base;
    var Prueba = null;
    var re = config.mapConfig.restrictedExtent;
    var e = config.mapConfig.initialExtent;
    var defineIndexLayers = function(source){
        var s = (source)?Mapc:Map;
        for(x in s.Layers){
            var layer = s.Layers[x];
            if(!layer.isBaseLayer){
                   s.map.setLayerIndex(layer,layer.position);
            }
        }
    };
    var Mapc={
        map:null,
        Layers:{},
        loaded:false,
        onMap:false
    };
    var Map={
        Layers:{},
        Ov:{
            ctl:null,
            layers:[],
            id:'mdm6Layers_miniMap'
        },
        map:null,
        projection:{
            used:config.mapConfig.projection,
            base:'EPSG:900913'
        },
        onEODFeature:null,
        extent:new OL.Bounds(e.lon[0],e.lon[1], e.lat[0],e.lat[1]),
        restrictedExtent:new OL.Bounds(re.lon[0],re.lon[1], re.lat[0],re.lat[1]),
        controls:{},
        loaded:false,
        getEODFeature:false,
        factorZoom:0.001,
        render:null,
        addLayer:null,
        getRegSelected:null,
        clearPopup:null,
        getLayer:null,
        onMap:false,
        onFeature:false,
        activeControl:null,
        getExtent:null,
	getResolution:null,
        setParamsToLayer:null,
        transformToMercator:null,
	transformToGeographic:null,
	updatesize:null,
	getWidth:null,
	getParamFromUrl:null,
	setOpacity:null,
	setIndex:null,
	getOverlays:null,
	goCoords:null,
    thirdsFormat:{},
	cluster:{active:false,moreLevels:false,recordCardOnCluster:false,onlyDisplayRecordCard:false,geometry:false,whatshere:false},
	economic:false,
    cenago:false,
    eod:false,
    isEnableEOD:null,
    enableAditionalDenue:null,
    setParamsToLayer:null
    };
    var hideTableAttributes = function(){
        
    }
    var initialOLDefinitions = function(){
        OL.Util.onImageLoadErrorColor = "transparent";
        defineRender();
    };
    var getScale = function(){
	//var scale = Math.floor(Map.map.getScale());
	var scale = (Map.map.getZoom()+1);
        return scale; 
    };
    var getscale = function(){
	var scale = Math.floor(Map.map.getScale());
	//var scale = (Map.map.getZoom()+1);
        return scale; 
    };
    var zoomToLayer = function(){
        var a  = arguments;
        //Map.map.zoomToScale(a[0]);
	Map.map.zoomTo(parseInt(a[0])-1);
	
    };
    var getOverlays=function(){
	var couter=0;
	for(var x in Map.Layers){
	    var l = Map.Layers[x];
	    if(!l.isBaseLayer){
		couter+=1;
	    }
	}
	return couter-4;
    }
    Map.getOverlays = getOverlays;
    var getPxFromLonlat = function(lon,lat){
	return Base.getViewPortPxFromLonLat({lon:lon,lat:lat});
    }
    var getQueryString = function () {
	var query_string = null;
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	if(vars!=''){
	    query_string = {};
	    for (var i=0;i<vars.length;i++) {
		var pair = vars[i].split("=");
		    
		if (typeof query_string[pair[0]] === "undefined") {
		  query_string[pair[0]] = pair[1];
		    
		} else if (typeof query_string[pair[0]] === "string") {
		  var arr = [ query_string[pair[0]], pair[1] ];
		  query_string[pair[0]] = arr;
		    
		} else {
		  query_string[pair[0]].push(pair[1]);
		}
	    } 
	}
	  return query_string;
    }
    var starLine = function(id,lon,lat){
	var point = getPxFromLonlat(lon,lat)
	var item = $("#"+id);
	var offset = item.offset();
	var pos = {x:(item.width())+offset.left,y:offset.top+(item.height()/2)}
	var points = [{x: pos.x, y: pos.y}, {x: point.x, y: point.y+55}]
		
	var svgContainer = d3.select("#demo").append("svg:svg")
		    .attr("width",$('body').width())
		    .attr("height",$('body').height())
		    
		    
		svgContainer.append("svg:g")
		    .attr("id","g-1")
     
		var line = d3.svg.line()
		    .x(function(d) { return d.x; })
		    .y(function(d) { return d.y; })
		    .interpolate("cardinal")
		    .tension(0);
		
		d3.select("#g-1").append("svg:path").attr("d", line(points)).attr("id", "myPath");
		
		var myPoint = points[points.length-1];
		
		d3.select("#g-1").append("svg:circle")
				.attr("cx", myPoint.x)
				.attr("cy", myPoint.y)
				.attr("r", 4);
				
    }

    var loadOverview = function(i,s){
        if(!s){
            s = Map.Ov.id;
        }
        var m = Map.projection;
        var re = Map.restrictedExtent.clone();
        if(Map.Ov.ctl){
            Map.Ov.ctl.destroy();
        }
        var template = Layer.buildLayer(x,tree.baseLayers[i],true);
        var layer = Layer.getNewLayer(template);
        var c = config.mapConfig;
        var options = {
            numZoomLevels: 3,
            projection: Map.projection.base,
            resolutions:[78271.516953125,19567.87923828125,4891.969809375,2445.9849046875,1222.99245234375] 
            //maxExtent: re.transform(m.used,m.base)
        };
        Map.Ov.ctl = new OL.Control.OverviewMap({
            layers:[layer],
            'div': OpenLayers.Util.getElement(s),
            mapOptions: options
        });
	//console.log(Map.Ov.ctl);
	//Map.Ov.ctl.size = new OL.Size(190,112);
        Map.map.addControl(Map.Ov.ctl);
	//$(".olControlOverviewMapElement").css({top:"0px",left:"0px",right:"0px",bottom:"0px",position:"relative"});
        $(".olControlOverviewMapElement").children().css({width:'100%',height:'100%'});
        
    };
    MDM6('define','updateOverview',function(){
	    loadOverview(Map.map.baseLayer.name);
    });
    
    var setVectorial = function(type,source){
        var c = config.mapConfig;
        var nameLayer = 'Vectorial';
        var url = (type=='vectorial')? c.layers[0].url:c.layers[0].alternativeUrl;
        var layer = getLayer(nameLayer,source);
        if(layer){
	    if(layer.visibility){
		layer.url = url;
		setParamsToLayer({
		    layer:nameLayer,
		    params:{}
		});
	    }
        }
    };
    
    var setBaseLayer = function(i,source){
        var s = (source)?Mapc:Map;
        var layer = getLayer(i,source);
        if(layer){
            s.map.setBaseLayer(layer);
            setVectorial(layer.clasification,source);
            if (!source) {
                loadOverview(i);
                inserCopyRights(tree.baseLayers[layer.name].rights);
                if(layer.name=='B8'){
                    setParamsToLayer({
                        layer:'B8',
                        params:{time: '2013-10-10'}
                    });
                }
                if($("#menu_download").attr('id')){
                    var img = tree.baseLayers[layer.name].img;
                    $('#panel-center').menuDownload({mapImage:img});
                }
            }
            
            Map.map.baseLayer.redraw();
            
            
        }
    };
    
    var addEvents = function(item){
        
        var events = item.item.events;
        for(x in item.events){
            events.register(x,item.item,item.events[x]);
        }
        
    };
    
    var inserCopyRights = function(){
        var a = arguments[0];
        var r = $('.copyRights');
        if(r.attr('class')){
            r.html(a);
        }else{
            var cadena = '<div class="containerCopyRights"><div class="copyRights" align="center">'+a+'</div></div>';
	    cadena +='<div id="bottom_messages" align="center">&nbsp;</div>';
            $("#panel-center").append(cadena);
        }
    };
    var coordinatesMap={lon:0,lat:0};
    var isOsm = function(s){
        return (s.map.baseLayer.id.indexOf('OSM')!=-1)?true:false;
    }
    var getListenersMapCompare = function(){
        
        var listeners = {
                "mouseover":function(){
                    Mapc.onMap = true;
                },
                "mouseout":function(){
                    Mapc.onMap=false;
                },
                "moveend": function(){
                   if (Mapc.onMap) {
                        Map.map.setCenter(Mapc.map.getCenter());
                   }
                },
                "move":function(){
                    
                },
                "zoomend": function(){
                    if (Mapc.onMap) {
                        
                        var zoom= Mapc.map.getZoom();
                        var reference = isOsm(Map);
                        var actual = isOsm(Mapc);
                        if ((!reference)&&(actual)) {
                            zoom=zoom-5;
                        }
                        if ((reference)&&(!actual)) {
                            zoom=zoom+5;
                        }
                        Map.map.zoomTo(zoom);
                        
                        
                    }
                },
                "mousemove":function(){

                },
                "updatesize":function(){
                    
                }
            }
        return listeners;
    };
    var getListenersMap = function(){
        
        var listeners = {
                "mouseover":function(){
                    Map.onMap = true;
                },
                "mouseout":function(){
                    Map.onMap=false;
                   if(!Features.isClusterActive()){
                        //Popup.clear();
                   }
                },
                "moveend": function(){
                    Popup.setPanned(false);
                    if ((Mapc.map!=null)&&(Map.onMap)&&(statusComparation)) {
                        Mapc.map.setCenter(Map.map.getCenter());
                        
                    }
                    //LineTime.setMovedMap(true);
                    //LineTime.execute();
                    var cluster = getLayer('Cluster');
                    if(cluster){
                        //Cluster.execute();
                    }
                    MDM6('onMoveEnd');
                    amplify.publish( 'hideTutorialDenue'); 
                    amplify.publish( 'hideTutorialCE');
                    
                    if (statusWindy) {
                        //displayWindy();
                        //refreshWindy();
                        enableWindy(true,null,true);
                    }
                },
                "move":function(){
                    //var cluster = getLayer('Cluster');
                    //if(cluster){
                    //    cluster.setVisibility(false);
                    //}
                    if(Features.isClusterActive()){
                        Features.deactivateCluster();
                        Popup.clear();
                   }
                   
                    var i = Features.reg.selected;
                    var ctl = Features.controls.Editor;
                    if(i.id){
                                var valid = (i.item=='point')?true:false;
                                if((Map.onMap)&&(valid)&&(ctl.active==null)){
                                        Features.showInfo();
                                }
				
                    }
                    if(Map.cluster.active){
                        Cluster.clear();
                    }
                    $("#panel-center_popup").hide();
                    if (statusWindy) {
                        enableWindy(false,'now',true);
                    }
                },
                "zoomend": function(){
                    Popup.setPanned(false);
                    if ((Mapc.map!=null)&&(Map.onMap)&&(statusComparation)) {
                        
                        //Mapc.map.zoomTo(Map.map.getZoom());
                        var zoom= Map.map.getZoom();
                        var reference = isOsm(Mapc);
                        var actual = isOsm(Map);
                        if ((reference)&&(!actual)) {
                            zoom=zoom+5;
                        }
                        if ((!reference)&&(actual)) {
                            zoom=zoom-5;
                        }
                        Mapc.map.zoomTo(zoom);
                        
                    }
                    var lastResolution = getLasResolution();
                    var resolution = getResolution();
                    if(resolution>=lastResolution){
                    try{
                        amplify.publish('mapReload');
                    }catch(e){}
                    var cluster = getLayer('Cluster');
                    if(cluster){
                        //Cluster.execute();
                    }
                    MDM6('onZoomEnd');
                    enableClusters();
                    if(config.startupConfig.map.level){
                        showActualLevel();
                    }
                    }else{
                    
                    setTimeout(function(){
                        Map.map.zoomTo(14);
                    },1000);
                    
                    
                    }
                    amplify.publish( 'hideTutorialDenue');
                    amplify.publish( 'hideTutorialCE');
                    requestGeometries();
                    refreshInternalArcs();
                },
                "mousemove":function(e){
                    
                    var i = Features.reg.selected;
                    var ctl = Features.controls.Editor;
                    if(i.id){
                                var valid = ((i.item=='feature')||(i.item=='point'))?true:false;
                                if((Map.onMap)&&(valid)&&(ctl.active==null)){
                                 
                                        if(i.item!='point'){
                                            Popup.clear();
                                        }
                                        var event = function(){
                                            Features.showInfo();
                                        }
					
                                        Popup.defineTimer(event);
                                }
				
                    }
                    
                    if((Map.cluster.active)&&(Map.cluster.geometry)){
                        try{
                            var resolution = Map.map.getResolution();
                            if(resolution<4891.969809375){
                            var xy = Map.map.controls[1].lastXy;
                            var coords = Map.map.getLonLatFromPixel(new OL.Pixel(xy.x, xy.y));
                            var wkt = 'POINT('+coords.lon+' '+coords.lat+')';
                            Cluster.showGeometry({wkt:wkt,resolution:getResolution(),time:1000});
                            }
                        }catch(e){}
                    
                    }
                    if(Map.onMap){
                            var xy = Map.map.controls[1].lastXy;
                            if(xy){
                                var coords = Map.map.getLonLatFromPixel(new OL.Pixel(xy.x, xy.y));
                                if((coordinatesMap.lon!=coords.lon)&&(coordinatesMap.lat!=coords.lat)){
                                    coordinatesMap.lon = coords.lon;
                                    coordinatesMap.lat = coords.lat;
                                    if(clockAltitude){
                                        clearTimeout(clockAltitude);
                                    }
                                    if(config.startupConfig.map.elevation){
                                        clockAltitude = setTimeout(function(){
                                            requestAltitude.setParams(JSON.stringify({x:coords.lon,y:coords.lat}));
                                            requestAltitude.execute();
                                        },500);
                                    }
                                }
                                
                            }
                    }
                    /*
                    if (config.startupConfig.map.onOver.showPolygon) {
                        try{
                            var resolution = Map.map.getResolution();
                            
                            var xy = Map.map.controls[1].lastXy;
                            var coords = Map.map.getLonLatFromPixel(new OL.Pixel(xy.x, xy.y));
                            var wkt = 'POINT('+coords.lon+' '+coords.lat+')';
                            displayGeometry({wkt:wkt,resolution:getResolution(),time:1000});
                            
                        }catch(e){}
                    }*/
                },
                "updatesize":function(){
                    Popup.resetLimits();
                    if (statusWindy) {
                        //hideWindy();
                        //displayWindy();
                        //refreshWindy();
                        enableWindy(true,null,true);
                    }
                }
            }
        return listeners;
    };
    var clockGeometry=null;
    var displayGeometry = function(a){
        a.time = (a.time!=null)?1000:0;
        if(clockGeometry){
            clearTimeout(clockGeometry);
        }
        clockGeometry = setTimeout(function(){
                var params = {point:a.wkt,resolution:a.resolution};
                requestGeometry.setParams(JSON.stringify(params));
                requestGeometry.execute(); 
        },a.time);
    };
    var requestGeometry = Request.New({
        url:DataSource.displayGeometry.url,
        type:DataSource.displayGeometry.type,
        format:DataSource.displayGeometry.dataType,
        contentType:DataSource.displayGeometry.contentType,
        params:'',
        events:{
            success:function(data){
                if(data){
                    if(data.response.success){
                        var c = config.startupConfig.map.onOver.color;
                        var options = {fColor:c.filled,lSize:c.size,lColor:c.line,lType:"line",type:'buffer'};
                        MDM6('addPolygon',data.data.geometry,options);
                        MDM6('onDisplayFeatureMouseOver',data.data);
                    }else{
                        MDM6('onDisplayFeatureMouseOver',data.response.message);
                        MDM6('deletePolygons');
                    }
                }else{
                    MDM6('onDisplayFeatureMouseOver','Servicio de cluster no disponible');
                    MDM6('deletePolygons');
                }
            }
        }
    });
    getformatNumber = function(nStr){
		nStr += '';
		x = nStr.split('.');
		x1 = x[0];
		//alert('antes');
		x2 = x.length > 1 ? '.' + x[1] : '';
		var rgx = /(\d+)(\d{3})/;
		while (rgx.test(x1)) {
			x1 = x1.replace(rgx, '$1' + ',' + '$2');
		}
		return x1 + x2;
    };
    var buildInfoLevel = function(){
        var chain = '<div class="infoLevel no-print">'+
                        '<div class="label">Nivel : </div>'+
                        '<div class="level"></div>'+
                    '</div>';
        $("#panel-center").append(chain);
        showActualLevel();
    }
    var showActualLevel = function(){
        var level = Map.map.zoom;
        $(".infoLevel .level").html(level+1);
    };
    var insertBaseLayers = function(source){
        var s = (source)?Mapc:Map;
        var c = config.mapConfig;
        
        for(x in tree.baseLayers){
            var valid = true;
            try{
                var i = tree.baseLayers[x];
                var template = Layer.buildLayer(x,i);
                if(i.type=='Wms'){
                    template.params['transitionEffect']='resize';
                }
                if(template.type=='Google'){
                    if(typeof google === "undefined"){
                        valid=!valid;
                        Notification.show({message:'El servicio de Google no esta disponible',time:5000});
                    }
                }
                template.clasification= (i.clasification)?i.clasification.toLowerCase():'vectorial';
            }catch(e){
                valid=false;
            }
                if(valid){
                    addLayer(template,null,source);
                    if (template.type=='Google') {
                         s.map.layers[s.map.layers.length-1].mapObject.setTilt(0);
                    }
                   
                }
            //}catch(e){}
        }
        //console.log(Map.Layers);
    };
    
    var addLayer = function(p,Format,source){
        var s = (source)?Mapc:Map;
        if(!s.Layers[p.type]){
            var isBase=false;
            try{isBase=(p.isBase)?true:false;}catch(e){}
            var properties= Layer.getParamsLayer(p.info);
            var newLayer = Layer.getNewLayer(p);
            newLayer.clasification = p.clasification;
            newLayer.isBaseLayer = isBase;
            newLayer['position']=(isBase)?0:p.position;
            var Name = (p.name)?p.name:properties.name;
            s.Layers["'"+Name+"'"]=newLayer;
            s.map.addLayer(newLayer);
            
            if (Format) {
                if (!s.thirdsFormat[Format]) {
                    s.thirdsFormat[Format]={};
                }
                s.thirdsFormat[Format][Name] = newLayer;
               
                
            }
        }else{
            /*
            setParamsToLayer({
                layer:p.,
                params:
            });
            */
        }
        defineIndexLayers(source);
    };
    var addGeorss = function(name,value,params){
	var newl = new OL.Layer.GeoRSS(name, value,params);
	Map.map.addLayer(newl);
	Map.Layers["'"+name+"'"]=newl;
    }
    Map.addLayer = addLayer;
    
    var encuadrarNayarit = function(){
        if (!Map.map || !Map.map.restrictedExtent || !Map.map.size || Map._ajustandoNayarit) {
            return;
        }
        if (Map._sinEncuadre) {
            return;
        }
        var limite = Map.map.restrictedExtent;
        var vista = Map.map.getExtent();
        if (!vista || Map.map.getZoom() === 0) {
            return;
        }
        var contiene = vista.containsBounds(limite);
        if (!contiene) {
            Map._ajustandoNayarit = true;
            Map.map.zoomToExtent(limite.clone());
            Map._ajustandoNayarit = false;
        }
    };
    var updateSize = function(source){
        var s = (source)?Mapc:Map;
        s.map.updateSize();
        if (!source) {
            encuadrarNayarit();
        }
        setTimeout(function(){
            var vectorial = getLayer('Vectorial',source);
            var text = getLayer('Text',source);
            if ((vectorial)&&(vectorial.visibility)) {
                setParamsToLayer({layer:'Vectorial',params:{layers:vectorial.params.LAYERS},forceRefresh:true},source);
            }
            if ((text)&&(text.visibility)) { 
                setParamsToLayer({layer:'Text',params:{layers:text.params.LAYERS},forceRefresh:true},source);
            }
        },500);
    };
    var getExtent = function(){
        var a = arguments[0];
        var m = Map.projection;
        var newProj = (a=='geographic')?m.used:m.base;
        var e = Map.map.getExtent();
        var lon = new OL.LonLat(e.left,e.bottom).transform(m.base,newProj);
        var lat = new OL.LonLat(e.right,e.top).transform(m.base,newProj);
        return {lon:[lon.lon,lon.lat],lat:[lat.lon,lat.lat]};
    };
    var getLasResolution=function(){
	var res = config.mapConfig.resolutions[config.mapConfig.resolutions.length-1];
	res = res+'';
	var cadena = res.split('.');
	var a = '';
	for(var x in cadena[1]){
	    var c = cadena[1][x];
	    if(x<=8){
		a+=c;
	    }
	}
	return parseFloat(cadena[0]+'.'+a);
    }
    var getResolution = function(){
	var res = Map.map.getResolution();
	res = res+'';
	var cadena = res.split('.');
	var a = '';
	for(var x in cadena[1]){
	    var c = cadena[1][x];
	    if(x<=8){
		a+=c;
	    }
	}
	return parseFloat(cadena[0]+'.'+a);
    }
    Map.getResolution = getResolution;
    var transformToDegrees = function(lon,lat){
        var lonlat = transformToGeographic(lon,lat);
        var Lon = ctl.transformToDegrees(lonlat.lon.toFixed(5))+ 'W';
        var Lat = ctl.transformToDegrees(lonlat.lat.toFixed(5))+ 'N';
        return {lon:Lon,lat:Lat};
    };
    var transformToGeographic = function(lon,lat){
        var m = Map.projection;
        var point = new OL.LonLat(lon,lat).transform(m.base,m.used);
        return {lon:point.lon,lat:point.lat};
    };
    Map.transformToGeographic = transformToGeographic;
    var transformToMercator = function(lon,lat){
        var m = Map.projection;
        var point = new OL.LonLat(lon,lat).transform(m.used,m.base);
        return {lon:point.lon,lat:point.lat};
    };
    Map.transformToMercator = transformToMercator;
    Map.getExtent = getExtent;
    var getWidth = function(){
        var width=0;
        var extent = Map.map.getExtent().toBBOX();
	extent = extent.split(',');
        //var point = transformToGeographic(parseFloat(extent[0]),parseFloat(extent[2]));
        //var width =  (Math.abs(point.lon-point.lat))/parseFloat($("#map").width());
        var width =  (Math.abs(parseFloat(extent[0])-parseFloat(extent[2])))/parseFloat($("#map").width());
        return width;
    };
    Map.getWidth = getWidth;
    var extentRedefined = false;
    var extentMap = function(){
        if (extentRedefined) {
            Map.map.zoomToExtent(Map.extent);
            if (Mapc.map!=null) {
                Mapc.map.zoomToExtent(Map.extent);
                var zoom = Map.map.getZoom();
                Mapc.map.zoomTo(zoom);
            }
        }else{
            goCoords(Map.extent,'origin');
        }
    };
    var zoomIn = function(){
        Map.map.zoomIn();
        if (Mapc.map!=null) {
            Mapc.map.zoomIn();
        }
    };
    var zoomOut = function(){
        Map.map.zoomOut();
        if (Mapc.map!=null) {
            Mapc.map.zoomOut();
        }
    };
    var setRestrictedExtent=function(newExtent,source){
        var s = (source)?Mapc:Map;
        var m = Map.projection;
        var cloneExtent = newExtent.clone();
        s.map.setOptions({restrictedExtent: cloneExtent.transform(m.used,m.base)});
        var newResolution = s.map.getResolution();
        s.map.setOptions({minResolution:newResolution});
    };
    var getZoomLevel=function(){
	return (Map.map.getZoom())+1;
    };
    var redefineExtent = function(){
	var a = arguments;
	if(typeof(a[0]) == 'string'){
	    var response = Features.getFeatureFromWKT(a[0]);
	    var extent = response.bounds;
	}else{
	    var extent = new OL.Bounds(a[0],a[1],a[2],a[3]);
	}
	//if(Map.map.restrictedExtent == null) {
                Map.map.setOptions({restrictedExtent: extent});
        //    } else {
        //        Map.map.setOptions({restrictedExtent: null});
        //}
	//goCoords(extent);
	//setRestrictedExtent(extent);
	Map.map.zoomToExtent(extent);
	var actualResolution = Map.map.getResolution();
	setResolutions(actualResolution);
    Map.extent = extent;
    extentRedefined =true;
	
    };
    var mirrorCluster = function(){
	var height = $("#background_nodes").height();
	if(height){
	    var svg = $('#nodos').html();
	    var data = '<svg height="'+height+'" width="'+height+'"><circle cx="'+(height/2)+'" cy="'+(height/2)+'" r="'+(height/2)+'" fill="#131313"></circle></svg>';
	    canvg('background_nodes_mirror_canvas', data);
	    canvg('nodos_mirror_canvas', svg);
	    $("#background_nodes_mirror,#nodos_mirror").css("display","");
	    
	    var recorCardIconSvg = $("#circle_icon_svg").html();
	    if(recorCardIconSvg){
		canvg('circle_icon_mirror_canvas', recorCardIconSvg);
	    }
	}
    }
    var clearMirrorCluster = function(){
	$("#background_nodes_mirror,#nodos_mirror").css("display","none");
    }
    
    var enableExportMap = true;
    var exportNotification=null;
    var exportMap = function(format,aditionals){
	var hideDetailCluster = false;
	if(enableExportMap){
	    Marker.buildMirror();
	    mirrorCluster(); 
	    enableExportMap=false;
	    var element = (aditionals)?$("#content"):$('#main');
	    var items = $("#eod,#toolGeoelectorales,#mdm6DinamicPanel,#mdm6Layers,#scaleControl,#baseMapMini,#mdmToolBar,.section_share,.more_info,.popup_close,#menu_mapDownload,#mdm6Layers_v_container,#background_nodes,#nodos,#floatingLegend,#BaseNotifications");
	    var itemDisplayState = [];
	    items.each(function(){
		itemDisplayState.push({element:this, display:this.style.display});
	    });
	    var restoreExportItems = function(){
		for(var i=0; i<itemDisplayState.length; i++){
		    itemDisplayState[i].element.style.display = itemDisplayState[i].display;
		}
	    };
	    if(exportNotification==null){
		if ((typeof aditionals != 'undefined')&&(aditionals!=null)){
            if (aditionals.message) {
                exportNotification = Notification.show({message: aditionals.message});
            }else{
                exportNotification = Notification.show({message: 'Exportando itinerario...'});
            }
		}else{
		    exportNotification = Notification.show({message: 'Exportando mapa...'});
		}
	    
	    }else{
		exportNotification.show();
	    }
		    if(Map.cluster.active){
			if($("#detailCluster").css('display')!='none'){
			    $("#detailCluster").hide();
			    hideDetailCluster=true;
			}
			
		    }
		    
		    items.css({display:'none'});
		    var ie = isExplorer();
		    html2canvas(element, {
			"proxy":DataSource.files.download,
			//"logging": true, //Enable log (use Web Console for get Errors and Warnings)
			onrendered: function (canvas) {
				if ((typeof aditionals != 'undefined')&&(aditionals!=null)){
				    var imgData = canvas.toDataURL('image/'+format,1.0);
				    aditionals.event(imgData);
				}else{
				    if(format=='pdf'){
					var widthMap = parseFloat($("#map").width());
					var heightMap = parseFloat($("#map").height());
					var altoNew = (28*heightMap)/widthMap;
					
					var imgData = canvas.toDataURL('image/png',1.0);
					var doc = new jsPDF('l','cm','letter');
					doc.addImage(imgData, 'PNG',0,0, 28,altoNew);
					doc.save('mdm.pdf');
				    }else{
		    
					var img = $('<img>'); //Equivalent: $(document.createElement('img'))
					img.attr('src', canvas.toDataURL("image/"+format,1.0));
					
					var src = img.attr('src');
					
					if(!ie){
					    var a = $("<a>")
						.attr("href", src)
						.attr("download", "mdm."+format)
						.appendTo("body");
					    a[0].click();
					    a.remove();
					}
				    }
				    
				    if((ie)&&(format!='pdf')){
					 modalImage.show();
					$("#imageDownload").attr('src',"");
					$("#imageDownload").attr('src',canvas.toDataURL("image/"+format,1.0));
				    }
				}   
				    exportNotification.hide();
				    restoreExportItems();
				    enableExportMap=true;
				    //alert("fin imagen");
				    
			}
		    });
		    
	    if(hideDetailCluster){
			$("#detailCluster").show();
	    }
	    Marker.clearMirror();
	    clearMirrorCluster();
	}else{
	    Notification.show({message:'Actualmente esta generando una descarga espere hasta que finalize',time:3000});	
	}
    };
    var setResolutions = function(resolution){
	var c = config.mapConfig;
	var pos = c.resolutions.indexOf(resolution);
	//console.log(resolution);
	if(pos!=-1){
	    var newResolutions=[];
	    newResolutions = $.extend(newResolutions,c.resolutions);
	    newResolutions = newResolutions.slice(pos,newResolutions.length);
	    //console.log(newResolutions);
	    Map.map.setOptions({resolutions: newResolutions});
	}
	
    };
    
    var addCustomControls = function(){
        Map.controls = ctl.getCustom({'Poligonos':getLayer('Poligonos')},Map);
        for(x in Map.controls) {
                Map.map.addControl(Map.controls[x]);
        }
        addEventControls();
    };
    var getControl = function(name){
        return Map.controls[name];
    };
    
    var report = function(event) {
        //console.log(event.type, event.feature ? event.feature.id : event.components);
    };
    
    var addEventControls = function(){
        var idContainer = 'medidaG';
        
        addEvents({
            item:getControl('georeferencePolygon'),
            events:{
                activate:function(){
                    
                },
                deactivate:function(){
                    //eventDisableCtl.execute('measure');
                },
                measure:function(e){
                    if(e.measure>0){
                        Features.add({
                            wkt:e.geometry+'',
                            zoom:false,
                            store:true,
                            params:Features.getFormat('georeference','polygon')
                        });
                        Features.showGeoModal();
                    }else{
                        $("#mdm6DinamicPanel_geo_btnEndAction").click();
                    }
                },
                measurepartial:function(e){
                    
                }
            }   
        });
        
        addEvents({
            item:getControl('georeferenceLine'),
            events:{
                activate:function(){},
                deactivate:function(){
                    //eventDisableCtl.execute('measure');
                },
                measure:function(e){
                    if(e.measure>0){
                        Features.add({
                            wkt:e.geometry+'',
                            zoom:false,
                            store:true,
                            params:Features.getFormat('georeference','line')
                        });
                        Features.showGeoModal();
                    }else{
                        $("#mdm6DinamicPanel_geo_btnEndAction").click();
                    }
                },
                measurepartial:function(e){
                    
                }
            }   
        });
        
        addEvents({
            item:getControl('polygonH'),
            events:{
                activate:function(){},
                deactivate:function(){
                     eventDisableCtl.execute('buffer');
                },
                done:function(){/*console.log('done')*/},
                featureadded:function(e){
                    var params = Features.getFormat('buffer','polygon');
                    Features.addProperties(e.feature,params);
                    Features.setArguments(e.feature,params);
                    Features.addToReg(e.feature);
                    Features.added({id:e.feature.id,type:'buffer',data:{name:e.feature.custom.name,type:'polygon',measure:Features.getArea(e.feature,false)}});
                }
            }   
        });
        
        addEvents({
            item:getControl('measurePolygon'),
            events:{
                activate:function(){/*console.log('activado')*/},
                deactivate:function(){
                    eventDisableCtl.execute('measure');
                },
                measure:function(e){
                    if(e.measure>0){
                        Features.add({
                            wkt:e.geometry+'',
                            zoom:false,
			    store:true,
                            params:Features.getFormat('measure','polygon')
                        });
                    }else{
                        $("#mdm6DinamicPanel_measure_btnEndAction").click();
                    }
                },
                measurepartial:function(e){}
            }   
        });
        
        
        addEvents({
            item:getControl('measureLine'),
            events:{
                activate:function(){/*console.log('activado')*/},
                deactivate:function(){
                    eventDisableCtl.execute('measure');
                },
                measure:function(e){
                    if(e.measure>0){
                        Features.add({
                            wkt:e.geometry+'',
                            zoom:false,
                            store:true,
                            params:Features.getFormat('measure','line')
                        });
                    }else{
                        $("#mdm6DinamicPanel_measure_btnEndAction").click();
                    }
                },
                measurepartial:function(e){}
            }   
        });
       /*
        addEvents({
            item:getControl('polygonH'),
            events:{
                beforefeaturemodified: function(e){console.log('antes modificar')},
                featuremodified: report,
                afterfeaturemodified: report,
                vertexmodified: report,
                sketchmodified: report,
                sketchstarted: report,
                sketchcomplete: report,
                activate:function(){console.log('activado')},
                deactivate:function(){console.log('deactivado')},
                done:function(){console.log('done')},
                featureadded:function(e){console.log(e)}
            }   
        });
        */
        addEvents({
            item:getControl('identify'),
            events:{
                activate:function(){/*console.log('activado')*/},
                deactivate:function(){/*console.log('deactivado')*/}
            }   
        });
	addEvents({
            item:getControl('customPolygon'),
            events:{
                activate:function(){},
                deactivate:function(){
                    activeControl({control:'identify',active:true});
                },
                measure:function(e){
                    if(e.measure>0){
			var wkt = e.geometry+'';
			if(this.Event){
			    this.Event(wkt);
			}
			//MDM6('customTool','polygon',wkt);
                    }else{
                    }
                }
            }   
        });
        /*
        var selectedFeature = function(){
            var Ctl = Features.getCtls();
            var s = Ctl.Select;
            var h = Ctl.Hover;
            if(s.active){
                
            }
            if(h.active){
            }
        }
        
        addEvents({
            item:getLayer('Poligonos'),
            events:{
                featureselected:selectedFeature
            }
        });
        */
        
        
    };
    
    var defineRender = function(){
        var renderer = OL.Util.getParameters(window.location.href).renderer;
        renderer = (renderer) ? [renderer] : OL.Layer.Vector.prototype.renderers;
        Map.render = renderer;
	Map.render = ["Canvas","SVG", "VML"];
    };
    
    var activeControl = function(p){
            p.control = (p.control=='none')?'identify':p.control;
            for(x in Map.controls) {
                var control = Map.controls[x];
                if(p.control == x && p.active) {
                    control.activate();
		    if(p.event){
			control.Event = p.event;
		    }
		    if(p.onDeactivate){
			addEvents({
			    item:control,
			    events:{
				deactivate:p.onDeactivate
			    }
			});
			
		    }
                } else {
                    control.deactivate();
		    
                }   
            }
    };
    Map.activeControl = activeControl;
    var addSpetialVector = function(){
        /***********/
                addLayer({
                    type:'Vector',
                    name:'hoverPolygons',
                    position:15,
                    info:{
                        renderers:Map.render,
                        styleMap:new OL.StyleMap({
				
                                "default": new OL.Style(OL.Util.applyDefaults({
                                    fillColor: "${fColor}",
                                    strokeWidth: "${lSize}",//1
                                    strokeColor: "${lColor}",//#59590E
                                    strokeDashstyle: "solid",//dash
                                    //label : "${nombre}",
                                    labelAlign: "center",
                                    fontColor: "#000000",
                                    fontWeight: "bold",
                                    labelOutlineColor: "white",
                                    labelOutlineWidth: 3,
                                    fontFamily: "Courier New, monospace",
                                    fontSize: "16px",
                                    fillOpacity:0.2

                                }, OL.Feature.Vector.style["default"])),
                                "select": new OL.Style(OL.Util.applyDefaults({
                                    fillColor: "${fColor}",
                                    strokeWidth: "${lSize}",//1
                                    strokeColor: "${lColor}",//#59590E
                                    strokeDashstyle: "solid",//dash
                                    //label : "${nombre}",
                                    labelAlign: "center",
                                    fontColor: "#000000",
                                    fontWeight: "bold",
                                    labelOutlineColor: "white",
                                    labelOutlineWidth: 3,
                                    fontFamily: "Courier New, monospace",
                                    fontSize: "16px",
                                    fillOpacity:0.2

                                }, OL.Feature.Vector.style["select"])),
                                
                                "vertex": new OL.Style(OL.Util.applyDefaults({
                                    fillColor: "${fColor}",
                                    strokeWidth: 1,
                                    externalGraphic: "${image}",
                                    graphicWidth: "${gWith}",
                                    graphicHeight: "${gHeight}",
                                    //graphicName: "square",
                                    strokeColor: "#59590E",
                                    strokeDashstyle: "line",
                                    //label : "${nombre}",
                                    labelAlign: "center",
                                    fontColor: "#000000",
                                    fontWeight: "bold",
                                    labelOutlineColor: "white",
                                    labelOutlineWidth: 3,
                                    fontFamily: "Courier New, monospace",
                                    fontSize: "16px"
                                }, OL.Feature.Vector.style["vertex"]))
                        })
                    }
                });
                /***********/
                addLayer({
                type:'Vector',
                name:'SpetialPolygons',
                position:16,
                info:{
                    renderers:Map.render,
                    styleMap:new OL.StyleMap({
				
                                "default": new OL.Style(OL.Util.applyDefaults({
                                    fillColor: "${fColor}",
                                    strokeWidth: "${lSize}",//1
                                    strokeColor: "${lColor}",//#59590E
                                    strokeDashstyle: "${lType}",//dash
                                    //label : "${nombre}",
                                    labelAlign: "center",
                                    fontColor: "#000000",
                                    fontWeight: "bold",
                                    labelOutlineColor: "white",
                                    labelOutlineWidth: 3,
                                    fontFamily: "Courier New, monospace",
                                    fontSize: "16px",
                                    fillOpacity:0.2

                                }, OL.Feature.Vector.style["default"])),
                                
                                "vertex": new OL.Style(OL.Util.applyDefaults({
                                    fillColor: "${fColor}",
                                    strokeWidth: 1,
                                    externalGraphic: "${image}",
                                    graphicWidth: "${gWith}",
                                    graphicHeight: "${gHeight}",
                                    //graphicName: "square",
                                    strokeColor: "#59590E",
                                    strokeDashstyle: "line",
                                    //label : "${nombre}",
                                    labelAlign: "center",
                                    fontColor: "#000000",
                                    fontWeight: "bold",
                                    labelOutlineColor: "white",
                                    labelOutlineWidth: 3,
                                    fontFamily: "Courier New, monospace",
                                    fontSize: "16px"
				    

                                }, OL.Feature.Vector.style["vertex"]))
                    })
                }
        });
        
    }
    var addVector = function(){
        addLayer({
                type:'Vector',
                name:'Poligonos',
                position:1,
                info:{
                    renderers:Map.render,
                    styleMap:new OL.StyleMap({
				
                                "default": new OL.Style(OL.Util.applyDefaults({
                                    fillColor: "${fColor}",
                                    strokeWidth: "${lSize}",//1
                                    strokeColor: "${lColor}",//#59590E
                                    strokeDashstyle: "${lType}",//dash
                                    //label : "${nombre}",
                                    labelAlign: "center",
                                    fontColor: "#000000",
                                    fontWeight: "bold",
                                    labelOutlineColor: "white",
                                    labelOutlineWidth: 3,
                                    fontFamily: "Courier New, monospace",
                                    fontSize: "16px",
                                    fillOpacity:0.2

                                }, OL.Feature.Vector.style["default"])),
                                
                                "vertex": new OL.Style(OL.Util.applyDefaults({
                                    fillColor: "${fColor}",
                                    strokeWidth: 1,
                                    externalGraphic: "${image}",
                                    graphicWidth: "${gWith}",
                                    graphicHeight: "${gHeight}",
                                    //graphicName: "square",
                                    strokeColor: "#59590E",
                                    strokeDashstyle: "line",
                                    //label : "${nombre}",
                                    labelAlign: "center",
                                    fontColor: "#000000",
                                    fontWeight: "bold",
                                    labelOutlineColor: "white",
                                    labelOutlineWidth: 3,
                                    fontFamily: "Courier New, monospace",
                                    fontSize: "16px"
				    

                                }, OL.Feature.Vector.style["vertex"]))
                    })
                }
        });
        
        
        /**/
        var styleCluster = new OpenLayers.Style({
                    pointRadius: "${radius}",
                    fillColor: "#ffcc66",
                    fillOpacity: 0.8,
                    strokeColor: "#cc6633",
                    strokeWidth: "${width}",
                    strokeOpacity: 0.8,
                    label : "${total}",
                    labelAlign: "center",
                    fontColor: "#000000",
                    fontWeight: "bold",
                    //externalGraphic: "${image}",
                    //graphicWidth: "35",
                    //graphicHeight: "50",
                    fontFamily: "Courier New, monospace",
                    fontSize: "10px"
                    //labelOutlineColor: "white",
                    //labelOutlineWidth: 3,
                    //graphicYOffset:-43,
                    //labelYOffset:17
                }, {
                    context: {
                        
                        width: function(feature) {
                            return (feature.cluster) ? 2 : 1;
                        },
                        radius: function(feature) {
                            var pix = 2;
                            //var pix="";
                            if(feature.cluster) {
                                
                                pix = Math.min(feature.attributes.count, 7) + 2;
                                
                            }
                            return pix;
                        },
                        total: function(feature) {
                            var total = 1;
                            if(feature.cluster) {
                                total = feature.attributes.count;
                            }
                            total = (total==1)?"":total; 
                            return total;
                        }
                        
                    }
                });
                /*
                Estrategia = [
                    new OpenLayers.Strategy.Fixed(),
                    new OpenLayers.Strategy.AnimatedCluster({
                        distance: 45,
                        animationMethod: OpenLayers.Easing.Expo.easeOut,
                        animationDuration: 10
                    })

                ]*/
                Estrategia = new OL.Strategy.Cluster();
                /*
                Estrategia = new OpenLayers.Strategy.AttributeCluster({
                                    attribute:'clazz'
                            });
                            */
                /*
                clusters = new OpenLayers.Layer.Vector("Clusters", {
                    strategies: [strategy],
                    styleMap: new OpenLayers.StyleMap({
                        "default": style,
                        "select": {
                            fillColor: "#8aeeef",
                            strokeColor: "#32a8a9"
                        }
                    })
                });
                */
        /**/
        addLayer({
                type:'Vector',
                name:'Cluster',
                position:1,
                info:{
                    renderers:Map.render,
                    strategies:[Estrategia],
                    styleMap:styleCluster
                }
        });
    };
    var setCustomControls = function(p){
        Map.controls = p;
    };
    var getCustomControls = function(){
        return Map.controls;
    };
    var addEventsBaseCompare = function(){
        var loadStart = function(){
	    
        }
        var loadEnd=function(){
          if(!Mapc.loadEnd){
            Mapc.loadEnd=true;
            updateSize(Mapc);
          }
        }
        addEvents({
            item:getLayer('B1',Mapc),
            events:{
                loadstart:loadStart,
                loadend:loadEnd
            }   
        });
        
    };
    var addEventsBase = function(){
        var loadStart = function(){
	    
        }
        var loadEnd=function(){
          if(!Map.loadEnd){
                var enableTutorial = (getParamFromUrl('coordinates')==null)?true:false;
                if((config.startupConfig.ui.startupTotorial)&&(enableTutorial)){
                    Tutorial.load();
                }
                Map.loadEnd=true;
                MDM6('onLoad');
                updateSize();
                locateUbication();
                if(config.startupConfig.map.level){
                    buildInfoLevel();
                }
                try{
                    amplify.publish( 'mapAfterLoad');
                }catch(e){
                    
                }
          }
	 
        }
        addEvents({
            item:getLayer('B1'),
            events:{
                loadstart:loadStart,
                loadend:loadEnd
            }   
        });
        
    };
    var setOpacity = function(){
        var a = arguments;
        if(a[0]){
            a[0].setOpacity(a[1]); 
        }
    };
    Map.setOpacity = setOpacity;
    var changeOpacity = function(){
        var a = arguments;
        setOpacity(getLayer('Vectorial'),a[0]);
        setOpacity(getLayer('Text'),a[0]);
        for(var x in Map.thirdsFormat){
            var format = Map.thirdsFormat[x];
            for(var y in format){
                setOpacity(getLayer(y),a[0]);
            }
        }
        if ((Mapc.map!=null)&&(statusComparation)) {
            setOpacity(getLayer('Vectorial',Mapc),a[0]);
            setOpacity(getLayer('Text',Mapc),a[0]);
        }
        
    };
    
    var getLayer=function(name,source){
        var s = (source)?Mapc:Map;
        return (s.Layers["'"+name+"'"])?s.Layers["'"+name+"'"]:null;
    };
    Map.getLayer = getLayer;

    var equalParams = function(a,b){
	var response=true;
	for(var x in a){
	    var param = x.toUpperCase();
	    if(b[param]!=a[x]){
		response=false;
		break;
	    }
	}
	return response;
    };
    var clockSetParamsToLayer = null;
    var setParamsToLayer = function(p,source){
        var evento = function(p,source){
            //console.log('ejecutando..')
            var layer = getLayer(p.layer,source);
            var force = (p.forceRefresh)?p.forceRefresh:true;
            var sameInformation=false;
            if(layer){
                var status = true;
                if(!force){
                    sameInformation = equalParams(p.params,layer.params);
                }
                if(p.params.layers!=''){
                    if((!force)&&(!sameInformation)||(force)){
                        p.params['firm'] = ""+ Math.floor(Math.random()*11) + (Math.floor(Math.random()*101));
                        var bandera = true;
                        if(layer.typeService){
                            if(layer.typeService=='TMS'){
                            if(p.params.format){
                            var f = p.params.format.split('/');
                            layer.options.format=p.params.format;
                            layer.options.type=f[1];
                            layer.type=f[1];
                            layer.format=p.params.format;
                            }
                            if(p.params.layers){
                            layer.options.layers=p.params.layers;
                            layer.layers=p.params.layers;
                            }
                        }
                        if(layer.typeService=='WFS'){
                            layer.protocol.setFeatureType(p.params.layers); 
                            layer.refresh({featureType: p.params.layers,force: true});
                        }
                        
                        }
                        if((layer.typeService!='WFS')&&(layer.mergeNewParams)){
                            layer.mergeNewParams(p.params);
                        }
                    }
                }else{
                        status=false;
                }
                layer.setVisibility(status);
            }
        }
        if (p.layer =='Economico') {
            clearTimeout(clockSetParamsToLayer);
            //console.log('definiendo...')
            clockSetParamsToLayer = setTimeout(function(){evento(p,source)},500);
        }else{
            evento(p,source);
        }
        
    };
    var setVisibility = function(name,status){
        var layer = getLayer(name);
        if (layer) {
             layer.setVisibility(status);
        }
    };
    Map.setParamsToLayer = setParamsToLayer;
    /*
    var goCoords = function(){
            var m = Map.projection;
            var a = arguments;
            var f = Map.factorZoom;
            var p;
            var bandera =false;
            if(typeof(a[0]) == 'object'){
                var t=a[0];
            }else{
                if(typeof(a[0]) == 'string'){
                    var response = Features.getFeatureFromWKT(a[0]);
                    var t = response.bounds;
                    Map.map.zoomToExtent(t);
                    bandera=true;
                }else{
                    if((!a[2])&&(!a[3])){
                        
                        // a[2] = a[0]+f;
                        // a[3] = a[1]+f;
                        // a[0]-=-f; 
                        // a[1]-=f;
                        
                        var lonlat = new OL.LonLat(parseFloat(a[0]),parseFloat(a[1]));
                        Map.map.setCenter(lonlat,12);
                    }else{
                        var t=new OL.Bounds(a[0],a[1],a[2],a[3]);
                    }
                }
            }
            if(!bandera){
                p=t.clone();
                Map.map.zoomToExtent(p.transform(m.used,m.base));
            }
    };
    */
    var locateUbication = function(){
	var params = getQueryString();
	if(params==null){
	    Geolocation.findMyLocation({zoom:8});
	    //Geolocation.findMyLocation({zoom:8,params});
	}
    };
    var getParamFromUrl=function(param){
	    var result = null;
	    param = param.replace(/[[]/,"\[").replace(/[]]/,"\]");
	    var regexS = "[\?&]"+param+"=([^&#]*)";
	    var regex = new RegExp( regexS );
	    result = regex.exec( window.location.href );
	    if(result){
		result=unescape(result[1]);
	    }
	    return result;
    };
    
    Map.getParamFromUrl = getParamFromUrl;
    var goCoords = function(){
            var m = Map.projection;
            var a = arguments;
            var f = Map.factorZoom;
            var p;
	    var zoomLevel = false;
            var bandera =false;
            var geographic=false;
            var geojson=false;
            var origin = false;
            for(var x in arguments){
                if(arguments[x]=='geographic'){
                    geographic=!geographic;
                }
                if (arguments[x]=='origin') {
                    origin=true;
                }
		if(typeof(arguments[x])=='object'){
		    if(arguments[x].zoomLevel){
			zoomLevel=parseInt(arguments[x].zoomLevel);
		    }
		}
            }
            if(typeof(a[0]) == 'object'){
                var t=a[0];
            }else{
                if(typeof(a[0]) == 'string'){
                    var geojson=false;
                    try {
                        geojson = Features.isGeoJson(a[0]);
                    } catch(e) {
                         
                    }
                    if (geojson) {
                        var wkt = Features.getFeatureFromGeojson(a[0]);
                        var response = Features.getFeatureFromWKT(wkt);
                    }else{
                        var response = Features.getFeatureFromWKT(a[0]);
                    }
		    
		    
		    if(geographic){
			var t = response.bounds.transform(m.used,m.base);
		    }else{
			var t = response.bounds;
		    }
                    Map.map.zoomToExtent(t);
                    if (Mapc.map!=null) {
                        Mapc.map.zoomToExtent(t);
                        //var zoom = Map.map.getZoom();
                        //Mapc.map.zoomTo(zoom);
                    }
                    bandera=true;
                }else{
                    if((typeof(a[2])!='number')&&(typeof(a[3])!='number')){
		    //if((!a[2])&&(!a[3])){
                        bandera=!bandera;
                        if(geographic){
                            var punto = transformToMercator(a[0],a[1]);
                        }else{
                            var punto = {lon:a[0],lat:a[1]};
                        }
                        var lonlat = new OL.LonLat(parseFloat(punto.lon),parseFloat(punto.lat));
                        Map.map.setCenter(lonlat,12);
                        if (Mapc.map!=null) {
                            Mapc.map.setCenter(lonlat,12);
                        }
                    }else{
                        bandera=!bandera;
                        if(geographic){
                           var min = transformToMercator(a[0],a[1]);
                           var max = transformToMercator(a[2],a[3]);
                           var t=new OL.Bounds(min.lon,min.lat,max.lon,max.lat);
                        }else{
                            var t=new OL.Bounds(a[0],a[1],a[2],a[3]);
                        }
                        Map.map.zoomToExtent(t);
                        if (Mapc.map!=null) {
                            Mapc.map.zoomToExtent(t);
                            //var zoom = Map.map.getZoom();
                            //Mapc.map.zoomTo(zoom);
                        }
			if((typeof(a[4])=='number')){
			    var centroid = Map.map.getCenter();
			    Map.map.setCenter(centroid,(a[4])-1);
                if (Mapc.map!=null) {
                            Mapc.map.setCenter(centroid,(a[4])-1);
                }
			}
                    }
                }
            }
            if(!bandera){
                p=t.clone();
                //Map.map.zoomToExtent(p);
                Map.map.zoomToExtent(p.transform(m.used,m.base));
                if (Mapc.map!=null) {
                            var newExtent = Map.map.getExtent();
                            Mapc.map.zoomToExtent(newExtent);
                            //var zoom = Map.map.getZoom();
                            //Mapc.map.zoomTo(zoom);
                }
                if (origin) {
                    var reference = isOsm(Map);
                    if (reference) {
                         Map.map.zoomIn();
                    }
                   
                }
            }
	    if(zoomLevel){
		    var centroid = Map.map.getCenter();
		    Map.map.setCenter(centroid,zoomLevel-1);
            if (Mapc.map!=null) {
                            Mapc.map.setCenter(centroid,zoomLevel-1);
            }
	    }
    };
    Map.goCoords = goCoords;
    var resetTree = function(){
        var V='Vectorial';
        var T='Text';
        Tree.reset();
        var i = '';
        setParamsToLayer({
                layer:V,
                params:{layers: i}
            });
        setParamsToLayer({
                layer:T,
                params:{layers: i}
            });
        if (Mapc.map!=null) {
            setParamsToLayer({
                layer:V,
                params:{layers: i}
            },Mapc);
            setParamsToLayer({
                layer:T,
                params:{layers: i}
            },Mapc);
        }
    };
    var addNewWms = function(layer,source){
        var pos = source.item[layer];
        var ref = source.position[pos];
        var item = tree.layers.groups[ref.group].layers[ref.id];
        var params = {
            format:item.image,
            type: "Wms",
             label: ref.id,
             url: item.url, 
            tiled: (item.tiled)?item.tiled:false,
            layer: ref.id
        }
        var template = Layer.buildLayer(ref.id,params);
        template.isBase=false;
        template.position=1;
        addLayer(template,'wms');
    };
    var hideNewWms = function(layers){
        if (Map.thirdsFormat.wms) {
            for(var x in Map.thirdsFormat.wms){
                var id = x;
                var exist = false;
                for(var y in layers){
                    if (layers[y]==id) {
                        exist = true;
                        break
                    }
                }
                if (exist==false) {
                    var layer = getLayer(id);
                    layer.setVisibility(false);
                }
            }
        }
        
    };
    var activateAdditionalWms = function(layers,source){
        if (layers[0]!='') {
            for(var x in layers){
                var i = layers[x];
                var layer = getLayer(i);
                if (layer) {
                    setParamsToLayer({
                        layer:i,
                        params:{layers: i}
                    });
                }else{
                    addNewWms(i,source);
                }
            }
        }
        hideNewWms(layers);
    };
    var reloadLayer=function(){
        //console.log(tree);
        var a = arguments;
        var source = a[2]
        var l =(a[1][a[0]])?Tree.get(a[0]):null;
        if(l){
            var i = Tree.serialize(l);
            //i = LineTime.spetialModule(i);
            //console.log(i);
            switch (a[0]) {
                case 'Wms':
                    var layers = i.split(',');
                    activateAdditionalWms(layers,l);
                    break;
                case 'Windy':
                        /*
                        var params = null;
                        var status = false;
                        if (i!=='') {
                            status = true;
                            var data = l.position[l.item[i]];
                            params = tree.layers.groups[data.group].layers[data.id].windy;
                        }
                        enableWindy(status,params);
                        */
                        
                        var status = (i!=='')?true:false;
                        try {
                            $('body').windy({enable:status});
                        } catch(e) {
                            
                        }
                        
                    break;
            }
            setParamsToLayer({
                layer:a[0],
                params:{layers: i}
            },source);
        }
    };
    function setLayerIndex(source,name,index) {
        var map = (source)?Mapc:Map;
        var Layer = getLayer(name);
        if(Layer){
            map.map.setLayerIndex(Layer,index);
        }
    }
    function setIndex(name,pos){
	var source = [];
	for(var x in Map.map.layers){
	    var i = Map.map.layers[x];
	    if((!i.isBaseLayer)&&(i.name.indexOf('Select')==-1)){
		source.push({name:i.name,index:x});
	    }
	}
	var Layer = getLayer(name);
	if(Layer){
	    var index = source[pos-1].index;
	    Map.map.setLayerIndex(Layer,index);
	}
	
	
	
    }
    Map.setIndex = setIndex;
    
    var enableClusters = function(){
	var source = DataSource.cluster.enableOn;
	var moreLevels = DataSource.cluster.moreLevels;
	var status=false;
	var onlyRecorcard=true;
	var data = Tree.getActiveLayers();
	var resolution = getResolution();
	var showGeometry = (resolution>2)?true:false;
	var showDetailCluster = false;
	/*
	for(var x in moreLevels){
	    if(moreLevels[x]==resolution){
		showDetailCluster=true;
		break;
	    }
	}
	*/
	for(var x in moreLevels){
	    var level = moreLevels[x]+'';
	    var res = resolution+'';
	    if(level.indexOf(res)!=-1){
		showDetailCluster=true;
		break;
	    }
	}
	for(x in data){
	    if(data[x].id==source.layer){
		status=true;
		Map.cluster.onlyDisplayRecordCard=false;
		break;
	    }
	}
	if(!status){
	    Cluster.clear();
	}
	Map.cluster.active=status;
	Map.cluster.moreLevels=showDetailCluster;
	Map.cluster.recordCardOnCluster=showDetailCluster;
	Map.cluster.geometry = showGeometry;
	Map.cluster.whatshere=false;
	
    };
    var getLayersActive = function(Layer){
        var layer = Map.getLayer(Layer);
        var response =(layer)?layer.params.LAYERS:'';
        return response;
    }
    var enableAditionalDenue = function(){
        var resolution = getResolution();
        var moreLevels = DataSource.cluster.moreLevels;
        var layer = Map.getLayer('Denue');
        var totalItems =(layer)?layer.params.LAYERS:'';
        totalItems = totalItems.split(',');
        /*
        if((layer.params.SCIAN)||(totalItems.length>1)){
            if((layer.params.SCIAN!='0')||(totalItems.length>1)){
            Map.cluster.active=true;
            }
        }
        */
        
        var showDetailCluster = false;
        for(var x in moreLevels){
            var level = moreLevels[x]+'';
            var res = resolution+'';
            if(level.indexOf(res)!=-1){
            showDetailCluster=true;
            break;
            }
        }
        Map.cluster.whatshere=false;
        if((layer)&&(totalItems.length>=1)&&(resolution<=toolsConfig.denue.visibleScale)){
            if(layer.params['TIPOTURISTA']){
            if((layer.params['TIPOTURISTA'].length>0)&&(layer.params['TIPOTURISTA']!='0')){ 
                if(!Map.cluster.active){
                Map.cluster.active=true;
                }
                //Map.cluster.onlyDisplayRecordCard=true;
                Map.cluster.onlyDisplayRecordCard=false;
                Map.cluster.whatshere=layer.params['TIPOTURISTA'];
            }
            }
        }
        Map.cluster.moreLevels=showDetailCluster;
        Map.cluster.recordCardOnCluster=showDetailCluster;
        Map.cluster.geometry = false;
        
        var vectorialLayer = Map.getLayer('Vectorial');
        var vectorialLayers= (vectorialLayer.visibility)?vectorialLayer.params.LAYERS:'';
        Map.economic = (vectorialLayers.indexOf('ceco2014')!=-1)?true:false;
        Map.cenago = (vectorialLayers.indexOf('cenago')!=-1)?true:false;
    }
    Map.enableAditionalDenue = enableAditionalDenue;
    var displayLayersFromOrigin=function(){
        var l = ['Vectorial','Text'];
        for(var x in l){
                var i = l[x];
                var layer = getLayer(i);
                if ((layer)&&(layer.visibility)) {
                    layers = layer.params.LAYERS;
                    setParamsToLayer({
                            layer:i,
                            params:{layers:layers},
                    forceRefresh:true
                    },Mapc);
                }
        }
        
    }
    var reloadTree=function(source){
        var V='Vectorial';
        var T='Text';
        Tree.registerChanges();
        var a = Tree.layersAlterated();
        //console.log(a);
        for(var x in a) {
            reloadLayer(x,a,source);
            if ((Mapc.map!=null)&&(!source)) {
                reloadLayer(x,a,Mapc);
            }
        }
        //reloadLayer(V,a);
        //reloadLayer(T,a);
        
        Tree.cleanRepository();
        if (!source) {
            enableClusters();
        }
        
    };
    /////////////////////////////////// old
    /*
    var loadTree = function(){
        var c = config.mapConfig;
        Tree.load();
        Tree.defineTimer(reloadTree);
        var v = Tree.get('Vectorial');
        var t = Tree.get('Text');
        //var l = LineTime.getLayers();
        if(v){
            v= Tree.serialize(v);
            var templae = c.layers
            addLayer({
                type:'WMS',
                name:'Vectorial',
                url:c.layers.vectorial,
                isBase:false,
                position:1,
                info:{
                    layers:v,
                    format:'png'
                },
                params:{
                    tiled:false,
                    effect:false,
                    buffer:0,
                    ratio:1
                }
        });
        }
        if(t){
            t = Tree.serialize(t);
            addLayer({
                type:'WMS',
                name:'Text',
                url:c.layers.text,
                isBase:false,
                position:2,
                info:{
                    layers:t,
                    format:'png'
                },
                params:{
                    tiled:false,
                    effect:false,
                    buffer:0,
                    ratio:1
                }
        });
        }
        if(l){
            l=l.toString();
            addLayer({
                type:'WMS',
                name:'lineTime',
                url:c.layers.time,
                isBase:false,
                position:3,
                info:{
                    layers:v,
                    format:'png'
                },
                params:{
                    tiled:false,
                    effect:false,
                    buffer:0,
                    ratio:1
                }
        });
        }
    };
    */
    /////////////////////////// old
    ////////////////////////////// new
    var buildExtentByPoint = function(x,y,incrementPixel){
	
    }
    var loadTree = function(source){
        var layers = config.mapConfig.layers;
        layers = MDM6('getAditionalLayers',layers);
        if (!source) {
             Tree.load();
             Tree.defineTimer(reloadTree);
        }
        
        for(var x in layers){
            var id = layers[x].label;
            var layer = Tree.get(id);
            //if(layer){
                var template = Layer.buildLayer(id,layers[x]);
                template.isBase=false;
                template.position=x+1;
                //console.log(template);
                addLayer(template,null,source);
            //}
        }
    };
    
    /////////////////////////////////////new
    var insertCtl = function(){
        var cadena = '<button id="ctlPol" style="position:absolute;top:0px;left:0px;z-index:50000">activa polygon</button>';
        //$("#map").append(cadena);
        $("#ctlPol").click(function(){
            activeControl({control:'polygonH',active:true});
        });
        
        var cadena = '<button id="ctlstopprog" style="position:absolute;top:-50px;left:0px;z-index:50000">activa stoppropag</button>';
        //$("#map").append(cadena);
        $("#ctlstopprog").click(function(){
            activeControl({control:'stopPropag',active:true});
        });
        
        
        var cadena = '<button id="ctlPol2" style="position:absolute;top:50px;left:0px;z-index:50000">desactiva polygon</button>';
        //$("#map").append(cadena);
        $("#ctlPol2").click(function(){
            activeControl({control:'pan',active:true});
        });
        
        var cadena = '<div style="position:absolute;top:100px;left:0px;z-index:50000"><input id="scaleG" value=""><button id="getScaleG">get Scale</button></div>';
        //$("#map").append(cadena);
        $("#getScaleG").click(function(){
            var P = getLayer('Poligonos');
            var idF = P.features[0].id;
            //var params = {edition:true,action:'rotate',/*scale:$("#scaleG").val(),*/id:idF};
            var params = {edition:true,action:'rotate',angle:$("#scaleG").val(),id:idF};
            Features.event(params);
        });
        
        var cadena = '<div style="position:absolute;top:130px;left:0px;z-index:50000"><input id="scaleResize" value=""><button id="getScaleResize">set resize</button></div>';
        //$("#map").append(cadena);
        $("#getScaleResize").click(function(){
            var P = getLayer('Poligonos');
            var idF = P.features[0].id;
            var params = {edition:true,action:'resize',scale:$("#scaleResize").val(),id:idF};
            Features.event(params);
        });
        
        var cadena = '<div style="position:absolute;top:200px;left:0px;z-index:50000"><input id="lonR" value=""><input id="latR" value=""><button id="moveF">move</button></div>';
        //$("#map").append(cadena);
        $("#moveF").click(function(){
            var P = getLayer('Poligonos');
            var idF = P.features[0].id;
            var params = {edition:true,action:'drag',lon:$("#lonR").val(),lat:$("#latR").val(),id:idF};
            Features.event(params);
        });
    
        
        var cadena = '<div style="position:absolute;top:150px;left:0px;z-index:50000"><button id="getScaleG2">hacer</button><button id="getScaleG3">deshacer</button></div>';
        //$("#map").append(cadena);
        $("#getScaleG2").click(function(){
            var P = getLayer('Poligonos');
            var f = P.features[0];
            f.Events.execute({action:'redo'});
            
        });
        $("#getScaleG3").click(function(){
            var P = getLayer('Poligonos');
            var f = P.features[0];
            f.Events.execute({action:'undo'});
        });
        
        
        var cadena = '<div style="position:absolute;top:400px;left:0px;z-index:50000"><button id="delAll">eliminar todas</button><button id="delLast">burrar ultima</button></div>';
        //$("#map").append(cadena);
        $("#delAll").click(function(){
           var params = {action:'hide',items:'all',type:'poi'};
           Marker.event(params);
            
        });
        $("#delLast").click(function(){
            var Layer = getLayer('Markers');
           var lastMarker = Layer.features[Layer.features.length-1];
           var params = {action:'hide',items:[{id:lastMarker.id}],type:'poi'};
           Marker.event(params);
        });
        
        var cadena = '<div style="position:absolute;top:450px;left:0px;z-index:50000"><button id="showAll">mostrar todas</button><button id="showLast">mostrar ultima</button></div>';
        //$("#map").append(cadena);
        $("#showAll").click(function(){
           var params = {action:'show',items:'all',type:'poi'};
           Marker.event(params);
            
        });
        $("#showLast").click(function(){
            var Layer = getLayer('Markers');
           var lastMarker = Layer.features[Layer.features.length-1];
           var params = {action:'show',items:[{id:lastMarker.id}],type:'poi'};
           Marker.event(params);
        });
        
        var cadena = '<div style="position:absolute;top:450px;left:400px;z-index:50000"><button id="geopoint">geo puntos</button><button id="geoline">geo line</button><button id="geopolygon">geo polygon</button><button id="geoexport">geo polygon</button></div>';
        //$("#map").append(cadena);
        $("#geopoint").click(function(){
           activeControl({control:'georeferencePoint',active:true});
            
        });
        $("#geoline").click(function(){
           activeControl({control:'georeferenceLine',active:true});
            
        });
        $("#geopolygon").click(function(){
           activeControl({control:'georeferencePolygon',active:true});
            
        });
        
        $("#geoexport").click(function(){
            Georeference.Export();
        });
        
        var cadena = '<div style="position:absolute;top:350px;left:500px;z-index:50000"><button id="convert">conver to buff</button></div>';
        //$("#map").append(cadena);
        $("#convert").click(function(){
            var P = getLayer('Poligonos');
            var f = P.features[0];
            Features.convertToBuffer(f.id); 
        });
        
        var cadena = '<div style="position:absolute;top:350px;left:800px;z-index:50000"><input id="valorbuffer" type="text"><button id="reset">addbuffertobuffer</button></div>';
        //$("#map").append(cadena);
        $("#reset").click(function(){
            var P = getLayer('Poligonos');
            var f = P.features[0];
            Features.convertToBuffer(f.id);
            //Features.addBufferToBuffer(f.id,$("#valorbuffer").val());
            /*
            var P = getLayer('Poligonos');
            var f = P.features[0];
            //Features.addBufferToBuffer(f.id,10);
            var params = {select:true,id:f.id};
            //Features.event({id:f.id,action:'set',params:{data:{name:'prueba',unit:'british'}}});
            Features.event(params);
            
            Features.event({action:'hide',items:'all'});
            */
        });
        
        var cadena = '<div style="position:absolute;top:250px;left:800px;z-index:50000"><button id="reset2">pois</button></div>';
       // $("#map").append(cadena);
       /*
        $("#reset2").click(function(){
            //Features.event({action:'show',items:'all'});
            activeControl({control:'poi',active:true});
        });
        */
        var cadena = '<div id="files" style="position:absolute;top:250px;left:20px;z-index:50000;height:200px;background:red;"><button id="reset2">kml</button><button id="reset3">kml</button></div>';
        //$("#map").append(cadena);
        $("#reset2").click(function(){
           /*
           var notification = Notification.show({message:'Generando &Aacute;rea'});
           
           setTimeout(function(){
                notification.error();
            },40000);
            */
            //var wkt = $("#wktn").val();
            //Features.add({wkt:wkt,store:false,zoom:true,params:Features.getFormat('buffer','polygon')});
            //var lon=-11735253.667984;
            //var lat=2954947.0024818;
            //var lonlat = transformToDegrees(lon,lat);
            //console.log(lonlat);
            //finishMeasure();
            //Popup.add('reset2','hola','nada malo');
            $("#files").popup({text:'dfsdfsdfsdfsf szb </br> ffsafsdafdsfdasfs </br> fdsfsfsdfdsafsa </br> fsdfsdafsdafsafsa<br>fdsfasfasfadfasfsfas'});
            $("#mdm6DinamicPanel_geoPanel_tab").popup({title:'Crear georeferencias'});
            $("#mdm6Layers_layerManager_baseMapBox").popup({title:'georeferenciacion',text:''});
            $("#mdm6DinamicPanel_btnSearch").popup({title:'georeferenciacion',text:''});
            $("#mdm6Layers_layerManager_btnLayers2").popup({title:'georeferenciacion',text:''});
            $("#scaleControl").popup({text:'dfsdfsdfsdfsf szb </br> ffsafsdafdsfdasfs </br> fdsfsfsdfdsafsa </br> fsdfsdafsdafsafsa<br>fdsfasfasfadfasfsfas'});
            
        });
        var cadena = '<div id="files" style="position:absolute;top:250px;left:20px;z-index:50000;height:10px;background:red;"><input id="grados" value=""><button id="reset3">kml</button><button id="reset4">kml2</button><button id="reset5">Procesa</button></div>';
        $("#map").append(cadena);
        $("#reset3").click(function(){
            //$("#panel-left").panel({width:'300px',position:'left',type:'static',title:'panel izquierdo',load:function(event,ui){console.log("cargado");console.log(event);console.log(ui)}});
            $("#panel-right").panel({width:'300px',position:'right',type:'static',title:'panel izquierdo',load:function(event,ui){console.log("cargado");console.log(event);console.log(ui)}});
	    $("#panel-bottom").panel({height:'300px',position:'bottom',type:'static',title:'panel inferior',load:function(event,ui){console.log("cargado");console.log(event);console.log(ui)}});
           
        });
        $("#reset4").click(function(){
            //Notification.show({message:'El servicio de Google no esta disponible',time:5000});
            calculate([{id:'a1'},{id:'a2'},{id:'a3'},{id:'a4'},{id:'a5'},{id:'a6'},{id:'a7'},{id:'a8'},{id:'a9'},{id:'a10'},{id:'a11'}],'treecomp');
        });
	
	$("#reset5").click(function(){
	    var result = moca2($("#grados").val());
	    //console.log(result);
	});
       
        var cadena ='<div id="treecomp" style="background:transparent;position:absoltue;top:300px;left:400px;width:150px;height:150px;position:absolute;z-index:50000">'+
                            '<div id="a1" style="position:absolute;" class="dinamicPanel-sprite dinamicPanel-geo-big"></div>'+
                            '<div id="a2" style="position:absolute;" class="dinamicPanel-sprite dinamicPanel-geo-big"></div>'+
                            '<div id="a3" style="position:absolute;" class="dinamicPanel-sprite dinamicPanel-geo-big"></div>'+
                            '<div id="a4" style="position:absolute;" class="dinamicPanel-sprite dinamicPanel-geo-big"></div>'+
                            '<div id="a5" style="position:absolute;" class="dinamicPanel-sprite dinamicPanel-geo-big"></div>'+
                            '<div id="a6" style="position:absolute;" class="dinamicPanel-sprite dinamicPanel-geo-big"></div>'+
                            '<div id="a7" style="position:absolute;" class="dinamicPanel-sprite dinamicPanel-geo-big"></div>'+
                            '<div id="a8" style="position:absolute;" class="dinamicPanel-sprite dinamicPanel-geo-big"></div>'+
			    '<div id="a9" style="position:absolute;" class="dinamicPanel-sprite dinamicPanel-geo-big"></div>'+
			    '<div id="a10" style="position:absolute;" class="dinamicPanel-sprite dinamicPanel-geo-big"></div>'+
			    '<div id="a11" style="position:absolute;" class="dinamicPanel-sprite dinamicPanel-geo-big"></div>'+
                    '</div>';
        $("#map").append(cadena);
         $("#treecomp").mouseenter(function(){
            $("#a1" ).animate({ "left": "+=50px" }, "medium" );
            $("#a2" ).animate({ "left": "+=50px","top": "-=50px" }, "medium" );
            $("#a3" ).animate({ "top": "-=50px" }, "medium" );
            $("#a4" ).animate({ "left": "-=50px","top": "-=50px" }, "medium" );
            $("#a5" ).animate({ "left": "-=50px"}, "medium" );
            $("#a6" ).animate({ "left": "-=50px","top": "+=50px" }, "medium" );
            $("#a7" ).animate({ "top": "+=50px" }, "medium" );
            $("#a8" ).animate({ "left": "+=50px","top": "+=50px" }, "medium" );
        });
        $("#treecomp").mouseleave(function(){
            $("#a1" ).animate({ "left": "-=50px" }, "medium" );
            $("#a2" ).animate({ "left": "-=50px","top": "+=50px" }, "medium" );
            $("#a3" ).animate({ "top": "+=50px" }, "medium" );
            $("#a4" ).animate({ "left": "+=50px","top": "+=50px" }, "medium" );
            $("#a5" ).animate({ "left": "+=50px"}, "medium" );
            $("#a6" ).animate({ "left": "+=50px","top": "-=50px" }, "medium" );
            $("#a7" ).animate({ "top": "-=50px" }, "medium" );
            $("#a8" ).animate({ "left": "-=50px","top": "-=50px" }, "medium" );
        });
        
        setTimeout(function(){
            $("#treecomp").children('div').each(function(){
                $(this).position({
                    of:$("#treecomp"),
                    at:"center"+ " " +"center"
                });
            });
        },500);
        
        ///////////////////////////////////
        
        ///////////////////////////////////
    };
    
        var radians, maxRadians, target, radius, originX, originY, inc, timer;
      
        var radius = 50;
        var radians = 0;
        var maxRadians = 2 * Math.PI;
        var inc = 280 / 360;
    var calculate = function(total,root){
	var item = {
	    width: $("#a1").width(),
	    heigth:$("#a1").heigth()
	};
	var totalItems = 8;
	var position = $("#"+root).offset();
	var originX = 60;
        var originY = 60;
        for(i=0;i<total.length;i++){
          var x, y;
          x = originX + (Math.cos(radians) * radius);
          y = originY + (Math.sin(radians) * radius);
          $("#"+total[i].id).css('left',x+"px");
          $("#"+total[i].id).css('top',y+"px");
          radians += inc;
          if (radians > maxRadians) {
            //radians -= maxRadians;
          }
        }
    };

    window.onbeforeunload = function() {
       Tree.store();
       //Poi.store();
    };
    var clockComparation = null;
    var enableCompare = true;
    var clearClockComparation = function(){
        if (clockComparation) {
            clearTimeout(clockComparation);            
        }
        
    }
    var statusComparation = false;
    var defineClockComparation = function(status){
        if (enableCompare) {
            statusComparation=!statusComparation;
            enableCompare = false;
            clearClockComparation();
            clockComparation = setTimeout(function(){
                displayComparation(statusComparation);
                enableCompare=true;
            },300);
           
        }
    }
    var displayComparation = function(status){
        var clase = 'compare';
        var item = $("#main");
        item.removeClass(clase);
        if (status) {
            item.addClass(clase);
            $("#contentCompare").show();
            if (Mapc.map==null) {
                initCompare();
            }else{
                
                var extent = Map.map.getExtent();
                Mapc.map.zoomToExtent(extent);
                var zoom = Map.map.getZoom();
                Mapc.map.zoomTo(zoom);
                updateSize(Mapc);
                for(var x in Map.Layers){
                    var l = Map.Layers[x];
                        if ((l.visibility)&&(!l.isBaseLayer)) {
                            if (Mapc.Layers[x]) {
                                Mapc.Layers[x].setVisibility(true);
                            }
                        }
                }
            }
        }else{
            $("#contentCompare").hide();
            for(var x in Map.Layers){
                var l = Map.Layers[x];
                    if ((l.visibility)&&(!l.isBaseLayer)) {
                        if (Mapc.Layers[x]) {
                            Mapc.Layers[x].setVisibility(false);
                        }
                        
                    }
            }
        }
        updateSize();
        
    };
    var ApiEvents = function(){
        var evento = function(params){
            setParamsToLayer({
                    layer:params.layer,
                    params:params.params,
                    forceRefresh:params.forceRefresh
            });
        }
        MDM6('define','setParams',evento);
        
        var eventoCoordenadas =function(){
            goCoords.apply(this,arguments);
        }
     amplify.subscribe( 'clearRegSelected', function(){
            Features.clearRegSelected();
    });
    Map.getRegSelected = function(){
        return Features.reg.selected;    
    }
    Map.clearPopup = function(){
        Popup.clear();
    }
    MDM6('define','setDataWindy',function(params){
        
        var item = $("#pelicula");
        if (params.color) {
            item.css('background',params.color);
        }
        if (params.opacity) {
           var opacity = params.opacity/100;
           item.css('opacity',opacity).css('filter','alpha(opacity='+params.opacity+')');
        }
        
    });
    MDM6('define','getLonLatFromPixel',function(x,y){
        var coords = null;
        coords = Map.map.getLonLatFromPixel(new OL.Pixel(x, y));
        return coords;
    });
    MDM6('define','zoomToExtent',function(param,newExtent){
        
        var map = (param=='Mapc')?Mapc.map:Map.map;
        if (map) {
             map.zoomToExtent(newExtent);
        }
       
    });
    MDM6('define','setCenterTo',function(param,lon,lat,zoom){
        var map = (param=='Mapc')?Mapc:Map;
        if (map.map) {
            var actual = isOsm(map);
            var newZoom = (actual)?zoom+4:zoom;
             map.map.setCenter(new OL.LonLat(lon,lat),newZoom);
        }
    });
    MDM6('define','getMyLocation',function(){
        return Geolocation.getCurrent();
    });
    var clockEOD = null;
    MDM6('define','eod',function(status){
       if (clockEOD) {
            clearTimeout(clockEOD);
       }
       clockEOD = setTimeout(function(){
            //console.log("ejecutando..")
            if (status) {
                generateCircles(status);
            }else{
                removeArcSegments();
            }
       },800);
        
    })
    MDM6('define','initialExtent',extentMap);
    MDM6('define','enableWindy',enableWindy);
    MDM6('define','getCenter',function(){return Map.map.getCenter()});
    MDM6('define','panTo',function(params){Map.map.panTo(params)});
    MDM6('define','calculateBounds',function(centroid){return Map.map.calculateBounds(centroid)});
    MDM6('define','getPixelFromLonLat',function(lonlat){return Map.map.getPixelFromLonLat(lonlat)});
    MDM6('define','goCoords',eventoCoordenadas);
	MDM6('define','getResolution',getResolution);
	MDM6('define','setRestrictedExtent',redefineExtent);
	MDM6('define','getZoomLevel',getZoomLevel);//pat
	MDM6('define','getExtent',getExtent);
	MDM6('define','updateSize',updateSize);
    MDM6('define','addMarker',Marker.add);
    MDM6('define','removeMarker',function(tipo,id){
	    Marker.event({action:'delete',items:id,type:tipo});
	});
	MDM6('define','hideMarkers',function(tipo){
	    Marker.event({action:'delete',items:'all',type:tipo});
	});
    MDM6('define','getDistanceFromCentroid',getDistanceFromCentroid);
    MDM6('define','setStatusLayer',Tree.addToRepository);
	MDM6('define','customPolygon',function(){
	    var a = arguments[0];
	    var defaultParams = {fColor:"none",lSize:2,lColor:"blue",lType:"line",type:'buffer'};
	    var params = $.extend(defaultParams, a.params);
        params.clearFeatures=true;
	    if(a.action){
		if(a.action=='add'){
		    MDM6('addPolygon',a.wkt,params);
		}else{
		    MDM6('deletePolygons');
		}
	    }
	});
	MDM6('define','addPolygon',function(wkt,params){
	    Features.addSpetialFeature(wkt,params);
	});
	MDM6('define','deletePolygons',Features.deleteSpetialFeature);
	MDM6('define','getSizeMap',function(){
	    return {width:$("#map").width(),height:$("#map").height()};
	})
	MDM6('define','iplanayTematico',function(geojson){
	    if (Map._tematico && Map.map) {
		try { Map.map.removeLayer(Map._tematico); } catch (e) {}
		Map._tematico = null;
	    }
	    if (!geojson || !Map.map) return;
	    var proyeccion = Map.map.getProjectionObject();
	    var formato = new OL.Format.GeoJSON({
		externalProjection: proyeccion,
		internalProjection: proyeccion
	    });
	    var features = formato.read(geojson);
	    if (!features || !features.length) return;
	    for (var i = 0; i < features.length; i++) {
		var a = features[i].attributes || {};
		features[i].style = {
		    fillColor: a.color || "#f4f7fa",
		    fillOpacity: a.opacidad == null ? 0.72 : Number(a.opacidad),
		    strokeColor: a.borde || "#ffffff",
		    strokeWidth: a.grosor == null ? 1 : Number(a.grosor),
		    strokeOpacity: 1
		};
	    }
	    var capa = new OL.Layer.Vector("Temático IPLANAY", {displayInLayerSwitcher: false});
	    capa.addFeatures(features);
	    Map.map.addLayer(capa);
	    Map._tematico = capa;
	});
	MDM6('define','iplanayPanLibre',function(activo){
	    if (!Map.map) return;
	    if (activo) {
		if (!Map._restriccionPrevia && Map.map.restrictedExtent) {
		    Map._restriccionPrevia = Map.map.restrictedExtent.clone();
		}
		Map._sinEncuadre = true;
		Map.map.setOptions({restrictedExtent: null});
	    } else {
		Map._sinEncuadre = false;
		if (Map._restriccionPrevia) {
		    Map.map.setOptions({restrictedExtent: Map._restriccionPrevia});
		    Map._restriccionPrevia = null;
		}
	    }
	});
	MDM6('define','enableCustomTool',function(){
	    var a = arguments[0];
	    //a={control:'customPolygon',active:true,event:function()}
	    if(a.control){
		var ctl = a.control;
		a.control='custom'+ctl.charAt(0).toUpperCase() + ctl.slice(1);
	    }
	    activeControl(a);
	});
	
    MDM6('define','setOpacity',function(layer,opacity){
	    setOpacity(getLayer(layer),opacity);
	});
	MDM6('define','getModal',function(){
	    return Modal.create(arguments[0]);
	});
	MDM6('define','newRequest',function(){
	    return Request.New(arguments[0]);
	});
	MDM6('define','newNotification',function(){
	    return Notification.show(arguments[0]);
	});
	MDM6('define','getUrlParam',function(){
	    return getParamFromUrl(arguments[0]);
	});
	MDM6('define','addGeorss',addGeorss);
	MDM6('define','getLayer',getLayer);
	//MDM6('define','getExtent',function(){
	//    return config.mapConfig.initialExtent;
	//});
	MDM6('define','toMercator',transformToMercator);
	MDM6('define','toGeographic',transformToGeographic);
	MDM6('define','createGeorreference',function(a){
	$("#mdm6DinamicPanel").dinamicPanel('showPanel','geoPanel');
	Georeference.showModalBuffer(a);
	});
	MDM6('define','markerEvent',Marker.event);
	MDM6('define','setZoomLevel',function(a){
	    var lonlat = new OL.LonLat(a.lon,a.lat);
	   Map.map.setCenter(lonlat,a.zoomLevel);
	});
	MDM6('define','addLayer',function(a){
	    Map.map.addLayer(a);
	});
	MDM6('define','updateCluster',function(a){
	    a.whatshere=Map.cluster.whatshere;
	    Cluster.update(a);
	});
	MDM6('define','showRecordCard',function(a){
	    //if(Map.cluster.recordCardOnCluster){
		Cluster.showRecordCard(a);
	    //}
	});
	MDM6('define','showRecordCardMarker',function(a){
		Cluster.showRecordCard(a);
	});
	MDM6('define','showLabelCluster',Cluster.showLabel);
	MDM6('define','hideLabelCluster',Cluster.hideLabel);
	MDM6('define','getMousePosition',Cluster.getMousePosition);
	MDM6('define','compactCluster',Cluster.compact);
	MDM6('define','updateDetailCluster',Cluster.updateDetailCluster);
	MDM6('define','destroyDetailCluster',Cluster.destroyDetailCluster);
	MDM6('define','moreLevesCluster',function(){return Map.cluster.moreLevels});
	MDM6('define','setCenter',function(lon,lat){
	    var lonlat = new OL.LonLat(lon,lat)
	    Map.map.setCenter(lonlat);
	});
	MDM6('define','getLonLatFromPrixel',function(a){
	    return Map.map.getLonLatFromPixel(a);
	});
	MDM6('define','isFirstNodes',function(){return Cluster.isFirstNodes()});
	MDM6('define','clearClusters',function(){Cluster.clear()});
	MDM6('define','setClearItems',function(status){Cluster.setClearItems(status)});
	MDM6('define','printExtent',function(lon,lat,lon2,lat2){
	    var extent = new OL.Bounds(lon,lat,lon2,lat2);
	
	    var siteStyle = {
		// style_definition
	    };
	    var info = extent.toGeometry();
	    var points = info.components[0].components;
	    var linearRing = new OL.Geometry.LinearRing(points);
	    var geometry = new OL.Geometry.Polygon([linearRing]);
	    var feature = new OpenLayers.Feature.Vector(geometry, null, siteStyle);
	    var params = {fColor:"red",lSize:2,lColor:"blue",lType:"line",type:'buffer'};
	    MDM6('addPolygon',feature.geometry+'',params);
	    
	});
	MDM6('define','exportMap',exportMap);
	MDM6('define','getActualBaseLayer',getActualBaseLayer);
	MDM6('define','printMap',function(html){
	    printControl.printHtml(html); 
	});
    }
    var isExplorer=function(){
	    var response = false;
    
	    var ua = window.navigator.userAgent;
	    var msie = ua.indexOf("MSIE ");
    
	    if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)){
		response=true;
	    }
    
	    return response;
    }
    var isIE = function(){
	var ie = (function(){
            var undef,
                v = 3,
                div = document.createElement('div'),
                all = div.getElementsByTagName('i');
        
            while (
                div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
                all[0]
            );
        
            return v > 4 ? v : undef;
        
        }());
	return ie;
    }
    var getIeVersion = function(){
	var version=null;

        var ua = window.navigator.userAgent;
        var msie = ua.indexOf("MSIE ");

        if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./))      // If Internet Explorer, return version number
            version = parseInt(ua.substring(msie + 5, ua.indexOf(".", msie)));

	return version;
    }
    /**/
    /**/
    var getDocumentMode = function(){
	var mode;
	var agentStr = navigator.userAgent;
        if (agentStr.indexOf("Trident/5.0") > -1) {
            if (agentStr.indexOf("MSIE 7.0") > -1)
                mode = "ie9";//vista de compatibilidad
            else
                mode = "ie9";
        }
        else if (agentStr.indexOf("Trident/4.0") > -1) {
            if (agentStr.indexOf("MSIE 7.0") > -1)
                mode = "ie8";//vista de compatibilidad
            else
                mode = "ie8";
        }
        else
            mode = "ie7";

	return mode;
    }
    var testBrowserCompatibility = function(){
	var option = true;
	var ie = isIE();
	var ieVer = getIeVersion();
	var mode = getDocumentMode();
	
	if((ie)&&(mode!=ie)&&(ieVer<9)){
	    option=false;
	}else{
	    
	}
	if(!option){
	    showScreen(option);
	}
	//showScreen();
	/**/
	/*
	var params = {
		url:"http://mapserver.inegi.org.mx/InformaCartPart/informaCartPart.do?",
		params:'',
		type:'get',
		format:'html',
		events:{
		    success:function(data,extraFields){
			console.log(data);
		    },
		    before:function(a,extraFields){
		       
		    },
		    error:function(a,b,extraFields){
			    console.log(a.status)
		    },
		    complete:function(a,b,extraFields){
			
		    }
		}
	}
	var newRequest = Request.New(params);
	
	var parametros = {
	    sistema:'MDM',
	    x:-11974520.215691,
	    y:3489658.6524744,
	    epsg:3857,
	    extent:'-13170606.834131,1410571.483407,-9516305.3863815,4091370.9390516',
	    ux:-11387330.964486,
	    uy:2497849.9920983
	 };
	 
	newRequest.setParams(parametros);
        newRequest.execute();
	*/
	//cartografiaModal.show();
	/**/
	return option;
    };
    
    var showScreen = function(){
	var showStep = function(a){
	    var step = Help.ie.steps[(a-1)];
	    var imagen = 'help/img/ie/'+step.img;
	    var texto = step.text;
	    $('.image').children().attr('src',imagen);
	    $('.text').children().html(texto);
	    $(".selected").removeClass('selected');
	    $("div[step='"+a+"']").addClass('selected');
	    $(".steps").html('Paso '+a);
	    if(a>1){
		$(".rightRow").removeClass('hidden');
		$(".leftRow").removeClass('hidden');
	    }
	    if(a==1){
		$(".leftRow").addClass('hidden');
		$(".rightRow").removeClass('hidden');
	    }
	    if(a==(Help.ie.steps.length)){
		$(".rightRow").addClass('hidden');
	    }
	    $(".rightRow").attr('next',a+1);
	    $(".leftRow").attr('next',a-1);
	    
	}
	var getSteps = function(a){
	    var chain='';
	    for(x in Help.ie.steps){
		chain+='<div><div step="'+(parseInt(x)+1)+'"></div></div>';
	    }
	    return chain;
	}
	var events = function(){
	    $("div[step]").each(function(){
		$(this).click(function(){
		    var step = $(this).attr('step');
		    showStep(parseInt(step));
		});
	    });
	    
	    $(".rightRow,.leftRow").click(function(){
		var step = $(this).attr('next');
		showStep(parseInt(step));
	    });
	    
	   
	}
	var print = function(){
	    var chain = '<div class="helpScreen">'+
			    '<div class="header">'+
				'<label>Mapa Digital de M&eacute;xico en l&iacute;nea</label>'+    
				'<span>'+Help.ie.header+'</span>'+
				'<div class="help_template logo_mdm"></div>'+
				'<div align="center">'+
				    getSteps()+
				'</div>'+
				'<div></div>'+
			    '</div>'+
			    '<div section>'+
				'<div browsers>'+
				    '<div leftRow class="help_template leftRow"></div>'+
				    '<div class="content">'+
					'<div class="image">'+
					    '<image src=""/>'+
					'</div>'+
					'<div class="text">'+
					    '<span></span>'+
					'</div>'+
				    '</div>'+
				    '<div rightRow class="help_template rightRow"></div>'+
				'</div>'+
				'<div class="steps">Paso 1</div>'+
			    '</div>'+
			'</div>';
	    $('body').html(chain);
	    showStep(1);
	}
	$.when(
                $('<link>', {rel: 'stylesheet',type: 'text/css',href: 'css/help.css'}).appendTo('head'),
                $.Deferred(function( deferred ){
                        $( deferred.resolve );
                })
        ).done(function(){
                print();
		events();
        });
    };
    /*
    var initialMessage = function(){
        if(ie){
            if(document.documentMode!=ie){
                //ieModal.show();
            }
        }
    };
    */
    /*
    var getContentIEModal = function(){
        var steps='';
	for(var x in Help.ie.steps){
	    steps +='<div id="step_'+x+'" class="step_option">Paso '+(parseInt(x)+1)+'</div>';
	}
	
	var cadena ='<div style="width:700px;">'+
			'<div style="background:#DBDBDB;padding-top:10px;padding-bottom:10px;font-size:110%;">'+Help.ie.header+'</div>'+
			'<div style="width:700px;height:340px;border-bottom: 2px solid #DDDDDD;">'+
			    '<div style="position:relative;float:left;height:100%;width:232px;background:#F8F8F8">'+
				'<p id="step_text" align="justify" style="position:absolute;left:10px;right:10px;font-size:110%;">'+Help.ie.steps[0].text+'</p>'+
			    '</div>'+
			    '<div style="position:relative;float:left;height:100%;width:468px;">'+
				'<img id="step_image" style="width:468px;height:340px" src="help/img/ie/'+Help.ie.steps[0].img+'">'+
			    '</div>'+
			'</div>'+
			'<div style="width:700px;background:#DBDBDB">'+
			    steps+
			'</div>'+
		    '</div>';        
        return cadena;
    };
    
    var ieModal = Modal.create({
                    title:Help.ie.titleWindow,
                    content:getContentIEModal(),
                    events:{
                        onCancel:function(){
                            
                        },
                        onCreate:function(){
			    for(var x in Help.ie.steps){
				$("#step_"+x).click(function(){
				    var pos = parseInt($(this).attr('id').replace('step_',''));
				    $("#step_text").html(Help.ie.steps[pos].text);
				    $("#step_image").attr("src",'help/img/ie/'+Help.ie.steps[pos].img);
				    $("._active").removeClass('_active');
				    $(this).addClass('_active');
				});
			    }
			    $("#step_0").addClass('_active');
			    
                        },
                        onShow:function(){
                            
                        }
                    }
        });
    */
    var clockAltitude = null;
    var requestAltitude = Request.New({
            url:DataSource.mousePosition.elevation.url,
            contentType:"application/json; charset=utf-8",
            params:'',
            events:{
                success:function(data,extraFields){
                    var msg=null;
                    if(data){
                        if(data.response.success){
			    var altitude = getformatNumber(data.data.elevation);
			    $("#coordinates_map .altitude").html('Altitud: '+altitude+'msnm');
                        }else{
                             msg='Altitud no disponible';
                        }
                    }else{
                        msg='Servicio de altitud no disponible';
                    }
                    if(msg!=null){
                        //var notification = Notification.show({message:msg});
                        //notification.show();
			$("#coordinates_map .altitude").html('');
                    }
                },
                before:function(a,extraFields){
                   
                },
                error:function(a,b,extraFields){
                    
                    //var notification = Notification.show({message:'Serviciode altitud no disponible'});
                    //notification.show();
		    $("#coordinates_map .altitude").html('');
                        
                },
                complete:function(a,b,extraFields){
                    
                }
            }
    });
    var addDivsCanvas = function(){
	    var chain=  '<div id="background_nodes_mirror">'+
			    '<canvas id="background_nodes_mirror_canvas"></canvas>'+
			'</div>'+
			'<div id="nodos_mirror">'+
			    '<canvas id="nodos_mirror_canvas"></canvas>'+
			'</div>';
	    $("#map").append(chain);
    };
    var initCompare = function(){
        var c = config.mapConfig;
        Mapc.map = new OL.Map({ 
                div: "contentCompare",
                controls: ctl.getOL(),
                projection: Map.projection.base,
                displayProjection: config.mapConfig.projection,
                resolutions: c.resolutions,
                eventListeners:getListenersMapCompare()
            });
            insertBaseLayers(Mapc);
            addEventsBaseCompare();
            updateSize();
            var extent = Map.map.getExtent();
            Mapc.map.zoomToExtent(extent);
            setRestrictedExtent(Map.restrictedExtent,Mapc);
            var zoom = Map.map.getZoom();
            Mapc.map.zoomTo(zoom);
            defineIndexLayers(Mapc);
            loadTree(Mapc);
            onResizeWindow(Mapc);
            displayLayersFromOrigin();
            var chain = '<div id="baseMapMiniCompare" class="mdm-ui-widget"></div>';
            $("#contentCompare").append(chain);
            $('#baseMapMiniCompare').baseMapMini({
									data:tree.baseLayers,imgPath:'img/mapaBase',
									baseSelection:function(id){
										setBaseLayer(id,Mapc);
									}
			});
            var vectorial =getLayer('Vectorial');
            var text = getLayer('Text');
            if (vectorial) {
                setOpacity(getLayer('Vectorial',Mapc),vectorial.opacity);
            }
            if (text) {
                setOpacity(getLayer('Text',Mapc),text.opacity);
            }
            
            
            
            
    }
    
    
    var beilBlocledMouseWeel=false;
    var clockBlocledMouseWeel = null;
    var clearClockBlocledMouseWeel = function(){
        if (clockBlocledMouseWeel) {
            clearTimeout(clockBlocledMouseWeel);
        }
    }
    var hideBlockerMouseWeel = function(){
        $(".beilBlockedMouseWeel").hide();
        $(".blockedMouseWeel").hide();
    }
    var showBlockerMouseWeel = function(){
        $(".beilBlockedMouseWeel").show();
        $(".blockedMouseWeel").show();
    }
    var eventMouseWeelDisabled = function(message){
        if (!beilBlocledMouseWeel) {
            $("#map").parent().append('<div class="beilBlockedMouseWeel"></div><div class="blockedMouseWeel"><div class="message">'+message+'</div></div>');
            beilBlocledMouseWeel =true;
            $(".blockedMouseWeel").on("mousewheel",function(){
                showBlockerMouseWeel();
                clearClockBlocledMouseWeel();
                clockBlocledMouseWeel = setTimeout(function(){
                        hideBlockerMouseWeel();
                },3000);
            });
            $(".blockedMouseWeel").on("mouseleave",function(){
                clearClockBlocledMouseWeel();
                hideBlockerMouseWeel();
            });
        }
        showBlockerMouseWeel();
        clearClockBlocledMouseWeel();
        clockBlocledMouseWeel = setTimeout(function(){
                hideBlockerMouseWeel();
        },3000);
        
        
    }
    var disableMouseWeel = function(){
        var w = config.startupConfig.map.mousewheel;
        if ((w)&&(w.disable)) {
            $("#map").on("mousewheel", function() {
                eventMouseWeelDisabled(w.message);
                return false;
            });
        }
    }
    var init = function(){
            addDivsCanvas();
            $('#map').append('<div id="coordinates_map"><div class="altitude"></div></div>');
            $("#canvasimage").css({height:$("#map").height()+'px',width:$("#map").width()+'px'});
            M = Map.map;
                //initialMessage();
                //Escuelas.init();
                //jQuery.support.cors = true;
                //MDM6('loadPanels');
            var actionHeader = MDM6('loaderHeader');
            if(actionHeader){
                if(actionHeader.content){
                    $('#header').html(actionHeader.content); 
                }
                if(actionHeader.event){
                   actionHeader.event();
                }
            }
            OL.Control.Measure.prototype.geodesic = true;
            initialOLDefinitions();
            var c = config.mapConfig;
            var idMap='map';
            if(((typeof apiUrl!=='undefined'))&&($("#mapa").length)){
                idMap = idMap+((apiUrl)?'a':'');
                $("#mdm6Layers,#mdm6DinamicPanel").css('display','none');
            }
            Map.map = new OL.Map({ 
                    div: "map",
                    controls: ctl.getOL(),
                    projection: Map.projection.base,
                    displayProjection: config.mapConfig.projection,
                    resolutions: c.resolutions,
                    eventListeners:getListenersMap()
            });
            if(typeof apiUrl!=='undefined'){
                if($("#mapa").length){
                    $("#content").addClass('apiMDM6Content');
                    $(".olControlMousePosition").addClass('apiMDM6MousePosition');
                    $(".olControlScaleLine").addClass('apiMDM6ScaleLine');
                    updateSize();
                }
            }
            if(!config.startupConfig.ui.layersBar){ 
                $(".olControlMousePosition").addClass('apiMDM6MousePosition');
                $(".olControlScaleLine").addClass('apiMDM6ScaleLine');
            }
            insertBaseLayers();
            addEventsBase();
            extentMap();
            setRestrictedExtent(Map.restrictedExtent);
            encuadrarNayarit();
            defineIndexLayers();
            addVector();
            //Marker.addLayer(Map);
            //Georeference.load(Map);
            cargaCapaArcos();
            addCustomControls();
            activeControl({control:'identify',active:true});
            //activeControl({control:'measurePolygon',active:true});
            loadTree();
            Marker.addLayer(Map);
            addSpetialVector();
            //loadOverview('B1');
            ctl.defineActions(getControl('polygonH'));
            ctl.defineActions(getControl('measurePolygon'));
            ctl.defineActions(getControl('measureLine'));
            ctl.defineActions(getControl('georeferencePolygon'));
            ctl.defineActions(getControl('georeferenceLine'));
            ctl.addExtra(Map,[getLayer('Poligonos'),getLayer('Markers'),getLayer('Cluster'),getLayer('hoverPolygons'),capaCirculos],getControl('polygonH'),getLayer('SpetialPolygons'));
            //Cluster.load(Map);
            Features.addEvent(getLastMousePosition);
            Popup.resetLimits();
            //LineTime.load(Map,Tree.getMain());
            inserCopyRights(tree.baseLayers['B1'].rights);
	    if(((typeof apiUrl!== 'undefined')&&($("#mapa").length))||(!config.startupConfig.ui.layersBar)){
		$(".copyRights").addClass('apiMDM6Rights');
	    }
            ApiEvents();
            disableMouseWeel();
	    //Features.loadInitialWindow();
            //Notification.load();
            //getLocation();
            //Poi.load(Map);
            //ctl.setEventIdentify(function(e){console.log(e)});
            //Popup.defineTimer();
            //$("#map").append('<textarea id="wktn" style="position:absolute;bottom:0px;left:200px;z-index:50000"></textarea>');
            //$("#map").append('<button id="bwktn"  style="position:absolute;bottom:-200px;left:200px;z-index:50000"></button>');
            
           
            //insertCtl();
            //wps.init();

            /*
            var Pois = new OpenLayers.Layer.Text( "cvs",
                    { location:"http://localhost/mdm6/js/frameworks/upload/server/php/files/poi.txt",//"poi.txt",
                      projection:Map.projection.base
                    });
            
             console.log(Pois);
            Map.map.addLayer(Pois);
            */
	    //activeControl({control:'routing',active:true});
	    Geolocation.init(Map);
	    Route = Geolocation;
	    //activeControl({control:'cartografia',active:true});
            //Cluster.execute();
	    Tree.runTimer();
	   
	    TS.initialize(Map);
	    
	    var cadena ='<div id="tabulado" style="position:absolute;bottom:100px;left:200px;z-index:5000">'+
			    '<button id="sbtn1">Tabulado</button>'+
			'</div>';

	    //$("#map").append(cadena);
	    $("#sbtn1").click(function(){
           $('body').tabulateCenago({table:'c102'});
	    });
	    $("#sbtn2").click(function(){
		var evento = function(e){
		    //console.log(e);
		    e.selected.layers.push('basic');  
		    e.selected.format='image/png';
		    e.action='add';
		    e.opacity=1;
		    TS.event(e);
		}
	       TS.event({action:'get',type:'tms',path:'http://tilecache.osgeo.org/wms-c/Basic.py/',catchEvent:evento});
	    });
	    
	    
	    $("#sbtn3").click(function(){
		var params = {action:'set',position:2,id:'S2'};
		TS.event(params);    
	    });
	    $("#sbtn4").click(function(){
		var params = {action:'set',position:1,id:'S2'};
		TS.event(params);    
	    });
	    $("#gordis").click(function(){
		//Features.restoreFeatures('georeference');
		//console.log(getControl('identify'));
		//ctl.actionIdentify({lon:-11361017.977566,lat:2509777.7498286});
		
		var g = '';
		Routing.event({action:'add',geometry:g,type:'segment',params:{title:'informa',description:'datos'}})
		setTimeout(function(){
		    Routing.event({action:'delete',type:'pay'});
		},1000)
		
		var params = {lon:-11394874.503839,lat:2512338.90335061,type:'routing',params:{nom:'Identificaci&oacute;n',desc:'informacion',image:'cyclone'}};
		var marca = Marker.add(params);
		var marca = [marca];
		setTimeout(function(){
		    Marker.event({action:'select',items:marca,type:'routing'});
		    
		},3000);
		mirrorCluster();
	    });
	    $("#imprime").click(function(){
		Marker.buildMirror();
		exportMap('gif');
		Marker.clearMirror();
		//exportMap('png');
		
	    });
	    
	    
	    var eventos={
		Stop:function(){
		    Route.event({action:'endTracking'});
		},
		byCar:function(){
		    Route.event({action:'starSnap'});
		},
		Walking:function(){
		    Route.event({action:'stopSnap'})
		}
		
	    }
	    demoTraking = function(){
		Route.event({action:'runDemo',eventCatch:function(e){$("#map").tracking({data:e,controller:eventos});}})
	    }
	    $("#locate").click(function(){
		Route.event({action:'runDemo',eventCatch:function(e){$("#map").tracking({data:e,controller:eventos});}})
		});
	    $("#track").click(function(){
		Route.event({action:'starTracking',eventCatch:function(e){$("#map").tracking({data:e,controller:eventos});}})
		});
	    $("#snap").click(function(){Route.event({action:'starSnap'})});
	    $("#endtrack").click(function(){Route.event({action:'endTracking'})});
	    $("#ruta").click(function(){
		
		//console.log(getPxFromLonlat(-11044172.4761245,2139087.50120208));
		starCluster();
	    });
	    activeControl({control:'identify',active:true});
	    onResizeWindow();
	    
	    
	    var pointProve = new OL.LonLat(-102,22).transform('EPSG:4326','EPSG:9102008');
        
    
        $('body').keydown(function(event){
            var keycode = (event.keyCode ? event.keyCode : event.which);
            if (keycode==17) {
                console.log("Presionaste control");
            }
            
        }).keyup(function(event){
            var keycode = (event.keyCode ? event.keyCode : event.which);
            if (keycode==17) {
                console.log("Soltaste control");
            }
            
        });
    };
    var drawingFlag = false;    
    var addGeometries = function(json){
                var layer = getLayer('hoverPolygons');
                var features = [];
                for(var x in json){
                      var i = json[x];
                      var wkt = i.geometria;
                      var params = {fColor:'transparent',lColor:'transparent',lSize:0};
                      var feature = new OpenLayers.Feature.Vector(OpenLayers.Geometry.fromWKT(wkt), params);
                      feature.attributes.data = i;
                      features.push(feature);
                }
                layer.removeFeatures(layer.features);
                layer.addFeatures(features);
          
    };
    var activeJson = '';
    var requestGeometriesAjax=null;
    var requestGeometries = function(){
            if (requestGeometriesAjax) {
                requestGeometriesAjax.abort();
            }
            var over = config.startupConfig.map.onOver;
            if ((over)&&(over.showPolygon)) {
                    var obj=this;
                    var actualResolution = getResolution();
                    var jsonFile = (actualResolution<=over.changeDisplayOn)?'municipalities':'states';
                    if (activeJson!=jsonFile) {
                        
                        var r= {
                                success:function(json,estatus){
                                    var valid=false;
                                    if (json){
                                        activeJson = jsonFile+'';
                                        addGeometries(json);
                                    }
                                },
                                error:function(a,b,extraFields){
                                    //console.log(a.status)
                                }
                            };
                        var source = {
                            url:'json/'+jsonFile+'.json',
                            type:'GET',
                            //headers: {Range: "bytes=0-100000000"},
                            dataType:'json'
                        }
                        r = $.extend(r, source);
                        requestGeometriesAjax = $.ajax(r);
                    }
            }
        
    };
    var onResizeWindow=function(source){
	$( window ).resize(function() {
	    updateSize(source);
	});
    };
    var intersectExtent = function(lon,lat){
	var response = false;
	//var extent = Map.map.getExtent();
	var extent = Map.map.restrictedExtent;
	var geometria = extent.toGeometry();
	var point = new OL.Geometry.Point(lon,lat);
	
	if(geometria.intersects(point)){
	    response = {lon:lon,lat:lat};
	}else{
	    point = new OL.Geometry.Point(lat,lon);
	    if(geometria.intersects(point)){
		response = {lon:lat,lat:lon};
	    }
	}
	return response;
    }
    var isValidCoordinate = function(lon,lat){
	lon = parseFloat(lon);
	lat = parseFloat(lat);
	var r = transformToMercator((lon)*-1,lat);
	var response = intersectExtent(r.lon,r.lat);
	if(!response){
	    var r = transformToMercator(lon,(lat)*-1);
	    response = intersectExtent(r.lon,r.lat);
	}
	return response;
    }
    var eventDisableCtl={
        func:null,
        set:function(){
            var obj = eventDisableCtl;
            obj.func= arguments[0];
        },
        execute:function(e){
            var obj = eventDisableCtl;
            if(obj.func){
                obj.func(e)
            }
        }
    };
    var getDistanceFromCentroid = function(){
        var extent = Map.map.getExtent();
        var centroid = Map.map.getCenter();
        var point1 = new OL.Geometry.Point(centroid.lon,centroid.lat);  
        var point2 = new OL.Geometry.Point(extent.right,extent.top);
        var r = transformToGeographic(point1.x,point1.y);
        return {centroid:r,distance:point1.distanceTo(point2)}
    };
    var getLastMousePosition = function(){
        var ctl = Map.map.controls[1];
        var px = ctl.lastXy;
        var lonlat = Map.map.getLonLatFromPixel(px);
        return {px:px,lonlat:lonlat};
    };
    var statusWindy = false;
    var windy;
    var canvas = document.getElementById('windyMap');
    var clockWindy = null;
    function enableWindy(status,params,refresh) {
        if (status) {
            hideWindy('now');
            clockWindy =setTimeout(function(){
                displayWindy();
                if (params) {
                    loadWindy(params);
                }
                if (refresh) {
                    refreshWindy();
                }
            },2000);
        }else{
            
            if ((clockWindy)&&(windy)) {
                clearTimeout(clockWindy);
            }
            hideWindy(params);
        }
        if (!refresh) {
            statusWindy = status;
        }
        
    }
    function displayMapLimits() {
        var layer = getLayer('Vectorial');
        
        var itemLayers='contorno';
        var params = '';
        for(var x in layer.params){
            var value =(x=='LAYERS')?itemLayers:layer.params[x];
            params+='&'+x+'='+value
        }
        var grid = layer.grid[0][0].bounds;
        var bbox='&BBOX='+grid.left+','+grid.bottom+','+grid.right+','+grid.top;
        var width='&WIDTH='+layer.tileSize.w;
        var height='&HEIGHT='+layer.tileSize.h;
        var path = 'http://10.152.11.6/fcgi-bin/ms62/mapserv.exe?map=/opt/map/mdm60/contorno.map';
        var chain = '<img src="'+path+params+bbox+width+height+'">';
        $("#mapLimits").html(chain);
    }
    chaskastasis = displayMapLimits;
    function displayWindy() {
        //console.log('mostrando')
        $("#windyMap").fadeIn();
        $("#mapLimits").fadeIn()
        $("#pelicula").fadeIn();
        displayMapLimits();
        
    }
    function hideWindy(now) {
        //console.log('ocultando');
        if (windy) {
            windy.stop();
        }
        if (now) {
            $("#windyMap").hide();
            $("#mapLimits").hide()
            $("#pelicula").hide();
            
        }else{
            $("#windyMap").fadeOut();
            $("#mapLimits").fadeOut()
            $("#pelicula").fadeOut();
        }
        
    }
    function refreshWindy() {
          if(!windy) {
            return;
          }
          windy.stop();
          var mapSize = Map.map.getSize();
          var extent = Map.getExtent();
          var cloneExtent = new OL.Bounds(extent.lon[0],extent.lon[1], extent.lat[0],extent.lat[1]);
          cloneExtent.transform('EPSG:900913','EPSG:4326');
          canvas.width = mapSize.w;
          canvas.height = mapSize.h;
        
          windy.start(
            [[0,0], [canvas.width, canvas.height]],
            canvas.width,
            canvas.height,
            [[cloneExtent.left, cloneExtent.bottom],[cloneExtent.right, cloneExtent.top]]
          );
    }
    /*
    var loadWindy = function(params){
        var url = (params.useProxy)?DataSource.files.download+'?l='+params.url:params.url;
        fetch(url).then(function(response) {
            return response.json();
        }).then(function(json) {
            windy = new Windy({canvas: canvas, data: json.data.winds });
            refreshWindy();
        });
    }
    */
    
    var loadWindy = function(params){
            $('#windyMap').remove();
            $("#mapping").append('<canvas id="windyMap" class="fill"></canvas>');
            canvas = document.getElementById('windyMap');
            windy = null;
            windy = new Windy({canvas: canvas, data: params });
            refreshWindy();
    }
    
    var finishMeasure = function(){
        try{
            var line=getControl('measureLine');
            var polygon = getControl('measurePolygon');
            var finished = false;
            //console.log(polygon);
            if(line.active){
                line.handler.finishGeometry();
                finished = true;
            }
            if(polygon.active){
                polygon.handler.finishGeometry();
                finished = true;
            }
        }catch(e){ 
            var finished=false;
        }
        return finished;
    };
    var getActualBaseLayer=function(){
	return Map.map.baseLayer.name;
    }
    var finishGeoreference = function(){
        try{
            var line=getControl('georeferenceLine');
            var polygon = getControl('georeferencePolygon');
            var finished = false;
            //console.log(polygon);
            if(line.active){
                line.handler.finishGeometry();
                finished = true;
            }
            if(polygon.active){
                polygon.handler.finishGeometry();
                finished = true;
            }
        }catch(e){
            var finished=false;
        }
        return finished;
    };
    var getWmsParams=function(){
	var extent = getExtent();
	return {
	    LAYERS:'',
	    FORMAT:'image/png',
	    SERVICE:'WMS',
	    VERSION:'1.1.1',
	    REQUEST:'GetMap',
	    FIRM:""+ Math.floor(Math.random()*11) + (Math.floor(Math.random()*101)),
	    SRS:Map.projection.base,
	    BBOX:extent.lon[0]+","+extent.lon[1]+","+extent.lat[0]+","+extent.lat[1],
	    WIDTH:$("#map").width(),
	    HEIGHT:$("#map").height()
	}
    }
    var getContentDownloadImage = function(){
	var chain=  'De clic derecho para guardar la imagen </br></br>'+
		    '<img id="imageDownload" src="" style="width:400px;" oncontextmenu="return true">';
	return chain;
    };
    var modalImage = Modal.create({
                    title:'Descargar imagen',
                    content:getContentDownloadImage(),
                    events:{
                        onCancel:function(){
                            modalImage.hide();
                        },
                        onCreate:function(){
                       
                        },
                        onShow:function(){
                        }
                    }
    });
    /************************************/
    function cargaCapaArcos(){
        var colors = ["#00C5FF", "#00FF00", "#FFFF00", "#FFAA00", "#FF0000", "#9B0000"];
        //var colors = ["#aec6cf","#77dd77","#fdfd96","#ffb347","#ff6961","#c23b22"];
        //var colors = ["#80C7CD","#557AB7","#496A98","#2E4B97","#26376D","#21284C"];
        var widths = [2, 4, 6, 8, 10.00, 12.0]
        //var diameters = [7, 10, 14, 17, 20, 23]
        var diameters = [8, 12, 15, 18, 21, 24];
        if(conEstratos){
            var context = {
                        getColor: function(feature) {
                            var estrato = feature.attributes["estrato"];
                            return colors[estrato];
                        },
                        getSize: function(feature) {
                            var size = feature.attributes["lugar"];
                            var estrato = feature.attributes["estrato"];
                            var internal = feature.attributes["internal"];
                            return (internal)?7:( widths[estrato] * size / 10);
                        },
                        getOpacity: function(feature) {
                            var opacity = feature.attributes["lugar"];
                            return (opacity * 5) / 100;
                        },
                        getLinecap: function(feature) {
                            var LineCap = feature.attributes["lugar"];
                            if (LineCap == 20){
                                return "round";                        
                            }
                            return "butt";
                        }
                    };
            var template = {
                        strokeColor: "${getColor}", 
                        strokeWidth: "${getSize}",
                        strokeOpacity: "0.7",
                        strokeLinecap: "${getLinecap}",
                    };
                    
            var style = new OpenLayers.Style(template, {context: context});
                    
            arcosEstrato1 = new OpenLayers.Layer.Vector("1 - 99", {
                        styleMap: new OpenLayers.StyleMap(style)
                       ,renderers: ["Canvas", "SVG", "VML"]
                    }); 
    
            Map.map.addLayer(arcosEstrato1);
            arcosEstrato1.consultable=false;
            arcosEstrato1.displayInLayerSwitcher = false;
            arcosEstrato1.group='Viajes EOD';
            arcosEstrato1.icono='img/estratos/estrato_1.png'
    
            arcosEstrato2 = new OpenLayers.Layer.Vector("100 - 999", {
                        styleMap: new OpenLayers.StyleMap(style)
                        ,renderers: ["Canvas", "SVG", "VML"]
                    }); 
            Map.map.addLayer(arcosEstrato2);
            arcosEstrato2.consultable=false;
            arcosEstrato2.displayInLayerSwitcher = false;
            arcosEstrato2.visibility=true;
            arcosEstrato2.group='Viajes EOD';
            arcosEstrato2.icono='img/estratos/estrato_2.png'
    
            arcosEstrato3 = new OpenLayers.Layer.Vector("1 000 - 9 999", {
                        styleMap: new OpenLayers.StyleMap(style)
                        ,renderers: ["Canvas", "SVG", "VML"]
                    }); 
            Map.map.addLayer(arcosEstrato3);
            arcosEstrato3.consultable=false;
            arcosEstrato3.displayInLayerSwitcher = false;
            arcosEstrato3.group='Viajes EOD';
            arcosEstrato3.icono='img/estratos/estrato_3.png'
    
            arcosEstrato4 = new OpenLayers.Layer.Vector("10 000 - 99 999", {
                        styleMap: new OpenLayers.StyleMap(style)
                        ,renderers: ["Canvas", "SVG", "VML"]
                    }); 
            Map.map.addLayer(arcosEstrato4);
            arcosEstrato4.consultable=false;
            arcosEstrato4.displayInLayerSwitcher = false;
            arcosEstrato4.group='Viajes EOD';
            arcosEstrato4.icono='img/estratos/estrato_4.png'
    
            arcosEstrato5 = new OpenLayers.Layer.Vector("100 000 - 999 999", {
                        styleMap: new OpenLayers.StyleMap(style)
                        ,renderers: ["Canvas", "SVG", "VML"]
                    }); 
            Map.map.addLayer(arcosEstrato5);
            arcosEstrato5.consultable=false;
            arcosEstrato5.displayInLayerSwitcher = false;
            arcosEstrato5.group='Viajes EOD';
            arcosEstrato5.icono='img/estratos/estrato_5.png'
            
            arcosEstrato6 = new OpenLayers.Layer.Vector("m�s de 1 000 000", {
                        styleMap: new OpenLayers.StyleMap(style)
                        ,renderers: ["Canvas", "SVG", "VML"]
                    }); 
            Map.map.addLayer(arcosEstrato6);
            arcosEstrato6.consultable=false;
            arcosEstrato6.displayInLayerSwitcher = false;
            arcosEstrato6.group='Viajes EOD';
            arcosEstrato6.icono='img/estratos/estrato_6.png'
    
            listaCapasArcos = [arcosEstrato1, arcosEstrato2, arcosEstrato3, arcosEstrato4, arcosEstrato5, arcosEstrato6];
        }else{
            var context = {
                        getSize: function(feature) {
                            var size = feature.attributes["lugar"];
                            return 5 * size / 20;
                        
                        },
                        getOpacity: function(feature) {
                            var lugar = feature.attributes["lugar"];
                            return 0.15 + (lugar * 0.85) / 20;
                        },
                        getLinecap: function(feature) {
                            var LineCap = feature.attributes["lugar"];
                            if (LineCap == 20){
                                return "round";                        
                            }
                            return "butt";
                        }
                    };
            var template = {
                        strokeColor: "#00FFFF", 
                        strokeWidth: "${getSize}",
                        strokeOpacity: "${getOpacity}",
                        strokeLinecap: "${getLinecap}"
                    };
                    
            var style = new OpenLayers.Style(template, {context: context});
    
            arcos = new OpenLayers.Layer.Vector("Viajes", {
                        styleMap: new OpenLayers.StyleMap(style),
                        renderers: ["Canvas", "SVG", "VML"]
                    }); 
    
            map.addLayer(arcos);
            arcos.consultable=false;
            arcos.displayInLayerSwitcher = false;
            arcos.group='Viajes EOD';
            //arcos.icono='img/estratos/estrato_1.png'
            listaCapasArcos = [arcos];
        }
        var contextOrgDst = {
                    getPointRadius: function(feature) {
                        var viajes = feature.attributes["viajes"];
                        var estrato = getEstrato(viajes);
                        return diameters[estrato];
                    },
                    getLabel: function(feature){
                        var viajes = feature.attributes["etiqueta"];
                        return viajes;
                    },
                    getStrokeColor: function(feature){
                        /*
                        var orgDst = feature.attributes["orgDst"];
                        var color;
                        if (orgDst > 0){
                            color = "#FF0000";
                        }else{
                            color = "#00FFFF";
                        }
                        return color;
                        */
                        var orgDst = feature.attributes["orgDst"];
                        var color;
                        if (orgDst > 0){
                            color = "#FF0000";//"#E4625C";//
                        }else{
                            color = "#00FFFF";//"#334F9A";
                        }
                        return color;
                    
                    },
                    getFill:function(feature){
                        
                        var orgDst = feature.attributes["orgDst"];
                        var color;
                        if (orgDst > 0){
                            color = "#E4625C";
                        }else{
                            color = "#334F9A";
                        }
                        return color;
                    }
                };
        var templateOrgDst = {
                pointRadius: "${getPointRadius}",
                fillColor: "#FFFFFF",//"${getFill}",//"#FFFFFF",
                strokeColor: "${getStrokeColor}",
                strokeWidth: 2,
                label : "${getLabel}",
                fontSize: 10//,
                //fontColor:"#ffffff"
                };
    
        var styleOrgDst = new OpenLayers.Style(templateOrgDst, {context: contextOrgDst});
        
        capaCirculos = new OpenLayers.Layer.Vector("Centroides Distritos", {
            styleMap: new OpenLayers.StyleMap(styleOrgDst)
        }); 
    
        Map.map.addLayer(capaCirculos);
        capaCirculos.consultable=false;
        capaCirculos.displayInLayerSwitcher = false;
        capaCirculos.group='Viajes EOD';
        capaCirculos.icono='img/estratos/estrato_1.png'
    }
    function addFeatureSegmentstoMatriz(viajes, pto1, pto2, estrato, clockwise, puntos, anguloArco,internal,notInclude){
        var value = (internal)?5:2;
        var anguloSagita = Math.radians(anguloArco / value);
        var cuerda = pto1.distanceTo(pto2);
        var anguloAlpha = Math.radians(90) - anguloSagita;
        var A = cuerda / 2;
        var radio = A / (Math.cos(anguloAlpha));
        if (internal) {
            radio = radio* getRadioFromResolution();
        }
        var inclinacion = Math.atan2(pto2.Y - pto1.Y, pto2.X - pto1.X);
        var anguloACentro;
        var deltaAng;
        if (clockwise){
            anguloACentro = inclinacion - anguloAlpha;
            deltaAng =  - Math.radians(anguloArco / puntos);
        }else{
            anguloACentro = inclinacion + anguloAlpha;
            deltaAng = Math.radians(anguloArco / puntos);
        }
        var centro = new Coord(pto1.X + radio * Math.cos(anguloACentro), pto1.Y + radio * Math.sin(anguloACentro));
        var angCentroPunto;
        var oldPnt = new OpenLayers.Geometry.Point(pto1.X, pto1.Y);
        var newPnt;
        var segment;
        if (internal) {
            arcosIncluir=[];
        }
        for (var i = 1; i <= puntos; i++){
            angCentroPunto = Math.PI + anguloACentro + (deltaAng * i);
            newPnt = new OpenLayers.Geometry.Point(centro.X + radio * Math.cos(angCentroPunto), centro.Y + radio * Math.sin(angCentroPunto));
            segment = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LineString([oldPnt, newPnt]), {
                lugar: i,
                estrato: estrato, 
                viajes: viajes,
                internal:(internal)?internal:false
            });
            if (!notInclude) {
                arcosSegmentMatrix[estrato][i-1].push(segment);
            }
            if (internal) {
                arcosIncluir.push(segment);
            }
            oldPnt = newPnt;
        }
    }
    
    function getEstrato(viajes){
        if (conEstratos){
            if (viajes <= 100){
                return 0;
            }else if (viajes <= 1000){
                return 1;
            }else if (viajes <= 10000){
                return 2;
            }else if (viajes <= 100000){
                return 3;
            }else if (viajes <= 1000000){
                return 4;
            }
            return 5;
        }else{
            return 0;
        }
    }
    var numberWithCommas = function(nStr){
		nStr += '';
		x = nStr.split('.');
		x1 = x[0];
		//alert('antes');
		x2 = x.length > 1 ? '.' + x[1] : '';
		var rgx = /(\d+)(\d{3})/;
		while (rgx.test(x1)) {
			x1 = x1.replace(rgx, '$1' + ',' + '$2');
		}
		return x1 + x2;
	}  
    Math.radians = function(degrees) {
        return degrees * Math.PI / 180;
    };
       
      // Converts from radians to degrees.
    Math.degrees = function(radians) {
        return radians * 180 / Math.PI;
    };
      
    var Coord = function (x, y) {
          this.X = x;
          this.Y = y;
    };
      
    Coord.prototype.view = function () {
          return String(this.X).slice(0, 4) + ',' + String(this.Y).slice(0, 4);
    };
      
    Coord.prototype.antipode = function () {
          var anti_lat = -1 * this.Y;
          var anti_lon = (this.X < 0) ? 180 + this.X : (180 - this.X) * -1;
          return new Coord(anti_lon, anti_lat);
    };
      
    Coord.prototype.distanceTo =function distanciaPtos(coord2){
         return Math.sqrt(Math.pow(coord2.X - this.X, 2) + Math.pow(coord2.Y - this.Y, 2));
    }
    var getInternal = function(data){
        var respone = null;
        var word = 'viajes'
        for(var x in data){
            if (data[x].name.indexOf('Viajes')!=-1) {
                response = data[x];
                break;
            }
        }
        return response;
    }
    var getPointTravel = function(wkt){
        var e = wkt.replace('POINT(','');
        e = e.replace(')','');
        e = e.split(' ');
        return {lon:e[0],lat:e[1]};
    };
    var arcosSegmentMatrix,puntosDistritos,arcosSegmentMatrix,arcosIncluir;
    var conEstratos = true;
    var consultando = false;
    var OrgDst;
    var capaCirculos;
    var listaCapasArcos;
    var dataInternal = null;
    function createArcSegments(data){
        var origin = getPointTravel(data.origin.coordinate);
        var origenDestination = data.originDestination
        var features = data.destinations;
        var clockWise = false;
        var puntos = 20;
        var anguloArco = 35;
        puntosDistritos = [];
        arcosSegmentMatrix = [];
        var totalViajes = 0;
        for (var i in listaCapasArcos){
            arcosSegmentMatrix.push([]);
            for (var j = 0; j < puntos; j++){
                arcosSegmentMatrix[i].push([])
            }
        }
        var reg;
        var pto1;
        var pto2;
        var viajes;
        var estrato;
        dataInternal = null;
        pto2 = new Coord(Number(origin.lon), Number(origin.lat));
        if (features.length>0) {
            for (var k in features){
                reg = features[k];
                //viajes = Number(reg[0]);
                viajes = Number(reg.travels);
                coords = getPointTravel(reg.coordinate);
                //pto1 = new Coord(Number(reg[1]), Number(reg[2]));
                //pto2 = new Coord(Number(reg[3]), Number(reg[4]));
                pto1 = new Coord(Number(coords.lon), Number(coords.lat));
                
                estrato = getEstrato(viajes);
                totalViajes += viajes;
                if (origenDestination) {
                    addFeatureSegmentstoMatriz(viajes, pto2, pto1, estrato, clockWise, puntos, anguloArco);
                }else{
                    addFeatureSegmentstoMatriz(viajes, pto1, pto2, estrato, clockWise, puntos, anguloArco);
                }
                
                if (OrgDst == 0){
                    puntosDistritos.push(new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(pto2.X, pto2.Y), {
                        viajes: viajes,
                        etiqueta: numberWithCommas(viajes),
                        orgDst: ((origenDestination)?0:1),
                        name:reg.name,
                        desc:'Viajes: '+numberWithCommas(viajes)
                    }));
                }else{
                    puntosDistritos.push(new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(pto1.X, pto1.Y), {
                        viajes: viajes,
                        etiqueta: numberWithCommas(viajes),
                        orgDst: ((origenDestination)?0:1),
                        name:reg.name,
                        desc:'Viajes: '+numberWithCommas(viajes)
                    }));
                }
            }
        }
        var interno  = getInternal(data.internalTravels);
        if (interno.travels>0) {
            var estratoBucle = getEstrato(interno.travels);
            var anguloArcoBucle = 360;
            var pto3 = new Coord((Number(origin.lon)-6),Number(origin.lat));
            dataInternal = {travels:data.origin.travels,pto2:pto2,pto3:pto3, estrato:estratoBucle,clock:clockWise,puntos:puntos,angulo:anguloArcoBucle};
            addFeatureSegmentstoMatriz(data.origin.travels, pto2, pto3, estratoBucle, clockWise, puntos, anguloArcoBucle,true);
        }
        
        var distColor = 0;
        if ((features.length > 1)||(interno.travels>0)||(features.length==0)){
            distColor = 1;
        }
        if (OrgDst == 0){
            puntosDistritos.push(new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(pto1.X, pto1.Y), {
                    viajes: data.origin.travels,//totalViajes,
                    etiqueta: numberWithCommas(data.origin.travels),//numberWithCommas(totalViajes),
                    orgDst: ((origenDestination)?distColor:0),
                    name:data.origin.name,
                    desc:'Viajes: '+numberWithCommas(data.origin.travels)
            }));
        }else{
            
            puntosDistritos.push(new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(pto2.X, pto2.Y), {
                    viajes: data.origin.travels,//totalViajes,
                    etiqueta: numberWithCommas(data.origin.travels),//numberWithCommas(totalViajes),
                    orgDst: ((origenDestination)?distColor:0),
                    name:data.origin.name,
                    desc:'Viajes: '+numberWithCommas(data.origin.travels)
            }));
            
        }
        drawSegmentsCnt = 0;
        drawSegmentsTimer = setInterval(function(){ addFeatureSegments() }, 50);
    }
    
    var getRadioFromResolution = function(){
        var radio = 1000;
        var resolution = getResolution();
        var r = config.mapConfig.resolutions;
        var level = 0;
        for(var x in r){
            if (resolution<=r[x]) {
                level=parseInt(x)+1;
            }else{
                break;
            }
        }
        switch (level) {
            case 5:
                radio = 2000;
                break;
            case 6:    
                radio = 1500;
                break;
            case 7:
                radio = 700;
                break;
            case 8:
                radio=500;
                break;
            case 9:
                radio = 300;
                break;
            case 10:
                radio = 200;
                break;
            case 11:
            case 12:
            case 13:
                radio = 40;
                break;
            case 14:
                radio = 20;
                break;
            case 15:
                radio = 10;
                break;
                default:
                    radio=4000;
        }
        
        return radio;
    }
    var clockArcs = null;
    function refreshInternalArcs() {
        if (dataInternal) {
            if (clockArcs) {
                clearTimeout(clockArcs);
            }
            clockArcs = setTimeout(function(){
                var a  =dataInternal;
                listaCapasArcos[a.estrato].removeFeatures(arcosIncluir);
                addFeatureSegmentstoMatriz(a.travels, a.pto2, a.pto3, a.estrato, a.clock, a.puntos, a.angulo,true,true,getRadioFromResolution());
                listaCapasArcos[a.estrato].addFeatures(arcosIncluir);
            },1000);
             
        }
        
    }
    chaskit = refreshInternalArcs;
    function addFeatureSegments(){
        if (drawSegmentsCnt == 20){
            capaCirculos.addFeatures(puntosDistritos);
            clearInterval(drawSegmentsTimer);
            consultando = false;
            return;
        }
        for (var i in listaCapasArcos){
            listaCapasArcos[i].addFeatures(arcosSegmentMatrix[i][drawSegmentsCnt]);
        }
        drawSegmentsCnt += 1;
    }
    var removeArcSegments = function(){
        if (listaCapasArcos) {
            for (var i in listaCapasArcos){
                listaCapasArcos[i].removeFeatures(listaCapasArcos[i].features);
            }
        }
        if (capaCirculos) {
            capaCirculos.removeFeatures(capaCirculos.features);
            capaCirculos.destroyFeatures();
        }
        
        
    }
    
    var onEODFeature = function(lon,lat){
        var diameters = [8, 12, 15, 18, 21, 24];
        var wkt = "POINT("+lon+" "+lat+")";
        var featurePoint = new OpenLayers.Feature.Vector(OpenLayers.Geometry.fromWKT(wkt));
        var intersects = false;
        for(var x in capaCirculos.features){
                var f = capaCirculos.features[x];
                var sides = 50;
                var viajes = f.attributes["viajes"];
                var estrato = getEstrato(viajes);
                var radius = diameters[estrato];    
                var lonLat = new OpenLayers.LonLat(f.geometry.x, f.geometry.y);
                var pCenter = new OpenLayers.Geometry.Point(lonLat.lon, lonLat.lat);
                var circle = OpenLayers.Geometry.Polygon.createRegularPolygon(pCenter, radius, sides, 0);
                var circleFeature = new OpenLayers.Feature.Vector(circle);
                var circleStyle = new OpenLayers.StyleMap({'strokeColor': '#1E88E5', 'strokeWidth': 2});
                intersects = circleFeature.geometry.intersects(featurePoint.geometry);
                var intersects2 = featurePoint.geometry.intersects(circleFeature.geometry)
                
                //console.log(x+'--'+intersects+' -- '+intersects2);
                if (intersects) {
                        break;        
                }
        }
        return intersects;
    }
    Map.onEODFeature = onEODFeature;

    var isEnableEOD = function(){
        Map.eod = false;
        var layer = Map.getLayer('Vectorial');
        var totalItems =(layer)?layer.params.LAYERS:'';
        totalItems = totalItems.split(',');
        if(totalItems.indexOf('ceod')!=-1){
            Map.eod=true;
        }
    }
    Map.isEnableEOD = isEnableEOD;
    var getEODFeature = function(id){
        var f = null;
        for(var x in capaCirculos.features){
            var i = capaCirculos.features[x];
            if (i.id==id) {
                f = i;
                break;
            }
        }
        return f;
    }
    Map.getEODFeature = getEODFeature;
    var definedInitialArc=false;
    var generateCircles= function(data){
       /*
        if (!definedInitialArc) {
             cargaCapaArcos();
             definedInitialArc=true;
        }
        */
        removeArcSegments();
        //if (data.destinations.length>0) {
            createArcSegments(data);
        //}
        
    }
    
    
    
    /*************************************/
    return{
        init:init,
        getLayersActive:getLayersActive,
        setVisibility:setVisibility,
        setParamsToLayer:setParamsToLayer,
	getZoomLevel:getZoomLevel,
	getWmsParams:getWmsParams,
	testBrowserCompatibility:testBrowserCompatibility,
        getExtent:getExtent,
	getResolution:getResolution,
        setBaseLayer:setBaseLayer,
	setRestrictedExtent:redefineExtent,
        loadOverview:loadOverview,
        statusLayer:Tree.addToRepository,
        getActiveLayers:Tree.getActiveLayers,
        getScale:getScale,
        getscale:getscale,
        zoomToLayer:zoomToLayer,
        changeOpacity:changeOpacity,
        activeCtl:activeControl,
        getDistanceFromCentroid:getDistanceFromCentroid,
        extent:extentMap,
        zoomIn:zoomIn,
        zoomOut:zoomOut,
        transformToGeographic:transformToGeographic,
        transformToDegrees:transformToDegrees,
        transformToMercator:transformToMercator,
        goCoords:goCoords,
        getWidth:getWidth,
        ui:{
            splitWindow:defineClockComparation
        },
	intersectExtent:intersectExtent,
	isValidCoordinate:isValidCoordinate,
	getActualBaseLayer:getActualBaseLayer,
	getImageMap:exportMap,
        Poi:{
            event:Poi.event,
            generateBuffers:Poi.generateBuffers
        },
        Mark:{
            event:Marker.event,
            add:Marker.add,
            addBufferAll:Georeference.showModalGeoPoints
        },
        Tree:{
            event:{
                reset:resetTree,
		addAditionals:function(){
		    Tree.activateLayers(getParamFromUrl('layers'));
		}
            }
        },
        Feature:{
            event:Features.event,
            addBuffer:Features.addBufferToBuffer,
            convertToBuffer:Features.convertToBuffer,
            exportGeoreference:Features.exportGeoreference,
            importGeoreference:Features.getFile,
            addBufferGeoreference:Georeference.showModalBuffer,
            finishGeoreference:finishGeoreference,
            finishMeasure:finishMeasure,
            addArea:Georeference.showModalBufferIdentify,
	    getAllForStore:Features.getFeatures,
	    restore:Features.restoreFeatures
        },
	Service:{
	    event:TS.event  
	},
        event:{
            setFeatureAdded:Features.setAdded,
            setFeatureCanceled:Features.canceled,
            setEventCatchMeasure:ctl.setEventCatchMeasure,
            setEventDisableCtl:eventDisableCtl.set,
            setEventIdentify:ctl.setEventIdentify,
            setEventPoiAdded:Poi.setEventAdded,
            setEventPoiCanceled:Poi.setEventCanceled,
            setEventGeoAdded:Features.setGeoAdded,
	    identify:ctl.actionIdentify,
	    exportMap:exportMap
        },
	Tracking:{
	    event:Geolocation.event,
	    Export:Features.exportGPX
	},
        Notification:Notification.show,
        showDataImporter:Features.showDataImporter,
	Popup:{
            add:Popup.add,
            set:Popup.set
        },
	Routing:{
	    event:Routing.event
	}
        
    }
});
